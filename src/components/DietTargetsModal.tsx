import React, { useState } from 'react';
import { Heart, X, Check } from 'lucide-react';
import { DietTargets } from '../types';

interface DietTargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: DietTargets;
  onSaveTargets: (targets: DietTargets) => void;
}

export default function DietTargetsModal({
  isOpen,
  onClose,
  targets,
  onSaveTargets,
}: DietTargetsModalProps) {
  const [protein, setProtein] = useState(targets.protein || 160);
  const [calories, setCalories] = useState(targets.calories || 2000);
  const [carbs, setCarbs] = useState(targets.carbs || 220);
  const [fats, setFats] = useState(targets.fats || 70);
  const [fiber, setFiber] = useState(targets.fiber || 25);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTargets({
      protein: Math.max(10, Number(protein) || 160),
      calories: Math.max(500, Number(calories) || 2000),
      carbs: Math.max(10, Number(carbs) || 220),
      fats: Math.max(10, Number(fats) || 70),
      fiber: Math.max(5, Number(fiber) || 25),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">Daily Nutrition Goals</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Customize your daily macro targets</p>
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

        <form onSubmit={handleSubmit} className="space-y-3 pt-3.5">
          {/* Protein Target */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3">
            <label className="block text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-1">
              Daily Protein Target (g)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="20"
                max="400"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-sm font-black text-gray-900 outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-xs font-bold text-emerald-700">grams</span>
            </div>
          </div>

          {/* Calories Target */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                Calories (kcal)
              </label>
              <input
                type="number"
                min="500"
                max="8000"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                Fats (g)
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={fats}
                onChange={(e) => setFats(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                Fiber (g)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={fiber}
                onChange={(e) => setFiber(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Targets</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
