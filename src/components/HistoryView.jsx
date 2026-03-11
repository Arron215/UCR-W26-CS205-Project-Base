import { useMemo } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import { useI18n } from '../context/I18nContext'

function HistoryView() {
  const {
    moodEntries,
    deleteMoodEntry,
    sleepEntries = [],
    deleteSleepEntry,
    waterEntries = [],
    deleteWaterEntry,
  } = useHealthData()
  const { t } = useI18n()

  const sortedEntries = useMemo(() => {
    const moodWithType = moodEntries.map(e => ({ ...e, type: 'mood' }))
    const sleepWithType = sleepEntries.map(e => ({ ...e, type: 'sleep' }))
    const waterWithType = waterEntries.map(e => ({ ...e, type: 'water' }))
    return [...moodWithType, ...sleepWithType, ...waterWithType].sort((a, b) => b.id - a.id)
  }, [moodEntries, sleepEntries, waterEntries])

  const groupedByDate = useMemo(() => {
    const grouped = {}
    sortedEntries.forEach(entry => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = []
      }
      grouped[entry.date].push(entry)
    })
    return grouped
  }, [sortedEntries])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
        {t('healthHistory')}
      </h2>
      
      {Object.keys(groupedByDate).length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          {t('noHistoryYet')}
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .map(([date, entries]) => (
              <div key={date} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">{date}</h3>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-800 dark:text-white">
                          {entry.type === 'mood'
                            ? `${t('moodEntry')}: ${entry.mood}`
                            : entry.type === 'sleep'
                            ? `${t('sleepEntry')}: ${entry.hours} ${entry.hours === 1 ? t('hour') : t('hourPlural')}`
                            : `${t('waterEntry')}: ${entry.glasses} ${entry.glasses === 1 ? t('glass') : t('glasses')}`}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                          • {entry.time}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          let confirmMsg
                          if (entry.type === 'mood') {
                            confirmMsg = t('confirmDelete')
                          } else if (entry.type === 'sleep') {
                            confirmMsg = t('confirmDeleteSleep')
                          } else {
                            confirmMsg = t('confirmDeleteWater')
                          }
                          if (window.confirm(confirmMsg)) {
                            if (entry.type === 'mood') {
                              deleteMoodEntry(entry.id)
                            } else if (entry.type === 'sleep') {
                              deleteSleepEntry(entry.id)
                            } else {
                              deleteWaterEntry(entry.id)
                            }
                          }
                        }}
                        className="text-red-500 hover:text-red-700 font-medium text-sm ml-4 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title={t('deleteEntry')}
                      >
                        {t('deleteEntry')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default HistoryView
