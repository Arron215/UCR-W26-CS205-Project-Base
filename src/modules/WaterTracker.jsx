import { useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import { useI18n } from '../context/I18nContext'
import { getTodayFormatted } from '../utils/helpers'

const GLASS_SIZE = 1

function WaterTracker() {
  const { waterEntries, waterGoal, addOrUpdateWaterEntry, setWaterGoal } = useHealthData()
  const [showGoalInput, setShowGoalInput] = useState(false)
  const [goalValue, setGoalValue] = useState(waterGoal)
  const { t } = useI18n()

  const today = getTodayFormatted()
  const todayEntry = Array.isArray(waterEntries) 
    ? waterEntries.find(e => e.date === today)
    : null
  const todayTotal = todayEntry?.glasses || 0
  const progress = Math.min((todayTotal / waterGoal) * 100, 100)
  const isGoalReached = todayTotal >= waterGoal

  const handleAddGlass = () => {
    addOrUpdateWaterEntry(today, 1)
  }

  const handleSaveGoal = () => {
    if (goalValue > 0) {
      setWaterGoal(goalValue)
      setShowGoalInput(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
        {t('waterIntake')}
      </h2>
      
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6">
          <button
            className="pb-2 font-medium text-sm border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
          >
            {t('track')}
          </button>
          <button
            onClick={() => setShowGoalInput(true)}
            className={`pb-2 font-medium text-sm border-b-2 transition-colors ${
              showGoalInput
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t('settings')}
          </button>
        </nav>
      </div>

      {!showGoalInput ? (
        <>
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-gray-600 dark:text-gray-300">
                {t('todaysProgress')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {todayTotal} / {waterGoal} {t('glasses')}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${
                  isGoalReached ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {isGoalReached && (
              <p className="mt-2 text-green-600 dark:text-green-400 font-medium text-center">
                {t('goalReached')}
              </p>
            )}
          </div>

          <button
            onClick={handleAddGlass}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-2xl">💧</span>
            {t('addGlass')}
          </button>
        </>
      ) : (
        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('setGoal')}
          </p>
          
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="20"
              value={goalValue}
              onChange={(e) => setGoalValue(parseInt(e.target.value) || 1)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={handleSaveGoal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              {t('change')}
            </button>
            <button
              onClick={() => setShowGoalInput(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WaterTracker
