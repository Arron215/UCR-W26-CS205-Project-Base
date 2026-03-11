import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { HealthDataProvider } from './context/HealthDataContext'
import MoodTracker from './modules/MoodTracker'
import SleepTracker from './modules/SleepTracker'
import WaterTracker from './modules/WaterTracker'
import DailyGraph from './components/DailyGraph'
import WeeklyGraph from './components/WeeklyGraph'
import TrendGraph from './components/TrendGraph'
import HistoryView from './components/HistoryView'
import FileManager from './components/FileManager'
import Login from './components/Login'

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const { user, logout } = useAuth()

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  if (!user) {
    return <Login />
  }

  return (
    <HealthDataProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                Health Tracker App
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Track how you feel over time with simple mood and sleep logs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                {user.email}
              </span>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Logout
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-yellow-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </header>

          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'data'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                Data Management
              </button>
            </nav>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MoodTracker />
                <SleepTracker />
                <WaterTracker />
                <DailyGraph />
                <WeeklyGraph />
                <TrendGraph />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <HistoryView />
          )}

          {activeTab === 'data' && (
            <FileManager />
          )}
        </div>
      </div>
    </HealthDataProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
