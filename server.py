from flask import Flask, request, jsonify
from utils import Config as cf

app = Flask(__name__)

@app.route('/api/data', methods=['POST'])
def process_data():
    data = request.json
    return jsonify({"message": "Data processed successfully", "data": data}), 200


def run_server():
    app.run(
        host=cf().get('hostname', '0.0.0.0'),
        port=cf().get('port', 5000)
    )