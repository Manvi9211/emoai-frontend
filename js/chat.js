import { sendChat, clearChat, saveMood, getMoodHistory } from "./api.js";
import { requireAuth, getUser, logout } from "./auth.js";

requireAuth("pages/login.html");

const EMOTION_COLORS = {
    joy: "#D4870A", sadness: "#3B82C4", anger: "#C43B3B",
    fear: "#7C3AC4", surprise: "#1A9E6A", disgust: "#6B5540", neutral: "#7A6E67",
};

const user = getUser();
if (user?.email) {
    const el = document.getElementById("user-email");
    if (el) el.textContent = user.email;
}
document.getElementById("logout-btn")?.addEventListener("click", () => logout("pages/login.html"));

const messagesEl = document.getElementById("messages");
const welcomeEl = document.getElementById("welcome");
const inputEl = document.getElementById("user-input");
const sendBtnEl = document.getElementById("send-btn");
const moodSavedEl = document.getElementById("mood-saved");
let isLoading = false;

// ── Textarea auto-resize ─────────────────────────────────
inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + "px";
});
inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!isLoading) sendMessage(); }
});

// ── Mood check-in ────────────────────────────────────────
document.querySelectorAll(".mood-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
        document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        moodSavedEl.style.opacity = "1";
        setTimeout(() => moodSavedEl.style.opacity = "0", 2000);
        await saveMood(parseInt(btn.dataset.score), btn.dataset.emoji).catch(() => { });
        renderMoodChart();
    });
});

// ── Mood chart ───────────────────────────────────────────
async function renderMoodChart() {
    const chartCanvas = document.getElementById("mood-chart");
    if (!chartCanvas) return;
    const data = await getMoodHistory(7).catch(() => ({ moods: [] }));
    const moods = data.moods || [];
    if (moods.length === 0) { chartCanvas.parentElement.style.display = "none"; return; }
    chartCanvas.parentElement.style.display = "block";
    const labels = moods.map(m => {
        const d = new Date(m.created_at);
        return d.toLocaleDateString("en-IN", { weekday: "short" });
    });
    if (window._moodChart) window._moodChart.destroy();
    window._moodChart = new Chart(chartCanvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                data: moods.map(m => m.mood_score),
                borderColor: "#B5673A", backgroundColor: "rgba(181,103,58,0.1)",
                pointBackgroundColor: "#B5673A", pointRadius: 4,
                tension: 0.4, fill: true,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` Mood ${ctx.parsed.y}/5` } } },
            scales: {
                y: { min: 1, max: 5, display: false },
                x: { display: false },
            },
        },
    });
}

// ── Add message ──────────────────────────────────────────
function addMessage(text, role, emotionData = null) {
    welcomeEl.style.display = "none";
    messagesEl.style.display = "flex";
    const wrap = document.createElement("div");
    wrap.className = `msg-wrap ${role}`;
    const avatar = document.createElement("div");
    avatar.className = `avatar ${role}`;
    avatar.textContent = role === "ai" ? "E" : "U";
    const col = document.createElement("div");
    col.className = "msg-col";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    col.appendChild(bubble);
    if (role === "user" && emotionData) {
        const badge = document.createElement("div");
        badge.className = "emotion-badge";
        const dot = document.createElement("div");
        dot.className = "emotion-dot";
        dot.style.background = EMOTION_COLORS[emotionData.label] || "#7A6E67";
        badge.appendChild(dot);
        badge.appendChild(document.createTextNode(`${emotionData.label} · ${Math.round(emotionData.score * 100)}%`));
        col.appendChild(badge);
    }
    wrap.appendChild(avatar);
    wrap.appendChild(col);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
    welcomeEl.style.display = "none";
    messagesEl.style.display = "flex";
    const wrap = document.createElement("div");
    wrap.id = "typing-indicator"; wrap.className = "msg-wrap ai typing";
    const av = document.createElement("div"); av.className = "avatar ai"; av.textContent = "E";
    const bl = document.createElement("div"); bl.className = "bubble";
    bl.innerHTML = '<div class="dots"><span></span><span></span><span></span></div>';
    wrap.appendChild(av); wrap.appendChild(bl);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}
function hideTyping() { document.getElementById("typing-indicator")?.remove(); }

// ── Send ─────────────────────────────────────────────────
async function sendMessage() {
    const message = inputEl.value.trim();
    if (!message || isLoading) return;
    inputEl.value = ""; inputEl.style.height = "auto";
    isLoading = true; sendBtnEl.disabled = true;
    addMessage(message, "user");
    showTyping();
    try {
        const data = await sendChat(message);
        hideTyping();
        const userMsgs = document.querySelectorAll(".msg-wrap.user");
        const lastUser = userMsgs[userMsgs.length - 1];
        if (lastUser && data.emotion) {
            const col = lastUser.querySelector(".msg-col");
            const badge = document.createElement("div");
            badge.className = "emotion-badge";
            const dot = document.createElement("div");
            dot.className = "emotion-dot";
            dot.style.background = EMOTION_COLORS[data.emotion.label] || "#7A6E67";
            badge.appendChild(dot);
            badge.appendChild(document.createTextNode(`${data.emotion.label} · ${Math.round(data.emotion.score * 100)}%`));
            col.appendChild(badge);
        }
        addMessage(data.reply, "ai");
    } catch (err) {
        hideTyping();
        addMessage(err.message.includes("fetch") ? "Can't reach server. Is the backend running?" : err.message, "ai");
    } finally {
        isLoading = false; sendBtnEl.disabled = false; inputEl.focus();
    }
}

document.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => { inputEl.value = c.textContent; sendMessage(); }));
sendBtnEl.addEventListener("click", () => { if (!isLoading) sendMessage(); });
document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await clearChat().catch(() => { });
    logout("pages/login.html");
});

renderMoodChart();