import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Clock,
  Sparkles,
  Clipboard,
  Plus,
  Trash2,
  CheckCircle2,
  Timer,
  Hash,
  ArrowRight,
  Flame,
  ChevronRight,
  Layers,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Category, Habit, HabitType, Routine, SubHabit } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (habitData: Partial<Habit>) => void;
  onSave?: (id: string, habitData: Partial<Habit>) => void;
  onDelete?: (id: string) => void;
  habitToEdit?: Habit | null;
  routines: Routine[];
  prefilledRoutineId?: string;
}

export interface HabitPreset {
  id: string;
  name: string;
  category: Category;
  actionStyle: 'check' | 'count' | 'timer';
  target: number;
  unit: string;
  timeBlock: '' | 'Morning' | 'Evening' | 'Night';
  points: number;
  subHabits: string[];
  icon: string;
  tagline: string;
}

const HABIT_PRESETS: HabitPreset[] = [
  // 🏃 FITNESS
  {
    id: 'p-fit-workout',
    name: 'Morning Lift & Workout',
    category: 'Fitness',
    actionStyle: 'timer',
    target: 45,
    unit: 'min',
    timeBlock: 'Morning',
    points: 25,
    subHabits: ['5m Dynamic warmup & mobility', 'Heavy compound sets', 'Core & cooldown stretch'],
    icon: '🏋️',
    tagline: 'Build raw strength and metabolic burn',
  },
  {
    id: 'p-fit-pushups',
    name: '100 Daily Pushups',
    category: 'Fitness',
    actionStyle: 'count',
    target: 100,
    unit: 'reps',
    timeBlock: '',
    points: 15,
    subHabits: ['25 reps morning wake-up', '25 reps midday', '25 reps afternoon', '25 reps before bed'],
    icon: '💪',
    tagline: 'Chest and triceps calisthenics volume',
  },
  {
    id: 'p-fit-steps',
    name: '10,000 Daily Steps',
    category: 'Fitness',
    actionStyle: 'count',
    target: 10000,
    unit: 'steps',
    timeBlock: '',
    points: 15,
    subHabits: ['Morning sunlight walk (2,500)', 'Midday movement (3,500)', 'Evening post-dinner walk (4,000)'],
    icon: '👟',
    tagline: 'Non-exercise energy expenditure baseline',
  },
  {
    id: 'p-fit-mobility',
    name: '15m Mobility & Foam Rolling',
    category: 'Fitness',
    actionStyle: 'timer',
    target: 15,
    unit: 'min',
    timeBlock: 'Evening',
    points: 10,
    subHabits: ['Deep hip openers (90/90)', 'Hamstring & spine decompression', 'Diaphragmatic box breathing'],
    icon: '🧘',
    tagline: 'Joint longevity and injury prevention',
  },
  {
    id: 'p-fit-cardio',
    name: '5km Zone 2 Run',
    category: 'Fitness',
    actionStyle: 'count',
    target: 5,
    unit: 'km',
    timeBlock: 'Morning',
    points: 20,
    subHabits: ['500m warmup walk', 'Zone 2 steady pace (nasal breathing)', '5m cool down walk'],
    icon: '🏃',
    tagline: 'Aerobic base and mitochondrial health',
  },

  // 🥗 DIET
  {
    id: 'p-diet-protein',
    name: 'Hit Daily Protein Target',
    category: 'Diet',
    actionStyle: 'check',
    target: 1,
    unit: 'done',
    timeBlock: '',
    points: 20,
    subHabits: ['High-protein breakfast (35g+)', 'Post-workout fuel (40g+)', 'Lean dinner protein (45g+)'],
    icon: '🥩',
    tagline: 'Maximized muscle protein synthesis',
  },
  {
    id: 'p-diet-water',
    name: 'Drink 3.5L Pure Water',
    category: 'Diet',
    actionStyle: 'count',
    target: 7,
    unit: 'glasses',
    timeBlock: '',
    points: 10,
    subHabits: ['500ml upon waking with pinch of salt', '1L before lunch', '1L afternoon', '1L evening'],
    icon: '💧',
    tagline: 'Cellular hydration and mental sharpness',
  },
  {
    id: 'p-diet-sugar',
    name: 'Zero Processed Sugar',
    category: 'Diet',
    actionStyle: 'check',
    target: 1,
    unit: 'done',
    timeBlock: '',
    points: 15,
    subHabits: ['No soda, energy drinks, or fruit juice', 'Zero candy or refined pastries', 'Real, whole foods only'],
    icon: '🚫',
    tagline: 'Eliminate insulin spikes and brain fog',
  },
  {
    id: 'p-diet-fasting',
    name: '16:8 Intermittent Fasting',
    category: 'Diet',
    actionStyle: 'timer',
    target: 16,
    unit: 'hours',
    timeBlock: '',
    points: 15,
    subHabits: ['Fast begins 8:00 PM', 'Black coffee & water in morning', 'Break fast at 12:00 PM noon'],
    icon: '⏳',
    tagline: 'Autophagy and metabolic flexibility',
  },
  {
    id: 'p-diet-supps',
    name: 'Creatine & Electrolytes',
    category: 'Diet',
    actionStyle: 'check',
    target: 1,
    unit: 'done',
    timeBlock: 'Morning',
    points: 5,
    subHabits: ['5g Creatine monohydrate', 'Electrolyte hydration pack', 'Vitamin D3 + K2'],
    icon: '💊',
    tagline: 'ATP recycling and micronutrient support',
  },

  // 🎯 CAREER
  {
    id: 'p-car-deepwork',
    name: '4-Hour Deep Work Block',
    category: 'Career',
    actionStyle: 'timer',
    target: 240,
    unit: 'min',
    timeBlock: 'Morning',
    points: 50,
    subHabits: ['Phone in other room on airplane mode', 'Deep work Block 1 (90m)', 'Deep work Block 2 (90m)', 'Review output & clear tasks (60m)'],
    icon: '🎯',
    tagline: 'High-leverage focused execution',
  },
  {
    id: 'p-car-priority',
    name: 'Execute #1 Priority First',
    category: 'Career',
    actionStyle: 'check',
    target: 1,
    unit: 'done',
    timeBlock: 'Morning',
    points: 25,
    subHabits: ['Define single highest-ROI task', 'Work before email or notifications', 'Mark complete before 1:00 PM'],
    icon: '⚡',
    tagline: 'Win the day before noon',
  },
  {
    id: 'p-car-code',
    name: 'Code & Ship Daily Update',
    category: 'Career',
    actionStyle: 'timer',
    target: 60,
    unit: 'min',
    timeBlock: 'Evening',
    points: 25,
    subHabits: ['Review backlog tickets', 'Write and test clean features', 'Deploy or ship PR'],
    icon: '💻',
    tagline: 'Relentless daily shipping compounding',
  },
  {
    id: 'p-car-social',
    name: 'Zero Social Media Pre-Noon',
    category: 'Career',
    actionStyle: 'check',
    target: 1,
    unit: 'done',
    timeBlock: 'Morning',
    points: 15,
    subHabits: ['Keep phone locked away in morning', 'Do not open feeds or news', 'Protect morning attention span'],
    icon: '🛡️',
    tagline: 'Guard your attention and dopamine',
  },

  // 😴 RECOVERY
  {
    id: 'p-rec-sleep',
    name: '8 Hours Quality Sleep',
    category: 'Recovery',
    actionStyle: 'count',
    target: 8,
    unit: 'hours',
    timeBlock: 'Night',
    points: 25,
    subHabits: ['Bedroom cold (66°F / 19°C)', 'Pitch-black blackout environment', 'Consistent 10:30 PM bedtime'],
    icon: '😴',
    tagline: 'Non-negotiable cellular regeneration',
  },
  {
    id: 'p-rec-screens',
    name: 'No Screens 1h Before Bed',
    category: 'Recovery',
    actionStyle: 'check',
    target: 1,
    unit: 'done',
    timeBlock: 'Night',
    points: 15,
    subHabits: ['Phone plugged in outside bedroom', 'Dim warm amber room lights', 'Read paper book or journal'],
    icon: '📵',
    tagline: 'Maximize deep and REM sleep cycles',
  },
  {
    id: 'p-rec-cold',
    name: 'Cold Shower / Ice Plunge',
    category: 'Recovery',
    actionStyle: 'timer',
    target: 3,
    unit: 'min',
    timeBlock: 'Morning',
    points: 10,
    subHabits: ['Calm box breathing before entry', 'Full cold immersion 3 minutes', 'Control shivering with deep exhales'],
    icon: '❄️',
    tagline: '250% sustained dopamine increase',
  },
  {
    id: 'p-rec-sunlight',
    name: '15m Morning Sunlight Walk',
    category: 'Recovery',
    actionStyle: 'timer',
    target: 15,
    unit: 'min',
    timeBlock: 'Morning',
    points: 10,
    subHabits: ['Get outside within 45m of waking', 'No sunglasses to trigger retinal sensors', 'Brisk pace to wake nervous system'],
    icon: '☀️',
    tagline: 'Master circadian anchor for energy',
  },

  // 🧘 MIND
  {
    id: 'p-mnd-read',
    name: 'Read 10 Pages of Non-Fiction',
    category: 'Mind',
    actionStyle: 'count',
    target: 10,
    unit: 'pages',
    timeBlock: 'Night',
    points: 15,
    subHabits: ['High-leverage mindset/strategy book', 'Highlight top 2 takeaways', 'Write 1 actionable application note'],
    icon: '📖',
    tagline: 'Read 15+ high-value books a year',
  },
  {
    id: 'p-mnd-meditate',
    name: '10m Mindful Meditation',
    category: 'Mind',
    actionStyle: 'timer',
    target: 10,
    unit: 'min',
    timeBlock: 'Morning',
    points: 10,
    subHabits: ['Upright seated posture', 'Focus on sensations of the breath', 'Gently return focus when mind wanders'],
    icon: '🧘',
    tagline: 'Mental clarity and emotional detachment',
  },
  {
    id: 'p-mnd-journal',
    name: 'Daily Wins & Evening Reflection',
    category: 'Mind',
    actionStyle: 'check',
    target: 1,
    unit: 'done',
    timeBlock: 'Night',
    points: 15,
    subHabits: ['Write down 3 concrete wins today', 'Identify 1 lesson or obstacle handled', 'Select tomorrow\'s top 3 priorities'],
    icon: '✍️',
    tagline: 'Close mental loops and sleep peacefully',
  },
  {
    id: 'p-mnd-gratitude',
    name: 'Morning Gratitude & Affirmation',
    category: 'Mind',
    actionStyle: 'check',
    target: 1,
    unit: 'done',
    timeBlock: 'Morning',
    points: 10,
    subHabits: ['Note 3 things genuinely grateful for', 'Frame challenges today as growth opportunities', 'Anchor into resilient mindset'],
    icon: '🌱',
    tagline: 'Prime dopamine and psychological resilience',
  },
];

export function CreateHabitModal({
  isOpen,
  onClose,
  onCreate,
  onSave,
  onDelete,
  habitToEdit,
  routines,
  prefilledRoutineId,
}: CreateHabitModalProps) {
  const [modalTab, setModalTab] = useState<'presets' | 'custom'>('custom');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Fitness');
  const [actionStyle, setActionStyle] = useState<'check' | 'count' | 'timer'>('count');
  const [points, setPoints] = useState(10);
  const [type, setType] = useState<HabitType>('Count');
  const [target, setTarget] = useState<number | string>(10);
  const [unit, setUnit] = useState('reps');
  const [repeat, setRepeat] = useState<'Daily' | 'Custom Days' | 'Today Only'>('Daily');
  const [timeBlock, setTimeBlock] = useState<'' | 'Morning' | 'Evening' | 'Night'>('');
  const [enableFocusTimer, setEnableFocusTimer] = useState(false);
  const [routineId, setRoutineId] = useState('');
  const [subHabits, setSubHabits] = useState<SubHabit[]>([]);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [presetFilterCategory, setPresetFilterCategory] = useState<Category>('Fitness');

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name || '');
      setCategory(habitToEdit.category || 'Fitness');
      setPoints(habitToEdit.points || 10);
      setType(habitToEdit.type || 'Count');
      setTarget(habitToEdit.target ?? 10);
      setUnit(habitToEdit.unit || 'reps');
      setRepeat(habitToEdit.repeat || 'Daily');
      setEnableFocusTimer(!!habitToEdit.enableFocusTimer);
      setRoutineId(habitToEdit.routineId || '');
      setSubHabits(habitToEdit.subHabits || []);
      setModalTab('custom');

      // Determine action style
      if (habitToEdit.type === 'Timer') {
        setActionStyle('timer');
      } else if (habitToEdit.target === 1 && (habitToEdit.unit === 'done' || habitToEdit.unit === 'check')) {
        setActionStyle('check');
      } else {
        setActionStyle('count');
      }

      const tod = habitToEdit.timeOfDay || '';
      if (tod === 'Morning' || tod === 'Evening' || tod === 'Night') {
        setTimeBlock(tod);
      } else if (tod.toLowerCase().includes('morning')) {
        setTimeBlock('Morning');
      } else if (tod.toLowerCase().includes('evening') || tod.toLowerCase().includes('afternoon')) {
        setTimeBlock('Evening');
      } else if (tod.toLowerCase().includes('night')) {
        setTimeBlock('Night');
      } else {
        setTimeBlock('');
      }
    } else {
      setName('');
      setCategory('Fitness');
      setActionStyle('count');
      setPoints(10);
      setType('Count');
      setTarget(10);
      setUnit('reps');
      setRepeat('Daily');
      setTimeBlock('');
      setEnableFocusTimer(false);
      setRoutineId(prefilledRoutineId || '');
      setSubHabits([]);
      setNewSubTitle('');
      setModalTab('custom');
    }
  }, [habitToEdit, isOpen, prefilledRoutineId]);

  if (!isOpen) return null;

  const categories: {
    id: Category;
    label: string;
    icon: string;
    color: string;
    bgBadge: string;
    activeClass: string;
  }[] = [
    {
      id: 'Fitness',
      label: 'Fitness',
      icon: '🏃',
      color: 'text-rose-400',
      bgBadge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      activeClass: 'border-rose-500 bg-rose-500/15 text-rose-300 ring-2 ring-rose-500/10 shadow-sm shadow-rose-950/40',
    },
    {
      id: 'Diet',
      label: 'Diet',
      icon: '🥗',
      color: 'text-emerald-400',
      bgBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      activeClass: 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500/10 shadow-sm shadow-emerald-950/40',
    },
    {
      id: 'Career',
      label: 'Career',
      icon: '🎯',
      color: 'text-amber-400',
      bgBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      activeClass: 'border-amber-500 bg-amber-500/15 text-amber-300 ring-2 ring-amber-500/10 shadow-sm shadow-amber-950/40',
    },
    {
      id: 'Recovery',
      label: 'Recovery',
      icon: '😴',
      color: 'text-cyan-400',
      bgBadge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      activeClass: 'border-cyan-500 bg-cyan-500/15 text-cyan-300 ring-2 ring-cyan-500/10 shadow-sm shadow-cyan-950/40',
    },
    {
      id: 'Mind',
      label: 'Mind',
      icon: '🧘',
      color: 'text-purple-400',
      bgBadge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      activeClass: 'border-purple-500 bg-purple-500/15 text-purple-300 ring-2 ring-purple-500/10 shadow-sm shadow-purple-950/40',
    },
  ];

  const timeBlocks: { id: '' | 'Morning' | 'Evening' | 'Night'; label: string; icon: string; sub: string }[] = [
    { id: 'Morning', label: 'Morning', icon: '☀️', sub: 'Win the morning' },
    { id: 'Evening', label: 'Evening', icon: '🌇', sub: 'Deep flow' },
    { id: 'Night', label: 'Night', icon: '🌙', sub: 'Shutdown & sleep' },
    { id: '', label: 'Anytime', icon: '🔄', sub: 'Flexible' },
  ];

  const handleActionStyleChange = (style: 'check' | 'count' | 'timer') => {
    setActionStyle(style);
    if (style === 'check') {
      setType('Count');
      setTarget(1);
      setUnit('done');
      setEnableFocusTimer(false);
    } else if (style === 'count') {
      setType('Count');
      if (target === 1 && unit === 'done') {
        setTarget(10);
        setUnit('reps');
      } else if (!target) {
        setTarget(10);
        setUnit('reps');
      }
      setEnableFocusTimer(false);
    } else {
      setType('Timer');
      setTarget(25);
      setUnit('min');
      setEnableFocusTimer(true);
    }
  };

  const handleApplyPreset = (preset: HabitPreset) => {
    setName(preset.name);
    setCategory(preset.category);
    setActionStyle(preset.actionStyle);
    setType(preset.actionStyle === 'timer' ? 'Timer' : 'Count');
    setTarget(preset.target);
    setUnit(preset.unit);
    setTimeBlock(preset.timeBlock);
    setPoints(preset.points);
    setEnableFocusTimer(preset.actionStyle === 'timer');
    setSubHabits(
      preset.subHabits.map((title) => ({
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title,
        completedHistory: {},
      }))
    );
    setModalTab('custom');
  };

  const handleAddSubHabit = () => {
    if (!newSubTitle.trim()) return;
    const newSub: SubHabit = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: newSubTitle.trim(),
      completedHistory: {},
    };
    setSubHabits([...subHabits, newSub]);
    setNewSubTitle('');
  };

  const handleRemoveSubHabit = (id: string) => {
    setSubHabits(subHabits.filter((s) => s.id !== id));
  };

  const resolvedTarget = () => {
    if (actionStyle === 'check') return 1;
    const parsed = Number(target);
    if (target !== '' && !Number.isNaN(parsed) && parsed >= 1) return parsed;
    return actionStyle === 'timer' ? 30 : 10;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalTarget = resolvedTarget();
    const finalUnit = actionStyle === 'check' ? 'done' : actionStyle === 'timer' ? 'min' : unit.trim() || 'reps';
    const finalType: HabitType = actionStyle === 'timer' ? 'Timer' : 'Count';

    const payload: Partial<Habit> = {
      name: name.trim(),
      category,
      points,
      type: finalType,
      target: finalTarget,
      unit: finalUnit,
      repeat,
      timeOfDay: timeBlock || undefined,
      enableFocusTimer: actionStyle === 'timer' ? enableFocusTimer : false,
      routineId: routineId || undefined,
      subHabits,
    };

    if (habitToEdit && onSave) {
      onSave(habitToEdit.id, payload);
    } else {
      onCreate(payload);
    }

    if (!habitToEdit) {
      setName('');
      setCategory('Fitness');
      setActionStyle('count');
      setPoints(10);
      setType('Count');
      setTarget(10);
      setUnit('reps');
      setRepeat('Daily');
      setTimeBlock('');
      setEnableFocusTimer(false);
      setRoutineId('');
      setSubHabits([]);
      setNewSubTitle('');
    }
  };

  const currentCategoryMeta = categories.find((c) => c.id === category) || categories[0];
  const presetsForSelectedCat = HABIT_PRESETS.filter((p) => p.category === category);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/85 backdrop-blur-md md:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full h-[100dvh] md:h-auto md:max-w-lg md:max-h-[92vh] bg-[#0A0C10] border-0 md:border border-[#1E2330] rounded-none md:rounded-3xl shadow-2xl p-4 md:p-6 flex flex-col overflow-hidden text-left font-sans"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-purple-500/10 via-emerald-500/5 to-transparent rounded-bl-full blur-3xl pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between pb-3 border-b border-[#161922] relative z-10 shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold tracking-widest text-[#10B981] uppercase">
                90-DAY LOCK-IN ARCHITECT
              </span>
              <span className="text-gray-600 text-xs">•</span>
              <span className="text-[9px] font-mono font-semibold text-purple-400 uppercase">
                ATOMIC DISCIPLINE
              </span>
            </div>
            <h3 className="text-lg font-black text-white font-sans mt-0.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              {habitToEdit ? 'Edit Discipline' : 'Construct New Discipline'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-gray-400 hover:text-white bg-[#141721] hover:bg-[#1E2230] border border-[#232838] flex items-center justify-center transition cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── TOP SWITCHER: PRESETS VS CUSTOM BUILDER ── */}
        {!habitToEdit && (
          <div className="mt-3 grid grid-cols-2 gap-1.5 p-1 bg-[#10131B] border border-[#1C212D] rounded-2xl shrink-0 relative z-10">
            <button
              type="button"
              onClick={() => setModalTab('custom')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                modalTab === 'custom'
                  ? 'bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white shadow-md border border-purple-400/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#161B26]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Custom Constructor</span>
            </button>
            <button
              type="button"
              onClick={() => setModalTab('presets')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                modalTab === 'presets'
                  ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white shadow-md border border-emerald-400/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#161B26]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Lock-In Blueprints</span>
              <span className="text-[9px] bg-white/15 px-1.5 py-0.2 rounded-full font-mono">20</span>
            </button>
          </div>
        )}

        {/* ── TAB 1: PRESET BLUEPRINTS EXPLORER ── */}
        {modalTab === 'presets' && !habitToEdit && (
          <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1 space-y-3 relative z-10">
            <div className="bg-[#12151F] border border-[#212738] rounded-2xl p-3 flex items-start gap-2.5">
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-xs font-bold text-white">Proven 90-Day Transformation Habits</p>
                <p className="text-[11px] text-gray-400 leading-snug">
                  1-tap battle-tested routines with pre-configured micro-steps, duration, and optimal time cues.
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="grid grid-cols-5 gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPresetFilterCategory(cat.id)}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition flex flex-col items-center gap-0.5 cursor-pointer ${
                    presetFilterCategory === cat.id
                      ? cat.activeClass
                      : 'border-[#1C212E] bg-[#10131B] text-gray-400 hover:bg-[#181D2A]'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="truncate w-full text-center">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Presets List */}
            <div className="space-y-2">
              {HABIT_PRESETS.filter((p) => p.category === presetFilterCategory).map((p) => (
                <div
                  key={p.id}
                  className="bg-[#12151E] hover:bg-[#161B26] border border-[#1E2332] hover:border-purple-500/40 rounded-2xl p-3 transition-all cursor-pointer group space-y-2"
                  onClick={() => handleApplyPreset(p)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <h4 className="text-xs font-black text-white group-hover:text-purple-300 transition flex items-center gap-1.5">
                          {p.name}
                        </h4>
                        <p className="text-[10px] text-gray-400">{p.tagline}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        +{p.points} pts
                      </span>
                    </div>
                  </div>

                  {/* Micro-steps peek */}
                  <div className="bg-[#0B0D13] border border-[#1A1E29] rounded-xl p-2 space-y-1">
                    <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block">
                      Included Micro-Steps ({p.subHabits.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {p.subHabits.map((sub, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] bg-[#161B26] text-gray-300 px-2 py-0.5 rounded-md border border-[#242A3A]"
                        >
                          ✓ {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom details & apply button */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#191D2A] px-2 py-0.5 rounded-md border border-[#252B3C]">
                        {p.actionStyle === 'check'
                          ? '✓ 1-Tap Done'
                          : p.actionStyle === 'timer'
                          ? `⏱️ ${p.target} min`
                          : `🔢 ${p.target} ${p.unit}`}
                      </span>
                      {p.timeBlock && (
                        <span className="bg-[#191D2A] px-2 py-0.5 rounded-md border border-[#252B3C]">
                          {p.timeBlock === 'Morning' ? '☀️ Morning' : p.timeBlock === 'Evening' ? '🌇 Evening' : '🌙 Night'}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-xs font-extrabold text-emerald-400 group-hover:translate-x-0.5 transition flex items-center gap-1"
                    >
                      <span>Apply Preset</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: CUSTOM CONSTRUCTOR FORM ── */}
        {(modalTab === 'custom' || habitToEdit) && (
          <form onSubmit={handleSubmit} className="mt-3 space-y-3.5 relative z-10 overflow-y-auto pr-1 flex-1 min-h-0 pb-safe">

            {/* Repeat Schedule */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase">
                  Repeat Schedule
                </label>
                <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {repeat === 'Daily' ? 'Repeats daily on your dashboard' : 'Scheduled for today only'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRepeat('Daily')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2 ${
                    repeat === 'Daily'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-[#1E2332] bg-[#11141D] text-gray-400 hover:text-white hover:bg-[#161B26]'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Repeat Daily (Every Day)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRepeat('Today Only')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2 ${
                    repeat === 'Today Only'
                      ? 'border-purple-500 bg-purple-500/15 text-purple-300 ring-2 ring-purple-500/20'
                      : 'border-[#1E2332] bg-[#11141D] text-gray-400 hover:text-white hover:bg-[#161B26]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Today Only</span>
                </button>
              </div>
            </div>

            {/* 2. Habit Title */}
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">
                Discipline Title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 100 Pushups, 4h Deep Work, Zero Sugar, 10 Pages Read"
                required
                className="w-full bg-[#11141D] border border-[#232838] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition font-sans shadow-inner"
              />
            </div>

            {/* 3. Target 90-Day Life Goal (Category) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase">
                  Target 90-Day Life Goal
                </label>
                <span className="text-[9px] text-purple-400/80 font-medium">Connects directly to your 90-day pillar</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {categories.map((cat) => {
                  const isActive = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                        isActive
                          ? cat.activeClass
                          : 'border-[#1B202D] bg-[#11141C]/80 text-gray-450 hover:text-gray-200 hover:bg-[#171B26]'
                      }`}
                    >
                      <span className="text-base mb-0.5">{cat.icon}</span>
                      <span className="truncate w-full text-center">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick load preset for selected pillar */}
              {presetsForSelectedCat.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[9px] font-mono text-gray-500 uppercase shrink-0">Suggestions:</span>
                  {presetsForSelectedCat.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="text-[9px] font-semibold bg-[#141824] hover:bg-[#1D2335] text-gray-300 hover:text-white border border-[#242A3D] px-2 py-0.5 rounded-lg whitespace-nowrap cursor-pointer transition active:scale-95"
                    >
                      ⚡ {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Action Execution Style (The 3 Atomic Habits Modes) */}
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1.5">
                Execution Style (Action Mode)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleActionStyleChange('check')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                    actionStyle === 'check'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/10'
                      : 'border-[#1E2332] bg-[#11141D] text-gray-400 hover:bg-[#161B26]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-0.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${actionStyle === 'check' ? 'text-emerald-400' : 'text-gray-400'}`} />
                    <span>1-Tap Done</span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-tight">Binary complete (e.g. cold shower, no sugar)</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleActionStyleChange('count')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                    actionStyle === 'count'
                      ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/10'
                      : 'border-[#1E2332] bg-[#11141D] text-gray-400 hover:bg-[#161B26]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-0.5">
                    <Hash className={`w-3.5 h-3.5 ${actionStyle === 'count' ? 'text-purple-400' : 'text-gray-400'}`} />
                    <span>Volume Count</span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-tight">Quantity reps (e.g. 50 pushups, 8 glasses)</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleActionStyleChange('timer')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                    actionStyle === 'timer'
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/10'
                      : 'border-[#1E2332] bg-[#11141D] text-gray-400 hover:bg-[#161B26]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-0.5">
                    <Timer className={`w-3.5 h-3.5 ${actionStyle === 'timer' ? 'text-amber-400' : 'text-gray-400'}`} />
                    <span>Focus Timer</span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-tight">Time duration (e.g. 45 min workout, 25m pomodoro)</p>
                </button>
              </div>
            </div>

            {/* 5. Target Stepper & Unit (Adapts according to Action Style) */}
            {actionStyle === 'check' ? (
              <div className="bg-[#11141D] border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-[11px] leading-snug">
                  <strong>1-Tap Discipline:</strong> Tap once on the daily card to mark 100% completed. No complex counting required!
                </p>
              </div>
            ) : actionStyle === 'count' ? (
              <div className="bg-[#11141D] border border-[#232838] rounded-xl p-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">
                      Target Volume
                    </label>
                    <div className="flex items-center bg-[#181D2A] border border-[#2A3245] rounded-xl px-2 py-1">
                      <button
                        type="button"
                        onClick={() => setTarget(Math.max(1, (Number(target) || 1) - 1))}
                        className="w-7 h-7 rounded-lg bg-[#222838] hover:bg-[#2C3448] text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full bg-transparent border-0 text-center text-white font-black font-mono text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setTarget((Number(target) || 0) + 1)}
                        className="w-7 h-7 rounded-lg bg-[#222838] hover:bg-[#2C3448] text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">
                      Measurement Unit
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="reps, pages, glasses, km"
                      className="w-full bg-[#181D2A] border border-[#2A3245] rounded-xl px-3 py-2 text-center text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Quick Target Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[9px] font-mono text-gray-500 uppercase">Quick Target:</span>
                  {[5, 10, 25, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTarget(val)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border cursor-pointer transition ${
                        Number(target) === val
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-[#181D2A] text-gray-400 border-[#262E40] hover:text-white'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#11141D] border border-[#232838] rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">
                      Duration Target (Minutes)
                    </label>
                    <div className="flex items-center bg-[#181D2A] border border-[#2A3245] rounded-xl px-2 py-1 w-40">
                      <button
                        type="button"
                        onClick={() => setTarget(Math.max(5, (Number(target) || 5) - 5))}
                        className="w-7 h-7 rounded-lg bg-[#222838] hover:bg-[#2C3448] text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        -5
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full bg-transparent border-0 text-center text-white font-black font-mono text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setTarget((Number(target) || 0) + 5)}
                        className="w-7 h-7 rounded-lg bg-[#222838] hover:bg-[#2C3448] text-white text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1">
                      Focus Timer Mode
                    </label>
                    <label className="flex items-center gap-2 bg-[#181D2A] border border-[#2A3245] rounded-xl p-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableFocusTimer}
                        onChange={(e) => setEnableFocusTimer(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                      />
                      <span className="text-[11px] font-bold text-white">Interactive Clock Tool</span>
                    </label>
                  </div>
                </div>

                {/* Quick Duration Pills */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-0.5">
                  <span className="text-[9px] font-mono text-gray-500 uppercase shrink-0">Duration:</span>
                  {[10, 15, 25, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTarget(mins)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border whitespace-nowrap cursor-pointer transition ${
                        Number(target) === mins
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-[#181D2A] text-gray-400 border-[#262E40] hover:text-white'
                      }`}
                    >
                      {mins}m{mins === 25 ? ' (Pomodoro)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Micro-Steps / Sub-Habits (Defeat Friction & Procrastination) */}
            <div className="bg-[#11141D] border border-[#232838] rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-300 uppercase">
                    Micro-Steps Checklist ({subHabits.length})
                  </label>
                </div>
                <span className="text-[9px] text-gray-500">Auto-completes habit when all checked</span>
              </div>

              {/* Added Sub-habits */}
              {subHabits.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {subHabits.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between bg-[#171C28] border border-[#252C3E] rounded-lg px-2.5 py-1.5 text-xs text-white group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">{idx + 1}.</span>
                        <span>{sub.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubHabit(sub.id)}
                        className="text-gray-500 hover:text-rose-400 transition cursor-pointer p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input to add sub-habit */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newSubTitle}
                  onChange={(e) => setNewSubTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubHabit();
                    }
                  }}
                  placeholder="e.g. Put shoes on, 5m warmup, 4 sets..."
                  className="flex-1 bg-[#181D2A] border border-[#283042] rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleAddSubHabit}
                  className="bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* 7. Implementation Cue (Time of Day Anchor) */}
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <span>Time of Day Anchor</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {timeBlocks.map((blk) => (
                  <button
                    key={blk.id || 'anytime'}
                    type="button"
                    onClick={() => setTimeBlock(blk.id)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[9px] font-bold cursor-pointer transition ${
                      timeBlock === blk.id
                        ? 'border-[#10B981] bg-[#10B981]/15 text-white ring-1 ring-[#10B981]/30'
                        : 'border-[#1C212E] bg-[#11141D] text-gray-450 hover:text-white hover:bg-[#181D2A]'
                    }`}
                  >
                    <span className="text-base mb-0.5">{blk.icon}</span>
                    <span>{blk.label}</span>
                    <span className="text-[8px] text-gray-500 font-normal">{blk.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 8. Points & Routine Linker */}
            <div className="grid grid-cols-2 gap-3">
              {/* Points */}
              <div className="bg-[#11141D] border border-[#232838] rounded-xl p-2.5">
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Dopamine Reward</span>
                </label>
                <div className="flex items-center gap-1">
                  {[5, 10, 15, 25, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPoints(val)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                        points === val
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-[#181D2A] text-gray-400 border-[#262E40] hover:text-white'
                      }`}
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Link Routine */}
              <div className="bg-[#11141D] border border-[#232838] rounded-xl p-2.5">
                <label className="block text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <Clipboard className="w-3 h-3 text-gray-500" />
                  <span>Routine Group</span>
                </label>
                <select
                  value={routineId}
                  onChange={(e) => setRoutineId(e.target.value)}
                  className="w-full bg-[#181D2A] border border-[#262E40] rounded-lg px-2 py-1 text-xs text-white focus:outline-none font-sans"
                >
                  <option value="">Independent</option>
                  {routines.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── FOOTER ACTIONS ── */}
            <div className="flex items-center space-x-2.5 pt-3 border-t border-[#181C26] shrink-0 sticky bottom-0 bg-[#0A0C10]">
              {habitToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    const id = habitToEdit.id;
                    onClose();
                    onDelete(id);
                  }}
                  className="px-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[11px] font-bold py-2.5 rounded-xl transition cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 active:scale-95"
                  title="Delete this discipline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-[#141824] hover:bg-[#1D2335] border border-[#252C3E] text-[11px] font-bold text-gray-400 hover:text-white py-2.5 rounded-xl transition cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-[11px] font-black text-[#07130F] py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-950/40 uppercase tracking-wider min-h-[44px] active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{habitToEdit ? 'Save Changes' : 'Construct Discipline'}</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// --- CREATE ROUTINE MODAL ---
interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (routineData: any) => void;
}

export function CreateRoutineModal({ isOpen, onClose, onCreate }: CreateRoutineModalProps) {
  const [name, setName] = useState('');
  const [awardPoints, setAwardPoints] = useState(25);
  const [timeBlock, setTimeBlock] = useState<'Morning' | 'Evening' | 'Night' | 'Constant'>('Morning');
  const [category, setCategory] = useState<Category>('Fitness');
  const [repeat, setRepeat] = useState<'Daily' | 'Custom Days' | 'Today Only'>('Daily');
  const [habitLines, setHabitLines] = useState<string[]>(['']);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setAwardPoints(25);
      setTimeBlock('Morning');
      setCategory('Fitness');
      setRepeat('Daily');
      setHabitLines(['']);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddHabitLine = () => setHabitLines([...habitLines, '']);

  const handleHabitLineChange = (idx: number, value: string) => {
    const updated = [...habitLines];
    updated[idx] = value;
    setHabitLines(updated);
  };

  const handleRemoveHabitLine = (idx: number) =>
    setHabitLines(habitLines.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const validNames = habitLines.filter((line) => line.trim() !== '');
    onCreate({ name, points: Number(awardPoints), timeBlock, category, repeat, habitNames: validNames });
    setName('');
    setAwardPoints(25);
    setTimeBlock('Morning');
    setCategory('Fitness');
    setRepeat('Daily');
    setHabitLines(['']);
  };

  const categories: { id: Category; label: string; icon: string; activeClass: string }[] = [
    { id: 'Fitness',      label: 'Fitness',      icon: '🏃',  activeClass: 'border-rose-500 bg-rose-500/10 text-rose-400' },
    { id: 'Diet',         label: 'Diet',         icon: '🥗',  activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
    { id: 'Career',       label: 'Career',       icon: '🎯',  activeClass: 'border-amber-500 bg-amber-500/10 text-amber-400' },
    { id: 'Recovery',     label: 'Recovery',     icon: '😴',  activeClass: 'border-cyan-500 bg-cyan-500/10 text-cyan-400' },
    { id: 'Mind',         label: 'Mind',         icon: '🧘',  activeClass: 'border-purple-500 bg-purple-500/10 text-purple-400' },
  ];

  const timeBlocks: { id: typeof timeBlock; label: string; icon: string; activeClass: string }[] = [
    { id: 'Morning',  label: 'Morning',  icon: '☀️',  activeClass: 'border-[#FDAF17] bg-[#FDAF17]/10 text-white shadow-md' },
    { id: 'Evening',  label: 'Evening',  icon: '🌇',  activeClass: 'border-[#F06A33] bg-[#F06A33]/10 text-white shadow-md' },
    { id: 'Night',    label: 'Night',    icon: '🌙',  activeClass: 'border-[#7952B3] bg-[#7952B3]/10 text-white shadow-md' },
    { id: 'Constant', label: 'Constant', icon: '🔄',  activeClass: 'border-[#12B886] bg-[#12B886]/10 text-white shadow-md' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/85 backdrop-blur-sm md:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full h-[100dvh] md:h-auto md:max-w-md md:max-h-[92vh] bg-[#0C0E14] border-0 md:border border-[#232734] rounded-none md:rounded-2xl shadow-2xl p-4 md:p-5 flex flex-col overflow-hidden text-left font-sans"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1E29] shrink-0">
          <div>
            <span className="text-[9px] font-mono font-bold tracking-widest text-[#B197FC] uppercase">
              ROUTINE ARCHITECT
            </span>
            <h3 className="text-lg font-extrabold text-white font-sans mt-0.5 flex items-center">
              <Clipboard className="w-4 h-4 text-purple-400 mr-2" />
              Build New Routine
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-[#1A1D27] border border-transparent hover:border-gray-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">

          {/* Routine Name */}
          <div className="flex items-center space-x-2.5">
            <div className="bg-[#B197FC]/10 text-[#B197FC] p-2.5 rounded-xl border border-[#B197FC]/20 shrink-0 hidden sm:block">
              <Sparkles className="w-4 h-4 fill-current text-purple-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Routine Name (e.g. Morning Focus, Evening Wind-Down)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#13151D] border border-[#252A39] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition font-sans shadow-inner"
              />
            </div>
          </div>

          {/* Points bonus */}
          <div className="bg-[#13151D] border border-[#252A39] rounded-xl p-3">
            <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-gray-450 mb-1.5">
              Routine completion bonus points
            </label>
            <div className="flex items-center space-x-2.5">
              <div className="flex items-center space-x-1.5 bg-[#1C1F2B] border border-gray-850 px-2 py-0.5 rounded-lg shrink-0">
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={awardPoints}
                  onChange={(e) => setAwardPoints(Math.max(5, Number(e.target.value)))}
                  className="w-10 bg-transparent border-0 text-center text-xs font-black text-[#FCC419] focus:outline-none focus:ring-0 font-mono p-0"
                />
                <span className="text-[10px] text-gray-500">PT</span>
              </div>
              <span className="text-[10px] text-gray-500 leading-tight">
                Awarded as bonus when you clear all routine tasks today.
              </span>
            </div>
          </div>

          {/* Time Block */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Assigned Time Block
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {timeBlocks.map((blk) => (
                <button
                  key={blk.id}
                  type="button"
                  onClick={() => setTimeBlock(blk.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                    timeBlock === blk.id
                      ? blk.activeClass
                      : 'border-[#1C1F2B] bg-[#12141A]/50 text-gray-450 hover:bg-[#1A1D27] hover:text-white'
                  }`}
                >
                  <span className="text-sm mb-0.5">{blk.icon}</span>
                  <span className="text-[9px] font-bold font-sans select-none">{blk.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Routine Step Category
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl border text-[9px] font-bold cursor-pointer transition ${
                    category === cat.id
                      ? cat.activeClass
                      : 'border-[#1C1F2B] bg-[#12141A]/50 text-gray-450 hover:bg-[#1A1D27] hover:text-white'
                  }`}
                >
                  <span className="text-sm mb-0.5">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Repeat */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
              Repeat Schedule
            </label>
            <div className="flex bg-[#13151D] border border-[#252A39] p-0.5 rounded-xl">
              {(['Daily', 'Custom Days', 'Today Only'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRepeat(opt)}
                  className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${
                    repeat === opt ? 'bg-[#1E212E] text-white border border-[#2F3446] shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Habit steps */}
          <div>
            <label className="block text-[10px] font-sans font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
              Include Habit Steps ({habitLines.filter((h) => h.trim() !== '').length} draft)
            </label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 select-none">
              {habitLines.map((line, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#181C26] border border-gray-850 text-purple-400 text-[10px] font-mono font-black flex items-center justify-center rounded-lg shrink-0">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Meditate for 10 min"
                    value={line}
                    onChange={(e) => handleHabitLineChange(index, e.target.value)}
                    className="flex-1 bg-[#13151D] border border-[#252A39] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-sans shadow-inner"
                  />
                  {habitLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveHabitLine(index)}
                      className="text-gray-500 hover:text-red-400 hover:bg-gray-800 transition text-[10px] font-bold font-mono px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddHabitLine}
              className="mt-2 w-full flex items-center justify-center py-2 border border-dashed border-purple-500/15 hover:border-purple-500/30 rounded-xl text-[10px] font-bold text-purple-400 hover:bg-[#1A1C28]/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add custom steps to timeline</span>
            </button>
          </div>

          {/* Footer */}
          <div className="flex space-x-2.5 pt-3 border-t border-[#1A1E29] shrink-0 sticky bottom-0 bg-[#0C0E14]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#151722]/85 hover:bg-[#1E2131] border border-[#252C3E] text-[11px] font-bold text-gray-400 hover:text-white py-2.5 rounded-xl transition cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-[11px] font-extrabold text-white py-2.5 rounded-xl transition cursor-pointer shadow-md uppercase tracking-wider min-h-[44px]"
            >
              {`Build Routine (${habitLines.filter((h) => h.trim() !== '').length})`}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}