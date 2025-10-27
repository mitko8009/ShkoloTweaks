import os
import json
from datetime import datetime
from flask import Flask, request, jsonify, render_template, url_for

from utils import Config as cf
from utils import db

_base_dir = os.path.dirname(__file__)
_static_folder = os.path.join(_base_dir, "static")
_templates_folder = os.path.join(_base_dir, "templates")

app = Flask(
    __name__,
    static_folder=_static_folder,
    static_url_path="/static",
    template_folder=_templates_folder,
)

@app.template_filter('datetimeformat')
def datetimeformat(value, fmt='%b %d, %Y %H:%M'):
    if not value:
        return ''

    # already a datetime
    if isinstance(value, datetime):
        return value.strftime(fmt)

    # numeric timestamp
    if isinstance(value, (int, float)):
        try:
            dt = datetime.fromtimestamp(float(value))
            return dt.strftime(fmt)
        except Exception:
            return str(value)

    if isinstance(value, str):
        s = value.strip()
        if s.endswith('Z'):
            s = s[:-1] + '+00:00'
        try:
            dt = datetime.fromisoformat(s)
            return dt.strftime(fmt)
        except Exception:
            for f in ('%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
                try:
                    dt = datetime.strptime(s, f)
                    return dt.strftime(fmt)
                except Exception:
                    continue
        return value

    return str(value)

@app.route('/leaderboard/get', methods=['OPTIONS', 'GET'])
def get_leaderboard():
    if request.method == 'OPTIONS':
        return '', 200
    return jsonify(db().get_leaderboard()), 200

@app.route('/leaderboard/submit', methods=['POST'])
def submit_score():
    data = request.get_json()
    if not data or 'username' not in data:
        return jsonify({"error": "Invalid request, 'username' required"}), 400
    username = data['username']

    if 'pupil_id' not in data or 'school' not in data:
        return jsonify({"error": "Invalid request, 'pupil_id' and 'school' required"}), 400
    pupil_id = str(data.get('pupil_id', '')).strip()
    school = str(data.get('school', '')).strip()
    if not pupil_id or not school:
        return jsonify({"error": "Invalid request, 'pupil_id' and 'school' cannot be empty"}), 400

    # client-provided passphrase (may be empty)
    passphrase = data.get('passphrase', '')

    db_instance = db()

    existing_user_for_pupil = db_instance.find_username_by_pupil_id(pupil_id)
    if existing_user_for_pupil and existing_user_for_pupil != username:
        # If another user already holds this pupil_id, require that the provided
        # passphrase matches that other user's stored passphrase (if any) in order
        # to allow deletion of the existing entry and claim the pupil_id.
        other_entry = db_instance.get_entry(existing_user_for_pupil)
        other_pass = (other_entry.get('passphrase') or '') if other_entry else ''
        # If the other entry has a passphrase, it must match the provided passphrase
        if other_pass:
            if passphrase != other_pass:
                return jsonify({"error": "Passphrase mismatch for existing pupil owner"}), 403
        # If passphrase matches (or other had no passphrase), delete the other entry
        deleted = db_instance.delete_entry(existing_user_for_pupil)
        if not deleted:
            return jsonify({"error": "Failed to remove existing pupil owner"}), 500

    # check passphrase for current username: if an existing entry has a non-empty passphrase, it must match
    existing_entry = db_instance.get_entry(username)
    if existing_entry and existing_entry.get('passphrase'):
        stored_pass = existing_entry.get('passphrase') or ''
        if passphrase != stored_pass:
            return jsonify({"error": "Passphrase mismatch for this username"}), 403

    grades_raw_received = data.get('grades', 0.0)
    grades_input = grades_raw_received
    grades_avg = 0.0

    if isinstance(grades_input, dict):
        cleaned = {}
        total = 0.0
        count = 0
        for cls, entry in grades_input.items():
            id_val = ""
            # Collect numeric values for this class (may be from 'grades' list, single 'value', or a plain number)
            class_numbers: list[float] = []

            if isinstance(entry, dict):
                id_val = str(entry.get('id', ''))
                if 'grades' in entry and isinstance(entry.get('grades'), (list, tuple)):
                    for g in (entry.get('grades') or []):
                        try:
                            class_numbers.append(float(g))
                        except (TypeError, ValueError):
                            return jsonify({"error": f"Invalid grade value in grades array for class '{cls}'"}), 400
                # also accept a single 'value' field
                if 'value' in entry and entry.get('value') is not None:
                    try:
                        class_numbers.append(float(entry.get('value')))
                    except (TypeError, ValueError):
                        return jsonify({"error": f"Invalid grade value for class '{cls}'"}), 400
            else:
                # entry may be a plain numeric value or a numeric string
                try:
                    class_numbers.append(float(entry))
                except (TypeError, ValueError):
                    return jsonify({"error": f"Invalid grade value for class '{cls}'"}), 400

            if not class_numbers:
                return jsonify({"error": f"No valid grades provided for class '{cls}'"}), 400

            # clamp each individual grade, accumulate both per-class and global totals
            clamped = [max(0.0, min(6.0, float(v))) for v in class_numbers]
            # store a per-class representative (mean) for cleaned record, but overall average is across all individuals
            class_avg = sum(clamped) / len(clamped)
            cleaned[cls] = {"id": id_val, "value": class_avg}

            total += sum(clamped)
            count += len(clamped)

        # overall average across all individual grades
        grades_avg = (total / count) if count > 0 else 0.0
    else:
        try:
            grades_avg = float(grades_input)
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid 'grades' value"}), 400
        grades_avg = max(0.0, min(6.0, grades_avg))

    # prepare the raw value for storage: serialize if it is an object, otherwise store as-is
    if isinstance(grades_raw_received, dict):
        grades_raw_to_store = json.dumps(grades_raw_received, ensure_ascii=False)
    else:
        grades_raw_to_store = grades_raw_received

    # use numeric average for scoring calculations
    grades = grades_avg

    try:
        N_positive_notes = int(data.get('N_positive_notes', 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid 'N_positive_notes' value"}), 400
    try:
        N_negative_notes = int(data.get('N_negative_notes', 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid 'N_negative_notes' value"}), 400

    pos = max(0, N_positive_notes)
    neg = max(0, N_negative_notes)

    base_max = 1000.0
    adjusted_max = base_max + (pos * 25.0) - (neg * 50.0)
    adjusted_max = max(0.0, adjusted_max)

    if grades_avg <= 2.0:
        rating = 0.0
    elif grades_avg >= 6.0:
        rating = adjusted_max
    else:
        rating = ((grades_avg - 2.0) / (6.0 - 2.0)) * adjusted_max

    # ensure non-negative
    rating = max(0.0, rating)

    # store numeric average in `grades` and raw client payload in `grades_raw`, plus pupil_id and school
    db_instance.update_leaderboard_entry(
        username,
        rating,
        grades,
        grades_raw_to_store,
        pos,
        neg,
        passphrase,
        pupil_id,
        school
    )

    return jsonify({
        "status": "Score submitted",
        "rating": rating,
        "grades_average": grades_avg,
        "pupil_id": pupil_id,
        "school": school
    }), 200

@app.route('/leaderboard', methods=['GET'])
def leaderboard_view():
    rows = db().get_leaderboard()
    return render_template("leaderboard.html", rows=rows), 200

def run_server():
    app.run(
        host=cf().get('hostname', '0.0.0.0'),
        port=cf().get('port', 5000)
    )