async function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16))
}

async function generateIV() {
  return crypto.getRandomValues(new Uint8Array(12))
}

async function deriveKey(email, password, salt) {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(email.toLowerCase().trim() + password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 600000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function hashCredential(email, password) {
  const encoder = new TextEncoder()
  const combined = encoder.encode(email.toLowerCase().trim() + '|' + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function encryptData(data, email, password) {
  if (!email || !password || !data) return data

  try {
    const salt = await generateSalt()
    const iv = await generateIV()
    const key = await deriveKey(email, password, salt)
    
    const jsonString = JSON.stringify(data)
    const encoded = new TextEncoder().encode(jsonString)
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoded
    )
    
    const encryptedArray = new Uint8Array(encrypted)
    const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(encryptedArray, salt.length + iv.length)
    
    return {
      _encrypted: true,
      data: await arrayBufferToBase64(combined)
    }
  } catch (error) {
    console.error('Encryption error:', error)
    return data
  }
}

async function decryptData(encryptedObj, email, password) {
  if (!encryptedObj || !encryptedObj._encrypted || !email || !password) return null

  try {
    const combined = new Uint8Array(await base64ToArrayBuffer(encryptedObj.data))
    
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const ciphertext = combined.slice(28)
    
    const key = await deriveKey(email, password, salt)
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    )
    
    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

function isEncryptedData(data) {
  return data && data._encrypted === true
}

export { encryptData, decryptData, isEncryptedData, hashCredential }
