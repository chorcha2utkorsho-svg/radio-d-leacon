/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Cryptographic SHA-256 hash of the master password (one-way hash, cannot be reversed)
// The raw plaintext password is never exposed or hardcoded in plain form
export const MASTER_BROADCASTER_HASH = 'bf63cc60720c2b9790eab11a8109e06b0f24f924b4f83ee52ae0c72794e4bfe9';

export const HASH_STORAGE_KEY = 'radio_dleacon_broadcaster_hash';
export const AUTH_TOKEN_KEY = 'radio_dleacon_auth_token';
export const AUTH_TOKEN_VALUE = 'broadcaster_authenticated';

/**
 * Computes SHA-256 hash using the Web Crypto API built into modern browsers.
 */
export async function computeSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies if the provided plain password matches the master hash or custom saved hash.
 */
export async function verifyBroadcasterPasscode(plainPasscode: string): Promise<boolean> {
  if (!plainPasscode) return false;
  const inputHash = await computeSHA256(plainPasscode.trim());

  // Check custom hash if configured by station owner, otherwise fallback to master hash
  const storedHash = localStorage.getItem(HASH_STORAGE_KEY);
  const targetHash = storedHash || MASTER_BROADCASTER_HASH;

  return inputHash === targetHash;
}

/**
 * Updates broadcaster passcode by saving its SHA-256 hash.
 */
export async function updateBroadcasterPasscode(newPlainPasscode: string): Promise<void> {
  const newHash = await computeSHA256(newPlainPasscode.trim());
  localStorage.setItem(HASH_STORAGE_KEY, newHash);
  // Clear any legacy plain text pin key if present
  localStorage.removeItem('radio_dleacon_broadcaster_pin');
}

/**
 * Checks if broadcaster is currently authenticated in this browser.
 */
export function checkIsBroadcasterAuthenticated(): boolean {
  return (
    localStorage.getItem(AUTH_TOKEN_KEY) === AUTH_TOKEN_VALUE ||
    sessionStorage.getItem(AUTH_TOKEN_KEY) === AUTH_TOKEN_VALUE
  );
}

/**
 * Sets broadcaster session upon successful authentication.
 */
export function setBroadcasterAuthenticated(remember: boolean): void {
  if (remember) {
    localStorage.setItem(AUTH_TOKEN_KEY, AUTH_TOKEN_VALUE);
  } else {
    sessionStorage.setItem(AUTH_TOKEN_KEY, AUTH_TOKEN_VALUE);
  }
}

/**
 * Logs out broadcaster by clearing tokens.
 */
export function clearBroadcasterSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}
