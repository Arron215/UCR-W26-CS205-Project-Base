import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useHealthData } from '../context/HealthDataContext'
import { useI18n } from '../context/I18nContext'

function TrendGraph() {
  const { moodEntries, sleepEntries, waterEntries } = useHealthData()
  const [range, setRange] = useState('month')
  const { t } = useI18n()

  const trendData = useMemo(() => {
    const now = new Date()
    let startDate = new Date(now)
    
    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date(0)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    const dataMap = new Map()

    moodEntries.forEach(entry => {
      const date = new Date(entry.timestamp || entry.date)
      if (date >= startDate) {
        const dateKey = entry.date
        if (!dataMap.has(dateKey)) {
          dataMap.set(dateKey, { date: dateKey, moodSum: 0, moodCount: 0, sleepSum: 0, sleepCount: 0, waterSum: 0, waterCount: 0 })
        }
        const day = dataMap.get(dateKey)
        day.moodSum += entry.mood
        day.moodCount++
      }
    })

    sleepEntries.forEach(entry => {
      const date = new Date(entry.timestamp || entry.date)
      if (date >= startDate) {
        const dateKey = entry.date
        if (!dataMap.has(dateKey)) {
          dataMap.set(dateKey, { date: dateKey, moodSum: 0, moodCount: 0, sleepSum: 0, sleepCount: 0, waterSum: 0, waterCount: 0 })
        }
        const day = dataMap.get(dateKey)
        day.sleepSum += entry.hours
        day.sleepCount++
      }
    })

    waterEntries.forEach(entry => {
      const date = new Date(entry.timestamp || entry.date)
      if (date >= startDate) {
        const dateKey = entry.date
        if (!dataMap.has(dateKey)) {
          dataMap.set(dateKey, { date: dateKey, moodSum: 0, moodCount: 0, sleepSum: 0, sleepCount: 0, waterSum: 0, waterCount: 0 })
        }
        const day = dataMap.get(dateKey)
        day.waterSum += entry.glasses || 0
        day.waterCount++
      }
    })

    const data = Array.from(dataMap.values())
      .map(day => ({
        date: day.date,
        mood: day.moodCount > 0 ? Number((day.moodSum / day.moodCount).toFixed(2)) : null,
        sleep: day.sleepCount > 0 ? Number((day.sleepSum / day.sleepCount).toFixed(2)) : null,
        water: day.waterCount > 0 ? Number((day.waterSum / day.waterCount).toFixed(2)) : null,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    if (range === 'week') {
      return data.slice(-7)
    }

    return data
  }, [moodEntries, sleepEntries, waterEntries, range])

  const ranges = [
    { value: 'week', label: t('sevenDays') },
    { value: 'month', label: t('oneMonth') },
    { value: 'year', label: t('oneYear') },
    { value: 'all', label: t('allTime') },
  ]

  const hasData = trendData.some(d => d.mood !== null || d.sleep !== null || d.water !== null)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          {t('trends')}
        </h3>
        <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          {ranges.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                range === r.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            {t('noDataRange')}
          </p>
        </div>
      )}

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }}
            className="dark:text-gray-400"
          />
          <YAxis 
            yAxisId="mood" 
            domain={[0, 5]} 
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fontSize: 11 }}
            className="dark:text-gray-400"
          />
          <YAxis 
            yAxisId="sleep" 
            orientation="right" 
            domain={[0, 12]} 
            ticks={[0, 3, 6, 9, 12]}
            tick={{ fontSize: 11 }}
            className="dark:text-gray-400"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: 'none', 
              borderRadius: '8px',
              color: '#fff'
            }}
            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          />
          <Legend />
          <Line 
            yAxisId="mood"
            type="monotone" 
            dataKey="mood" 
            stroke="#eab308" 
            strokeWidth={2}
            name={t('mood')}
            connectNulls
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            yAxisId="sleep"
            type="monotone" 
            dataKey="sleep" 
            stroke="#10b981" 
            strokeWidth={2}
            name={t('sleep')}
            connectNulls
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            yAxisId="mood"
            type="monotone" 
            dataKey="water" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name={t('water')}
            connectNulls
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TrendGraph
