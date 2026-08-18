const encoder = new TextEncoder();
const COOKIE_NAME = "kbeauty_auth";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===";
  const binary = atob(padded.slice(0, padded.length - (padded.length % 4)));
  return new Uint8Array([...binary].map((char) => char.charCodeAt(0)));
}

async function sha256(value: string) {
  return toBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export async function createAuthToken(email: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  const payload = toBase64Url(encoder.encode(`${Date.now()}.${email}`));
  const signature = await sha256(`${secret}.${payload}`);
  return `${payload}.${signature}`;
}

export async function verifyAuthToken(token: string | undefined) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  try {
    const decoded = new TextDecoder().decode(fromBase64Url(payload));
    const [createdAt] = decoded.split(".");
    const timestamp = Number(createdAt);
    if (!Number.isFinite(timestamp) || Date.now() - timestamp > MAX_AGE_SECONDS * 1000 || timestamp > Date.now() + 60_000) return false;
    const expected = await sha256(`${secret}.${payload}`);
    return expected === signature;
  } catch {
    return false;
  }
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
