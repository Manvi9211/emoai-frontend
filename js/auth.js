// ── Auth helpers ─────────────────────────────────────────
// Tokens stored in sessionStorage (cleared when browser tab closes)
// For persistent login, swap to localStorage

const TOKEN_KEY = "emoai_token";
const USER_KEY = "emoai_user";

export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser() {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function saveSession(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
    return !!getToken();
}

// ── Auth guard ───────────────────────────────────────────
// Call this at the top of any protected page
export function requireAuth(redirectTo = "../pages/login.html") {
    if (!isLoggedIn()) {
        window.location.href = redirectTo;
    }
}

// ── Auth headers ─────────────────────────────────────────
export function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`,
    };
}

// ── Logout ───────────────────────────────────────────────
export function logout(redirectTo = "../pages/login.html") {
    clearSession();
    window.location.href = redirectTo;
}