/**
 * Encryption/decryption utilities for storing cookies securely
 */

import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.COOKIE_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error("COOKIE_ENCRYPTION_KEY environment variable is required");
}

const encryptionKey: string = ENCRYPTION_KEY;

/**
 * Encrypts a JSON string for storage
 * @param data - Data to encrypt (will be JSON stringified)
 * @returns Encrypted string
 */
export function encryptData(data: unknown): string {
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, encryptionKey).toString();
}

/**
 * Decrypts an encrypted string back to original data
 * @param encrypted - Encrypted string from encryptData
 * @param defaultValue - Value to return if decryption fails
 * @returns Decrypted data
 */
export function decryptData<T>(encrypted: string, defaultValue: T): T {
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey).toString(
      CryptoJS.enc.Utf8
    );
    return JSON.parse(decrypted) as T;
  } catch {
    console.error("Decryption failed, returning default value");
    return defaultValue;
  }
}

/**
 * Encrypts a string directly (not JSON)
 * @param text - Text to encrypt
 * @returns Encrypted string
 */
export function encryptText(text: string): string {
  return CryptoJS.AES.encrypt(text, encryptionKey).toString();
}

/**
 * Decrypts a string directly
 * @param encrypted - Encrypted string
 * @returns Decrypted text
 */
export function decryptText(encrypted: string): string {
  try {
    return CryptoJS.AES.decrypt(encrypted, encryptionKey).toString(
      CryptoJS.enc.Utf8
    );
  } catch {
    console.error("Text decryption failed");
    return "";
  }
}
