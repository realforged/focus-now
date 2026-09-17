import React, { useState, useEffect } from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleCheck,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Dumbbell,
  Edit3,
  Flame,
  Heart,
  ListChecks,
  Moon,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
  UtensilsCrossed,
  X,
  Zap
} from 'lucide-react';
import { Habit, Category, Routine, DailyJournalEntry, DietTargets } from '../types';
import { dateToday, dateYesterday, getRoutineHabits, isHabitScheduledForDate } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import SubHabitsDrawer from './SubHabitsDrawer';
import JournalModal from './JournalModal';
import PillarGoalsModal from './PillarGoalsModal';
import DietTargetsModal from './DietTargetsModal';

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
  onEditHabit?: (habit: Habit) => void;
  onCreateHabitInRoutine?: (routineId: string, name: string, category: Category) => Promise<void>;
  showDietModalDirectly?: boolean;
  onCloseDietModalDirectly?: () => void;
  showJournalModalDirectly?: boolean;
  onCloseJournalModalDirectly?: () => void;
  showGoalsModalDirectly?: boolean;
  onCloseGoalsModalDirectly?: () => void;
  showTargetsModalDirectly?: boolean;
  onCloseTargetsModalDirectly?: () => void;
  onResetMission?: () => void;
  onAddSubHabit?: (habitId: string, title: string) => Promise<void>;
  onToggleSubHabit?: (habitId: string, subHabitId: string, dateStr: string) => Promise<void>;
  onDeleteSubHabit?: (habitId: string, subHabitId: string) => Promise<void>;
  openCreateHabit?: () => void;
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
  onDeleteHabit,
  onEditHabit,
  showDietModalDirectly = false,
  onCloseDietModalDirectly,
  showJournalModalDirectly = false,
  onCloseJournalModalDirectly,
  showGoalsModalDirectly = false,
  onCloseGoalsModalDirectly,
  showTargetsModalDirectly = false,
  onCloseTargetsModalDirectly,
  onResetMission,
  onAddSubHabit,
  onToggleSubHabit,
  onDeleteSubHabit,
  openCreateHabit,
}: DashboardProps) {
  // Expanded habits for sub-habits drawer
  const [expandedHabitIds, setExpandedHabitIds] = useState<string[]>([]);
  const toggleExpandHabit = (id: string) => {
    setExpandedHabitIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };


  // Starred habits list for Today Focus
  const [starredHabits, setStarredHabits] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('starred_habits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Action menu for Edit / Delete
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  // Configurable Diet Targets
  const [dietTargets, setDietTargets] = useState<DietTargets>(() => {
    try {
      const saved = localStorage.getItem('diet_targets');
      return saved ? JSON.parse(saved) : { protein: 160, calories: 2000, carbs: 220, fats: 70, fiber: 25 };
    } catch {
      return { protein: 160, calories: 2000, carbs: 220, fats: 70, fiber: 25 };
    }
  });

  // Daily Journal Entry for today
  const [todayJournal, setTodayJournal] = useState<DailyJournalEntry | null>(() => {
    try {
      const logs = JSON.parse(localStorage.getItem('journal_logs') || '{}');
      return logs[dateToday] || null;
    } catch {
      return null;
    }
  });

  // 90-Day Pillar Goals
  const [pillarGoals, setPillarGoals] = useState<Record<Category, string>>(() => {
    try {
      const saved = localStorage.getItem('pillar_goals');
      return saved ? JSON.parse(saved) : {
        Fitness: '100kg bench press, 5km in under 22 mins, lean 12% body fat',
        Diet: 'Hit 160g protein daily, drink 3.5L water, zero processed sugar',
        Career: 'Execute 4 hours deep work daily, launch transformation MVP',
        Recovery: '8 hours sleep every night, daily 15m mobility and foam rolling',
        Mind: 'Read 10 pages daily, morning meditation, daily gratitude reflection',
      };
    } catch {
      return {
        Fitness: '',
        Diet: '',
        Career: '',
        Recovery: '',
        Mind: '',
      };
    }
  });

  // Modal visibility states
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);

  // Direct modal trigger effects from navigation
  useEffect(() => {
    if (showDietModalDirectly) setIsDietModalOpen(true);
  }, [showDietModalDirectly]);

  useEffect(() => {
    if (showJournalModalDirectly) setIsJournalModalOpen(true);
  }, [showJournalModalDirectly]);

  useEffect(() => {
    if (showGoalsModalDirectly) setIsGoalsModalOpen(true);
  }, [showGoalsModalDirectly]);

  useEffect(() => {
    if (showTargetsModalDirectly) setIsTargetsModalOpen(true);
  }, [showTargetsModalDirectly]);

  const closeDietModal = () => {
    setIsDietModalOpen(false);
    if (onCloseDietModalDirectly) onCloseDietModalDirectly();
  };

  const closeJournalModal = () => {
    setIsJournalModalOpen(false);
    if (onCloseJournalModalDirectly) onCloseJournalModalDirectly();
  };

  const closeGoalsModal = () => {
    setIsGoalsModalOpen(false);
    if (onCloseGoalsModalDirectly) onCloseGoalsModalDirectly();
  };

  const closeTargetsModal = () => {
    setIsTargetsModalOpen(false);
    if (onCloseTargetsModalDirectly) onCloseTargetsModalDirectly();
  };



  // Save handlers
  const handleSaveDietTargets = (nextTargets: DietTargets) => {
    setDietTargets(nextTargets);
    localStorage.setItem('diet_targets', JSON.stringify(nextTargets));
  };

  const handleSaveJournal = (entry: DailyJournalEntry) => {
    try {
      const logs = JSON.parse(localStorage.getItem('journal_logs') || '{}');
      logs[dateToday] = entry;
      localStorage.setItem('journal_logs', JSON.stringify(logs));
      setTodayJournal(entry);
    } catch (e) {
      console.error('Error saving journal:', e);
    }
  };

  const handleSavePillarGoals = (nextGoals: Record<Category, string>) => {
    setPillarGoals(nextGoals);
    localStorage.setItem('pillar_goals', JSON.stringify(nextGoals));
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

  // Targets alias pointing to state
  const targets = dietTargets;

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
    localStorage.setItem('journey_start_date', dateToday);
  }
  const journeyStartDateStr = localStorage.getItem('journey_start_date') || dateToday;
  const startDate = new Date(journeyStartDateStr);
  const diffTime = Math.max(0, new Date(dateToday).getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const currentDayNum = Math.min(90, Math.max(1, diffDays));

  // Completed habits calculations
  const totalTodayCount = habits.length;
  const completedTodayCount = habits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
  const progressPercent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

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

  // Momentum view mode: 'rolling' (trailing 7 days) vs 'week' (Mon-Sun calendar week)
  const [momentumView, setMomentumView] = useState<'rolling' | 'week'>('rolling');

  // Trailing Rolling 7 Days (past 6 days + Today)
  const past7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const str = d.toISOString().split('T')[0];
    const dayLabel = idx === 6 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const isToday = str === dateToday;
    const dayHabits = habits.filter(h => isHabitScheduledForDate(h, str));
    const isDone = dayHabits.length > 0 && dayHabits.every(h => (h.history[str] || 0) >= h.target);
    return { str, dayLabel, isToday, isDone, isFuture: false };
  });

  // Fixed Mon-Sun Calendar Week
  const thisWeekDays = (() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: Sun, 1: Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const str = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      const isToday = str === dateToday;
      const isFuture = str > dateToday;
      const dayHabits = habits.filter(h => isHabitScheduledForDate(h, str));
      const isDone = !isFuture && dayHabits.length > 0 && dayHabits.every(h => (h.history[str] || 0) >= h.target);
      return { str, dayLabel, isToday, isDone, isFuture };
    });
  })();

  const activeMomentumDays = momentumView === 'rolling' ? past7Days : thisWeekDays;

  // Filter Focus Habits (Starred and scheduled for today)
  const focusHabits = habits.filter(h => starredHabits.includes(h.id) && isHabitScheduledForDate(h, dateToday));

  // THREE TIMELINES: Morning 5am-12pm | Afternoon 12pm-6pm | Night 6pm-5am
  const TIME_LABELS = {
    Morning:   { emoji: '🌅', label: 'Morning',   range: '5am–12pm' },
    Afternoon: { emoji: '☀️', label: 'Afternoon', range: '12pm–6pm' },
    Night:     { emoji: '🌙', label: 'Night',      range: '6pm–5am' },
  } as const;

  const [timeframeFilter, setTimeframeFilter] = useState<'All' | 'Morning' | 'Afternoon' | 'Night'>(() => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return 'Morning';
    if (hr >= 12 && hr < 18) return 'Afternoon';
    return 'Night';
  });

  // Maps any habit to one of our 3 display timelines
  const getHabitTimeframe = (habit: Habit): 'Morning' | 'Afternoon' | 'Night' | 'Anytime' => {
    const parentRoutine = routines.find(r => r.habitIds.includes(habit.id) || habit.routineId === r.id);
    if (parentRoutine) {
      if (parentRoutine.timeBlock === 'Morning')  return 'Morning';
      if (parentRoutine.timeBlock === 'Evening')  return 'Afternoon'; // stored as Evening = daytime
      if (parentRoutine.timeBlock === 'Night')    return 'Night';
      if (parentRoutine.timeBlock === 'Constant') return 'Anytime';
    }
    if (habit.timeOfDay) {
      const tod = habit.timeOfDay.toLowerCase().trim();
      if (tod === 'anytime' || tod === 'constant' || tod === 'none') return 'Anytime';
      const match = tod.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (match) {
        let hour = Number(match[1]);
        if (match[3] === 'pm' && hour < 12) hour += 12;
        if (match[3] === 'am' && hour === 12) hour = 0;
        if (hour >= 5 && hour < 12) return 'Morning';
        if (hour >= 12 && hour < 18) return 'Afternoon';
        return 'Night';
      }
      if (tod.includes('morning'))                              return 'Morning';
      if (tod.includes('afternoon') || tod.includes('noon'))   return 'Afternoon';
      if (tod.includes('evening') || tod.includes('night'))    return 'Night';
    }
    return 'Anytime';
  };

  const filteredHabits = habits.filter(habit => {
    if (!isHabitScheduledForDate(habit, dateToday)) return false;
    if (selectedCategoryId && habit.category !== selectedCategoryId) return false;
    if (timeframeFilter === 'All') return true;
    const tf = getHabitTimeframe(habit);
    return tf === timeframeFilter || (timeframeFilter === 'All');
  });

  // Calculate routine completions
  const routineCompletions = routines.map(rt => {
    const routineHabits = habits.filter(h => rt.habitIds.includes(h.id));
    const doneCount = routineHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
    const isCompleted = routineHabits.length > 0 && doneCount === routineHabits.length;
    return { ...rt, doneCount, totalCount: routineHabits.length, isCompleted };
  });

  // Best next action
  const nextFocusRoutine = routines
    .map(routine => {
      const routineHabits = habits.filter(h => routine.habitIds.includes(h.id));
      const done = routineHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
      const total = routineHabits.length;
      return { routine, done, total, pct: total ? Math.round((done / total) * 100) : 0 };
    })
  // Connect Diet Protein Goal to Diet Pillar Goal
  const isProteinGoalMet = dietTargets.protein > 0 && proteinTotal >= dietTargets.protein;

  // Goal completion calculations based on linked habits & protein target
  const goalStats = PILLARS.map((cat) => {
    const catHabits = habits.filter(h => h.category === cat && isHabitScheduledForDate(h, dateToday));
    const total = catHabits.length;
    const completed = catHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length;
    let pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    let isWon = total > 0 && completed === total;

    // Connect diet protein goal to Diet pillar goal!
    if (cat === 'Diet') {
      if (isProteinGoalMet) {
        isWon = true;
        pct = 100;
      } else if (dietTargets.protein > 0) {
        const proteinPct = Math.min(100, Math.round((proteinTotal / dietTargets.protein) * 100));
        pct = total > 0 ? Math.max(pct, proteinPct) : proteinPct;
      }
    }

    const effectiveTotal = cat === 'Diet' && total === 0 ? 1 : total;
    const effectiveCompleted = cat === 'Diet' && isProteinGoalMet ? effectiveTotal : completed;

    return {
      cat,
      goal: pillarGoals[cat] || '',
      habits: catHabits,
      total: effectiveTotal,
      completed: effectiveCompleted,
      pct,
      isWon,
    };
  });

  const totalGoalsWithHabits = goalStats.filter(g => g.total > 0).length;
  const wonGoalsToday = goalStats.filter(g => g.isWon).length;
  const dailyGoalsProgress = totalGoalsWithHabits > 0 ? Math.round((wonGoalsToday / totalGoalsWithHabits) * 100) : 0;

  // Track which pillars have their habits expanded (all habits closed by default, goals always visible)
  const [expandedPillarHabits, setExpandedPillarHabits] = useState<Category[]>([]);
  // Toggle to review goals that are already won today
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);

  const togglePillarHabits = (cat: Category) => {
    setExpandedPillarHabits(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handlePillarClick = (cat: Category) => {
    const isWon = goalStats.find(g => g.cat === cat)?.isWon;
    if (isWon && !showCompletedGoals) {
      setShowCompletedGoals(true);
    }
    togglePillarHabits(cat);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto font-sans pb-10 px-4 pt-5">
      {/* ── HEADER SECTION ── */}
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

      {/* ── 90-DAY LOCK-IN MISSION CARD ── */}
      <div className="bg-[#1A1D2E] p-5 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full uppercase border border-emerald-500/20">
                90-Day Lock-In Mission
              </span>
              {onResetMission && (
                <button
                  type="button"
                  onClick={onResetMission}
                  title="Reset 90-Day Mission to Day 1"
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full border border-white/15 transition cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Day 1</span>
                </button>
              )}
            </div>
            <div className="text-3xl font-black text-white">
              Day {currentDayNum} <span className="text-gray-500 text-xl font-medium">/ 90</span>
            </div>
            <p className="text-xs text-gray-400">
              {completedTodayCount} of {totalTodayCount} daily habits completed today
            </p>
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
          {/* Circle progress based directly on habit completion */}
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
              <div className="text-[8px] font-mono text-gray-400 uppercase tracking-tighter">Done Today</div>
            </div>
          </div>
        </div>

        {/* ── 7-DAY MOMENTUM CHAIN STRIP ── */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mb-2">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">Momentum</span>
              <div className="flex bg-white/10 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMomentumView('rolling')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                    momentumView === 'rolling'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Show rolling trailing 7 days (unbroken streak)"
                >
                  Last 7D
                </button>
                <button
                  type="button"
                  onClick={() => setMomentumView('week')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                    momentumView === 'week'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Show current calendar week (Mon-Sun)"
                >
                  This Week
                </button>
              </div>
            </div>
            <span className="text-emerald-400 font-bold flex items-center gap-1">🔥 {currentStreak} Day Streak</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {activeMomentumDays.map(day => (
              <div
                key={day.str}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border transition-all ${
                  day.isToday
                    ? 'bg-emerald-500/20 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                    : day.isDone
                    ? 'bg-emerald-500/10 border-emerald-500/25'
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <span className={`text-[10px] font-mono uppercase ${day.isToday ? 'text-emerald-300 font-black' : day.isFuture ? 'text-gray-600' : 'text-gray-400'}`}>
                  {day.dayLabel}
                </span>
                <div className="mt-1 flex items-center justify-center">
                  {day.isDone ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs ring-2 ring-emerald-400/20" />
                  ) : day.isToday ? (
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400/80 animate-pulse" />
                  ) : day.isFuture ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-white/15" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MOTIVATIONAL FUEL BANNER ── */}
      {totalTodayCount > 0 && completedTodayCount === totalTodayCount ? (
        <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-xs font-black text-emerald-800 uppercase tracking-wider">Day {currentDayNum} Cleared!</p>
              <p className="text-[11px] text-emerald-700 font-medium">100% disciplines executed today. Unstoppable momentum.</p>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300">
            LOCKED IN
          </span>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
            <span className="text-base">⚡</span>
            <span>
              <strong className="text-gray-900 font-bold">{Math.max(0, totalTodayCount - completedTodayCount)} habits</strong> remaining to win Day {currentDayNum}. Stay locked in.
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            {progressPercent}% Done
          </span>
        </div>
      )}

      {/* ── 90-DAY PILLAR COMMAND HUD (CLOSED BY DEFAULT, ONLY EXPANDS ON CLICK) ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Header & Goal Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-gray-900 leading-tight">5-Pillar Command HUD</h3>
                {wonGoalsToday === totalGoalsWithHabits && totalGoalsWithHabits > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    ALL WON
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-medium">90-Day Vision & Daily Goal Execution</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              🎯 {wonGoalsToday}/{totalGoalsWithHabits} Won
            </span>
            <button
              type="button"
              onClick={() => setIsGoalsModalOpen(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 transition cursor-pointer active:scale-95"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Goals</span>
            </button>
          </div>
        </div>

        {/* 5 Pillar Quick Buttons Row */}
        <div className="grid grid-cols-5 gap-1.5">
          {goalStats.map(({ cat, total, completed, pct, isWon }) => {
            const color = getCategoryColor(cat);
            const Icon = getCategoryIcon(cat);
            const isExpanded = expandedPillarHabits.includes(cat);

            return (
              <button
                key={cat}
                type="button"
                onClick={() => handlePillarClick(cat)}
                className={`border rounded-xl p-2 text-center flex flex-col items-center gap-1 transition active:scale-95 cursor-pointer relative ${
                  isExpanded
                    ? 'bg-purple-50 border-purple-400 shadow-xs ring-2 ring-purple-300'
                    : isWon
                    ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                    : 'bg-gray-50/70 border-gray-100 hover:border-gray-300'
                }`}
                title={`Click to ${isExpanded ? 'collapse' : 'expand'} ${cat} habits`}
              >
                {isWon && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-xs">
                    ✓
                  </span>
                )}
                <span className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: getCategoryTint(cat) }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </span>
                <div className="text-[9px] font-bold text-gray-800 truncate w-full">{cat}</div>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: isWon ? '#10B981' : color }} />
                </div>
                <span className={`text-[9px] font-mono font-bold ${isWon ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {completed}/{total}
                </span>
              </button>
            );
          })}
        </div>

        {/* 5 Pillar Goal Cards: Active Pending Goals displayed; Won Goals removed to completed review */}
        {(() => {
          const pendingGoals = goalStats.filter(g => !g.isWon);
          const wonGoals = goalStats.filter(g => g.isWon);

          const renderPillarCard = ({ cat, goal, habits: catHabits, total, completed, pct, isWon }: typeof goalStats[0]) => {
            const color = getCategoryColor(cat);
            const tint = getCategoryTint(cat);
            const Icon = getCategoryIcon(cat);
            const isExpanded = expandedPillarHabits.includes(cat);

            return (
              <div
                key={cat}
                className={`rounded-2xl border transition-all ${
                  isWon
                    ? 'bg-emerald-50/25 border-emerald-200/80'
                    : isExpanded
                    ? 'bg-purple-50/20 border-purple-200 shadow-xs'
                    : 'bg-gray-50/50 border-gray-200/80 hover:border-gray-300'
                }`}
              >
                {/* Pillar Header & Goal (ALWAYS VISIBLE) */}
                <div
                  onClick={() => togglePillarHabits(cat)}
                  className="p-3 flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span
                      className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: tint }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </span>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase"
                          style={{ backgroundColor: tint, color }}
                        >
                          {cat}
                        </span>
                        {isWon ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" /> Goal Won Today
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 font-mono">
                            {completed}/{total} habits done ({pct}%)
                          </span>
                        )}
                      </div>
                      {/* GOAL STATEMENT - ALWAYS VISIBLE */}
                      <p className={`text-xs font-black leading-snug ${isWon ? 'text-emerald-950 font-bold' : 'text-gray-900'}`}>
                        {goal || `${cat} 90-Day Goal`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5 text-gray-400 hover:text-gray-700">
                    <span className="text-[10px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded-md border border-gray-200">
                      {catHabits.length} {catHabits.length === 1 ? 'habit' : 'habits'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Habits Section (ONLY VISIBLE WHEN OPENED / EXPANDED) */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-2.5 animate-in fade-in duration-150">
                    {/* If Diet, show connected protein target tracker */}
                    {cat === 'Diet' && dietTargets.protein > 0 && (
                      <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-emerald-950">🥩 Connected Protein Goal</span>
                            {isProteinGoalMet ? (
                              <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                ✓ Cleared!
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                {Math.max(0, dietTargets.protein - proteinTotal)}g left
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-emerald-200/60 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.round((proteinTotal / dietTargets.protein) * 100))}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-black text-emerald-900">
                              {proteinTotal}g / {dietTargets.protein}g
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDietModalOpen(true);
                          }}
                          className="h-7 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Log</span>
                        </button>
                      </div>
                    )}

                    {/* Linked Habits list */}
                    {catHabits.length === 0 ? (
                      <div className="text-center py-2.5 text-xs text-gray-500 space-y-2">
                        <p>No habits currently assigned to {cat}.</p>
                        {openCreateHabit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreateHabit();
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create habit for {cat}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Habits linked to this goal:
                        </div>
                        {catHabits.map((habit) => {
                          const currentVal = habit.history[dateToday] || 0;
                          const isDone = currentVal >= habit.target;

                          return (
                            <div
                              key={habit.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                                isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-black truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                  {habit.name}
                                </p>
                                <span className="text-[10px] font-mono text-gray-400">
                                  {currentVal} / {habit.target} {habit.unit}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLogHabit(habit.id, isDone ? 0 : habit.type === 'Timer' ? 5 : 1);
                                }}
                                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  isDone ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-900 hover:bg-gray-800 text-white'
                                }`}
                              >
                                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                                <span>{isDone ? 'Done' : habit.type === 'Timer' ? '+5m' : '+1'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          };

          return (
            <div className="space-y-2.5 pt-1">
              {/* If all goals are won, show All Won Celebration Banner */}
              {pendingGoals.length === 0 && totalGoalsWithHabits > 0 ? (
                <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="text-xs font-black text-emerald-950">All 5 Pillars Conquered Today!</p>
                      <p className="text-[11px] text-emerald-700 font-medium">100% life goals executed. Elite consistency.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCompletedGoals(!showCompletedGoals)}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    {showCompletedGoals ? 'Hide Goals' : `Review All (${wonGoals.length})`}
                  </button>
                </div>
              ) : (
                /* Active Pending Goals (Remaining to be won) */
                <div className="space-y-2">
                  {pendingGoals.map(renderPillarCard)}
                </div>
              )}

              {/* Won Goals Section: Hidden from active view, collapsible review */}
              {wonGoals.length > 0 && (
                <div className="pt-1">
                  {pendingGoals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCompletedGoals(!showCompletedGoals)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/70 flex items-center justify-between text-[11px] font-bold text-emerald-900 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black">
                          ✓
                        </span>
                        <span>{wonGoals.length} {wonGoals.length === 1 ? 'Goal' : 'Goals'} Cleared Today</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-bold">
                        <span>{showCompletedGoals ? 'Hide' : 'Review'}</span>
                        {showCompletedGoals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  )}

                  {showCompletedGoals && (
                    <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                      <div className="text-[10px] font-bold text-emerald-800/70 uppercase tracking-wider px-1">
                        Cleared Goals ({wonGoals.length}):
                      </div>
                      {wonGoals.map(renderPillarCard)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── DAILY DISCIPLINES & IMMEDIATE ACTION (FRONT & CENTER) ── */}
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

          <div className="flex items-center gap-1.5">
            {/* Active Pillar Filter Chip */}
            {selectedCategoryId && (
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className="flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-200 transition cursor-pointer"
                title="Clear pillar filter"
              >
                <span>{selectedCategoryId}</span>
                <X className="w-2.5 h-2.5" />
              </button>
            )}

            {/* Timeframe Filter Pills — 3 Timelines */}
            <div className="flex bg-gray-100 p-1 rounded-xl gap-0.5">
              {([
                { id: 'All',       emoji: '⚡', label: 'All' },
                { id: 'Morning',   emoji: '🌅', label: 'Morning' },
                { id: 'Afternoon', emoji: '☀️', label: 'Afternoon' },
                { id: 'Night',     emoji: '🌙', label: 'Night' },
              ] as const).map(tf => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeframeFilter(tf.id)}
                  className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                    timeframeFilter === tf.id
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>{tf.emoji}</span>
                  <span>{tf.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Focus Section (if starred habits exist) */}
        {focusHabits.length > 0 && timeframeFilter === 'All' && !selectedCategoryId && (
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Priority Focus ({focusHabits.filter(h => (h.history[dateToday] || 0) >= h.target).length}/{focusHabits.length})
              </span>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                ⭐ Starred
              </span>
            </div>
            <div className="space-y-1.5">
              {focusHabits.map((habit) => {
                const currentVal = habit.history[dateToday] || 0;
                const isCompleted = currentVal >= habit.target;
                const color = getCategoryColor(habit.category);
                const tint = getCategoryTint(habit.category);

                return (
                  <div
                    key={habit.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                      isCompleted ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white border-amber-200/60 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onLogHabit(habit.id, isCompleted ? 0 : habit.target)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer active:scale-90 ${
                          isCompleted
                            ? 'bg-[#10B981] text-white shadow-xs'
                            : 'border-2 border-amber-300 hover:border-emerald-500 bg-white'
                        }`}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {habit.name}
                          </span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase" style={{ backgroundColor: tint, color }}>
                            {habit.category}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">
                          {currentVal} / {habit.target} {habit.unit}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onLogHabit(habit.id, habit.type === 'Timer' ? 5 : 1)}
                      className={`h-7 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                        isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      {isCompleted ? 'Done' : habit.type === 'Timer' ? '+5m' : '+1'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
              const subHabits = habit.subHabits || [];
              const isExpanded = expandedHabitIds.includes(habit.id);
              const doneSubCount = subHabits.filter(s => Boolean(s.completedHistory?.[dateToday])).length;

              return (
                <div
                  key={habit.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-gray-50/60 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-gray-400">
                          {currentVal} / {habit.target} {habit.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleExpandHabit(habit.id)}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg transition cursor-pointer ${
                            subHabits.length > 0
                              ? isExpanded
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-200/70 hover:bg-gray-200 text-gray-700'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'
                          }`}
                        >
                          <ListChecks className="w-3 h-3" />
                          <span>{subHabits.length > 0 ? `${doneSubCount}/${subHabits.length} steps` : '+ Step'}</span>
                          {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                        </button>
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
                        title="Pin to priority focus"
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

                      {/* More Options (Edit / Delete) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === habit.id ? null : habit.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                          title="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === habit.id && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-8 z-30 w-36 bg-white border border-gray-200 rounded-2xl shadow-xl p-1 text-left space-y-0.5 animate-in fade-in zoom-in-95">
                              {onEditHabit && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onEditHabit(habit);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Edit Habit</span>
                                </button>
                              )}
                              {onDeleteHabit && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onDeleteHabit(habit.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete Habit</span>
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <SubHabitsDrawer
                      habit={habit}
                      dateStr={dateToday}
                      onToggleSubHabit={onToggleSubHabit}
                      onAddSubHabit={onAddSubHabit}
                      onDeleteSubHabit={onDeleteSubHabit}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DAILY NUTRITION & PROTEIN FUEL CARD ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 leading-tight">Daily Protein & Fuel</h3>
              <p className="text-[11px] text-gray-400 font-medium">Powering your 90-day transformation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsTargetsModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 rounded-xl border border-gray-200 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Targets</span>
          </button>
        </div>

        {/* Big Protein Progress Hero */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-emerald-50/30 border border-emerald-100 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Protein Target
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              proteinTotal >= dietTargets.protein
                ? 'bg-emerald-200/70 text-emerald-900'
                : 'bg-white/80 text-emerald-800 border border-emerald-200/60'
            }`}>
              {proteinTotal >= dietTargets.protein
                ? `✓ Goal Hit! (+${proteinTotal - dietTargets.protein}g)`
                : `${Math.max(0, dietTargets.protein - proteinTotal)}g remaining`}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-gray-900">{proteinTotal}g</span>
            <span className="text-sm font-bold text-gray-500">/ {dietTargets.protein}g target</span>
            <span className="ml-auto text-sm font-black text-emerald-700">
              {Math.round((proteinTotal / Math.max(1, dietTargets.protein)) * 100)}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-emerald-200/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.round((proteinTotal / Math.max(1, dietTargets.protein)) * 100))}%` }}
            />
          </div>
        </div>

        {/* Secondary Macro Chips */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-gray-100">
          <div className="bg-gray-50/70 rounded-xl p-2 text-center">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Calories</span>
            <span className="text-xs font-black text-gray-800">{caloriesTotal}</span>
            <span className="text-[9px] text-gray-400 block font-mono">/{dietTargets.calories}</span>
          </div>
          <div className="bg-gray-50/70 rounded-xl p-2 text-center">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Carbs</span>
            <span className="text-xs font-black text-amber-600">{carbsTotal}g</span>
            <span className="text-[9px] text-gray-400 block font-mono">/{dietTargets.carbs}g</span>
          </div>
          <div className="bg-gray-50/70 rounded-xl p-2 text-center">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Fats</span>
            <span className="text-xs font-black text-rose-600">{fatsTotal}g</span>
            <span className="text-[9px] text-gray-400 block font-mono">/{dietTargets.fats}g</span>
          </div>
          <div className="bg-gray-50/70 rounded-xl p-2 text-center">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Fiber</span>
            <span className="text-xs font-black text-cyan-600">{fiberTotal}g</span>
            <span className="text-[9px] text-gray-400 block font-mono">/{dietTargets.fiber}g</span>
          </div>
        </div>

        {/* Log Custom / View Logged Button */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsDietModalOpen(true)}
            className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Meal & Custom Foods</span>
          </button>
          {todayFoods.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDietModalOpen(true)}
              className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {todayFoods.length} logged
            </button>
          )}
        </div>
      </div>

      {/* ── THREE STATS CARDS ── */}
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



      {/* ── DAILY REFLECTION & EVENING WIN CARD ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 leading-tight">Daily Lock-In Reflection</h3>
              <p className="text-[11px] text-gray-400 font-medium">Review your mindset and celebrate today's #1 win</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsJournalModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl border border-indigo-100 transition cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>{todayJournal ? 'Edit Entry' : '+ Log Reflection'}</span>
          </button>
        </div>

        {/* Celebratory closure when all habits completed */}
        {totalTodayCount > 0 && completedTodayCount === totalTodayCount && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 flex items-center gap-3">
            <span className="text-2xl">🌟</span>
            <div className="text-xs flex-1 min-w-0">
              <span className="font-black text-emerald-900 block">Day {currentDayNum} Victorious!</span>
              <span className="text-emerald-700 font-medium">All daily disciplines complete. Lock in tonight's reflection below to cement your streak.</span>
            </div>
          </div>
        )}

        {todayJournal ? (
          <div className="bg-indigo-50/40 border border-indigo-100/70 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                <span className="text-lg">{todayJournal.mood || '🔥'}</span>
                <span>Mindset: Locked In</span>
              </span>
              <span className="text-[10px] text-indigo-500 font-medium">Logged today</span>
            </div>

            {todayJournal.win && (
              <div className="bg-white/90 border border-indigo-100 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">🏆 #1 Victory Today</p>
                <p className="text-xs font-black text-gray-900 mt-0.5">{todayJournal.win}</p>
              </div>
            )}

            {todayJournal.reflection && (
              <div className="text-xs text-gray-600 italic px-1">
                "{todayJournal.reflection}"
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4 text-center space-y-2">
            <p className="text-xs text-gray-600 font-medium">
              No reflection logged for Day {currentDayNum} yet. Taking 60 seconds to lock in today's mindset compounds massive momentum.
            </p>
            <button
              type="button"
              onClick={() => setIsJournalModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Capture Today's Reflection & Win</span>
            </button>
          </div>
        )}
      </div>

      {/* ── DIET LOGGER MODAL ── */}
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

      {/* ── DIET TARGETS MODAL ── */}
      <DietTargetsModal
        isOpen={isTargetsModalOpen}
        onClose={closeTargetsModal}
        targets={dietTargets}
        onSaveTargets={handleSaveDietTargets}
      />

      {/* ── DAILY REFLECTION JOURNAL MODAL ── */}
      <JournalModal
        isOpen={isJournalModalOpen}
        onClose={closeJournalModal}
        onSave={handleSaveJournal}
        existingEntry={todayJournal}
        dateStr={dateToday}
      />

      {/* ── 90-DAY PILLAR GOALS MODAL ── */}
      <PillarGoalsModal
        isOpen={isGoalsModalOpen}
        onClose={closeGoalsModal}
        onSaveGoals={handleSavePillarGoals}
        existingGoals={pillarGoals}
      />
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
  
  // Custom entry form states (pure protein focused)
  const [customName, setCustomName] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [saveToFav, setSaveToFav] = useState(false);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const p = Number(customProtein) || 0;
    const payload = {
      name: customName.trim(),
      protein: p,
      carbs: 0,
      fats: 0,
      fiber: 0,
      calories: p * 4,
    };

    onLogCustom(payload);
    if (saveToFav) {
      onAddFavorite(payload);
    }

    // Reset fields
    setCustomName('');
    setCustomProtein('');
    setSaveToFav(false);
    onClose();
  };

  const filteredFavorites = favorites.filter(fav =>
    fav.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-xs md:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full h-[90vh] md:h-auto md:max-w-lg bg-white border border-gray-100 rounded-t-3xl md:rounded-3xl shadow-2xl p-5 md:p-6 flex flex-col overflow-hidden text-left font-sans text-gray-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">Log Protein & Nutrition</h3>
              <p className="text-xs text-gray-400">Quickly add protein to crush your daily target</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl my-4 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'favorites' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            ⭐ FAVORITES & QUICK LOG
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'custom' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            ➕ CUSTOM PROTEIN
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
                  className="flex-1 bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
                <button
                  onClick={() => setActiveTab('custom')}
                  className="h-[34px] px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom</span>
                </button>
              </div>

              {/* Favorites list */}
              {filteredFavorites.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  No favorites match. Create one under "Custom Protein"!
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFavorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="bg-gray-50/70 border border-gray-100 rounded-2xl p-3 flex items-center justify-between hover:border-gray-200 transition"
                    >
                      <div>
                        <div className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          {fav.name}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-emerald-700">P: {fav.protein}g</span> &bull;
                          <span className="text-gray-900 font-bold font-mono">{fav.calories || fav.protein * 4} kcal</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onDeleteFavorite(fav.id)}
                          className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 flex items-center justify-center cursor-pointer transition active:scale-95"
                          title="Delete favorite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            onLogFavorite(fav);
                            onClose();
                          }}
                          className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] uppercase transition cursor-pointer active:scale-95"
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
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">LOGGED TODAY</h4>
                  <div className="space-y-2">
                    {todayFoods.map((log, idx) => (
                      <div key={log.id} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div className="truncate pr-2">
                          <div className="font-bold text-gray-900 truncate">{log.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            P: {log.protein}g &bull; {log.calories || log.protein * 4} kcal
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteLoggedFood(idx)}
                          className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 flex items-center justify-center shrink-0 cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1.5">
                  Food Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Salmon bowl, Greek Yogurt, Protein bar..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-emerald-500 transition"
                />
              </div>

              {/* Protein (g) - Clean & Focused */}
              <div>
                <label className="block text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-1.5">
                  Protein Content
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 35"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    className="w-full bg-emerald-50/50 border-2 border-emerald-300 px-4 py-3 rounded-2xl text-lg font-black text-gray-900 outline-none focus:bg-white focus:border-emerald-500 pr-16 transition"
                  />
                  <span className="absolute right-4 top-3.5 text-sm font-black text-emerald-700 pointer-events-none">
                    grams
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Adds directly to your daily protein target ({customProtein ? `${Number(customProtein) * 4} kcal estimated` : '4 kcal per gram'})
                </p>
              </div>

              {/* Checkbox Save */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="save-fav"
                  type="checkbox"
                  checked={saveToFav}
                  onChange={(e) => setSaveToFav(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer border-gray-300"
                />
                <label htmlFor="save-fav" className="text-xs text-gray-600 select-none cursor-pointer font-semibold">
                  Save to favorites for 1-tap logging in the future
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-sm shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>+ Log {customProtein ? `${customProtein}g Protein` : 'Protein'}</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

