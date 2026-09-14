import React, { useState } from 'react';
import { Check, Plus, Trash2, CornerDownRight } from 'lucide-react';
import { Habit } from '../types';

interface SubHabitsDrawerProps {
  habit: Habit;
  dateStr: string;
  onToggleSubHabit?: (habitId: string, subHabitId: string, dateStr: string) => Promise<void> | void;
  onAddSubHabit?: (habitId: string, title: string) => Promise<void> | void;
  onDeleteSubHabit?: (habitId: string, subHabitId: string) => Promise<void> | void;
}

export default function SubHabitsDrawer({
  habit,
  dateStr,
  onToggleSubHabit,
  onAddSubHabit,
  onDeleteSubHabit,
}: SubHabitsDrawerProps) {
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subHabits = habit.subHabits || [];
  const completedCount = subHabits.filter((s) => Boolean(s.completedHistory?.[dateStr])).length;
  const totalCount = subHabits.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !onAddSubHabit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddSubHabit(habit.id, newTitle.trim());
      setNewTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-2 pt-2.5 pb-2 px-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
      {/* Sub-habits header & progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
          <CornerDownRight className="w-3.5 h-3.5 text-gray-400" />
          <span>Action Steps</span>
          {totalCount > 0 && (
            <span className="text-[10px] font-mono text-gray-400 font-semibold">
              ({completedCount}/{totalCount})
            </span>
          )}
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600">{pct}%</span>
          </div>
        )}
      </div>

      {/* Steps List */}
      {subHabits.length > 0 ? (
        <div className="space-y-1.5">
          {subHabits.map((sub) => {
            const isDone = Boolean(sub.completedHistory?.[dateStr]);
            return (
              <div
                key={sub.id}
                className={`flex items-center justify-between gap-2.5 p-2 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-white/90 border-emerald-200 text-gray-400'
                    : 'bg-white border-gray-200/70 hover:border-gray-300 text-gray-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleSubHabit && onToggleSubHabit(habit.id, sub.id, dateStr)}
                  className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer group"
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-300 group-hover:border-emerald-500 bg-gray-50'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                  </div>
                  <span
                    className={`text-xs font-medium truncate ${
                      isDone ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {sub.title}
                  </span>
                </button>

                {onDeleteSubHabit && (
                  <button
                    type="button"
                    onClick={() => onDeleteSubHabit(habit.id, sub.id)}
                    className="p-1 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete step"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 italic py-0.5">
          No sub-steps yet. Add micro-habits below to break down this habit.
        </p>
      )}

      {/* Add Step Input Form */}
      {onAddSubHabit && (
        <form onSubmit={handleAdd} className="flex items-center gap-2 pt-0.5">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add an action step..."
            className="flex-1 bg-white border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || isSubmitting}
            className="h-7 px-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-gray-900 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      )}
    </div>
  );
}
