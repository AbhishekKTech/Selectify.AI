'use client'
import React, { useMemo } from 'react'
import { Assess, Automated_Assess, Result } from '@prisma/client'
import { cn } from "@/lib/utils"

interface Props {
  EveryResolve: Result[];
  EveryAssessment: Assess[];
  EveryAutoAssessment: Automated_Assess[];
}

const Calendar = ({ EveryResolve, EveryAssessment, EveryAutoAssessment }: Props) => {
  // Merge all dates into a frequency map
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    const addDate = (d: Date) => {
      if (!d) return;
      const dateStr = new Date(d).toISOString().split('T')[0];
      map.set(dateStr, (map.get(dateStr) || 0) + 1);
    };

    EveryResolve.forEach(x => addDate(x.createdAt));
    EveryAssessment.forEach(x => addDate(x.createdAt));
    EveryAutoAssessment.forEach(x => addDate(x.createdAt));
    return map;
  }, [EveryResolve, EveryAssessment, EveryAutoAssessment]);

  // Generate the last 20 weeks of activity (140 days)
  const daysToShow = 140; 
  const today = new Date();
  const daysArr = [];

  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    daysArr.push({
      date: dateStr,
      count: activityMap.get(dateStr) || 0
    });
  }

  // Chunk days into columns (weeks)
  const grid = [];
  for (let i = 0; i < daysArr.length; i += 7) {
    grid.push(daysArr.slice(i, i + 7));
  }

  const getLevel = (count: number) => {
    if (count === 0) return 'bg-slate-200/60 dark:bg-slate-800/60';
    if (count === 1) return 'bg-indigo-300 dark:bg-indigo-900/80';
    if (count === 2) return 'bg-indigo-400 dark:bg-indigo-700/80';
    if (count >= 3) return 'bg-indigo-600 dark:bg-indigo-500';
  };

  return (
    <div className="w-full h-full flex flex-col justify-center py-2">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Activity Heatmap</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Last 140 Days</span>
      </div>
      
      {/* GitHub Style Heatmap Grid */}
      <div className="flex gap-[3px] overflow-x-auto pb-2 scrollbar-none w-full justify-center">
        {grid.map((week, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {week.map((day, j) => (
              <div
                key={j}
                title={`${day.count} assessments on ${day.date}`}
                className={cn(
                  "w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] rounded-[3px] transition-all duration-200 cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-400 dark:hover:ring-offset-slate-900",
                  getLevel(day.count)
                )}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-5 text-[11px] text-slate-500 px-2 font-medium tracking-wide">
        <span>Less</span>
        <div className="w-3 h-3 rounded-[2px] bg-slate-200/60 dark:bg-slate-800/60" />
        <div className="w-3 h-3 rounded-[2px] bg-indigo-300 dark:bg-indigo-900/80" />
        <div className="w-3 h-3 rounded-[2px] bg-indigo-400 dark:bg-indigo-700/80" />
        <div className="w-3 h-3 rounded-[2px] bg-indigo-600 dark:bg-indigo-500" />
        <span>More</span>
      </div>
    </div>
  )
}

export default Calendar;