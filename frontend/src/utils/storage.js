const KEYS = {
  displayName: "prepquest.displayName",
  xpTotal: "prepquest.xpTotal",
};

export function getDisplayName() {
  try {
    return localStorage.getItem(KEYS.displayName) || "";
  } catch {
    return "";
  }
}

export function setDisplayName(name) {
  try {
    localStorage.setItem(KEYS.displayName, name);
  } catch {
    // localStorage can throw in private-browsing / storage-full edge cases;
    // the app still works within the session, it just won't persist.
  }
}

export function getXpTotal() {
  try {
    const raw = localStorage.getItem(KEYS.xpTotal);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function setXpTotal(value) {
  try {
    localStorage.setItem(KEYS.xpTotal, String(Math.max(0, Math.round(value))));
  } catch {
    // see note above
  }
}
