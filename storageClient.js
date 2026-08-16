// Drop-in replacement for the Claude-artifact window.storage API, backed by
// the real Express + Postgres backend instead of Claude's sandbox storage.
// Same method signatures as before: get(key, shared) / set(key, value, shared)
// so the rest of the app's data layer didn't need to change.

async function get(key, shared = false) {
  const res = await fetch(`/api/storage?key=${encodeURIComponent(key)}&shared=${shared}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("storage get failed");
  const data = await res.json();
  if (data.value === null || data.value === undefined) return null;
  // The old window.storage API returned { key, value, shared } with value as
  // a JSON *string* the app then JSON.parse's itself. Match that shape.
  return { key, value: JSON.stringify(data.value), shared };
}

async function set(key, value, shared = false) {
  let parsed = value;
  try {
    parsed = JSON.parse(value);
  } catch {
    // value wasn't JSON (e.g. plain "true"/"false" strings the app also uses) — send as-is
  }
  const res = await fetch("/api/storage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ key, value: parsed, shared }),
  });
  if (!res.ok) throw new Error("storage set failed");
  return { key, value, shared };
}

window.storage = { get, set };
