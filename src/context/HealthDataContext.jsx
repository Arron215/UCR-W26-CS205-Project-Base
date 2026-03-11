import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { loadData, saveData, saveFileHandleInfo, getFileHandleInfo } from '../utils/storage'
import { createFile, openFile, writeFile, readFile } from '../utils/fileOperations'
import { encryptData, decryptData, isEncryptedData } from '../utils/encryption'
import { useAuth } from './AuthContext'

const HealthDataContext = createContext()

export function HealthDataProvider({ children }) {
  const { user, password } = useAuth()
  const userEmail = user?.email
  const userPassword = password
  
  const [moodEntries, setMoodEntries] = useState([])
  const [sleepEntries, setSleepEntries] = useState([])
  const [waterEntries, setWaterEntries] = useState([])
  const [waterGoal, setWaterGoal] = useState(() => {
    return 8
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const [fileHandle, setFileHandle] = useState(null)
  const [fileStatus, setFileStatus] = useState('none')
  const fileHandleRef = useRef(null)

  // Load data on startup
  useEffect(() => {
    async function initialize() {
      if (!userEmail) {
        setMoodEntries([])
        setSleepEntries([])
        setWaterEntries([])
        setIsLoaded(true)
        return
      }
      
      // Load from localStorage first
      const loaded = await loadData(userEmail, userPassword)
      
      if (loaded && isEncryptedData(loaded)) {
        const decrypted = await decryptData(loaded, userEmail, userPassword)
        if (decrypted) {
          setMoodEntries(Array.isArray(decrypted.moodEntries) ? decrypted.moodEntries : [])
          setSleepEntries(Array.isArray(decrypted.sleepEntries) ? decrypted.sleepEntries : [])
          setWaterEntries(Array.isArray(decrypted.waterEntries) ? decrypted.waterEntries : [])
        } else {
          setMoodEntries([])
          setSleepEntries([])
          setWaterEntries([])
        }
      } else if (loaded && !isEncryptedData(loaded)) {
        setMoodEntries(Array.isArray(loaded.moodEntries) ? loaded.moodEntries : [])
        setSleepEntries(Array.isArray(loaded.sleepEntries) ? loaded.sleepEntries : [])
        setWaterEntries(Array.isArray(loaded.waterEntries) ? loaded.waterEntries : [])
      } else {
        setMoodEntries([])
        setSleepEntries([])
        setWaterEntries([])
      }
      setIsLoaded(true)
      
      // Try to set up file auto-save
      const handleInfo = getFileHandleInfo()
      if (handleInfo && 'showOpenFilePicker' in window) {
        const handle = await openFile()
        if (handle) {
          fileHandleRef.current = handle
          setFileHandle(handle)
          
          // Load data from file if it's newer
          const fileData = await readFile(handle)
          if (fileData) {
            let moodData = []
            let sleepData = []
            let waterData = []
            
            if (isEncryptedData(fileData)) {
              const decrypted = await decryptData(fileData, userEmail, userPassword)
              if (decrypted) {
                moodData = Array.isArray(decrypted.moodEntries) ? decrypted.moodEntries : []
                sleepData = Array.isArray(decrypted.sleepEntries) ? decrypted.sleepEntries : []
                waterData = Array.isArray(decrypted.waterEntries) ? decrypted.waterEntries : []
              }
            } else if (fileData?.moodEntries || fileData?.sleepEntries || fileData?.waterEntries) {
              moodData = Array.isArray(fileData.moodEntries) ? fileData.moodEntries : []
              sleepData = Array.isArray(fileData.sleepEntries) ? fileData.sleepEntries : []
              waterData = Array.isArray(fileData.waterEntries) ? fileData.waterEntries : []
            }
            
            if (moodData.length > 0 || sleepData.length > 0 || waterData.length > 0) {
              const fileDate = fileData.lastSaved ? new Date(fileData.lastSaved) : null
              const storageDate = moodEntries.length > 0 
                ? new Date(Math.max(...moodEntries.map(e => e.id))) 
                : null
              
              if (!storageDate || (fileDate && fileDate > storageDate)) {
                setMoodEntries(moodData)
                setSleepEntries(sleepData)
                setWaterEntries(waterData)
                await saveData(userEmail, userPassword, moodData, sleepData, waterData)
              }
            }
          }
        }
        } else {
        // Auto-setup file on first use
        const handle = await createFile()
        if (handle) {
          fileHandleRef.current = handle
          setFileHandle(handle)
          saveFileHandleInfo(handle)
          await writeFile(handle, await encryptData({
            moodEntries: moodEntries,
            sleepEntries: sleepEntries || [],
            waterEntries: waterEntries || [],
            lastSaved: new Date().toISOString()
          }, userEmail, userPassword))
        }
      }
    }
    
    initialize()
  }, [userEmail, userPassword])

  // Auto-save to localStorage and file when data changes
  useEffect(() => {
    if (isLoaded && userEmail && userPassword) {
      saveData(userEmail, userPassword, moodEntries, sleepEntries, waterEntries).then(() => {
        saveToFile()
      })
    }
  }, [moodEntries, sleepEntries, waterEntries, isLoaded, userEmail, userPassword])

  // Load water goal for current user
  useEffect(() => {
    if (userEmail) {
      const saved = localStorage.getItem(`waterGoal_${userEmail}`)
      if (saved) {
        setWaterGoal(JSON.parse(saved))
      } else {
        setWaterGoal(8)
      }
    }
  }, [userEmail])

  // Save water goal separately (per user)
  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(`waterGoal_${userEmail}`, JSON.stringify(waterGoal))
    }
  }, [waterGoal, userEmail])

  async function saveToFile() {
    const handle = fileHandleRef.current
    if (!handle || !userEmail || !userPassword) return

    setFileStatus('saving')
    const success = await writeFile(handle, await encryptData({
      moodEntries,
      sleepEntries,
      waterEntries,
      lastSaved: new Date().toISOString()
    }, userEmail, userPassword))
    
    if (success) {
      setFileStatus('saved')
      setTimeout(() => setFileStatus('none'), 2000)
    } else {
      setFileStatus('error')
      setTimeout(() => setFileStatus('none'), 3000)
    }
  }

  async function setupFileHandle() {
    const handle = await createFile()
    if (handle) {
      fileHandleRef.current = handle
      setFileHandle(handle)
      saveFileHandleInfo(handle)
      await saveToFile()
      return true
    }
    return false
  }

  async function loadFromFile() {
    if (!userEmail) return false
    
    const handle = await openFile()
    if (handle) {
      fileHandleRef.current = handle
      setFileHandle(handle)
      saveFileHandleInfo(handle)
      
      const data = await readFile(handle)
      if (data) {
        let moodData = []
        let sleepData = []
        let waterData = []
        
        if (isEncryptedData(data)) {
          const decrypted = await decryptData(data, userEmail, userPassword)
          if (decrypted) {
            moodData = Array.isArray(decrypted.moodEntries) ? decrypted.moodEntries : []
            sleepData = Array.isArray(decrypted.sleepEntries) ? decrypted.sleepEntries : []
            waterData = Array.isArray(decrypted.waterEntries) ? decrypted.waterEntries : []
          }
        } else if (data?.moodEntries || data?.sleepEntries || data?.waterEntries) {
          moodData = Array.isArray(data.moodEntries) ? data.moodEntries : []
          sleepData = Array.isArray(data.sleepEntries) ? data.sleepEntries : []
          waterData = Array.isArray(data.waterEntries) ? data.waterEntries : []
        }
        
        if (moodData.length > 0 || sleepData.length > 0 || waterData.length > 0) {
          setMoodEntries(moodData)
          setSleepEntries(sleepData)
          setWaterEntries(waterData)
          await saveData(userEmail, userPassword, moodData, sleepData, waterData)
          return true
        }
      }
    }
    return false
  }

  const addMoodEntry = (entry) => {
    setMoodEntries(prev => Array.isArray(prev) ? [...prev, entry] : [entry])
  }

  const deleteMoodEntry = (id) => {
    setMoodEntries(prev => Array.isArray(prev) ? prev.filter(entry => entry.id !== id) : [])
  }

  const addSleepEntry = (entry) => {
    setSleepEntries(prev => Array.isArray(prev) ? [...prev, entry] : [entry])
  }

  const deleteSleepEntry = (id) => {
    setSleepEntries(prev => Array.isArray(prev) ? prev.filter(entry => entry.id !== id) : [])
  }

  const addWaterEntry = (entry) => {
    setWaterEntries(prev => Array.isArray(prev) ? [...prev, entry] : [entry])
  }

  const deleteWaterEntry = (id) => {
    setWaterEntries(prev => Array.isArray(prev) ? prev.filter(entry => entry.id !== id) : [])
  }

  const setAllData = (moodData, sleepData, waterData) => {
    setMoodEntries(Array.isArray(moodData) ? moodData : [])
    setSleepEntries(Array.isArray(sleepData) ? sleepData : [])
    setWaterEntries(Array.isArray(waterData) ? waterData : [])
  }

  const exportData = () => {
    const data = {
      moodEntries,
      sleepEntries,
      waterEntries,
      waterGoal,
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  }

  const importData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (data.moodEntries && Array.isArray(data.moodEntries)) {
        const sleeps = Array.isArray(data.sleepEntries) ? data.sleepEntries : []
        const waters = Array.isArray(data.waterEntries) ? data.waterEntries : []
        const goal = typeof data.waterGoal === 'number' ? data.waterGoal : 8
        setAllData(data.moodEntries, sleeps, waters)
        setWaterGoal(goal)
        return true
      }
      return false
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  return (
    <HealthDataContext.Provider
      value={{
        moodEntries,
        sleepEntries,
        waterEntries,
        waterGoal,
        addMoodEntry,
        addSleepEntry,
        addWaterEntry,
        deleteMoodEntry,
        deleteSleepEntry,
        deleteWaterEntry,
        setWaterGoal,
        exportData,
        importData,
        setAllData,
        setupFileHandle,
        loadFromFile,
        fileHandle,
        fileStatus,
      }}
    >
      {children}
    </HealthDataContext.Provider>
  )
}

export function useHealthData() {
  const context = useContext(HealthDataContext)
  if (!context) {
    throw new Error('useHealthData must be used within HealthDataProvider')
  }
  return context
}
