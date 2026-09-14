import React, { useState, useEffect } from 'react';
import { BookOpen, X, Sparkles, Check } from 'lucide-react';
import { DailyJournalEntry } from '../types';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: DailyJournalEntry) => void;
  existingEntry?: DailyJournalEntry | null;
  dateStr: string;
}

const MOODS = [
  { emoji: '⚡', label: 'Unstoppable', desc: 'Peak energy' },
  { emoji: '🔥', label: 'Locked In', desc: 'High momentum' },
  { emoji: '🎯', label: 'Focused', desc: 'Steady execution' },
  { emoji: '😴', label: 'Fatigued', desc: 'Pushing through' },
  { emoji: '🌧️', label: 'Struggling', desc: 'Resetting focus' },
];

export default function JournalModal({
  isOpen,
  onClose,
  onSave,
  existingEntry,
  dateStr,
}: JournalModalProps) {
  const [mood, setMood] = useState<string>('🔥');
  const [win, setWin] = useState('');
  const [reflection, setReflection] = useState('');

  useEffect(() => {
    if (existingEntry) {
      setMood(existingEntry.mood || '🔥');
      setWin(existingEntry.win || '');
      setReflection(existingEntry.reflection || '');
    } else {
      setMood('🔥');
      setWin('');
      setReflection('');
    }
  }, [existingEntry, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!win.trim() && !reflection.trim()) return;

    onSave({
      date: dateStr,
      mood,
      win: win.trim(),
      reflection: reflection.trim(),
      createdAt: existingEntry?.createdAt || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 leading-tight">Daily Lock-In Reflection</h2>
              <p className="text-xs text-gray-500 mt-0.5">Capture your mindset and victories for today</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Mood / Energy Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Energy & Mindset Today
            </label>
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((m) => {
                const isSelected = mood === m.emoji;
                return (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setMood(m.emoji)}
                    className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer select-none ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200'
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-[10px] font-bold truncate w-full">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's #1 Win */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Today's #1 Victory</span>
            </label>
            <input
              type="text"
              value={win}
              onChange={(e) => setWin(e.target.value)}
              placeholder="e.g., Crushed leg workout, hit 160g protein, finished pitch deck..."
              className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition font-medium"
            />
          </div>

          {/* Reflection & Lessons */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Evening Reflection & Notes
            </label>
            <textarea
              rows={4}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What went well? Where did you lose focus? What will you execute better tomorrow?"
              className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl p-3.5 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition resize-none leading-relaxed font-medium"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!win.trim() && !reflection.trim()}
              className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-xs font-black transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Reflection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
