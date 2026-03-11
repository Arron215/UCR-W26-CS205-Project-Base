import { encryptData, decryptData, isEncryptedData } from './encryption'

const STORAGE_KEY = 'healthTrackingData'
const FILE_HANDLE_KEY = 'healthTrackingFileHandle'

export async function loadData(userEmail) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      
      if (isEncryptedData(data)) {
        if (!userEmail) return { moodEntries: [], sleepEntries: [], waterEntries: [] }
        const decrypted = await decryptData(data, userEmail)
        return decrypted || { moodEntries: [], sleepEntries: [], waterEntries: [] }
      }
      
      return {
        moodEntries: data.moodEntries || [],
        sleepEntries: data.sleepEntries || [],
        waterEntries: data.waterEntries || [],
      }
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error)
  }
  return {
    moodEntries: [],
    sleepEntries: [],
    waterEntries: [],
  }
}

export async function saveData(userEmail, moodEntries, sleepEntries, waterEntries) {
  try {
    if (userEmail) {
      const encrypted = await encryptData({ moodEntries, sleepEntries, waterEntries }, userEmail)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted))
    } else {
      const data = { moodEntries, sleepEntries, waterEntries }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export function saveFileHandleInfo(fileHandle) {
  const info = { name: fileHandle.name, kind: fileHandle.kind }
  localStorage.setItem(FILE_HANDLE_KEY, JSON.stringify(info))
}

export function getFileHandleInfo() {
  try {
    const stored = localStorage.getItem(FILE_HANDLE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}
