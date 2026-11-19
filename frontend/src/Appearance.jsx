import { FONTS, DEFAULT_TYPOGRAPHY } from "./typography.js";

const WIDTHS = { Narrow: 700, Medium: 900, Wide: 1100 };

function Appearance({ theme, ui, themes, themeName, customAccent, onTheme, onAccent, typography, onTypography }) {
  const chip = (active) => ({ ...ui.small, outline: active ? `2px solid ${theme.accent}` : "none" });
  const set = (key, value) => onTypography({ ...typography, [key]: value });

  function slider(label, key, min, max, step, unit) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={ui.label}>
          {label}: {typography[key]}{unit}
        </label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={typography[key]}
          onChange={(e) => set(key, Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={ui.card}>
        <h2 style={{ fontSize: "1.3em", marginTop: 0 }}>Theme</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {Object.keys(themes).map((t) => (
            <button key={t} onClick={() => onTheme(t)} style={chip(t === themeName && !customAccent)}>
              {t}
            </button>
          ))}
          <label style={{ marginLeft: 8 }}>
            Accent <input type="color" value={theme.accent} onChange={(e) => onAccent(e.target.value)} />
          </label>
        </div>
      </div>

      <div style={ui.card}>
        <h2 style={{ fontSize: "1.3em", marginTop: 0 }}>Text</h2>

        {theme.scene && (
          <p style={{ marginTop: 0 }}>
            The pixel themes use their own pixel font for the page. The preview below still shows your chosen font. Switch to Light, Dark, Ocean, Forest, or Sunset to use these settings across the app.
          </p>
        )}

        <label style={ui.label}>Font</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {Object.keys(FONTS).map((name) => (
            <button
              key={name}
              onClick={() => set("font", name)}
              style={{ ...chip(typography.font === name), fontFamily: FONTS[name] }}
            >
              {name}
            </button>
          ))}
        </div>

        <div
          style={{
            position: "sticky",
            top: 8,
            zIndex: 1,
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            padding: 12,
            marginBottom: 16,
            fontFamily: FONTS[typography.font] || FONTS["Sans-serif"],
            fontSize: typography.size,
            lineHeight: typography.lineHeight,
            letterSpacing: `${typography.letterSpacing}px`,
            wordSpacing: `${typography.wordSpacing}px`,
          }}
        >
          <strong>Preview</strong>
          <p style={{ margin: "6px 0 0" }}>
            Leading the robotics team taught me that a good leader listens first. Every Saturday, I volunteered at the
            community center, and those mornings shaped the career I want to build.
          </p>
        </div>

        {slider("Text size", "size", 12, 24, 1, "px")}
        {slider("Line spacing", "lineHeight", 1.2, 2.4, 0.1, "")}
        {slider("Letter spacing", "letterSpacing", 0, 3, 0.5, "px")}
        {slider("Word spacing", "wordSpacing", 0, 10, 1, "px")}

        <label style={ui.label}>Page width</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {Object.entries(WIDTHS).map(([name, value]) => (
            <button key={name} onClick={() => set("width", value)} style={chip(typography.width === value)}>
              {name}
            </button>
          ))}
        </div>

        <button style={ui.small} onClick={() => onTypography(DEFAULT_TYPOGRAPHY)}>
          Reset text settings
        </button>
      </div>
    </div>
  );
}

export default Appearance;