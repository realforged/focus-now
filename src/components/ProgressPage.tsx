import React from 'react';
import { Sparkles, Flame, CheckCircle, TrendingUp, Calendar, Zap } from 'lucide-react';
import { Habit, Routine } from '../types';
import { dateToday } from '../data';

interface ProgressPageProps {
  habits: Habit[];
  routines: Routine[];
  userPoints: number;
}

export default function ProgressPage({ habits, routines, userPoints }: ProgressPageProps) {
  // Define journey start date as 5 days ago to match mock data or default to today
  const savedStartDate = localStorage.getItem('journey_start_date');
  const today = new Date();
  
  if (!savedStartDate) {
    // If not set, let's backdate it by 5 days so user starts with some progress
    const backdated = new Date();
    backdated.setDate(today.getDate() - 5);
    const dateStr = backdated.toISOString().split('T')[0];
    localStorage.setItem('journey_start_date', dateStr);
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
      // Check if habit has history on this date
      const val = h.history[dateStr] || 0;
      if (val > 0 || h.repeat === 'Daily') {
        habitsTotal++;
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
  
  // Calculate current streak
  let currentStreak = 0;
  // Start from today and count backwards
  const todayIndex = gridDays.findIndex(d => d.isTodayStr);
  if (todayIndex !== -1) {
    for (let i = todayIndex; i >= 0; i--) {
      const day = gridDays[i];
      if (day.completed) {
        currentStreak++;
      } else if (day.isTodayStr) {
        // If today is not completed yet, keep checking yesterday
        continue;
      } else {
        break;
      }
    }
  }
  
  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#12B886] uppercase bg-[#12B886]/10 px-2.5 py-1 rounded-full border border-[#12B886]/20">
            Transformation Analytics
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-3 font-sans tracking-tight">
            90 Days Consistency Grid
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Focus on daily execution. Don't break the chain.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-[#14161F] border border-[#232734] px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-[10px] font-mono text-gray-500 uppercase">Started On</div>
              <div className="text-xs font-bold text-white mt-0.5">{journeyStartDateStr}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak card */}
        <div className="bg-[#14161F]/90 border border-[#232734]/80 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-bl-full blur-xl pointer-events-none" />
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Current Streak</div>
            <div className="text-3xl font-extrabold text-white font-sans">{currentStreak} Days</div>
            <div className="text-xs text-orange-400 font-medium">Keep the flame alive!</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl text-orange-400">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        
        {/* Days Done card */}
        <div className="bg-[#14161F]/90 border border-[#232734]/80 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#12B886]/5 rounded-bl-full blur-xl pointer-events-none" />
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Perfect Days</div>
            <div className="text-3xl font-extrabold text-white font-sans">{completedDaysCount} / 90</div>
            <div className="text-xs text-[#12B886] font-medium">{progressPercent}% Completed</div>
          </div>
          <div className="bg-[#12B886]/10 border border-[#12B886]/20 p-3 rounded-xl text-[#12B886]">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
        
        {/* Total Points card */}
        <div className="bg-[#14161F]/90 border border-[#232734]/80 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-bl-full blur-xl pointer-events-none" />
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Mission Points</div>
            <div className="text-3xl font-extrabold text-white font-sans">{userPoints} PTS</div>
            <div className="text-xs text-indigo-400 font-medium">Unlock higher limits!</div>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl text-indigo-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>
      
      {/* 90 Days Grid Visual Card */}
      <div className="bg-[#14161F]/90 border border-[#232734]/80 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#12B886]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#12B886]" />
            Your Journey Progress
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <div className="w-3 h-3 bg-[#12B886] rounded" />
              <span>Perfect</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <div className="w-3 h-3 bg-amber-500/25 border border-amber-500/40 rounded" />
              <span>Active/Partial</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <div className="w-3 h-3 bg-[#1E2230] border border-[#2D334D] rounded" />
              <span>Future</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <div className="w-3 h-3 bg-rose-500/10 border border-rose-500/25 rounded" />
              <span>Missed</span>
            </div>
          </div>
        </div>
        
        {/* Grid layout */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
          {gridDays.map((day) => {
            let bgClass = 'bg-[#12141C] border border-[#232734] text-gray-500';
            
            if (day.completed) {
              bgClass = 'bg-[#12B886] text-white border-transparent shadow-[0_0_12px_rgba(18,184,134,0.35)]';
            } else if (day.partiallyCompleted) {
              bgClass = 'bg-amber-500/10 border border-amber-500/45 text-amber-300';
            } else if (day.missed) {
              bgClass = 'bg-rose-500/5 border border-rose-500/20 text-rose-400/70';
            } else if (day.isTodayStr) {
              bgClass = 'bg-[#1E2230] border-2 border-indigo-500 text-indigo-400 animate-pulse font-bold';
            }
            
            return (
              <div
                key={day.dayNum}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl p-1.5 transition-all duration-300 hover:scale-105 select-none relative group cursor-pointer ${bgClass}`}
                title={`${day.dateStr} - Day ${day.dayNum}`}
              >
                <span className="text-xs font-mono font-bold">{day.dayNum}</span>
                <span className="text-[7px] font-mono uppercase tracking-tighter opacity-50">
                  {day.isTodayStr ? 'TODAY' : ''}
                </span>
                
                {/* Floating tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0A0B0E] border border-[#232734] text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none shadow-xl">
                  <div>{day.dateStr}</div>
                  {day.habitsTotal > 0 && (
                    <div className="text-[#12B886] font-mono mt-0.5">
                      {day.habitsDone}/{day.habitsTotal} Habits Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Quote of transformation */}
        <div className="mt-8 p-4 bg-[#12141C] border border-[#232734]/60 rounded-xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs text-gray-400 italic">
            "It doesn't matter how slow you go as long as you do not stop. Real transformation happens through daily consistency, one day at a time."
          </p>
        </div>
      </div>
    </div>
  );
}
