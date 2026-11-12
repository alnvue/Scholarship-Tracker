import { useState, useEffect } from "react";

const API = "http://127.0.0.1:5000/api/scholarships";

function App() {
  const [scholarships, setScholarships] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requirements, setRequirements] = useState("");

  function loadScholarships() {
    fetch(API)
      .then((response) => response.json())
      .then((data) => setScholarships(data));
  }

  useEffect(() => {
    loadScholarships();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount, deadline, requirements }),
    }).then(() => {
      setName("");
      setAmount("");
      setDeadline("");
      setRequirements("");
      loadScholarships();
    });
  }

  function changeStatus(id, newStatus) {
    fetch(`${API}/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).then(() => loadScholarships());
  }

  const inputStyle = { display: "block", width: "100%", padding: 8, marginBottom: 10, boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Scholarship Tracker</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
        <input style={inputStyle} placeholder="Scholarship name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input style={inputStyle} type="number" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <input style={inputStyle} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
        <input style={inputStyle} placeholder="Requirements" value={requirements} onChange={(e) => setRequirements(e.target.value)} />
        <button type="submit" style={{ padding: "8px 16px" }}>Add scholarship</button>
      </form>

      {scholarships.length === 0 && <p>No scholarships yet.</p>}

      {scholarships.map((s) => (
        <div key={s.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <h3>{s.name}</h3>
          <p>Amount: ${s.amount}</p>
          <p>Deadline: {s.deadline}</p>
          <p>Requirements: {s.requirements}</p>
          <p>
            Status:{" "}
            <select value={s.status} onChange={(e) => changeStatus(s.id, e.target.value)}>
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Applied</option>
              <option>Submitted</option>
            </select>
          </p>
          {s.submitted_date && <p>Submitted on: {s.submitted_date}</p>}
        </div>
      ))}
    </div>
  );
}

export default App;