import React from 'react';
import { Home, CalendarDays, Plus, BarChart2, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onAddClick: () => void;
}

export default function BottomNav({ currentTab, setTab, onAddClick }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard', label: 'HOME', icon: Home },
    { id: 'habits', label: 'TODAY', icon: CalendarDays },
    { id: 'add', label: '', icon: Plus, isAction: true },
    { id: 'progress', label: 'PROGRESS', icon: BarChart2 },
    { id: 'profile', label: 'PROFILE', icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center justify-around h-[60px] px-2 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            if (item.isAction) {
              return (
                <div key={item.id} className="flex-1 flex justify-center items-center -translate-y-5">
                  <button
                    onClick={onAddClick}
                    className="w-[56px] h-[56px] bg-[#10B981] hover:bg-[#059669] text-white rounded-full flex items-center justify-center shadow-[0_6px_20px_rgba(16,185,129,0.45)] transition-all duration-200 active:scale-90 hover:scale-105 cursor-pointer border-4 border-white"
                    aria-label="Quick Add"
                  >
                    <Icon className="w-7 h-7 stroke-[2.5px]" />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                id={`bottom-nav-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-all duration-200 cursor-pointer select-none active:scale-95`}
                aria-label={item.label}
              >
                <Icon
                  className={`w-[22px] h-[22px] transition-all duration-200 ${
                    isActive ? 'text-[#10B981]' : 'text-gray-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-[9px] font-extrabold tracking-widest leading-none transition-all ${
                    isActive ? 'text-[#10B981]' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
