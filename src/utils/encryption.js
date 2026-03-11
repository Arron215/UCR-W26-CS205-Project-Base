async function hashCredential(email, password) {
  const encoder = new TextEncoder()
  const combined = encoder.encode(email.toLowerCase().trim() + '|' + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function deriveKeyFromCredentials(email, password) {
  const hash = await hashCredential(email, password)
  return hash
}

async function encryptData(data, email, password) {
  if (!email || !password || !data) return data
  
  try {
    const key = await deriveKeyFromCredentials(email, password)
    const jsonString = JSON.stringify(data)
    const encoded = new TextEncoder().encode(jsonString)
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: new Uint8Array(12) },
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(key.slice(0, 32)),
        'AES-GCM',
        false,
        ['encrypt', 'decrypt']
      ),
      encoded
    )
    
    const encryptedArray = new Uint8Array(encrypted)
    const combined = new Uint8Array(12 + encryptedArray.length)
    combined.set(new Uint8Array(12), 0)
    combined.set(encryptedArray, 12)
    
    return {
      _encrypted: true,
      _credentialHash: await hashCredential(email, password),
      data: btoa(String.fromCharCode(...combined))
    }
  } catch {
    return data
  }
}

async function decryptData(encryptedObj, email, password) {
  if (!encryptedObj || !encryptedObj._encrypted || !email || !password) return null
  
  try {
    const credentialHash = await hashCredential(email, password)
    if (encryptedObj._credentialHash !== credentialHash) {
      return null
    }
    
    const key = await deriveKeyFromCredentials(email, password)
    const encryptedData = Uint8Array.from(atob(encryptedObj.data), c => c.charCodeAt(0))
    const iv = encryptedData.slice(0, 12)
    const ciphertext = encryptedData.slice(12)
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(key.slice(0, 32)),
        'AES-GCM',
        false,
        ['encrypt', 'decrypt']
      ),
      ciphertext
    )
    
    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch {
    return null
  }
}

function isEncryptedData(data) {
  return data && data._encrypted === true
}

export { encryptData, decryptData, isEncryptedData, hashCredential }
