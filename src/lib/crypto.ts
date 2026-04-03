/**
 * E2E Encryption utilities using Web Crypto API (AES-GCM 256-bit).
 *
 * V1 approach: each conversation gets a single shared AES-GCM key stored
 * in the browser's localStorage, keyed by conversationId.
 */

const AES_ALGO = "AES-GCM";
const AES_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM

/** Generate a new AES-GCM 256-bit conversation key. */
export async function generateConversationKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: AES_ALGO, length: AES_LENGTH },
    true, // extractable so we can export to localStorage
    ["encrypt", "decrypt"],
  );
}

/** Export a CryptoKey to a base64 string for storage. */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return bufferToBase64(raw);
}

/** Import a base64 string back into a CryptoKey. */
export async function importKey(base64: string): Promise<CryptoKey> {
  const raw = base64ToBuffer(base64);
  return crypto.subtle.importKey(
    "raw",
    raw.buffer as ArrayBuffer,
    { name: AES_ALGO, length: AES_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt a plaintext string. Returns base64(iv + ciphertext).
 * The first 12 bytes of the decoded output are the IV.
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: AES_ALGO, iv },
    key,
    encoded,
  );

  // Concatenate IV + ciphertext into a single buffer
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return bufferToBase64(combined.buffer);
}

/** Decrypt a base64(iv + ciphertext) string back to plaintext. */
export async function decrypt(
  ciphertextBase64: string,
  key: CryptoKey,
): Promise<string> {
  const combined = base64ToBuffer(ciphertextBase64);
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: AES_ALGO, iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

// ---------------------------------------------------------------------------
// localStorage helpers for conversation keys
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "seasignal_ekey_";

/** Get or create a conversation key, persisting in localStorage. */
export async function getOrCreateConversationKey(
  conversationId: string,
): Promise<CryptoKey> {
  const stored = localStorage.getItem(STORAGE_PREFIX + conversationId);
  if (stored) {
    return importKey(stored);
  }
  const key = await generateConversationKey();
  const exported = await exportKey(key);
  localStorage.setItem(STORAGE_PREFIX + conversationId, exported);
  return key;
}

/** Check whether a conversation key exists in localStorage. */
export function hasConversationKey(conversationId: string): boolean {
  return localStorage.getItem(STORAGE_PREFIX + conversationId) !== null;
}

// ---------------------------------------------------------------------------
// Base64 <-> ArrayBuffer helpers (no external deps)
// ---------------------------------------------------------------------------

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
