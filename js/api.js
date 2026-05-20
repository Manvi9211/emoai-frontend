import { authHeaders } from "./auth.js";

// Change this to your Railway URL after deploy
// e.g. "https://emoai-backend.railway.app"
export const BASE = "https://emoai-backend-2.onrender.com";

// ── Auth endpoints (no auth header needed) ───────────────
export async function apiSignup(email, password) {
    const r = await fetch(`${BASE}/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || "Signup failed");
    return data;
}

export async function apiLogin(email, password) {
    const r = await fetch(`${BASE}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const text = await r.text();
    console.log("RAW RESPONSE:", text);

    const data = JSON.parse(text);
    if (!r.ok) throw new Error(data.detail || "Login failed");
    return data;
}


// ── Protected endpoints ───────────────────────────────────
export async function sendChat(message) {
    const r = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ message }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || "Chat error");
    return data;
}

export async function clearChat() {
    await fetch(`${BASE}/chat/clear`, { method: "DELETE", headers: authHeaders() });
}

export async function saveMood(moodScore, moodEmoji) {
    await fetch(`${BASE}/mood`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ mood_score: moodScore, mood_emoji: moodEmoji }),
    });
}

export async function getMoodHistory(days = 7) {
    const r = await fetch(`${BASE}/mood/history?days=${days}`, { headers: authHeaders() });
    return r.json();
}

export async function saveJournal(content) {
    const r = await fetch(`${BASE}/journal`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || "Journal error");
    return data;
}

export async function getJournalHistory() {
    const r = await fetch(`${BASE}/journal/history`, { headers: authHeaders() });
    return r.json();
}