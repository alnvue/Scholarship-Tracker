import { useState, useEffect } from "react";
import "./retro.css";

const API = "http://127.0.0.1:5000/api/scholarships";

const PIXEL_FONT = '"Press Start 2P", "Courier New", monospace';

const THEMES = {
  Light: { bg: "#f6f6f9", card: "#ffffff", text: "#222222", border: "#d8d8e0", accent: "#4f46e5" },
  Dark: { bg: "#14151a", card: "#1f2129", text: "#ececf1", border: "#34363f", accent: "#8b8dff" },
  Ocean: { bg: "#eaf6fb", card: "#ffffff", text: "#12343b", border: "#b9dbe6", accent: "#0b7a99" },
  Forest: { bg: "#eef5ee", card: "#ffffff", text: "#1d3322", border: "#c3d9c5", accent: "#2f7d46" },
  Sunset: { bg: "#fff3ea", card: "#ffffff", text: "#3b2418", border: "#f0cdb5", accent: "#d9531e" },
  Quest: { bg: "#10261c", card: "#1b3a2a", text: "#f3e9c6", border: "#d9b64a", accent: "#e8c547", scene: "quest", font: PIXEL_FONT },
  "Sky Run": { bg: "#5c94fc", card: "#fff6dc", text: "#2b1b0e", border: "#8a4b1c", accent: "#d9531e", scene: "sky", font: PIXEL_FONT },
  "Monster Trail": { bg: "#6cc36c", card: "#fbfbf2", text: "#1d2b1d", border: "#2e5e2e", accent: "#3b6fd4", scene: "trail", font: PIXEL_FONT },
};

const BITS = Array.from({ length: 14 }, (_, i) => i);

function Scene({ kind }) {
  if (!kind) return null;

  return (
    <div className={`scene scene-${kind}`} aria-hidden="true">
      {kind === "sky" && (
        <>
          <i className="cloud c1" />
          <i className="cloud c2" />
          <i className="cloud c3" />
          <div className="ground" />
        </>
      )}
      {kind === "quest" && (
        <>
          <div className="hill far" />
          <div className="hill near" />
        </>
      )}
      {(kind === "quest" || kind === "trail") &&
        BITS.map((i) => (
          <i
            key={i}
            className="bit"
            style={{
              left: `${(i * 37) % 100}%`,
              top: kind === "quest" ? `${35 + ((i * 13) % 55)}%` : undefined,
              animationDelay: `${-((i * 7) % 9)}s`,
            }}
          />
        ))}
    </div>
  );
}

function loadSetting(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable, ignore
  }
}

function parseDate(str) {
  const [year, month, day] = str.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysFromToday(str) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(str) - today) / 86400000);
}

function plural(n) {
  return n === 1 ? "1 day" : `${n} days`;
}

function windowStatus(s) {
  if (s.open_date && daysFromToday(s.open_date) > 0) {
    return { label: `Opens in ${plural(daysFromToday(s.open_date))}`, color: "#b26a00" };
  }

  const left = daysFromToday(s.deadline);

  if (left < 0) return { label: "Closed", color: "#757575" };
  if (left === 0) return { label: "Closes today", color: "#c62828" };
  if (left <= 7) return { label: `Closes in ${plural(left)}`, color: "#d9531e" };
  return { label: `Open · closes in ${plural(left)}`, color: "#2e7d32" };
}

function winnerText(s) {
  if (!s.winner_date) return null;

  const days = daysFromToday(s.winner_date);

  if (days > 0) return `Winner announced: ${s.winner_date} (in ${plural(days)})`;
  if (days === 0) return "Winner announced: today";
  return `Winner announced: ${s.winner_date}`;
}

function App() {
  const [scholarships, setScholarships] = useState([]);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [amount, setAmount] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [winnerDate, setWinnerDate] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  const [themeName, setThemeName] = useState(() => loadSetting("themeName", "Light"));
  const [customAccent, setCustomAccent] = useState(() => loadSetting("customAccent", ""));

  const baseTheme = THEMES[themeName] || THEMES.Light;
  const theme = { ...baseTheme, accent: customAccent || baseTheme.accent };

  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.classList.toggle("pixel", Boolean(theme.scene));
  }, [theme.bg, theme.scene]);

  function chooseTheme(newName) {
    setThemeName(newName);
    setCustomAccent("");
    saveSetting("themeName", newName);
    saveSetting("customAccent", "");
  }

  function chooseAccent(color) {
    setCustomAccent(color);
    saveSetting("customAccent", color);
  }

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
      body: JSON.stringify({
        name,
        provider,
        amount,
        open_date: openDate,
        deadline,
        winner_date: winnerDate,
        link,
        description,
        requirements,
      }),
    })
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) {
          alert(body.error || "Could not save the scholarship.");
          return;
        }

        setName("");
        setProvider("");
        setAmount("");
        setOpenDate("");
        setDeadline("");
        setWinnerDate("");
        setLink("");
        setDescription("");
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

  function deleteScholarship(id, scholarshipName) {
    if (!window.confirm(`Delete "${scholarshipName}"?`)) return;

    fetch(`${API}/${id}`, { method: "DELETE" }).then(() => loadScholarships());
  }

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: 8,
    marginBottom: 10,
    boxSizing: "border-box",
    background: theme.card,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: 6,
    fontSize: 14,
  };

  const labelStyle = { display: "block", fontSize: 13, marginBottom: 4, opacity: 0.8 };

  const primaryButton = {
    padding: "8px 16px",
    background: theme.accent,
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  };

  const smallButton = {
    padding: "4px 10px",
    background: theme.card,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: 6,
    cursor: "pointer",
  };

  return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 16px", fontFamily: theme.font || "sans-serif", textAlign: "left", color: theme.text }}>
          <Scene kind={theme.scene} />
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>Scholarship Tracker</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>
        <span>Theme:</span>
        {Object.keys(THEMES).map((t) => (
          <button
            key={t}
            onClick={() => chooseTheme(t)}
            style={{ ...smallButton, outline: t === themeName && !customAccent ? `2px solid ${theme.accent}` : "none" }}
          >
            {t}
          </button>
        ))}
        <label style={{ marginLeft: 8 }}>
          Accent{" "}
          <input type="color" value={theme.accent} onChange={(e) => chooseAccent(e.target.value)} />
        </label>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
        <input style={inputStyle} placeholder="Scholarship name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input style={inputStyle} placeholder="Provider / company (e.g. Mensa Foundation)" value={provider} onChange={(e) => setProvider(e.target.value)} />
        <input style={inputStyle} type="number" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} required />

        <label style={labelStyle}>Application opens (optional)</label>
        <input style={inputStyle} type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} />

        <label style={labelStyle}>Application deadline (closes)</label>
        <input style={inputStyle} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />

        <label style={labelStyle}>Winner announced (optional)</label>
        <input style={inputStyle} type="date" value={winnerDate} onChange={(e) => setWinnerDate(e.target.value)} />

        <input style={inputStyle} type="url" placeholder="Official link (https://...)" value={link} onChange={(e) => setLink(e.target.value)} />
        <input style={inputStyle} placeholder="Short description (your own words)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input style={inputStyle} placeholder="Requirements" value={requirements} onChange={(e) => setRequirements(e.target.value)} />
        <button type="submit" style={primaryButton}>Add scholarship</button>
      </form>

      {scholarships.length === 0 && <p>No scholarships yet.</p>}

      {scholarships.map((s) => {
        const status = windowStatus(s);
        const winner = winnerText(s);

        return (
          <div
            key={s.id}
            style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 16, marginBottom: 12 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <h3 style={{ marginTop: 0 }}>{s.name}</h3>
              <span
                style={{
                  background: status.color,
                  color: "#ffffff",
                  fontSize: 12,
                  padding: "3px 10px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                }}
              >
                {status.label}
              </span>
            </div>

            {s.provider && <p>Provider: {s.provider}</p>}
            {s.description && <p>{s.description}</p>}
            <p>Amount: ${s.amount}</p>

            {s.open_date && <p>Opens: {s.open_date}</p>}
            <p>Deadline: {s.deadline}</p>
            {winner && <p>{winner}</p>}

            <p>Requirements: {s.requirements}</p>
            {s.link && s.link.startsWith("http") && (
              <p>
                <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }}>
                  Official page
                </a>
              </p>
            )}
            <p>
              Status:{" "}
              <select
                value={s.status}
                onChange={(e) => changeStatus(s.id, e.target.value)}
                style={{ background: theme.card, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 4, padding: 4 }}
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Applied</option>
                <option>Submitted</option>
              </select>
            </p>
            {s.submitted_date && <p>Submitted on: {s.submitted_date}</p>}
            <button onClick={() => deleteScholarship(s.id, s.name)} style={{ ...smallButton, color: "#c62828" }}>
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default App;