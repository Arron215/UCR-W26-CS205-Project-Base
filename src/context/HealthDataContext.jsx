import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { loadData, saveData, saveFileHandleInfo, getFileHandleInfo } from '../utils/storage'
import { createFile, openFile, writeFile, readFile } from '../utils/fileOperations'

const HealthDataContext = createContext()

export function HealthDataProvider({ children }) {
  const [moodEntries, setMoodEntries] = useState([])
  const [sleepEntries, setSleepEntries] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [fileHandle, setFileHandle] = useState(null)
  const [fileStatus, setFileStatus] = useState('none') // 'none', 'saving', 'saved', 'error'
  const fileHandleRef = useRef(null)

  // Load data on startup
  useEffect(() => {
    async function initialize() {
      // Load from localStorage first
      const loaded = loadData()
      setMoodEntries(Array.isArray(loaded.moodEntries) ? loaded.moodEntries : [])
      setSleepEntries(Array.isArray(loaded.sleepEntries) ? loaded.sleepEntries : [])
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
          if (fileData?.moodEntries || fileData?.sleepEntries) {
            const fileDate = fileData.lastSaved ? new Date(fileData.lastSaved) : null
            const storageDate = loaded.moodEntries.length > 0 
              ? new Date(Math.max(...loaded.moodEntries.map(e => e.id))) 
              : null
            
            if (!storageDate || (fileDate && fileDate > storageDate)) {
              setMoodEntries(Array.isArray(fileData.moodEntries) ? fileData.moodEntries : [])
              setSleepEntries(Array.isArray(fileData.sleepEntries) ? fileData.sleepEntries : [])
              saveData(fileData.moodEntries || [], fileData.sleepEntries || [])
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
          await writeFile(handle, {
            moodEntries: loaded.moodEntries,
            sleepEntries: loaded.sleepEntries || [],
            lastSaved: new Date().toISOString()
          })
        }
      }
    }
    
    initialize()
  }, [])

  // Auto-save to localStorage and file when data changes
  useEffect(() => {
    if (isLoaded) {
      saveData(moodEntries, sleepEntries)
      saveToFile()
    }
  }, [moodEntries, sleepEntries, isLoaded])

  async function saveToFile() {
    const handle = fileHandleRef.current
    if (!handle) return

    setFileStatus('saving')
    const success = await writeFile(handle, {
      moodEntries,
      sleepEntries,
      lastSaved: new Date().toISOString()
    })
    
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
    const handle = await openFile()
    if (handle) {
      fileHandleRef.current = handle
      setFileHandle(handle)
      saveFileHandleInfo(handle)
      
      const data = await readFile(handle)
      if (data?.moodEntries || data?.sleepEntries) {
        setMoodEntries(Array.isArray(data.moodEntries) ? data.moodEntries : [])
        setSleepEntries(Array.isArray(data.sleepEntries) ? data.sleepEntries : [])
        saveData(Array.isArray(data.moodEntries) ? data.moodEntries : [], Array.isArray(data.sleepEntries) ? data.sleepEntries : [])
        return true
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

  const setAllData = (moodData, sleepData) => {
    setMoodEntries(Array.isArray(moodData) ? moodData : [])
    setSleepEntries(Array.isArray(sleepData) ? sleepData : [])
  }

  const exportData = () => {
    const data = {
      moodEntries,
      sleepEntries,
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  }

  const importData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (data.moodEntries && Array.isArray(data.moodEntries)) {
        const sleeps = Array.isArray(data.sleepEntries) ? data.sleepEntries : []
        setAllData(data.moodEntries, sleeps)
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
        addMoodEntry,
        addSleepEntry,
        deleteMoodEntry,
        deleteSleepEntry,
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
