import React, { useState, useEffect } from 'react';
import { X, Check, Dumbbell, Target, Utensils, BookOpen, Smile, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Habit, HabitType } from '../types';

interface LogMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogMeal: (name: string, calories: number, protein: number) => void;
}

export function LogMealModal({ isOpen, onClose, onLogMeal }: LogMealModalProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState<number | string>(350);
  const [protein, setProtein] = useState<number | string>(25);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onLogMeal(name.trim(), Number(calories) || 0, Number(protein) || 0);
    setName('');
    setCalories(350);
    setProtein(25);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
      <div className="relative w-full max-w-md bg-[#0C0E14] border border-[#232734] rounded-2xl shadow-2xl p-6 overflow-hidden text-gray-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1A1E29] mb-4">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-[#FD7E14]" />
            <h3 className="text-lg font-bold text-white">Log Today's Meal</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">Meal Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Grilled Chicken Salad, Whey Shake"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FD7E14] focus:ring-1 focus:ring-[#FD7E14]/30 placeholder-gray-650"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">Calories (kcal)</label>
              <input
                type="number"
                min="0"
                value={calories}
                onChange={e => setCalories(e.target.value)}
                className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FD7E14] focus:ring-1 focus:ring-[#FD7E14]/30 placeholder-gray-650"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">Protein (g)</label>
              <input
                type="number"
                min="0"
                value={protein}
                onChange={e => setProtein(e.target.value)}
                className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FD7E14] focus:ring-1 focus:ring-[#FD7E14]/30 placeholder-gray-650"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 mt-2 bg-[#FD7E14] hover:bg-[#F08C00] text-white font-extrabold text-sm rounded-xl transition cursor-pointer select-none"
          >
            Add Meal Log
          </button>
        </form>
      </div>
    </div>
  );
}

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveJournal: (text: string, mood: string) => void;
  existingJournal?: { text: string; mood: string };
}

const moods = [
  { emoji: '😊', label: 'Happy', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { emoji: '🚀', label: 'Energized', color: 'bg-amber-500/10 border-amber-500/30 text-amber-450' },
  { emoji: '😐', label: 'Neutral', color: 'bg-gray-800 border-gray-700 text-gray-300' },
  { emoji: '😴', label: 'Tired', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  { emoji: '😔', label: 'Stressed', color: 'bg-rose-500/10 border-rose-500/30 text-rose-455' }
];

export function JournalModal({ isOpen, onClose, onSaveJournal, existingJournal }: JournalModalProps) {
  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState('😊');

  useEffect(() => {
    if (existingJournal) {
      setText(existingJournal.text || '');
      setSelectedMood(existingJournal.mood || '😊');
    } else {
      setText('');
      setSelectedMood('😊');
    }
  }, [existingJournal, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSaveJournal(text.trim(), selectedMood);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
      <div className="relative w-full max-w-lg bg-[#0C0E14] border border-[#232734] rounded-2xl shadow-2xl p-6 overflow-hidden text-gray-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3.5 border-b border-[#1A1E29] mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#845EF7]" />
            <h3 className="text-lg font-bold text-white">Daily Reflection</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mood selection row */}
          <div>
            <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-2.5">How is your mood today?</label>
            <div className="flex justify-between gap-2">
              {moods.map(m => {
                const isSelected = selectedMood === m.emoji;
                return (
                  <button
                    key={m.emoji}
                    type="button"
                    onClick={() => setSelectedMood(m.emoji)}
                    className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-xl border transition cursor-pointer select-none ${
                      isSelected
                        ? `${m.color} ring-2 ring-purple-500/10`
                        : 'border-[#2C3246] bg-[#141620]/40 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl mb-1">{m.emoji}</span>
                    <span className="text-[10px] font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Journal Textarea */}
          <div>
            <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">What did you achieve? Any learnings?</label>
            <textarea
              required
              rows={5}
              placeholder="Write your journal entry here... Reflect on your progress, challenges faced, or general state of mind."
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-3.5 text-sm text-white focus:outline-none focus:border-[#845EF7] focus:ring-1 focus:ring-[#845EF7]/30 placeholder-gray-605 resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#845EF7] hover:bg-[#7048E8] text-white font-extrabold text-sm rounded-xl transition cursor-pointer select-none"
          >
            Save Journal Log
          </button>
        </form>
      </div>
    </div>
  );
}

interface CreateWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkout: (payload: Partial<Habit>) => void;
}

export function CreateWorkoutModal({ isOpen, onClose, onCreateWorkout }: CreateWorkoutModalProps) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState<number | string>(30);
  const [unit, setUnit] = useState('min');
  const [points, setPoints] = useState(15);
  const [timeBlock, setTimeBlock] = useState<'' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateWorkout({
      name: name.trim(),
      category: 'Fitness',
      points,
      type: unit === 'min' ? 'Timer' : 'Count',
      target: Number(target) || 30,
      unit,
      repeat: 'Daily',
      timeOfDay: timeBlock || undefined,
      enableFocusTimer: unit === 'min'
    });

    setName('');
    setTarget(30);
    setUnit('min');
    setPoints(15);
    setTimeBlock('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
      <div className="relative w-full max-w-md bg-[#0C0E14] border border-[#232734] rounded-2xl shadow-2xl p-6 overflow-hidden text-gray-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3.5 border-b border-[#1A1E29] mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-white">New Workout Habit</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">Workout Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Strength Training, Morning Cardio"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 placeholder-gray-650"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">Workout Unit</label>
              <select
                value={unit}
                onChange={e => {
                  setUnit(e.target.value);
                  setTarget(e.target.value === 'min' ? 30 : 5);
                }}
                className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="min">Minutes</option>
                <option value="reps">Reps (repetitions)</option>
                <option value="sets">Sets</option>
                <option value="km">Kilometers</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">Daily Target</label>
              <input
                type="number"
                min="1"
                required
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">XP Points Awarded</label>
              <select
                value={points}
                onChange={e => setPoints(Number(e.target.value))}
                className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value={10}>10 XP</option>
                <option value={15}>15 XP (Standard)</option>
                <option value={25}>25 XP (Intense)</option>
                <option value={50}>50 XP (Epic)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">Time of Day</label>
              <select
                value={timeBlock}
                onChange={e => setTimeBlock(e.target.value as any)}
                className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="">Anytime</option>
                <option value="Morning">🌅 Morning (5am – 12pm)</option>
                <option value="Afternoon">☀️ Afternoon (12pm – 5pm)</option>
                <option value="Evening">🌇 Evening (5pm – 9pm)</option>
                <option value="Night">🌙 Night (9pm – 5am)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 mt-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-sm rounded-xl transition cursor-pointer select-none"
          >
            Create Workout Habit
          </button>
        </form>
      </div>
    </div>
  );
}

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGoal: (payload: Partial<Habit>) => void;
}

export function CreateGoalModal({ isOpen, onClose, onCreateGoal }: CreateGoalModalProps) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState<number | string>(1);
  const [unit, setUnit] = useState('completion');
  const [points, setPoints] = useState(25);
  const [timeBlock, setTimeBlock] = useState<'' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateGoal({
      name: name.trim(),
      category: 'Career',
      points,
      type: 'Count',
      target: Number(target) || 1,
      unit,
      repeat: 'Daily',
      timeOfDay: timeBlock || undefined,
      enableFocusTimer: false
    });

    setName('');
    setTarget(1);
    setUnit('completion');
    setPoints(25);
    setTimeBlock('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
      <div className="relative w-full max-w-md bg-[#0C0E14] border border-[#232734] rounded-2xl shadow-2xl p-6 overflow-hidden text-gray-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3.5 border-b border-[#1A1E29] mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-white">New Priority Goal</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">Goal Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Read 5 pages, Code Next.js layout"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 placeholder-gray-650"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">Target Metric</label>
              <input
                type="text"
                required
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="e.g. completion, pages, task"
                className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 placeholder-gray-650"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">Goal Target Amount</label>
              <input
                type="number"
                min="1"
                required
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">XP Reward Points</label>
              <select
                value={points}
                onChange={e => setPoints(Number(e.target.value))}
                className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value={15}>15 XP</option>
                <option value={25}>25 XP (Standard Goal)</option>
                <option value={50}>50 XP (Major Milestone)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-gray-555 uppercase tracking-widest mb-1.5">Schedule Block</label>
              <select
                value={timeBlock}
                onChange={e => setTimeBlock(e.target.value as any)}
                className="w-full bg-[#141620] border border-[#2C3246] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Anytime</option>
                <option value="Morning">🌅 Morning (5am – 12pm)</option>
                <option value="Afternoon">☀️ Afternoon (12pm – 5pm)</option>
                <option value="Evening">🌇 Evening (5pm – 9pm)</option>
                <option value="Night">🌙 Night (9pm – 5am)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 mt-2 bg-[#FCC419] hover:bg-[#FAB005] text-[#0A0D10] font-extrabold text-sm rounded-xl transition cursor-pointer select-none"
          >
            Create Priority Goal
          </button>
        </form>
      </div>
    </div>
  );
}
