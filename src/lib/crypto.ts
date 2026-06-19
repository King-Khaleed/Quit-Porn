const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const ITERATIONS = 600_000;
const HASH = "SHA-256";

function toBuffer(buf: ArrayBufferLike): ArrayBuffer {
  if (buf instanceof ArrayBuffer) return buf;
  return buf.slice(0) as unknown as ArrayBuffer;
}

function getSalt(): ArrayBuffer {
  const stored = localStorage.getItem("qp_salt");
  if (stored) {
    const arr = new Uint8Array(stored.split(",").map(Number));
    return toBuffer(arr.buffer);
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem("qp_salt", Array.from(salt).join(","));
  return toBuffer(salt.buffer);
}

async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const salt = getSalt();
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: HASH,
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(
  plaintext: string,
  userPassphrase: string
): Promise<string> {
  const key = await deriveKey(userPassphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encoded = enc.encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(Array.from(combined).map((b) => String.fromCharCode(b)).join(""));
}

export async function decrypt(
  ciphertextB64: string,
  userPassphrase: string
): Promise<string> {
  const key = await deriveKey(userPassphrase);
  const combined = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

export async function hashPassphrase(passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(passphrase));
  return btoa(Array.from(new Uint8Array(hash)).map((b) => String.fromCharCode(b)).join(""));
}
