from flask import Flask, jsonify, request
from flask_cors import CORS
from database import create_tables, get_scholarships, add_scholarship 

app = Flask(__name__)
CORS(app)

create_tables()


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
        })

    return jsonify(scholarships)

@app.route("/api/scholarships", methods=["POST"])
def create_scholarship():
    data = request.get_json()

    add_scholarship(
        data["name"],
        float(data["amount"]),
        data["deadline"],
        data["requirements"],
    )

    return jsonify({"message": "Saved"}), 201

if __name__ == "__main__":
    app.run(debug=True)