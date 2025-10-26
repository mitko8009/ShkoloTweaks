from flask import Flask, request, jsonify
from utils import Config as cf
from utils import db

app = Flask(__name__)

@app.route('/', methods=['GET'])
def status():
    return jsonify({"status": "OK"}), 200

@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({"status": "OK"}), 200

@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    pass

def run_server():
    app.run(
        host=cf().get('hostname', '0.0.0.0'),
        port=cf().get('port', 5000)
    )