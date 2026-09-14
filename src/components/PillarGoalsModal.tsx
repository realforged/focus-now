import React, { useState, useEffect } from 'react';
import { Target, X, Check, Dumbbell, Heart, Moon, Brain, Sparkles } from 'lucide-react';
import { Category, PillarGoal } from '../types';

interface PillarGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoals: (goals: Record<Category, string>) => void;
  existingGoals: Record<Category, string>;
}

const PILLARS_CONFIG: {
  pillar: Category;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  text: string;
  placeholder: string;
}[] = [
  {
    pillar: 'Fitness',
    label: 'Fitness Pillar',
    icon: Dumbbell,
    color: '#E64980',
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    placeholder: 'e.g., Run 5km under 22m, bench 100kg, reach 12% body fat...',
  },
  {
    pillar: 'Diet',
    label: 'Diet Pillar',
    icon: Heart,
    color: '#10B981',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    placeholder: 'e.g., Hit 160g protein daily, zero processed sugar for 90 days...',
  },
  {
    pillar: 'Career',
    label: 'Career Pillar',
    icon: Target,
    color: '#3B82F6',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    placeholder: 'e.g., Ship MVP, sign 10 clients, earn promotion...',
  },
  {
    pillar: 'Recovery',
    label: 'Recovery Pillar',
    icon: Moon,
    color: '#06B6D4',
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    placeholder: 'e.g., 8 hours deep sleep nightly, daily mobility & hydration...',
  },
  {
    pillar: 'Mind',
    label: 'Mind Pillar',
    icon: Brain,
    color: '#8B5CF6',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    placeholder: 'e.g., Read 3 life-changing books, 10m daily mindfulness...',
  },
];

export default function PillarGoalsModal({
  isOpen,
  onClose,
  onSaveGoals,
  existingGoals,
}: PillarGoalsModalProps) {
  const [goals, setGoals] = useState<Record<Category, string>>({
    Fitness: '',
    Diet: '',
    Career: '',
    Recovery: '',
    Mind: '',
  });

  useEffect(() => {
    if (existingGoals) {
      setGoals({
        Fitness: existingGoals.Fitness || '',
        Diet: existingGoals.Diet || '',
        Career: existingGoals.Career || '',
        Recovery: existingGoals.Recovery || '',
        Mind: existingGoals.Mind || '',
      });
    }
  }, [existingGoals, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGoals(goals);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 leading-tight">90-Day Life Goals</h2>
              <p className="text-xs text-gray-500 mt-0.5">Define what you are fighting for across the 5 pillars</p>
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

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-4">
          {PILLARS_CONFIG.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.pillar} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-lg ${p.bg} ${p.text} flex items-center justify-center shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <label className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    {p.pillar} Target
                  </label>
                </div>
                <input
                  type="text"
                  value={goals[p.pillar]}
                  onChange={(e) => setGoals((prev) => ({ ...prev, [p.pillar]: e.target.value }))}
                  placeholder={p.placeholder}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-100 rounded-xl px-3.5 py-2 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition font-medium"
                />
              </div>
            );
          })}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-black transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save 90-Day Goals</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
