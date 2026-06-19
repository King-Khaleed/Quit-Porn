const AUTH_CACHE_KEY = "qp_auth_cached";

export function cacheAuthStatus(loggedIn: boolean) {
  if (typeof window === "undefined") return;
  if (loggedIn) {
    localStorage.setItem(AUTH_CACHE_KEY, Date.now().toString());
  } else {
    localStorage.removeItem(AUTH_CACHE_KEY);
  }
}

export function wasLoggedInRecently(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const val = localStorage.getItem(AUTH_CACHE_KEY);
    if (!val) return false;
    const timestamp = parseInt(val, 10);
    if (isNaN(timestamp)) return false;
    const age = Date.now() - timestamp;
    return age < 86400000;
  } catch {
    return false;
  }
}

export function clearAuthCache() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_CACHE_KEY);
}
