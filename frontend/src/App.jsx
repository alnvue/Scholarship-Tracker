import { useState, useEffect } from "react";

function App() {
  const [scholarships, setScholarships] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/scholarships")
  .then((response) => response.json())
  .then((data) => setScholarships(data));
}, []);

return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Scholarship Tracker</h1>

      {scholarships.length === 0 && <p>No scholarships found.</p>}

      {scholarships.map((s) => (
        <div
          key ={s.id}
          style ={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 12}}
          >
            <h3>{s.name}</h3>
            <p>Amount: ${s.amount}</p>
            <p>Deadline: {s.deadline}</p>
            <p>Requirements: {s.requirements}</p>
            <p>Status: {s.status}</p>
          </div>
        ))}
       </div>
    );
  }   
export default App;

