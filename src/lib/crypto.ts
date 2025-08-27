/**
 * Client-side encryption utilities using WebCrypto API
 * All sensitive data is encrypted with AES-GCM using a user-provided passphrase
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16
const TAG_LENGTH = 16
const ITERATIONS = 100000 // PBKDF2 iterations

export interface EncryptedData {
  data: string // Base64 encoded encrypted data
  iv: string // Base64 encoded initialization vector
  salt: string // Base64 encoded salt for key derivation
}

/**
 * Derives a cryptographic key from a passphrase using PBKDF2
 */
async function deriveKey(passphrase: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    passphraseKey,
    {
      name: ALGORITHM,
      length: KEY_LENGTH
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts data using AES-GCM with a passphrase-derived key
 */
export async function encrypt(data: string, passphrase: string): Promise<EncryptedData> {
  const encoder = new TextEncoder()
  const dataBytes = encoder.encode(data)
  
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  
  // Derive key from passphrase
  const key = await deriveKey(passphrase, salt.buffer)
  
  // Encrypt data
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH * 8
    },
    key,
    dataBytes
  )
  
  // Convert to base64 for storage
  return {
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt))
  }
}

/**
 * Decrypts data using AES-GCM with a passphrase-derived key
 */
export async function decrypt(encryptedData: EncryptedData, passphrase: string): Promise<string> {
  try {
    // Convert from base64
    const dataBytes = new Uint8Array(atob(encryptedData.data).split('').map(c => c.charCodeAt(0)))
    const iv = new Uint8Array(atob(encryptedData.iv).split('').map(c => c.charCodeAt(0)))
    const salt = new Uint8Array(atob(encryptedData.salt).split('').map(c => c.charCodeAt(0)))
    
    // Derive key from passphrase
    const key = await deriveKey(passphrase, salt.buffer)
    
    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH * 8
      },
      key,
      dataBytes
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    throw new Error('Decryption failed - invalid passphrase or corrupted data')
  }
}

/**
 * Generates a secure random passphrase
 */
export function generatePassphrase(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const array = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(array, byte => chars[byte % chars.length]).join('')
}

/**
 * Validates passphrase strength
 */
export function validatePassphrase(passphrase: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (passphrase.length < 12) {
    errors.push('Passphrase must be at least 12 characters long')
  }
  
  if (!/[a-z]/.test(passphrase)) {
    errors.push('Passphrase must contain lowercase letters')
  }
  
  if (!/[A-Z]/.test(passphrase)) {
    errors.push('Passphrase must contain uppercase letters')
  }
  
  if (!/[0-9]/.test(passphrase)) {
    errors.push('Passphrase must contain numbers')
  }
  
  if (!/[^a-zA-Z0-9]/.test(passphrase)) {
    errors.push('Passphrase must contain special characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Hashes a passphrase for verification (not for encryption)
 */
export async function hashPassphrase(passphrase: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(passphrase)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}

/**
 * Securely wipes sensitive data from memory (best effort)
 */
export function secureWipe(data: string | Uint8Array): void {
  if (typeof data === 'string') {
    // For strings, we can't directly modify the memory,
    // but we can at least clear any references
    data = ''
  } else {
    // For typed arrays, we can overwrite with random data
    crypto.getRandomValues(data)
  }
}

/**
 * Checks if WebCrypto is available
 */
export function isWebCryptoSupported(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues !== 'undefined'
}

/**
 * Encrypts an object as JSON
 */
export async function encryptObject<T>(obj: T, passphrase: string): Promise<EncryptedData> {
  const json = JSON.stringify(obj)
  return encrypt(json, passphrase)
}

/**
 * Decrypts an object from JSON
 */
export async function decryptObject<T>(encryptedData: EncryptedData, passphrase: string): Promise<T> {
  const json = await decrypt(encryptedData, passphrase)
  return JSON.parse(json)
}
