import { useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import { useI18n } from '../context/I18nContext'
import { getTodayFormatted } from '../utils/helpers'

const HOURS_RANGE = Array.from({ length: 13 }, (_, i) => i)

function SleepTracker() {
  const { sleepEntries, addSleepEntry, deleteSleepEntry } = useHealthData()
  const [selectedHours, setSelectedHours] = useState(null)
  const [activeView, setActiveView] = useState('log')
  const { t } = useI18n()

  const handleSelectHours = (hours) => {
    setSelectedHours(hours)
  }

  const handleSubmit = () => {
    if (selectedHours === null) return

    const now = new Date()

    const newEntry = {
      id: Date.now(),
      hours: selectedHours,
      timestamp: now.toISOString(),
      date: getTodayFormatted(),
      time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }

    addSleepEntry(newEntry)
    setSelectedHours(null)
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

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveView('log')}
            className={`pb-2 font-medium text-sm border-b-2 transition-colors ${
              activeView === 'log'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            {t('logSleep')}
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`pb-2 font-medium text-sm border-b-2 transition-colors ${
              activeView === 'history'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            {t('history')}
          </button>
        </nav>
      </div>

      {activeView === 'log' ? (
        <>
          <div className="flex flex-wrap justify-between mb-6 space-x-2">
            {HOURS_RANGE.map((hour) => (
              <button
                key={hour}
                onClick={() => handleSelectHours(hour)}
                className={`w-12 py-3 rounded-lg font-semibold border transition-colors ${
                  selectedHours === hour
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {hour}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={selectedHours === null}
            className={`w-full mb-6 py-2 px-4 rounded-lg font-medium transition-colors ${
              selectedHours !== null
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
                {latestEntry.hours} hour{latestEntry.hours === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {latestEntry.date} at {latestEntry.time}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {(!sleepEntries || sleepEntries.length === 0) ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {t('noSleepYet')}
            </p>
          ) : (
            [...sleepEntries]
              .sort((a, b) => b.id - a.id)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {entry.hours} hour{entry.hours === 1 ? '' : 's'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      • {entry.date} at {entry.time}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(t('confirmDeleteSleep'))) {
                        deleteSleepEntry(entry.id)
                      }
                    }}
                    className="text-red-500 hover:text-red-700 font-medium text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title={t('deleteEntry')}
                  >
                    {t('deleteEntry')}
                  </button>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  )
}

export default SleepTracker
