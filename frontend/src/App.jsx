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

const STATUSES = ["Not Started", "In Progress", "Applied", "Submitted"];

const EMPTY_FORM = {
  name: "",
  provider: "",
  amount: "",
  open_date: "",
  deadline: "",
  winner_date: "",
  link: "",
  description: "",
  requirements: "",
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

function sortList(list, sortBy) {
  const copy = [...list];

  if (sortBy === "deadline") copy.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
  else if (sortBy === "amount") copy.sort((a, b) => (b.amount || 0) - (a.amount || 0));
  else if (sortBy === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
  else copy.sort((a, b) => b.id - a.id);

  return copy;
}

function App() {
  const [scholarships, setScholarships] = useState([]);
  const [offline, setOffline] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline");
  const [hideClosed, setHideClosed] = useState(false);

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
      .then((data) => {
        setScholarships(data);
        setOffline(false);
      })
      .catch(() => setOffline(true));
  }

  useEffect(() => {
    loadScholarships();

    const timer = setInterval(loadScholarships, 5000);
    window.addEventListener("focus", loadScholarships);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", loadScholarships);
    };
  }, []);

  function setField(key, value) {
    setForm({ ...form, [key]: value });
  }

  function startEdit(s) {
    setForm({
      name: s.name || "",
      provider: s.provider || "",
      amount: s.amount ?? "",
      open_date: s.open_date || "",
      deadline: s.deadline || "",
      winner_date: s.winner_date || "",
      link: s.link || "",
      description: s.description || "",
      requirements: s.requirements || "",
    });
    setEditingId(s.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const isEditing = editingId !== null;

    fetch(isEditing ? `${API}/${editingId}` : API, {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) {
          alert(body.error || "Could not save the scholarship.");
          return;
        }

        cancelEdit();
        loadScholarships();
      })
      .catch(() => alert("Can't reach Flask. Is python app.py running?"));
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

    if (editingId === id) cancelEdit();
    fetch(`${API}/${id}`, { method: "DELETE" }).then(() => loadScholarships());
  }

  const text = search.trim().toLowerCase();

  const filtered = scholarships.filter((s) => {
    const left = daysFromToday(s.deadline);

    if (hideClosed && left < 0) return false;
    if (filter === "closing" && !(left >= 0 && left <= 7)) return false;
    if (STATUSES.includes(filter) && s.status !== filter) return false;

    if (text) {
      const haystack = `${s.name} ${s.provider || ""} ${s.requirements || ""}`.toLowerCase();
      if (!haystack.includes(text)) return false;
    }

    return true;
  });

  const visible = sortList(filtered, sortBy);

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

  const controlStyle = { ...inputStyle, width: "auto", marginBottom: 0 };

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
        <button onClick={loadScholarships} style={smallButton}>
          Refresh
        </button>
      </div>

      {offline && (
        <div style={{ background: "#c62828", color: "#ffffff", padding: 12, marginBottom: 16, borderRadius: 6 }}>
          Can't reach Flask. Start it with: python app.py
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 20, marginTop: 0 }}>{editingId !== null ? "Edit scholarship" : "Add a scholarship"}</h2>

        <input style={inputStyle} placeholder="Scholarship name" value={form.name} onChange={(e) => setField("name", e.target.value)} required />
        <input style={inputStyle} placeholder="Provider / company (e.g. Mensa Foundation)" value={form.provider} onChange={(e) => setField("provider", e.target.value)} />
        <input style={inputStyle} type="number" placeholder="Amount ($)" value={form.amount} onChange={(e) => setField("amount", e.target.value)} required />

        <label style={labelStyle}>Application opens (optional)</label>
        <input style={inputStyle} type="date" value={form.open_date} onChange={(e) => setField("open_date", e.target.value)} />

        <label style={labelStyle}>Application deadline (closes)</label>
        <input style={inputStyle} type="date" value={form.deadline} onChange={(e) => setField("deadline", e.target.value)} required />

        <label style={labelStyle}>Winner announced (optional)</label>
        <input style={inputStyle} type="date" value={form.winner_date} onChange={(e) => setField("winner_date", e.target.value)} />

        <input style={inputStyle} type="url" placeholder="Official link (https://...)" value={form.link} onChange={(e) => setField("link", e.target.value)} />
        <input style={inputStyle} placeholder="Short description (your own words)" value={form.description} onChange={(e) => setField("description", e.target.value)} />
        <input style={inputStyle} placeholder="Requirements" value={form.requirements} onChange={(e) => setField("requirements", e.target.value)} />

        <button type="submit" style={primaryButton}>
          {editingId !== null ? "Save changes" : "Add scholarship"}
        </button>
        {editingId !== null && (
          <button type="button" onClick={cancelEdit} style={{ ...smallButton, marginLeft: 8, padding: "8px 16px" }}>
            Cancel
          </button>
        )}
      </form>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <input
          style={{ ...controlStyle, flex: 1, minWidth: 140 }}
          placeholder="Search name, provider, requirements"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={controlStyle} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="closing">Closing within 7 days</option>
          {STATUSES.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
        <select style={controlStyle} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="deadline">Sort: deadline (soonest)</option>
          <option value="amount">Sort: amount (highest)</option>
          <option value="name">Sort: name (A to Z)</option>
          <option value="newest">Sort: newest added</option>
        </select>
        <label>
          <input type="checkbox" checked={hideClosed} onChange={(e) => setHideClosed(e.target.checked)} /> Hide closed
        </label>
      </div>

      {!offline && scholarships.length === 0 && <p>No scholarships yet.</p>}
      {scholarships.length > 0 && (
        <p style={{ fontSize: 13, opacity: 0.8 }}>
          Showing {visible.length} of {scholarships.length}
        </p>
      )}
      {scholarships.length > 0 && visible.length === 0 && <p>Nothing matches your search or filters.</p>}

      {visible.map((s) => {
        const status = windowStatus(s);
        const winner = winnerText(s);

        return (
          <div
            key={s.id}
            style={{
              background: theme.card,
              border: `1px solid ${s.id === editingId ? theme.accent : theme.border}`,
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
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
                {STATUSES.map((st) => (
                  <option key={st}>{st}</option>
                ))}
              </select>
            </p>
            {s.submitted_date && <p>Submitted on: {s.submitted_date}</p>}

            <button onClick={() => startEdit(s)} style={smallButton}>
              Edit
            </button>{" "}
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