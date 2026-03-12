import { useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import { useI18n } from '../context/I18nContext'
import { getTodayFormatted } from '../utils/helpers'

const HOURS_RANGE = Array.from({ length: 25 }, (_, i) => i)

function SleepTracker() {
  const { sleepEntries, addSleepEntry } = useHealthData()
  const [selectedHours, setSelectedHours] = useState('')
  const { t } = useI18n()

  const handleSubmit = () => {
    if (!selectedHours && selectedHours !== 0) return

    const hours = parseInt(selectedHours, 10)
    const now = new Date()

    const newEntry = {
      id: Date.now(),
      hours: hours,
      timestamp: now.toISOString(),
      date: getTodayFormatted(),
      time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }

    addSleepEntry(newEntry)
    setSelectedHours('')
  }

  const latestEntry = sleepEntries && sleepEntries.length > 0
    ? [...sleepEntries].sort((a, b) => b.id - a.id)[0]
    : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
        {t('sleepTracker')}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {t('sleepDescription')}
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('sleepHours')}
        </label>
        <select
          value={selectedHours}
          onChange={(e) => setSelectedHours(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
        >
          <option value="">{t('selectHours')}</option>
          {HOURS_RANGE.map((hour) => (
            <option key={hour} value={hour}>
              {hour} {hour === 1 ? t('hour') : t('hourPlural')}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedHours && selectedHours !== 0}
        className={`w-full mb-6 py-2 px-4 rounded-lg font-medium transition-colors ${
          selectedHours !== '' || selectedHours === 0
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 cursor-not-allowed'
        }`}
      >
        {t('saveSleepHours')}
      </button>

      {latestEntry && (
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{t('lastRecordedSleep')}</p>
          <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">
            {latestEntry.hours} {latestEntry.hours === 1 ? t('hour') : t('hourPlural')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {latestEntry.date} at {latestEntry.time}
          </p>
        </div>
      )}
    </div>
  )
}

export default SleepTracker
