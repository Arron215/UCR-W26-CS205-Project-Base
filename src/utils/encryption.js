async function hashEmail(email) {
  const encoder = new TextEncoder()
  const data = encoder.encode(email.toLowerCase().trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function deriveKeyFromEmail(email) {
  const hash = await hashEmail(email)
  return hash
}

async function encryptData(data, email) {
  if (!email || !data) return data
  
  try {
    const key = await deriveKeyFromEmail(email)
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
      _emailHash: await hashEmail(email),
      data: btoa(String.fromCharCode(...combined))
    }
  } catch {
    return data
  }
}

async function decryptData(encryptedObj, email) {
  if (!encryptedObj || !encryptedObj._encrypted || !email) return null
  
  try {
    const emailHash = await hashEmail(email)
    if (encryptedObj._emailHash !== emailHash) {
      return null
    }
    
    const key = await deriveKeyFromEmail(email)
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

export { encryptData, decryptData, isEncryptedData, hashEmail }
