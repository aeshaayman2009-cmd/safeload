from flask import Flask, jsonify, request, send_from_directory, redirect, session
from flask_cors import CORS
import pandas as pd
import joblib
import sqlite3
import os

app = Flask(__name__)
app.secret_key = "safeload-secret-key"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
CORS(app)

MODEL_PATH = os.path.join(BASE_DIR, "ai_model.pkl")
DB_PATH = os.path.join(BASE_DIR, "database", "safeload.db")
model = joblib.load(MODEL_PATH)
def get_db_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection

@app.route("/css/<path:filename>")
def css_files(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, "css"), filename)


@app.route("/js/<path:filename>")
def js_files(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, "js"), filename)


@app.route("/images/<path:filename>")
def image_files(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, "images"), filename)

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form.get("username")
        password = request.form.get("password")

        if username == "admin" and password == "1234":

            session["logged_in"] = True

            return redirect("/dashboard")

        return "Invalid username or password"

    return send_from_directory(FRONTEND_DIR, "login.html")


@app.route("/dashboard")
def dashboard():

    if not session.get("logged_in"):
        return redirect("/login")

    return send_from_directory(FRONTEND_DIR, "index.html")
@app.route("/")
def home():
    return redirect("/login")

@app.route("/api/data")
def get_data():

    device_id = request.args.get("device_id")

    connection = get_db_connection()

    if device_id:
        data = connection.execute(
            "SELECT * FROM readings WHERE Device_ID = ? ORDER BY rowid ASC",
            (device_id,)
        ).fetchall()
    else:
        data = connection.execute(
            "SELECT * FROM readings"
        ).fetchall()

    connection.close()

    return jsonify([dict(row) for row in data])

@app.route("/api/latest")
def get_latest():

    device_id = request.args.get("device_id")

    connection = get_db_connection()

    if device_id:
        latest = connection.execute(
            "SELECT * FROM readings WHERE Device_ID = ? ORDER BY rowid DESC LIMIT 1",
            (device_id,)
        ).fetchone()
    else:
        latest = connection.execute(
            "SELECT * FROM readings ORDER BY rowid DESC LIMIT 1"
        ).fetchone()

    connection.close()

    if latest is None:
        return jsonify({"found": False}), 404

    return jsonify(dict(latest))


@app.route("/api/status")
def get_status():
    connection = get_db_connection()

    latest = connection.execute(
        "SELECT * FROM readings ORDER BY rowid DESC LIMIT 1"
    ).fetchone()

    connection.close()

    current = float(latest["Current"])
    maximum = float(latest["Maximum_Limit"])
    temperature = float(latest["Temperature"])

    load_percentage = (current / maximum) * 100

    if load_percentage >= 100:
        status = "Critical"
    elif load_percentage >= 80:
        status = "Warning"
    else:
        status = "Normal"

    return jsonify({
        "device_id": str(latest["Device_ID"]),
        "current": current,
        "maximum_limit": maximum,
        "temperature": temperature,
        "status": status,
        "load_percentage": round(load_percentage, 1)
    })


@app.route("/api/predict", methods=["GET"])
def predict():
    current = float(request.args.get("current"))
    temperature = float(request.args.get("temperature"))

    prediction = model.predict([[current, temperature]])

    if prediction[0] == 1:
        result = "High Load Predicted"
    else:
        result = "Normal Load Predicted"

    return jsonify({
        "current": current,
        "temperature": temperature,
        "prediction": result
    })

@app.route("/api/device/<device_id>")
def get_device(device_id):

    connection = get_db_connection()

    device = connection.execute(
        "SELECT * FROM readings WHERE Device_ID = ? ORDER BY rowid DESC LIMIT 1",
        (device_id,)
    ).fetchone()

    connection.close()

    if device is None:
        return jsonify({"found": False})

    current = float(device["Current"])
    maximum_limit = float(device["Maximum_Limit"])
    load_percentage = (current / maximum_limit) * 100

    return jsonify({
        "found": True,
        "device_id": str(device["Device_ID"]),
        "current": current,
        "maximum_limit": maximum_limit,
        "temperature": float(device["Temperature"]),
        "status": str(device["Status"]),
        "load_percentage": round(load_percentage, 1)
    })

@app.route("/api/reading", methods=["POST"])
def add_reading():

    data = request.json

    device_id = data["device_id"]
    current = float(data["current"])
    temperature = float(data["temperature"])
    maximum_limit = float(data.get("maximum_limit", 10))

    load_percentage = (current / maximum_limit) * 100

    if load_percentage >= 100:
        status = "Critical"
    elif load_percentage >= 80:
        status = "Warning"
    else:
        status = "Normal"

    connection = get_db_connection()

    connection.execute(
        """
        INSERT INTO readings
        (Device_ID, Current, Maximum_Limit, Temperature, Status, Time, Date)
        VALUES (?, ?, ?, ?, ?, time('now'), date('now'))
        """,
        (
            device_id,
            current,
            maximum_limit,
            temperature,
            status
        )
    )

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Reading added successfully",
        "status": status
    })


@app.route("/api/power", methods=["POST"])
def power_control():
    data = request.json

    device_id = data.get("device_id")
    power = data.get("power")

    if not device_id or power not in ["ON", "OFF"]:
        return jsonify({
            "success": False,
            "message": "Invalid device ID or power state"
        }), 400

    # مؤقتًا: تسجيل أمر التحكم فقط
    print(f"Power Control → Device: {device_id}, Power: {power}")

    return jsonify({
        "success": True,
        "device_id": device_id,
        "power": power
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)