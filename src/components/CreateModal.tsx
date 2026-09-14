import React from 'react';
import { X, Check, Archive, Target, Dumbbell, Utensils, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHabit: () => void;
  onSelectRoutine: () => void;
  onSelectGoal: () => void;
  onSelectWorkout: () => void;
  onSelectMeal: () => void;
  onSelectJournal: () => void;
}

export default function CreateModal({
  isOpen,
  onClose,
  onSelectHabit,
  onSelectRoutine,
  onSelectGoal,
  onSelectWorkout,
  onSelectMeal,
  onSelectJournal,
}: CreateModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#06070a]/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Sheet Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative z-10 w-full max-w-lg bg-white rounded-t-[2.25rem] md:rounded-[2.25rem] p-6 md:p-8 flex flex-col shadow-[0_-10px_50px_rgba(0,0,0,0.3)] text-left"
        >
          {/* Top handle pill for mobile indicator */}
          <div className="flex justify-center mb-6 -mt-2">
            <div className="w-12 h-1.5 rounded-full bg-slate-200" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">Create</h2>
              <p className="text-sm font-semibold text-slate-500 mt-1">Add something to your mission</p>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Grid of Options */}
          <div className="grid grid-cols-2 gap-4 pb-6 md:pb-2">
            {/* Habit Card */}
            <button
              onClick={() => {
                onClose();
                onSelectHabit();
              }}
              className="flex flex-col items-start p-5 bg-[#FAFBFC] border border-slate-100 hover:border-[#12B886]/30 rounded-3xl hover:bg-[#12B886]/5 text-left transition group duration-200 cursor-pointer shadow-sm"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#E8FDF5] text-[#12B886] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Check className="h-6 w-6 stroke-[3px]" />
              </div>
              <span className="text-base font-extrabold text-slate-900 font-sans">Habit</span>
              <span className="text-xs text-slate-500 font-medium mt-1 leading-normal font-sans">
                Track a daily habit or action
              </span>
            </button>

            {/* Routine Card */}
            <button
              onClick={() => {
                onClose();
                onSelectRoutine();
              }}
              className="flex flex-col items-start p-5 bg-[#FAFBFC] border border-slate-100 hover:border-[#FD7E14]/30 rounded-3xl hover:bg-[#FD7E14]/5 text-left transition group duration-200 cursor-pointer shadow-sm"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#FEF6EE] text-[#FD7E14] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Archive className="h-6 w-6" />
              </div>
              <span className="text-base font-extrabold text-slate-900 font-sans">Routine</span>
              <span className="text-xs text-slate-500 font-medium mt-1 leading-normal font-sans">
                Group habits into a routine
              </span>
            </button>

            {/* Goal Card */}
            <button
              onClick={() => {
                onClose();
                onSelectGoal();
              }}
              className="flex flex-col items-start p-5 bg-[#FAFBFC] border border-slate-100 hover:border-[#845EF7]/35 rounded-3xl hover:bg-[#845EF7]/5 text-left transition group duration-200 cursor-pointer shadow-sm"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#FDF2FA] text-[#845EF7] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Target className="h-6 w-6" />
              </div>
              <span className="text-base font-extrabold text-slate-900 font-sans">Goal</span>
              <span className="text-xs text-slate-500 font-medium mt-1 leading-normal font-sans">
                Set a goal you want to achieve
              </span>
            </button>

            {/* Workout Card */}
            <button
              onClick={() => {
                onClose();
                onSelectWorkout();
              }}
              className="flex flex-col items-start p-5 bg-[#FAFBFC] border border-slate-100 hover:border-[#FF6B35]/35 rounded-3xl hover:bg-[#FF6B35]/5 text-left transition group duration-200 cursor-pointer shadow-sm"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#FFF0F6] text-[#FF6B35] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Dumbbell className="h-6 w-6" />
              </div>
              <span className="text-base font-extrabold text-slate-900 font-sans">Workout</span>
              <span className="text-xs text-slate-500 font-medium mt-1 leading-normal font-sans">
                Log a workout or activity
              </span>
            </button>

            {/* Meal Card */}
            <button
              onClick={() => {
                onClose();
                onSelectMeal();
              }}
              className="flex flex-col items-start p-5 bg-[#FAFBFC] border border-slate-100 hover:border-[#2ECC71]/35 rounded-3xl hover:bg-[#2ECC71]/5 text-left transition group duration-200 cursor-pointer shadow-sm"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#FEFBE8] text-[#2ECC71] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Utensils className="h-6 w-6" />
              </div>
              <span className="text-base font-extrabold text-slate-900 font-sans">Meal</span>
              <span className="text-xs text-slate-500 font-medium mt-1 leading-normal font-sans">
                Log a meal and track nutrition
              </span>
            </button>

            {/* Journal Card */}
            <button
              onClick={() => {
                onClose();
                onSelectJournal();
              }}
              className="flex flex-col items-start p-5 bg-[#FAFBFC] border border-slate-100 hover:border-[#339AF0]/35 rounded-3xl hover:bg-[#339AF0]/5 text-left transition group duration-200 cursor-pointer shadow-sm"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#EFF6FF] text-[#339AF0] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Book className="h-6 w-6" />
              </div>
              <span className="text-base font-extrabold text-slate-900 font-sans">Journal</span>
              <span className="text-xs text-slate-500 font-medium mt-1 leading-normal font-sans">
                Write your thoughts and reflect
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
