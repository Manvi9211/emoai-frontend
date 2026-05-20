import { saveJournal, getJournalHistory } from "./api.js";
import { requireAuth, logout } from "./auth.js";

requireAuth("login.html");

document.getElementById("logout-btn")?.addEventListener("click", () => logout("login.html"));

const textarea = document.getElementById("journal-input");
const wordCountEl = document.getElementById("word-count");
const reflectBtn = document.getElementById("reflect-btn");
const reflectionCard = document.getElementById("reflection-card");
const reflectionEl = document.getElementById("reflection-text");
const emotionEl = document.getElementById("reflection-emotion");
const historyEl = document.getElementById("journal-history");

const EMOTION_COLORS = {
    joy: "#D4870A", sadness: "#3B82C4", anger: "#C43B3B",
    fear: "#7C3AC4", surprise: "#1A9E6A", disgust: "#6B5540", neutral: "#7A6E67",
};

// ── Word count ───────────────────────────────────────────
textarea.addEventListener("input", () => {
    const words = textarea.value.trim() ? textarea.value.trim().split(/\s+/).length : 0;
    wordCountEl.textContent = `${words} word${words !== 1 ? "s" : ""}`;
    reflectBtn.disabled = words < 5;
});

// ── Reflect button ───────────────────────────────────────
reflectBtn.addEventListener("click", async () => {
    const content = textarea.value.trim();
    if (!content || content.split(/\s+/).length < 5) return;
    reflectBtn.disabled = true;
    reflectBtn.textContent = "Reflecting…";
    reflectionCard.style.display = "none";
    try {
        const data = await saveJournal(content);
        reflectionEl.textContent = data.reflection;
        const label = data.emotion?.label || "neutral";
        const score = Math.round((data.emotion?.score || 0.5) * 100);
        const color = EMOTION_COLORS[label] || "#7A6E67";
        emotionEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:5px">
      <span style="width:7px;height:7px;border-radius:50%;background:${color};display:inline-block"></span>
      ${label} · ${score}%
    </span>`;
        reflectionCard.style.display = "block";
        reflectionCard.scrollIntoView({ behavior: "smooth" });
        loadHistory();
    } catch (err) {
        reflectionEl.textContent = "Something went wrong. Is the backend running?";
        reflectionCard.style.display = "block";
    } finally {
        reflectBtn.disabled = false;
        reflectBtn.textContent = "Reflect";
    }
});

// ── Load history ─────────────────────────────────────────
async function loadHistory() {
    const data = await getJournalHistory().catch(() => ({ entries: [] }));
    const entries = data.entries || [];
    if (entries.length === 0) {
        historyEl.innerHTML = '<p style="font-size:13px;color:var(--muted)">Your past entries will appear here.</p>';
        return;
    }
    historyEl.innerHTML = entries.map(e => {
        const date = new Date(e.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        return `<div class="history-card">
      <div class="history-meta">
        <span class="history-date">${date}</span>
        <span class="history-emotion">${e.emotion || "—"}</span>
        <span class="history-words">${e.word_count} words</span>
      </div>
      <p class="history-preview">${e.preview}…</p>
    </div>`;
    }).join("");
}

loadHistory();