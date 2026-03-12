import { useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import { useI18n } from '../context/I18nContext'
import { getTodayFormatted } from '../utils/helpers'

function MoodTracker() {
  const { moodEntries, addMoodEntry, deleteMoodEntry } = useHealthData()
  const [selectedMood, setSelectedMood] = useState(null)
  const { t } = useI18n()

  const getMoodLabel = (mood) => {
    const labels = {
      1: t('veryLow'),
      2: t('low'),
      3: t('neutral'),
      4: t('good'),
      5: t('excellent'),
    }
    return labels[mood] || t('neutral')
  }

  const handleSelectMood = (mood) => {
    setSelectedMood(mood)
  }

  const handleSubmit = () => {
    if (!selectedMood) return

    const now = new Date()

    const newEntry = {
      id: Date.now(),
      mood: selectedMood,
      timestamp: now.toISOString(),
      date: getTodayFormatted(),
      time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }

    addMoodEntry(newEntry)
    setSelectedMood(null)
  }

  const latestEntry = moodEntries && moodEntries.length > 0
    ? [...moodEntries].sort((a, b) => b.id - a.id)[0]
    : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
        {t('moodTracker')}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {t('moodDescription')}
      </p>

      <div className="flex justify-between mb-6 space-x-2">
        {[1, 2, 3, 4, 5].map((mood) => (
          <button
            key={mood}
            onClick={() => handleSelectMood(mood)}
            className={`flex-1 py-3 rounded-lg font-semibold border transition-colors ${
              selectedMood === mood
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-lg">{mood}</div>
            <div
              className={`text-xs mt-1 ${
                selectedMood === mood ? 'text-white' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {getMoodLabel(mood)}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedMood}
        className={`w-full mb-6 py-2 px-4 rounded-lg font-medium transition-colors ${
          selectedMood
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 cursor-not-allowed'
        }`}
      >
        {t('saveMood')}
      </button>

      {latestEntry && (
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{t('lastRecordedMood')}</p>
          <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">
            {latestEntry.mood} – {getMoodLabel(latestEntry.mood)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {latestEntry.date} at {latestEntry.time}
          </p>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {!moodEntries || moodEntries.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            {t('noMoodsYet')}
          </p>
        ) : (
          [...moodEntries]
            .sort((a, b) => b.id - a.id)
            .map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {entry.mood} – {getMoodLabel(entry.mood)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                    • {entry.date} at {entry.time}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(t('confirmDelete'))) {
                      deleteMoodEntry(entry.id)
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
    </div>
  )
}

export default MoodTracker

