const API = "http://127.0.0.1:5000/api/scholarships";
const $ = (id) => document.getElementById(id);

// This function runs INSIDE the scholarship page, so it must be self-contained.
function extractFromPage() {
  const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
  const bodyText = clean(document.body.innerText);

  // ----- Name -----
  const h1 = document.querySelector("h1");
  const og = document.querySelector('meta[property="og:title"]');
  let name = clean(h1 ? h1.innerText : "") || clean(og ? og.content : "") || clean(document.title);
  name = name.split(/\s[|–—-]\s/)[0].trim();

  // ----- Provider -----
  const site = document.querySelector('meta[property="og:site_name"]');
  const provider = clean(site ? site.content : "") || location.hostname.replace(/^www\./, "");

  // ----- Amount: prefer dollar figures near words like "award" -----
  let amount = "";
  let best = -1;
  for (const m of bodyText.matchAll(/\$\s?(\d{1,3}(?:,\d{3})+|\d+)(\.\d{2})?/g)) {
    const around = bodyText.slice(Math.max(0, m.index - 80), m.index + 40).toLowerCase();
    let score = 0;
    if (/award|scholarship|prize|worth|up to|value|receive|grant/.test(around)) score += 2;
    if (/fee|cost|tuition/.test(around)) score -= 3;
    if (score > best) {
      best = score;
      amount = m[1].replace(/,/g, "");
    }
  }

  // ----- Deadline: find dates, keep the first one that follows deadline-type words -----
  const months = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";
  const monthNum = (s) => months.split("|").indexOf(s.slice(0, 3).toLowerCase()) + 1;
  const pad = (n) => String(n).padStart(2, "0");
  const found = [];

  const add = (index, y, mo, d) => {
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      found.push({ index, iso: `${y}-${pad(mo)}-${pad(d)}` });
    }
  };

  const monthFirst = new RegExp(`(${months})[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`, "gi");
  const dayFirst = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(${months})[a-z]*\\.?,?\\s+(\\d{4})`, "gi");
  const slashes = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;
  const iso = /(\d{4})-(\d{2})-(\d{2})/g;

  for (const m of bodyText.matchAll(monthFirst)) add(m.index, +m[3], monthNum(m[1]), +m[2]);
  for (const m of bodyText.matchAll(dayFirst)) add(m.index, +m[3], monthNum(m[2]), +m[1]);
  for (const m of bodyText.matchAll(slashes)) add(m.index, +m[3], +m[1], +m[2]);
  for (const m of bodyText.matchAll(iso)) add(m.index, +m[1], +m[2], +m[3]);

  found.sort((a, b) => a.index - b.index);

  let deadline = "";
  for (const f of found) {
    const before = bodyText.slice(Math.max(0, f.index - 70), f.index).toLowerCase();
    if (/deadline|due|clos|apply by|submit|submission|no later than|until/.test(before)) {
      deadline = f.iso;
      break;
    }
  }

  // ----- Requirements: text under a heading like "Eligibility" -----
  let requirements = "";
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,strong,b,dt")];
  const head = headings.find(
    (h) => /eligib|requirement|qualif|who can apply/i.test(h.innerText) && h.innerText.length < 80
  );

  if (head) {
    const node = /^(STRONG|B)$/.test(head.tagName) && head.parentElement ? head.parentElement : head;
    const parts = [];
    let el = node.nextElementSibling;

    while (el && parts.join(" ").length < 700 && !/^H[1-6]$/.test(el.tagName)) {
      parts.push(clean(el.innerText));
      el = el.nextElementSibling;
    }

    requirements = clean(parts.join(" ")).slice(0, 700);
    if (!requirements) requirements = clean(node.innerText).slice(0, 700);
  }

  return { name, provider, amount, deadline, requirements, link: location.href };
}

// ----- Popup logic -----
function setStatus(message, isError) {
  const el = $("status");
  el.textContent = message;
  el.className = isError ? "error" : "ok";
}

function fillForm(data) {
  $("name").value = data.name || "";
  $("provider").value = data.provider || "";
  $("amount").value = data.amount || "";
  $("deadline").value = data.deadline || "";
  $("requirements").value = data.requirements || "";
  $("link").value = data.link || "";

  const missing = [];
  if (!data.amount) missing.push("amount");
  if (!data.deadline) missing.push("deadline");
  if (!data.requirements) missing.push("eligibility");

  if (missing.length) {
    setStatus(`Couldn't find: ${missing.join(", ")}. Please fill in.`, true);
  } else {
    setStatus("Check the details, then save.");
  }
}

async function clipPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFromPage,
    });
    fillForm(result);
  } catch (error) {
    setStatus("Can't read this page. Fill in the details by hand.", true);
  }
}

$("save").addEventListener("click", async () => {
  const body = {
    name: $("name").value.trim(),
    provider: $("provider").value.trim(),
    amount: $("amount").value,
    deadline: $("deadline").value,
    requirements: $("requirements").value.trim(),
    link: $("link").value.trim(),
    description: "",
  };

  if (!body.name || !body.amount || !body.deadline) {
    setStatus("Name, amount, and deadline are required.", true);
    return;
  }

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Could not save.", true);
      return;
    }

    setStatus("Saved to your tracker!");
    $("save").disabled = true;
  } catch (error) {
    setStatus("Can't reach Flask. Is python app.py running?", true);
  }
});

clipPage();