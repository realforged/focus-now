import React, { useState, useEffect } from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleCheck,
  ChevronRight,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  Plus,
  Sparkles,
  Star,
  Target,
  Trash2,
  UtensilsCrossed,
  X,
  Zap
} from 'lucide-react';
import { Habit, Category, Routine } from '../types';
import { dateToday, dateYesterday, getRoutineHabits, isHabitScheduledForDate } from '../data';
import { motion, AnimatePresence } from 'motion/react';

type LogHabitHandler = (id: string, value: number) => void | Promise<void>;

interface DashboardProps {
  habits: Habit[];
  routines: Routine[];
  userPoints: number;
  onLogHabit: LogHabitHandler;
  setTab: (tab: string) => void;
  onNavigateToRoutine: (routineId: string) => void;
  selectedCategoryId: Category | null;
  setSelectedCategoryId: (cat: Category | null) => void;
  onDeleteHabit?: (id: string) => void;
  onCreateHabitInRoutine?: (routineId: string, name: string, category: Category) => Promise<void>;
  showDietModalDirectly?: boolean;
  onCloseDietModalDirectly?: () => void;
}

// Food interfaces
interface FoodItem {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  calories: number;
}

const PILLARS: Category[] = ['Fitness', 'Diet', 'Career', 'Recovery', 'Mind'];

// Categories config
const CATEGORY_MAP: Record<Category, { color: string; tint: string; icon: React.ElementType }> = {
  Fitness: { color: '#E64980', tint: '#FFE3EC', icon: Dumbbell },
  Diet: { color: '#12B886', tint: '#D3F9E8', icon: Heart },
  Career: { color: '#339AF0', tint: '#D0EBFF', icon: Target },
  Recovery: { color: '#06B6D4', tint: '#CFFAFE', icon: Moon },
  Mind: { color: '#845EF7', tint: '#E5DBFF', icon: Sparkles },
};

const getCategoryColor = (cat: Category) => CATEGORY_MAP[cat]?.color ?? '#868E96';
const getCategoryTint = (cat: Category) => CATEGORY_MAP[cat]?.tint ?? '#F1F3F5';
const getCategoryIcon = (cat: Category) => CATEGORY_MAP[cat]?.icon ?? Sparkles;

export default function Dashboard({
  habits,
  routines,
  userPoints,
  onLogHabit,
  setTab,
  onNavigateToRoutine,
  selectedCategoryId,
  setSelectedCategoryId,
  showDietModalDirectly = false,
  onCloseDietModalDirectly
}: DashboardProps) {
  // Starred habits list for Today Focus
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
      ? starredHabits.filter((x) => x !== id)
      : [...starredHabits, id];
    setStarredHabits(next);
    localStorage.setItem('starred_habits', JSON.stringify(next));
  };

  // Diet logging states
  const [foodLogs, setFoodLogs] = useState<Record<string, FoodItem[]>>(() => {
    try {
      const saved = localStorage.getItem('diet_logs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [favorites, setFavorites] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem('diet_favorites');
      return saved ? JSON.parse(saved) : [
        { id: 'fav-1', name: 'Eggs (2 large)', protein: 12, carbs: 1, fats: 10, fiber: 0, calories: 140 },
        { id: 'fav-2', name: 'Oatmeal with Banana', protein: 8, carbs: 54, fats: 5, fiber: 8, calories: 290 },
        { id: 'fav-3', name: 'Chicken Breast (150g)', protein: 46, carbs: 0, fats: 4, fiber: 0, calories: 220 },
        { id: 'fav-4', name: 'Whey Protein Shake', protein: 25, carbs: 3, fats: 2, fiber: 1, calories: 130 },
      ];
    } catch {
      return [];
    }
  });

  const [isDietModalOpen, setIsDietModalOpen] = useState(false);

  useEffect(() => {
    if (showDietModalDirectly) {
      setIsDietModalOpen(true);
    }
  }, [showDietModalDirectly]);

  const closeDietModal = () => {
    setIsDietModalOpen(false);
    if (onCloseDietModalDirectly) {
      onCloseDietModalDirectly();
    }
  };

  // Save food functions
  const logFoodItem = (food: Omit<FoodItem, 'id'>) => {
    const newEntry: FoodItem = {
      ...food,
      id: `log-${Date.now()}`
    };
    const nextLogs = {
      ...foodLogs,
      [dateToday]: [...(foodLogs[dateToday] || []), newEntry]
    };
    setFoodLogs(nextLogs);
    localStorage.setItem('diet_logs', JSON.stringify(nextLogs));
  };

  const deleteLoggedFood = (idx: number) => {
    const dayLogs = [...(foodLogs[dateToday] || [])];
    dayLogs.splice(idx, 1);
    const nextLogs = {
      ...foodLogs,
      [dateToday]: dayLogs
    };
    setFoodLogs(nextLogs);
    localStorage.setItem('diet_logs', JSON.stringify(nextLogs));
  };

  const addFavorite = (food: Omit<FoodItem, 'id'>) => {
    const newFav: FoodItem = {
      ...food,
      id: `fav-${Date.now()}`
    };
    const nextFavs = [...favorites, newFav];
    setFavorites(nextFavs);
    localStorage.setItem('diet_favorites', JSON.stringify(nextFavs));
  };

  const deleteFavorite = (id: string) => {
    const nextFavs = favorites.filter(x => x.id !== id);
    setFavorites(nextFavs);
    localStorage.setItem('diet_favorites', JSON.stringify(nextFavs));
  };

  // Compute daily totals
  const todayFoods = foodLogs[dateToday] || [];
  const proteinTotal = todayFoods.reduce((acc, f) => acc + f.protein, 0);
  const carbsTotal = todayFoods.reduce((acc, f) => acc + f.carbs, 0);
  const fatsTotal = todayFoods.reduce((acc, f) => acc + f.fats, 0);
  const fiberTotal = todayFoods.reduce((acc, f) => acc + f.fiber, 0);
  const caloriesTotal = todayFoods.reduce((acc, f) => acc + f.calories, 0);

  // Targets
  const targets = {
    protein: 150,
    carbs: 200,
    fats: 70,
    fiber: 25,
    calories: 2000
  };

  // Time-aware greeting
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 12) return 'Good morning';
    if (hr >= 12 && hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // 90 Day calculations
  const savedStartDate = localStorage.getItem('journey_start_date');
  if (!savedStartDate) {
    const backdated = new Date();
    backdated.setDate(backdated.getDate() - 5);
    localStorage.setItem('journey_start_date', backdated.toISOString().split('T')[0]);
  }
  const journeyStartDateStr = localStorage.getItem('journey_start_date') || dateToday;
  const startDate = new Date(journeyStartDateStr);
  const diffTime = Math.abs(new Date(dateToday).getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const currentDayNum = Math.min(90, Math.max(1, diffDays));
  const progressPercent = Math.round((currentDayNum / 90) * 100);

  // Completed habits calculations
  const totalTodayCount = habits.length;
  const completedTodayCount = habits.filter(h => (h.history[dateToday] || 0) >= h.target).length;

  // Streak calculations
  let currentStreak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    if (dateStr === dateToday) continue; // skip today for streak calculation if not complete
    const dayHabits = habits.filter(h => h.repeat === 'Daily' || (h.history[dateStr] || 0) > 0);
    const dayDone = dayHabits.length > 0 && dayHabits.every(h => (h.history[dateStr] || 0) >= h.target);
    if (dayDone) {
      currentStreak++;
    } else if (new Date(dateStr) < new Date(dateToday)) {
      currentStreak = 0; // reset streak if past day missed
    }
  }
  // Add today to streak if completed
  const todayAllDone = habits.length > 0 && habits.every(h => (h.history[dateToday] || 0) >= h.target);
  if (todayAllDone) {
    currentStreak++;
  }

  // Filter Focus Habits (Starred and scheduled for today)
  const focusHabits = habits.filter(h => starredHabits.includes(h.id));

  // Quick Habit Logger timeframe filter
  const [timeframeFilter, setTimeframeFilter] = useState<'All' | 'Morning' | 'Evening' | 'Night'>('All');

  const getHabitTimeframe = (habit: Habit): 'Morning' | 'Evening' | 'Night' | 'Anytime' => {
    const parentRoutine = routines.find(r => r.habitIds.includes(habit.id) || habit.routineId === r.id);
    if (parentRoutine) {
      if (parentRoutine.timeBlock === 'Morning') return 'Morning';
      if (parentRoutine.timeBlock === 'Evening') return 'Evening';
      if (parentRoutine.timeBlock === 'Night') return 'Night';
    }
    if (habit.timeOfDay) {
      const tod = habit.timeOfDay.toLowerCase().trim();
      const match = tod.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (match) {
        let hour = Number(match[1]);
        if (match[3] === 'pm' && hour < 12) hour += 12;
        if (match[3] === 'am' && hour === 12) hour = 0;
        if (hour >= 4 && hour < 12) return 'Morning';
        if (hour >= 12 && hour < 18) return 'Evening';
        return 'Night';
      }
      if (tod.includes('morning')) return 'Morning';
      if (tod.includes('evening') || tod.includes('afternoon')) return 'Evening';
      if (tod.includes('night')) return 'Night';
    }
    return 'Anytime';
  };

  const quickHabits = habits.filter(h => isHabitScheduledForDate(h, dateToday));
  const filteredHabits = quickHabits.filter(h => {
    if (timeframeFilter === 'All') return true;
    const tf = getHabitTimeframe(h);
    if (tf === 'Anytime') return true;
    return tf === timeframeFilter;
  });
  const remainingCount = quickHabits.filter(h => (h.history[dateToday] || 0) < h.target).length;
  const todayDoneCount = quickHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
  const todayLoggerPct = quickHabits.length ? Math.round((todayDoneCount / quickHabits.length) * 100) : 0;
  const yesterdayScheduled = habits.filter(h => isHabitScheduledForDate(h, dateYesterday));
  const yesterdayDoneCount = yesterdayScheduled.filter(h => (h.history[dateYesterday] || 0) >= h.target).length;
  const yesterdayLoggerPct = yesterdayScheduled.length ? Math.round((yesterdayDoneCount / yesterdayScheduled.length) * 100) : 0;
  const aheadDelta = todayLoggerPct - yesterdayLoggerPct;
  const routineSpotlight = routines
    .map((routine) => {
      const routineHabits = getRoutineHabits(routine, habits, dateToday);
      const done = routineHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
      const total = routineHabits.length;
      return { routine, done, total, pct: total ? Math.round((done / total) * 100) : 0 };
    })
    .filter(item => item.total > 0 && item.done < item.total)
    .sort((a, b) => b.total - a.total)[0];

  return (
    <div className="space-y-4 max-w-2xl mx-auto font-sans pb-10 px-4 pt-5">
      {/* â”€â”€ HEADER SECTION â”€â”€ */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{getGreeting()}, Charan</p>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">Let's win today.</h1>
        </div>
        <button className="w-11 h-11 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 relative cursor-pointer active:scale-95 transition-all shadow-sm">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>
      </div>

      {/* â”€â”€ 90-DAY LOCK-IN MISSION CARD â”€â”€ */}
      <div className="bg-[#1A1D2E] p-5 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full uppercase border border-emerald-500/20">
              90-Day Lock-In Mission
            </span>
            <div className="text-3xl font-black text-white">
              Day {currentDayNum} <span className="text-gray-500 text-xl font-medium">/ 90</span>
            </div>
            <p className="text-sm text-gray-400">You're building the life you always wanted.</p>
            {/* Dot tracker */}
            <div className="flex items-center gap-1.5 pt-1">
              {Array.from({ length: 8 }).map((_, idx) => {
                const isActive = idx < (currentDayNum % 8 || 8);
                return (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive ? 'w-6 bg-emerald-400' : 'w-2 bg-white/10'
                    }`}
                  />
                );
              })}
            </div>
          </div>
          {/* Circle progress */}
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="transparent" />
              <circle
                cx="50" cy="50" r="42"
                stroke="#10B981"
                strokeWidth="9"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-base font-black text-white">{progressPercent}%</span>
              <div className="text-[8px] font-mono text-gray-400 uppercase tracking-tighter">Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ THREE STATS CARDS â”€â”€ */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-400" />
          </div>
          <span className="text-xl font-black text-gray-900 mt-1">{currentStreak}</span>
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">DAY STREAK</span>
          <span className="text-[9px] text-emerald-500 font-semibold">Keep it up!</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-xl font-black text-gray-900 mt-1">{completedTodayCount}</span>
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">TODAY'S SCORE</span>
          <span className="text-[9px] text-emerald-500 font-semibold">Great progress!</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-1 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-500 fill-blue-400" />
          </div>
          <span className="text-xl font-black text-gray-900 mt-1">+{userPoints}</span>
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">MISSION PTS</span>
          <span className="text-[9px] text-blue-500 font-semibold">Keep going!</span>
        </div>
      </div>

      {/* â”€â”€ TODAY'S FOCUS SECTION â”€â”€ */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          Today's Focus
        </h3>
        {focusHabits.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-xs">
            No focus habits set. Star habits on the <span className="font-semibold text-gray-600">Today</span> page to pin them here.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {focusHabits.map((habit) => {
              const currentVal = habit.history[dateToday] || 0;
              const isCompleted = currentVal >= habit.target;
              return (
                <div key={habit.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleStarHabit(habit.id)} className="text-amber-400 cursor-pointer hover:text-gray-400 transition">
                      <Star className="w-4 h-4 fill-amber-400" />
                    </button>
                    <div>
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        {habit.name}
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                          style={{ backgroundColor: `${getCategoryColor(habit.category)}18`, color: getCategoryColor(habit.category) }}>
                          {habit.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{currentVal} / {habit.target} {habit.unit}</div>
                    </div>
                  </div>
                  <button
                    disabled={isCompleted}
                    onClick={() => onLogHabit(habit.id, habit.type === 'Timer' ? 5 : 1)}
                    className={`h-8 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isCompleted ? 'Done' : habit.type === 'Timer' ? '+5m' : '+1'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* â”€â”€ DIET LOGGER â”€â”€ */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-500" />
            DIET
          </h3>
          <button
            onClick={() => setIsDietModalOpen(true)}
            className="text-xs text-emerald-500 hover:text-emerald-700 font-bold transition cursor-pointer"
          >
            Log Food &gt;
          </button>
        </div>

        {/* Nutritional values */}
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: 'PROTEIN', current: proteinTotal, target: targets.protein, unit: 'g' },
            { label: 'CARBS', current: carbsTotal, target: targets.carbs, unit: 'g' },
            { label: 'FATS', current: fatsTotal, target: targets.fats, unit: 'g' },
            { label: 'FIBER', current: fiberTotal, target: targets.fiber, unit: 'g' },
            { label: 'CALORIES', current: caloriesTotal, target: targets.calories, unit: 'kcal' },
          ].map((macro) => (
            <div key={macro.label} className="flex flex-col items-center">
              <span className="text-[7px] font-bold text-gray-400 tracking-wider uppercase">{macro.label}</span>
              <span className="text-sm font-black text-gray-900 mt-1">{macro.current}<span className="text-xs font-medium text-gray-400">{macro.unit}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK HABIT LOGGER (DAILY DISCIPLINES) ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">Daily Disciplines</h3>
              <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                {filteredHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length} of {filteredHabits.length} completed
              </p>
            </div>
          </div>

          {/* Timeframe Filter Pills */}
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            {(['All', 'Morning', 'Evening', 'Night'] as const).map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframeFilter(tf)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                  timeframeFilter === tf
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Habit List */}
        {filteredHabits.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400 font-medium">
            No habits active in this block today.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredHabits.map((habit) => {
              const currentVal = habit.history[dateToday] || 0;
              const isCompleted = currentVal >= habit.target;
              const isStarred = starredHabits.includes(habit.id);
              const color = getCategoryColor(habit.category);
              const tint = getCategoryTint(habit.category);

              return (
                <div
                  key={habit.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-gray-50/60 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Left Circle Checkmark Target */}
                  <button
                    type="button"
                    onClick={() => onLogHabit(habit.id, isCompleted ? 0 : habit.target)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer active:scale-90 ${
                      isCompleted
                        ? 'bg-[#10B981] text-white shadow-sm'
                        : 'border-2 border-gray-300 hover:border-emerald-500 bg-white'
                    }`}
                    aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {isCompleted && <Check className="w-4 h-4 stroke-[3px]" />}
                  </button>

                  {/* Habit Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-black truncate ${
                          isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {habit.name}
                      </h4>
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                        style={{ backgroundColor: tint, color }}
                      >
                        {habit.category}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                      {currentVal} / {habit.target} {habit.unit}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleStarHabit(habit.id)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        isStarred ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'
                      }`}
                      title="Pin to focus"
                    >
                      <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
                    </button>

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

      {/* PILLAR OVERVIEW */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-400" />
          Pillar Overview
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {PILLARS.map((cat) => {
            const catHabits = habits.filter(h => h.category === cat);
            const total = catHabits.length;
            const completed = catHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const color = getCategoryColor(cat);
            const Icon = getCategoryIcon(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { setSelectedCategoryId(cat); setTab('habits'); }}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center flex flex-col items-center gap-1 transition hover:border-gray-200 active:scale-95 cursor-pointer"
              >
                <span className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: getCategoryTint(cat) }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </span>
                <div className="text-[9px] font-bold text-gray-700 truncate w-full">{cat}</div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <span className="text-[9px] font-mono text-gray-500">{completed}/{total}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* â”€â”€ DIET LOGGER MODAL â”€â”€ */}
      <AnimatePresence>
        {isDietModalOpen && (
          <DietModal
            onClose={closeDietModal}
            favorites={favorites}
            todayFoods={todayFoods}
            onLogCustom={logFoodItem}
            onAddFavorite={addFavorite}
            onDeleteFavorite={deleteFavorite}
            onLogFavorite={logFoodItem}
            onDeleteLoggedFood={deleteLoggedFood}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Diet modal component
interface DietModalProps {
  onClose: () => void;
  favorites: FoodItem[];
  todayFoods: FoodItem[];
  onLogCustom: (food: Omit<FoodItem, 'id'>) => void;
  onAddFavorite: (food: Omit<FoodItem, 'id'>) => void;
  onDeleteFavorite: (id: string) => void;
  onLogFavorite: (food: FoodItem) => void;
  onDeleteLoggedFood: (idx: number) => void;
}

function DietModal({
  onClose,
  favorites,
  todayFoods,
  onLogCustom,
  onAddFavorite,
  onDeleteFavorite,
  onLogFavorite,
  onDeleteLoggedFood
}: DietModalProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'custom'>('favorites');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom entry form states
  const [customName, setCustomName] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFats, setCustomFats] = useState('');
  const [customFiber, setCustomFiber] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [saveToFav, setSaveToFav] = useState(false);

  // Estimate calories function (4-4-9 formula: protein*4 + carbs*4 + fats*9)
  const estimateCalories = () => {
    const p = Number(customProtein) || 0;
    const c = Number(customCarbs) || 0;
    const f = Number(customFats) || 0;
    const est = p * 4 + c * 4 + f * 9;
    setCustomCalories(String(est));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const payload = {
      name: customName,
      protein: Number(customProtein) || 0,
      carbs: Number(customCarbs) || 0,
      fats: Number(customFats) || 0,
      fiber: Number(customFiber) || 0,
      calories: Number(customCalories) || 0
    };

    onLogCustom(payload);
    if (saveToFav) {
      onAddFavorite(payload);
    }

    // Reset fields
    setCustomName('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFats('');
    setCustomFiber('');
    setCustomCalories('');
    setSaveToFav(false);
    onClose();
  };

  const filteredFavorites = favorites.filter(fav =>
    fav.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/85 backdrop-blur-sm md:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full h-[90vh] md:h-auto md:max-w-lg bg-[#0C0E14] border-0 md:border border-[#232734] rounded-t-2xl md:rounded-2xl shadow-2xl p-4 md:p-5 flex flex-col overflow-hidden text-left font-sans text-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1E29] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Log Food Item</h3>
              <p className="text-[10px] text-gray-400">Slam your targets with easy tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800/40 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#14161F] border border-[#232734]/80 p-1 rounded-xl my-4 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'favorites' ? 'bg-[#212431] text-emerald-400 shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            â­ FAVORITES & QUICK LOG
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'custom' ? 'bg-[#212431] text-emerald-400 shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            ðŸ“ CUSTOM ENTRY
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[50dvh] md:max-h-[60dvh]">
          {activeTab === 'favorites' ? (
            <div className="space-y-4">
              {/* Search & Add bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search favorites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-[#14161F] border border-[#232734] px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/60"
                />
                <button
                  onClick={() => setActiveTab('custom')}
                  className="h-[34px] px-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Favorite</span>
                </button>
              </div>

              {/* Favorites list */}
              {filteredFavorites.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs">
                  No favorites match. Create one under "Custom Entry"!
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFavorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="bg-[#14161F]/60 border border-[#232734]/50 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          â­ {fav.name}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#339AF0]">P: {fav.protein}g</span> &bull;
                          <span className="text-amber-500">C: {fav.carbs}g</span> &bull;
                          <span className="text-rose-500">F: {fav.fats}g</span> &bull;
                          <span className="text-cyan-500">Fi: {fav.fiber}g</span> &bull;
                          <span className="text-white font-semibold font-mono">{fav.calories} KCAL</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onDeleteFavorite(fav.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex items-center justify-center cursor-pointer transition active:scale-95"
                          title="Delete favorite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            onLogFavorite(fav);
                            onClose();
                          }}
                          className="h-8 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg text-[10px] uppercase transition cursor-pointer active:scale-95"
                        >
                          + LOG
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Logged today list */}
              {todayFoods.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#232734]/40">
                  <h4 className="text-xs font-bold text-gray-400 mb-2">LOGGED TODAY</h4>
                  <div className="space-y-2">
                    {todayFoods.map((log, idx) => (
                      <div key={log.id} className="bg-gray-800/10 border border-[#232734]/30 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div className="truncate pr-2">
                          <div className="font-bold text-white truncate">{log.name}</div>
                          <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                            P: {log.protein}g | C: {log.carbs}g | F: {log.fats}g | Fi: {log.fiber}g &bull; {log.calories} kcal
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteLoggedFood(idx)}
                          className="w-7 h-7 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              {/* Food Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Food Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eggs and Avocado Toast"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#14161F] border border-[#232734] px-3.5 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Macronutrient inputs */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    className="w-full bg-[#14161F] border border-[#232734] px-3.5 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    className="w-full bg-[#14161F] border border-[#232734] px-3.5 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Fats (g)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={customFats}
                    onChange={(e) => setCustomFats(e.target.value)}
                    className="w-full bg-[#14161F] border border-[#232734] px-3.5 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Fiber (g)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={customFiber}
                    onChange={(e) => setCustomFiber(e.target.value)}
                    className="w-full bg-[#14161F] border border-[#232734] px-3.5 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>

              {/* Calories with auto estimation */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Calories (kcal)</label>
                  <button
                    type="button"
                    onClick={estimateCalories}
                    className="text-[9px] font-bold text-emerald-450 hover:text-emerald-300 font-mono tracking-wider cursor-pointer"
                  >
                    ESTIMATE (4-4-9)
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(e.target.value)}
                  className="w-full bg-[#14161F] border border-[#232734] px-3.5 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Checkbox Save */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="save-fav"
                  type="checkbox"
                  checked={saveToFav}
                  onChange={(e) => setSaveToFav(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer border-[#232734]"
                />
                <label htmlFor="save-fav" className="text-xs text-gray-400 select-none cursor-pointer">
                  Save this food to my personal favorites
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#12B886] hover:bg-[#0ca678] text-white font-extrabold rounded-xl text-sm shadow-[0_4px_14px_rgba(18,184,134,0.3)] transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>Log Custom Food Item</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

