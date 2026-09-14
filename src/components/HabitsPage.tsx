import React, { useState, useEffect, useMemo } from 'react';
import {
  Check, Plus, Star, Flame, CalendarDays, ChevronDown, ChevronUp,
  ChevronLeft, Clock, Play, Pause, RotateCcw,
  Dumbbell, Heart, Target, Moon, Brain, Sparkles, MoreVertical,
  Pencil, Trash2, Undo2
} from 'lucide-react';
import { Habit, Category, Routine } from '../types';
import {
  dateToday,
  formatDateString,
  isHabitScheduledForDate,
  getScheduledHabits,
  getStandaloneHabits,
  getRoutineHabits
} from '../data';
import CategoryDetailView from './CategoryDetailView';
import { useToast } from './Toast';

// ─── 5 PILLARS CONFIG ──────────────────────────────────────────────────────────
const PILLAR_MAP: Record<Category, { color: string; bg: string; text: string; icon: React.ElementType }> = {
  Fitness:  { color: '#E64980', bg: 'bg-pink-50',   text: 'text-pink-600',   icon: Dumbbell },
  Diet:     { color: '#10B981', bg: 'bg-emerald-50',text: 'text-emerald-600',icon: Heart },
  Career:   { color: '#3B82F6', bg: 'bg-blue-50',   text: 'text-blue-600',   icon: Target },
  Recovery: { color: '#06B6D4', bg: 'bg-cyan-50',   text: 'text-cyan-600',   icon: Moon },
  Mind:     { color: '#8B5CF6', bg: 'bg-purple-50', text: 'text-purple-600', icon: Brain },
};

const getPillarConfig = (cat: Category) => PILLAR_MAP[cat] ?? {
  color: '#6B7280',
  bg: 'bg-gray-50',
  text: 'text-gray-600',
  icon: Sparkles
};

// ─── TIME BLOCKS ──────────────────────────────────────────────────────────────
interface TimeBlockConfig {
  id: 'Morning' | 'Afternoon' | 'Evening' | 'Anytime';
  label: string;
  emoji: string;
  hours: string;
  defaultMinutes: number;
}

const TIME_BLOCKS: TimeBlockConfig[] = [
  { id: 'Morning',   label: 'Morning',   emoji: '☀️',  hours: '6:00 AM – 11:00 AM', defaultMinutes: 85 },
  { id: 'Afternoon', label: 'Afternoon', emoji: '🌤️', hours: '11:00 AM – 5:00 PM',  defaultMinutes: 110 },
  { id: 'Evening',   label: 'Evening',   emoji: '🌙',  hours: '5:00 PM – 11:00 PM', defaultMinutes: 45 },
  { id: 'Anytime',   label: 'Anytime Disciplines', emoji: '⚡', hours: 'All Day Habit Stack', defaultMinutes: 30 },
];

function classifyHabitTimeframe(habit: Habit, routines: Routine[]): 'Morning' | 'Afternoon' | 'Evening' | 'Anytime' {
  const parentRoutine = routines.find(r => r.habitIds.includes(habit.id) || habit.routineId === r.id);
  if (parentRoutine) {
    if (parentRoutine.timeBlock === 'Morning') return 'Morning';
    if (parentRoutine.timeBlock === 'Evening') return 'Evening';
    if (parentRoutine.timeBlock === 'Night') return 'Evening';
  }
  if (habit.timeOfDay) {
    const tod = habit.timeOfDay.toLowerCase().trim();
    if (tod === 'anytime' || tod === 'constant' || tod === 'none') return 'Anytime';
    const m = tod.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (m) {
      let hr = parseInt(m[1], 10);
      if (m[3] === 'pm' && hr < 12) hr += 12;
      if (m[3] === 'am' && hr === 12) hr = 0;
      if (hr >= 5 && hr < 11) return 'Morning';
      if (hr >= 11 && hr < 17) return 'Afternoon';
      return 'Evening';
    }
    if (tod.includes('morning')) return 'Morning';
    if (tod.includes('afternoon')) return 'Afternoon';
    if (tod.includes('evening') || tod.includes('night')) return 'Evening';
  }
  return 'Anytime';
}

interface HabitsPageProps {
  habits: Habit[];
  routines: Routine[];
  onLogHabit: (id: string, value: number) => void;
  onDeleteHabit: (id: string) => void;
  deletingHabitId: string | null;
  openCreateHabit: () => void;
  openCreateRoutine: () => void;
  onEditHabit: (habit: Habit) => void;
  onRevertHabit: (id: string) => void;
  onDeleteRoutine: (routineId: string) => void;
  selectedRoutineId: string | null;
  setSelectedRoutineId: (id: string | null) => void;
  selectedCategoryId: Category | null;
  setSelectedCategoryId: (cat: Category | null) => void;
}

export default function HabitsPage({
  habits,
  routines,
  onLogHabit,
  onDeleteHabit,
  onEditHabit,
  onRevertHabit,
  onDeleteRoutine,
  selectedRoutineId,
  setSelectedRoutineId,
  selectedCategoryId,
  setSelectedCategoryId,
}: HabitsPageProps) {
  const toast = useToast();

  // Selected date (defaults to dateToday)
  const [selectedDate, setSelectedDate] = useState<string>(dateToday);

  // View mode: 'time' vs 'pillar'
  const [viewMode, setViewMode] = useState<'time' | 'pillar'>('time');

  // Collapsed time blocks
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});

  // Starred habits for Today's Focus on Home
  const [starredHabits, setStarredHabits] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('starred_habits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleStarHabit = (id: string) => {
    const next = starredHabits.includes(id)
      ? starredHabits.filter(x => x !== id)
      : [...starredHabits, id];
    setStarredHabits(next);
    localStorage.setItem('starred_habits', JSON.stringify(next));
  };

  const toggleBlockCollapse = (blockId: string) => {
    setCollapsedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  // Active focus timer
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let id: any = null;
    if (isTimerRunning && activeTimerId && timeLeft > 0) {
      id = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            const h = habits.find(x => x.id === activeTimerId);
            if (h) {
              onLogHabit(h.id, h.target);
              toast.success(`Focus session completed for "${h.name}"!`);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(id);
  }, [isTimerRunning, activeTimerId, timeLeft, habits]);

  const startFocusTimer = (habitId: string, minutes: number) => {
    setActiveTimerId(habitId);
    setTimeLeft(minutes * 60);
    setIsTimerRunning(true);
  };

  // Journey Day calculations (Day X of 90)
  const journeyStart = localStorage.getItem('journey_start_date') || dateToday;
  const journeyDiff = Math.abs(new Date(selectedDate).getTime() - new Date(journeyStart).getTime());
  const currentDayNum = Math.min(90, Math.max(1, Math.ceil(journeyDiff / (1000 * 60 * 60 * 24)) + 1));

  // Streak calculation
  const currentStreak = useMemo(() => {
    let streak = 0;
    const start = new Date(journeyStart);
    for (let i = 0; i < 90; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const str = d.toISOString().split('T')[0];
      if (str === dateToday) continue;
      const dayHabits = habits.filter(h => isHabitScheduledForDate(h, str));
      const allDone = dayHabits.length > 0 && dayHabits.every(h => (h.history[str] || 0) >= h.target);
      if (allDone) streak++;
      else if (new Date(str) < new Date(dateToday)) streak = 0;
    }
    const todayAllDone = habits.length > 0 && habits.every(h => (h.history[dateToday] || 0) >= h.target);
    if (todayAllDone) streak++;
    return streak;
  }, [habits, journeyStart]);

  // Rolling 7-day strip centered on selected date
  const dateStrip = useMemo(() => {
    const base = new Date(selectedDate);
    const days: Array<{ dateStr: string; dayName: string; dayNum: number; isToday: boolean; isSelected: boolean }> = [];
    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);
      const str = formatDateString(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const dayNum = d.getDate();
      days.push({
        dateStr: str,
        dayName,
        dayNum,
        isToday: str === dateToday,
        isSelected: str === selectedDate,
      });
    }
    return days;
  }, [selectedDate]);

  // Habits scheduled for the selected date
  const scheduledHabits = useMemo(() => {
    return habits.filter(h => isHabitScheduledForDate(h, selectedDate));
  }, [habits, selectedDate]);

  const totalTasks = scheduledHabits.length;
  const completedTasks = scheduledHabits.filter(h => (h.history[selectedDate] || 0) >= h.target).length;
  const remainingTasks = totalTasks - completedTasks;
  const lockInPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Daily Score for selected date
  const todayScore = useMemo(() => {
    return scheduledHabits.reduce((acc, h) => {
      const val = h.history[selectedDate] || 0;
      if (val >= h.target) return acc + h.points;
      if (val > 0) return acc + Math.round((val / h.target) * h.points);
      return acc;
    }, 0);
  }, [scheduledHabits, selectedDate]);

  // ── CATEGORY DETAIL VIEW ROUTING ──
  if (selectedCategoryId) {
    return (
      <div className="max-w-2xl mx-auto py-2 px-4 font-sans">
        <CategoryDetailView
          category={selectedCategoryId}
          habits={habits}
          onLogHabit={onLogHabit}
          onBack={() => setSelectedCategoryId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto font-sans pb-16 px-4 pt-5">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Today</h1>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">
            Day {currentDayNum} of 90
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak pill */}
          <div className="flex items-center gap-1.5 bg-orange-50/80 border border-orange-200/80 px-3 py-1.5 rounded-full shadow-xs">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-xs font-black text-orange-700 font-mono">
              {currentStreak} Streak
            </span>
          </div>

          {/* Calendar Jump Button */}
          <button
            type="button"
            onClick={() => setSelectedDate(dateToday)}
            className="w-10 h-10 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition shadow-xs cursor-pointer active:scale-95"
            title="Reset to today"
          >
            <CalendarDays className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── HORIZONTAL WEEK DATE SELECTOR ── */}
      <div className="flex items-center justify-between gap-1.5 py-1">
        {dateStrip.map(day => (
          <button
            key={day.dateStr}
            type="button"
            onClick={() => setSelectedDate(day.dateStr)}
            className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
              day.isSelected
                ? 'bg-[#10B981] text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] scale-[1.02]'
                : 'bg-white border border-gray-200 text-gray-800 hover:border-gray-300'
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-wider ${day.isSelected ? 'text-emerald-100' : 'text-gray-500'}`}>
              {day.dayName}
            </span>
            <span className="text-lg font-black mt-0.5 leading-none font-mono">
              {day.dayNum}
            </span>
            {day.isToday && !day.isSelected && (
              <span className="w-1 h-1 bg-emerald-500 rounded-full mt-1" />
            )}
          </button>
        ))}
      </div>

      {/* ── DAILY LOCK-IN SCORE STATS CARD ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-4 divide-x divide-gray-100 text-center">
          <div className="px-2">
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-gray-400 block">
              LOCK-IN
            </span>
            <span className="text-xl font-black text-gray-900 mt-1 block">
              {lockInPct}%
            </span>
          </div>

          <div className="px-2">
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-gray-400 block">
              SCORE
            </span>
            <span className="text-xl font-black text-emerald-600 mt-1 block font-mono">
              {todayScore}
            </span>
          </div>

          <div className="px-2">
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-gray-400 block">
              LEFT
            </span>
            <span className="text-xl font-black text-amber-600 mt-1 block">
              {remainingTasks} tasks
            </span>
          </div>

          <div className="px-2">
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-gray-400 block">
              DONE
            </span>
            <span className="text-xl font-black text-blue-600 mt-1 block font-mono">
              {completedTasks}/{totalTasks}
            </span>
          </div>
        </div>
      </div>

      {/* ── VIEW TOGGLE (BY TIME / BY PILLAR) ── */}
      <div className="flex bg-white border border-gray-200 p-1 rounded-2xl shadow-xs">
        <button
          type="button"
          onClick={() => setViewMode('time')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            viewMode === 'time'
              ? 'bg-[#10B981] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>By Time</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('pillar')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            viewMode === 'pillar'
              ? 'bg-[#10B981] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>By Pillar</span>
        </button>
      </div>

      {/* ── ACTIVE FOCUS TIMER BANNER ── */}
      {isTimerRunning && activeTimerId && (
        <div className="bg-emerald-500 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Focus Timer Active</p>
              <p className="text-sm font-black truncate">
                {habits.find(h => h.id === activeTimerId)?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-black">
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => setIsTimerRunning(false)}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── CONTENT SECTION ── */}
      {viewMode === 'time' ? (
        /* ──────── BY TIME VIEW ──────── */
        <div className="space-y-3">
          {TIME_BLOCKS.map(block => {
            const blockHabits = scheduledHabits.filter(h => classifyHabitTimeframe(h, routines) === block.id);
            const isCollapsed = Boolean(collapsedBlocks[block.id]);
            const blockEstMinutes = blockHabits.reduce((acc, h) => acc + (h.type === 'Timer' ? h.target : 15), 0) || block.defaultMinutes;

            return (
              <div
                key={block.id}
                className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs transition"
              >
                {/* Block Header */}
                <div
                  onClick={() => toggleBlockCollapse(block.id)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{block.emoji}</span>
                    <div>
                      <h2 className="text-base font-black text-gray-900 leading-tight">
                        {block.label}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5 font-medium">
                        {block.hours}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-400">
                      Est. {blockEstMinutes} min
                    </span>
                    <button
                      type="button"
                      className="text-gray-400 p-1 rounded-lg hover:bg-gray-100 transition"
                      aria-label="Toggle collapse"
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Block Content */}
                {!isCollapsed && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    {blockHabits.length === 0 ? (
                      <p className="text-center py-6 text-xs italic text-gray-400">
                        No active habits or routines scheduled in this block.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {blockHabits.map(habit => {
                          const currentVal = habit.history[selectedDate] || 0;
                          const isCompleted = currentVal >= habit.target;
                          const isStarred = starredHabits.includes(habit.id);
                          const pillar = getPillarConfig(habit.category);

                          return (
                            <div
                              key={habit.id}
                              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                isCompleted
                                  ? 'bg-emerald-50/50 border-emerald-200'
                                  : 'bg-gray-50/60 border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              {/* Left Check Circle Button */}
                              <button
                                type="button"
                                onClick={() => onLogHabit(habit.id, isCompleted ? 0 : habit.target)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer active:scale-90 ${
                                  isCompleted
                                    ? 'bg-[#10B981] text-white shadow-sm'
                                    : 'border-2 border-gray-300 hover:border-emerald-500 bg-white'
                                }`}
                                aria-label={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                              >
                                {isCompleted && <Check className="w-4 h-4 stroke-[3px]" />}
                              </button>

                              {/* Habit Name & Metadata */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3
                                    className={`text-sm font-black truncate ${
                                      isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                                    }`}
                                  >
                                    {habit.name}
                                  </h3>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${pillar.bg} ${pillar.text}`}>
                                    {habit.category}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                                  {currentVal} / {habit.target} {habit.unit}
                                </div>
                              </div>

                              {/* Right Actions */}
                              <div className="flex items-center gap-2 shrink-0">
                                {/* Star Habit for Home Focus */}
                                <button
                                  type="button"
                                  onClick={() => toggleStarHabit(habit.id)}
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    isStarred ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'
                                  }`}
                                  title={isStarred ? 'Unpin from Today Focus' : 'Pin to Today Focus'}
                                >
                                  <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
                                </button>

                                {/* Timer action if timer habit */}
                                {habit.type === 'Timer' && !isCompleted && (
                                  <button
                                    type="button"
                                    onClick={() => startFocusTimer(habit.id, habit.target)}
                                    className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Play className="w-3 h-3 fill-purple-600" />
                                    <span>Start</span>
                                  </button>
                                )}

                                {/* Increment Button */}
                                {!isCompleted && (
                                  <button
                                    type="button"
                                    onClick={() => onLogHabit(habit.id, habit.type === 'Timer' ? 5 : 1)}
                                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-extrabold transition cursor-pointer active:scale-95"
                                  >
                                    {habit.type === 'Timer' ? '+5m' : '+1'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ──────── BY PILLAR VIEW ──────── */
        <div className="space-y-3">
          {(['Fitness', 'Diet', 'Career', 'Recovery', 'Mind'] as Category[]).map(cat => {
            const pillarHabits = scheduledHabits.filter(h => h.category === cat);
            const total = pillarHabits.length;
            const done = pillarHabits.filter(h => (h.history[selectedDate] || 0) >= h.target).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const pillar = getPillarConfig(cat);
            const Icon = pillar.icon;

            return (
              <div
                key={cat}
                className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs"
              >
                {/* Pillar Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${pillar.bg}`}>
                      <Icon className="w-5 h-5" style={{ color: pillar.color }} />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-gray-900">{cat}</h2>
                      <p className="text-xs text-gray-400 font-mono">
                        {done} of {total} completed
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black font-mono text-gray-700">
                    {pct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: pillar.color }}
                  />
                </div>

                {/* Habit items */}
                {pillarHabits.length === 0 ? (
                  <p className="text-center py-4 text-xs italic text-gray-400">
                    No active habits under this pillar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pillarHabits.map(habit => {
                      const currentVal = habit.history[selectedDate] || 0;
                      const isCompleted = currentVal >= habit.target;

                      return (
                        <div
                          key={habit.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isCompleted
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : 'bg-gray-50/60 border-gray-100'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onLogHabit(habit.id, isCompleted ? 0 : habit.target)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer active:scale-90 ${
                              isCompleted
                                ? 'bg-[#10B981] text-white'
                                : 'border-2 border-gray-300 hover:border-emerald-500 bg-white'
                            }`}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm font-black truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {habit.name}
                            </h3>
                            <p className="text-[10px] font-mono text-gray-400">
                              {currentVal}/{habit.target} {habit.unit}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => onLogHabit(habit.id, habit.type === 'Timer' ? 5 : 1)}
                                className="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-black transition cursor-pointer active:scale-95"
                              >
                                {habit.type === 'Timer' ? '+5m' : '+1'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}