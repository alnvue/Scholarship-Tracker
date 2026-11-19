import { useState, useEffect, useMemo, useRef } from "react";
import {
  MAIN_THEMES,
  wordCount,
  sentenceCount,
  limitNote,
  detectThemes,
  checkText,
  pickFixes,
} from "./textTools.js";
import RichEditor from "./RichEditor.jsx";

const API = "http://127.0.0.1:5000/api/essays";
const SCHOLARSHIP_API = "http://127.0.0.1:5000/api/scholarships";

const BLANK = { id: null, title: "", themes: [], content: "", html: "" };
const TYPE_COLORS = { spelling: "#c62828", grammar: "#d9531e", style: "#b26a00" };

function Essays({ theme, ui }) {
  const [essays, setEssays] = useState([]);
  const [offline, setOffline] = useState(false);
  const [scholarships, setScholarships] = useState([]);

  const [current, setCurrent] = useState(BLANK);
  const [saved, setSaved] = useState(BLANK);
  const [docKey, setDocKey] = useState(0);
  const [tagFilter, setTagFilter] = useState("All");
  const [customTag, setCustomTag] = useState("");

  const [prompt, setPrompt] = useState("");
  const [limit, setLimit] = useState("");

  const editorRef = useRef(null);

  function loadEssays() {
    fetch(API)
      .then((response) => response.json())
      .then((data) => {
        setEssays(Array.isArray(data) ? data : []);
        setOffline(false);
      })
      .catch(() => setOffline(true));
  }

  useEffect(() => {
    loadEssays();
    fetch(SCHOLARSHIP_API)
      .then((response) => response.json())
      .then((data) => setScholarships(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const dirty = JSON.stringify(current) !== JSON.stringify(saved);

  function openEssay(essay) {
    if (dirty && !window.confirm("You have unsaved changes. Discard them?")) return;

    const copy = {
      id: essay.id,
      title: essay.title,
      themes: essay.themes,
      content: essay.content,
      html: essay.html || "",
    };
    setCurrent(copy);
    setSaved(copy);
    setDocKey((k) => k + 1);
  }

  function newEssay() {
    if (dirty && !window.confirm("You have unsaved changes. Discard them?")) return;

    setCurrent(BLANK);
    setSaved(BLANK);
    setDocKey((k) => k + 1);
  }

  // The editor reports its text and formatting through these two
  function handleEditorLoad(html, text) {
    setCurrent((c) => ({ ...c, html, content: text }));
    setSaved((s) => ({ ...s, html, content: text }));
  }

  function handleEditorChange(html, text) {
    setCurrent((c) => ({ ...c, html, content: text }));
  }

  function toggleTheme(tag) {
    setCurrent((c) => ({
      ...c,
      themes: c.themes.includes(tag) ? c.themes.filter((t) => t !== tag) : [...c.themes, tag],
    }));
  }

  function addCustomTag() {
    const tag = customTag.trim().replace(/,/g, "");
    if (tag) {
      setCurrent((c) => (c.themes.includes(tag) ? c : { ...c, themes: [...c.themes, tag] }));
    }
    setCustomTag("");
  }

  function saveEssay() {
    if (!current.title.trim()) {
      alert("Give the essay a title first.");
      return;
    }

    const isNew = current.id === null;

    fetch(isNew ? API : `${API}/${current.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: current.title,
        themes: current.themes,
        content: current.content,
        html: current.html,
      }),
    })
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) {
          alert(body.error || "Could not save the essay.");
          return;
        }

        const next = {
          id: body.id,
          title: body.title,
          themes: body.themes,
          content: body.content,
          html: body.html,
        };
        setCurrent(next);
        setSaved(next);
        loadEssays();
      })
      .catch(() => alert("Can't reach Flask. Is python app.py running?"));
  }

  function deleteEssay() {
    if (current.id === null) {
      setCurrent(BLANK);
      setSaved(BLANK);
      setDocKey((k) => k + 1);
      return;
    }

    if (!window.confirm(`Delete "${current.title}"? This can't be undone.`)) return;

    fetch(`${API}/${current.id}`, { method: "DELETE" }).then(() => {
      setCurrent(BLANK);
      setSaved(BLANK);
      setDocKey((k) => k + 1);
      loadEssays();
    });
  }

  function fillFromScholarship(id) {
    const s = scholarships.find((item) => String(item.id) === id);
    if (s) {
      setPrompt([s.name, s.description, s.requirements].filter(Boolean).join(". "));
    }
  }

  // ----- Suggestions by theme tag (no keywords) -----
  const detected = useMemo(() => detectThemes(prompt), [prompt]);

  const ranked = useMemo(() => {
    if (detected.length === 0) return [];
    return essays
      .map((essay) => {
        const tags = essay.themes.map((t) => t.toLowerCase());
        const tagMatches = detected.filter((d) => tags.includes(d.toLowerCase()));
        return { essay, tagMatches };
      })
      .filter((item) => item.tagMatches.length > 0)
      .sort((a, b) => b.tagMatches.length - a.tagMatches.length);
  }, [essays, detected]);

  const limitNum = Number(limit) || 0;

  // ----- Current essay analysis -----
  const words = wordCount(current.content);
  const issues = useMemo(() => checkText(current.content), [current.content]);
  const fixes = useMemo(() => pickFixes(issues), [issues]);

  function fixIssue(issue) {
    editorRef.current.replaceRange(issue.start, issue.end, issue.replacement);
  }

  function fixAll() {
    // pickFixes goes from the end of the essay backwards, so positions stay valid
    for (const issue of fixes) {
      editorRef.current.replaceRange(issue.start, issue.end, issue.replacement);
    }
  }

  function showIssue(issue) {
    editorRef.current.selectRange(issue.start, issue.end);
  }

  // ----- Tag list -----
  const allTags = ["All", ...new Set(essays.flatMap((e) => e.themes))];
  const activeFilter = allTags.includes(tagFilter) ? tagFilter : "All";
  const shown = activeFilter === "All" ? essays : essays.filter((e) => e.themes.includes(activeFilter));
  const customTags = current.themes.filter((t) => !MAIN_THEMES.includes(t));

  const chip = (active) => ({
    ...ui.small,
    background: active ? theme.accent : theme.card,
    color: active ? "#ffffff" : theme.text,
    borderRadius: 999,
  });

  return (
    <div>
      {offline && (
        <div style={{ background: "#c62828", color: "#ffffff", padding: 12, marginBottom: 16, borderRadius: 6 }}>
          Can't reach Flask. Start it with: python app.py
        </div>
      )}

      {/* ---------- Suggest an essay for a prompt ---------- */}
      <div style={ui.card}>
        <h2 style={{ fontSize: "1.3em", marginTop: 0 }}>Find an essay for a prompt</h2>

        <select style={ui.input} value="" onChange={(e) => fillFromScholarship(e.target.value)}>
          <option value="">Fill from a saved scholarship (optional)</option>
          {scholarships.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <textarea
          style={{ ...ui.input, resize: "vertical" }}
          rows={4}
          placeholder="Paste the scholarship's essay prompt here"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <input
          style={ui.input}
          type="number"
          min="0"
          placeholder="Word limit (optional)"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />

        {detected.length > 0 && (
          <p style={{ marginTop: 0 }}>
            Themes this prompt seems to ask for: <strong>{detected.join(", ")}</strong>
          </p>
        )}

        {!prompt.trim() && <p style={{ opacity: 0.8, margin: 0 }}>Paste a prompt to see which of your essays fits its theme.</p>}
        {prompt.trim() && detected.length === 0 && <p style={{ margin: 0 }}>I couldn't tell which theme this prompt is about. Browse your essays below.</p>}
        {detected.length > 0 && ranked.length === 0 && <p>None of your essays are tagged {detected.join(", ")} yet. Tag one in the editor below.</p>}

        {ranked.slice(0, 3).map(({ essay, tagMatches }) => (
          <div key={essay.id} style={{ ...ui.card, marginBottom: 8, marginTop: 8 }}>
            <strong>{essay.title}</strong>
            <p style={{ margin: "6px 0" }}>Tagged {tagMatches.join(", ")}</p>
            <p style={{ margin: "6px 0" }}>
              {wordCount(essay.content)} words
              {limitNum > 0 && <> · {limitNote(wordCount(essay.content), limitNum)}</>}
            </p>
            <button style={ui.small} onClick={() => openEssay(essay)}>Open</button>
          </div>
        ))}
      </div>

      {/* ---------- Essay list ---------- */}
      <div style={ui.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.3em", margin: 0 }}>Your essays</h2>
          <button style={ui.small} onClick={newEssay}>New essay</button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>
          {allTags.map((tag) => (
            <button key={tag} style={chip(tag === activeFilter)} onClick={() => setTagFilter(tag)}>
              {tag}
            </button>
          ))}
        </div>

        {essays.length === 0 && <p style={{ margin: 0 }}>No essays yet. Write or paste one below and click Save.</p>}

        {shown.map((essay) => (
          <div
            key={essay.id}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderTop: `1px solid ${theme.border}` }}
          >
            <div>
              <strong>{essay.title}</strong>
              <div style={{ fontSize: "0.85em", opacity: 0.8 }}>
                {wordCount(essay.content)} words
                {essay.themes.length > 0 && <> · {essay.themes.join(", ")}</>}
              </div>
            </div>
            <button style={ui.small} onClick={() => openEssay(essay)}>Open</button>
          </div>
        ))}
      </div>

      {/* ---------- Editor ---------- */}
      <div style={ui.card}>
        <h2 style={{ fontSize: "1.3em", marginTop: 0 }}>
          {current.id === null ? "New essay" : "Edit essay"}
          {dirty && <span style={{ fontSize: "0.7em", marginLeft: 8, color: "#d9531e" }}>unsaved changes</span>}
        </h2>

        <input
          style={ui.input}
          placeholder="Essay title (e.g. Robotics club captain story)"
          value={current.title}
          onChange={(e) => setCurrent((c) => ({ ...c, title: e.target.value }))}
        />

        <label style={ui.label}>Themes</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {MAIN_THEMES.map((tag) => (
            <button key={tag} type="button" style={chip(current.themes.includes(tag))} onClick={() => toggleTheme(tag)}>
              {tag}
            </button>
          ))}
          {customTags.map((tag) => (
            <button key={tag} type="button" style={chip(true)} onClick={() => toggleTheme(tag)}>
              {tag} ×
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <input
            style={{ ...ui.input, marginBottom: 0 }}
            placeholder="Add your own theme tag"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
          />
          <button type="button" style={ui.small} onClick={addCustomTag}>Add</button>
        </div>

        <RichEditor
          ref={editorRef}
          docKey={docKey}
          html={current.html}
          text={current.content}
          onLoad={handleEditorLoad}
          onChange={handleEditorChange}
          ui={ui}
          theme={theme}
        />

        <p style={{ margin: "10px 0 12px", fontSize: "0.9em" }}>
          {words} words · {current.content.length} characters · {sentenceCount(current.content)} sentences
          {limitNum > 0 && (
            <span style={{ color: words > limitNum ? "#c62828" : "#2e7d32" }}> · {limitNote(words, limitNum)}</span>
          )}
        </p>

        <button style={ui.primary} onClick={saveEssay}>Save essay</button>{" "}
        <button style={{ ...ui.small, color: "#c62828", padding: "8px 16px" }} onClick={deleteEssay}>
          Delete
        </button>
      </div>

      {/* ---------- Writing check ---------- */}
      <div style={ui.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontSize: "1.3em", margin: 0 }}>Writing check ({issues.length})</h2>
          {fixes.length > 0 && (
            <button style={ui.small} onClick={fixAll}>Fix all ({fixes.length})</button>
          )}
        </div>

        {current.content.trim() === "" && <p style={{ marginBottom: 0 }}>Start writing and suggestions will show up here.</p>}
        {current.content.trim() !== "" && issues.length === 0 && <p style={{ marginBottom: 0 }}>No problems found. Still give it a careful read.</p>}

        {issues.slice(0, 40).map((issue, i) => (
          <div
            key={`${issue.start}-${i}`}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderTop: `1px solid ${theme.border}` }}
          >
            <div>
              <span style={{ color: TYPE_COLORS[issue.type], fontWeight: "bold", textTransform: "capitalize" }}>
                {issue.type}
              </span>
              {": "}
              {issue.message}
            </div>
            <div style={{ whiteSpace: "nowrap" }}>
              <button style={ui.small} onClick={() => showIssue(issue)}>Show</button>{" "}
              {issue.replacement !== undefined && (
                <button style={ui.small} onClick={() => fixIssue(issue)}>Fix</button>
              )}
            </div>
          </div>
        ))}
        {issues.length > 40 && <p>Showing the first 40. Fix some, and the rest will appear.</p>}

        <p style={{ fontSize: "0.8em", opacity: 0.7, marginBottom: 0 }}>
          This is a simple rule-based checker, not a full grammar tool. Your browser's red squiggles also work in the editor.
        </p>
      </div>
    </div>
  );
}

export default Essays;