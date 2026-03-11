import { useMemo } from 'react'
import { useHealthData } from '../context/HealthDataContext'

const MOOD_COLORS = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-green-300',
  5: 'bg-green-500',
}

function MoodHeatmap() {
  const { moodEntries } = useHealthData()

  const { weeks, months } = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364)

    const dayData = new Map()
    
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
      dayData.set(dateStr, { date: dateStr, moods: [], avg: null })
    }

    moodEntries.forEach(entry => {
      if (dayData.has(entry.date)) {
        const day = dayData.get(entry.date)
        day.moods.push(entry.mood)
      }
    })

    dayData.forEach(day => {
      if (day.moods.length > 0) {
        day.avg = Math.round(day.moods.reduce((a, b) => a + b, 0) / day.moods.length)
      }
    })

    const weeks = []
    let currentWeek = []
    const startDay = startDate.getDay()
    
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null)
    }

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
      const day = dayData.get(dateStr)
      currentWeek.push(day)

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeks.push(currentWeek)
    }

    const monthLabels = []
    let lastMonth = -1
    weeks.forEach((week, weekIndex) => {
      const firstValid = week.find(d => d !== null)
      if (firstValid) {
        const month = new Date(firstValid.date).getMonth()
        if (month !== lastMonth) {
          monthLabels.push({ month: new Date(firstValid.date).toLocaleDateString('en-US', { month: 'short' }), week: weekIndex })
          lastMonth = month
        }
      }
    })

    return { weeks, months: monthLabels }
  }, [moodEntries])

  const getColorClass = (day) => {
    if (!day || day.avg === null) return 'bg-gray-100 dark:bg-gray-700'
    return MOOD_COLORS[day.avg] || 'bg-gray-100 dark:bg-gray-700'
  }

  const getTitle = (day) => {
    if (!day) return 'No data'
    if (day.avg === null) return `${day.date}: No entries`
    const labels = { 1: 'Very Low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Excellent' }
    return `${day.date}: ${labels[day.avg]} (${day.moods.length} entries)`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Mood Calendar
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400">Less</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700" />
            <div className="w-3 h-3 rounded-sm bg-red-400" title="Very Low" />
            <div className="w-3 h-3 rounded-sm bg-orange-400" title="Low" />
            <div className="w-3 h-3 rounded-sm bg-yellow-400" title="Neutral" />
            <div className="w-3 h-3 rounded-sm bg-green-300" title="Good" />
            <div className="w-3 h-3 rounded-sm bg-green-500" title="Excellent" />
          </div>
          <span className="text-gray-500 dark:text-gray-400">More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-max">
          <div className="flex mb-1">
            <div className="w-6" />
            {months.map((m, i) => (
              <div 
                key={i} 
                className="text-xs text-gray-500 dark:text-gray-400"
                style={{ marginLeft: i === 0 ? m.week * 14 : (m.week - months[i-1].week) * 14 - 20, width: 32 }}
              >
                {m.month}
              </div>
            ))}
          </div>
          
          <div className="flex">
            <div className="flex flex-col gap-1 mr-1 text-xs text-gray-400 w-6">
              <span className="h-3" />
              <span className="h-3">Mon</span>
              <span className="h-3" />
              <span className="h-3">Wed</span>
              <span className="h-3" />
              <span className="h-3">Fri</span>
              <span className="h-3" />
            </div>
            
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      title={getTitle(day)}
                      className={`w-3 h-3 rounded-sm ${getColorClass(day)} transition-colors cursor-pointer hover:ring-2 hover:ring-indigo-500`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MoodHeatmap
