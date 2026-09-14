import React from 'react';
import { Sparkles, Flame, CheckCircle, TrendingUp, Calendar, Zap, RotateCcw, Target } from 'lucide-react';
import { Habit, Routine } from '../types';
import { dateToday, isHabitScheduledForDate } from '../data';

interface ProgressPageProps {
  habits: Habit[];
  routines: Routine[];
  userPoints: number;
  onResetMission?: () => void;
}

export default function ProgressPage({ habits, routines, userPoints, onResetMission }: ProgressPageProps) {
  // Define journey start date as saved or default to today
  const savedStartDate = localStorage.getItem('journey_start_date');
  const today = new Date();
  
  if (!savedStartDate) {
    localStorage.setItem('journey_start_date', dateToday);
  }
  
  const journeyStartDateStr = localStorage.getItem('journey_start_date') || dateToday;
  const startDate = new Date(journeyStartDateStr);
  
  // Calculate day index for each of the 90 days
  const gridDays = Array.from({ length: 90 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Check status
    const isTodayStr = dateStr === dateToday;
    const isFuture = d > today && !isTodayStr;
    
    // Calculate completions on this date
    let habitsDone = 0;
    let habitsTotal = 0;
    
    habits.forEach(h => {
      if (isHabitScheduledForDate(h, dateStr)) {
        habitsTotal++;
        const val = h.history[dateStr] || 0;
        if (val >= h.target) {
          habitsDone++;
        }
      }
    });
    
    const completed = habitsTotal > 0 && habitsDone === habitsTotal;
    const partiallyCompleted = !completed && habits.some(h => (h.history[dateStr] || 0) > 0);
    const missed = !isFuture && !isTodayStr && !completed && !partiallyCompleted;
    
    return {
      dayNum: i + 1,
      dateStr,
      isTodayStr,
      isFuture,
      completed,
      partiallyCompleted,
      missed,
      habitsDone,
      habitsTotal
    };
  });
  
  // Calculate completed days
  const completedDaysCount = gridDays.filter(d => d.completed).length;
  const progressPercent = Math.round((completedDaysCount / 90) * 100);

  // Today's habit progress
  const todayTotal = habits.length;
  const todayDone = habits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
  const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
  
  // Calculate current streak
  let currentStreak = 0;
  const todayIndex = gridDays.findIndex(d => d.isTodayStr);
  if (todayIndex !== -1) {
    for (let i = todayIndex; i >= 0; i--) {
      const day = gridDays[i];
      if (day.completed) {
        currentStreak++;
      } else if (day.isTodayStr) {
        continue;
      } else {
        break;
      }
    }
  }
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans pb-10 px-4 pt-5">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-700 uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Transformation Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 tracking-tight">
            90 Days Consistency Grid
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Focus on daily execution. Don't break the chain.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white border border-gray-200 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-xs">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <div>
              <div className="text-[9px] font-mono text-gray-400 uppercase font-semibold">Started On</div>
              <div className="text-xs font-bold text-gray-800">{journeyStartDateStr}</div>
            </div>
          </div>

          {onResetMission && (
            <button
              type="button"
              onClick={onResetMission}
              className="bg-white border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-700 hover:text-rose-600 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-95 text-xs font-bold"
              title="Reset 90-Day transformation back to Day 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Mission</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Streak card */}
        <div className="bg-white border border-gray-200/80 p-4 rounded-2xl flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-wider">Streak</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{currentStreak} Days</div>
            <div className="text-[11px] text-orange-600 font-semibold mt-0.5">Keep the flame alive!</div>
          </div>
        </div>
        
        {/* Perfect Days card */}
        <div className="bg-white border border-gray-200/80 p-4 rounded-2xl flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-wider">Perfect Days</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{completedDaysCount} / 90</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">{progressPercent}% Locked In</div>
          </div>
        </div>

        {/* Today Habit Completion */}
        <div className="bg-white border border-gray-200/80 p-4 rounded-2xl flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-wider">Today's Habits</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{todayDone} / {todayTotal}</div>
            <div className="text-[11px] text-blue-600 font-semibold mt-0.5">{todayPct}% Done Today</div>
          </div>
        </div>
        
        {/* Total Points card */}
        <div className="bg-white border border-gray-200/80 p-4 rounded-2xl flex flex-col justify-between gap-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-wider">Points</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{userPoints} PTS</div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5">Consistency score</div>
          </div>
        </div>
      </div>
      
      {/* 90 Days Grid Visual Card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Your Journey Map
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600">
              <div className="w-3 h-3 bg-emerald-500 rounded" />
              <span>Perfect (100%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <div className="w-3 h-3 bg-amber-200 border border-amber-400 rounded" />
              <span>Active/Partial</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <div className="w-3 h-3 bg-emerald-50 border-2 border-emerald-600 rounded" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <div className="w-3 h-3 bg-rose-100 border border-rose-300 rounded" />
              <span>Missed</span>
            </div>
          </div>
        </div>
        
        {/* Grid layout */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
          {gridDays.map((day) => {
            let bgClass = 'bg-gray-50 border border-gray-200 text-gray-400';
            
            if (day.completed) {
              bgClass = 'bg-emerald-500 text-white font-bold shadow-xs';
            } else if (day.partiallyCompleted) {
              bgClass = 'bg-amber-100 border border-amber-300 text-amber-900 font-bold';
            } else if (day.missed) {
              bgClass = 'bg-rose-50 border border-rose-200 text-rose-500';
            } else if (day.isTodayStr) {
              bgClass = 'bg-emerald-50 border-2 border-emerald-600 text-emerald-900 font-black shadow-sm ring-2 ring-emerald-100';
            }
            
            return (
              <div
                key={day.dayNum}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl p-1 transition-all duration-200 hover:scale-105 select-none relative group cursor-pointer ${bgClass}`}
              >
                <span className="text-xs font-mono font-bold">{day.dayNum}</span>
                <span className="text-[7px] font-mono uppercase tracking-tighter opacity-70">
                  {day.isTodayStr ? 'TODAY' : ''}
                </span>
                
                {/* Floating tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] py-1.5 px-2.5 rounded-xl whitespace-nowrap z-20 pointer-events-none shadow-xl">
                  <div className="font-semibold">{day.dateStr} (Day {day.dayNum})</div>
                  {day.habitsTotal > 0 && (
                    <div className="text-emerald-400 font-mono mt-0.5">
                      {day.habitsDone}/{day.habitsTotal} Habits Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Quote of transformation */}
        <div className="mt-6 p-4 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-900 italic">
            "It doesn't matter how slow you go as long as you do not stop. Real transformation happens through daily consistency, one day at a time."
          </p>
        </div>
      </div>
    </div>
  );
}

