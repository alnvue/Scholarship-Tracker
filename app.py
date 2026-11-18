from flask import Flask, jsonify, request
from flask_cors import CORS
from database import (
    create_tables,
    get_scholarships,
    add_scholarship,
    update_scholarship,
    update_status,
    delete_scholarship,
)

app = Flask(__name__)
CORS(app)

create_tables()


def date_error(data):
    deadline = data["deadline"]
    open_date = data.get("open_date", "")
    winner_date = data.get("winner_date", "")

    if open_date and open_date > deadline:
        return "The open date must be on or before the deadline."
    if winner_date and winner_date < deadline:
        return "The winner date must be on or after the deadline."
    return None


def clean_link(link):
    if link and not link.startswith(("http://", "https://")):
        return ""
    return link


@app.route("/api/scholarships", methods=["GET"])
def list_scholarships():
    rows = get_scholarships()

    scholarships = []
    for s in rows:
        scholarships.append({
            "id": s[0],
            "name": s[1],
            "amount": s[2],
            "deadline": s[3],
            "requirements": s[4],
            "status": s[5],
            "submitted_date": s[6],
            "provider": s[7],
            "link": s[8],
            "description": s[9],
            "open_date": s[10],
            "winner_date": s[11],
        })

    return jsonify(scholarships)


@app.route("/api/scholarships", methods=["POST"])
def create_scholarship():
    data = request.get_json()

    error = date_error(data)
    if error:
        return jsonify({"error": error}), 400

    add_scholarship(
        data["name"],
        float(data["amount"]),
        data["deadline"],
        data["requirements"],
        provider=data.get("provider", ""),
        link=clean_link(data.get("link", "")),
        description=data.get("description", ""),
        open_date=data.get("open_date", ""),
        winner_date=data.get("winner_date", ""),
    )

    return jsonify({"message": "Saved"}), 201


@app.route("/api/scholarships/<int:scholarship_id>", methods=["PUT"])
def edit_scholarship(scholarship_id):
    data = request.get_json()

    error = date_error(data)
    if error:
        return jsonify({"error": error}), 400

    update_scholarship(
        scholarship_id,
        data["name"],
        float(data["amount"]),
        data["deadline"],
        data["requirements"],
        provider=data.get("provider", ""),
        link=clean_link(data.get("link", "")),
        description=data.get("description", ""),
        open_date=data.get("open_date", ""),
        winner_date=data.get("winner_date", ""),
    )

    return jsonify({"message": "Updated"})


@app.route("/api/scholarships/<int:scholarship_id>/status", methods=["PUT"])
def change_status(scholarship_id):
    data = request.get_json()
    update_status(scholarship_id, data["status"])
    return jsonify({"message": "Updated"})


@app.route("/api/scholarships/<int:scholarship_id>", methods=["DELETE"])
def remove_scholarship(scholarship_id):
    delete_scholarship(scholarship_id)
    return jsonify({"message": "Deleted"})


if __name__ == "__main__":
    app.run(debug=True)