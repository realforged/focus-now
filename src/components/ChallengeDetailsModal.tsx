import React, { useState, useEffect, useMemo } from 'react';
import { X, Lock, ChevronDown, RotateCcw, Flame, BadgeCheck, Zap, Trophy, Sparkles, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChallengeConfig, DayReport, MilestoneBadge, ChallengePillarId } from '../types';
import {
  PILLARS,
  isChallengeDevToolsEnabled,
  getTimelineColor,
  getScoreTone,
  getGrade,
  readSeenMilestones,
  saveSeenMilestones,
  readDevSimulatedDay,
  setDevSimulatedDay,
  resetChallengeStorage,
  CHALLENGE_LENGTH,
  MILESTONES,
} from '../challengeEngine';

interface ChallengeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChallengeConfig;
  reports: DayReport[];
  currentDay: number;
  simulatedDay: number | null;
  asOfDate: string;
  onSimulateDay: (day: number | null) => void;
  onResetChallenge: () => void;
}

const DEV_DAY_PRESETS = [1, 7, 21, 30, 45, 60, 75, 90];

export default function ChallengeDetailsModal({
  isOpen,
  onClose,
  config,
  reports,
  currentDay,
  simulatedDay,
  asOfDate,
  onSimulateDay,
  onResetChallenge,
}: ChallengeDetailsModalProps) {
  const [openWeek, setOpenWeek] = useState<number>(0);
  const [selectedReport, setSelectedReport] = useState<DayReport | null>(null);
  const [sliderDay, setSliderDay] = useState(simulatedDay ?? currentDay);

  useEffect(() => {
    setSliderDay(simulatedDay ?? currentDay);
  }, [simulatedDay, currentDay]);

  const milestones = useMemo<MilestoneBadge[]>(() => {
    const seen = readSeenMilestones();
    return config.milestones.map((day) => ({
      day,
      title:
        day === 7
          ? 'First Week Warrior'
          : day === 21
          ? 'Habit Former'
          : day === 30
          ? 'One Month Locked'
          : day === 60
          ? 'Halfway Hero'
          : '90-Day Legend',
      icon:
        day === 7
          ? 'Flame'
          : day === 21
          ? 'BadgeCheck'
          : day === 30
          ? 'Zap'
          : day === 60
          ? 'Sparkles'
          : 'Trophy',
      unlocked: currentDay >= day,
      seen: seen.has(day),
    }));
  }, [config, currentDay]);

  if (!isOpen) return null;

  const getMilestoneIconComp = (icon: string) => {
    switch (icon) {
      case 'Flame':
        return Flame;
      case 'BadgeCheck':
        return BadgeCheck;
      case 'Zap':
        return Zap;
      case 'Trophy':
        return Trophy;
      default:
        return Sparkles;
    }
  };

  const weeklyReports = (() => {
    const weeks = [];
    const average = (values: number[]): number =>
      values.length === 0 ? 0 : Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);

    for (let index = 0; index < CHALLENGE_LENGTH; index += 7) {
      const weekReports = reports.slice(index, Math.min(index + 7, CHALLENGE_LENGTH));
      const scored = weekReports.filter((r) => !r.future && !r.locked);
      const pillarScores = PILLARS.reduce((scores, id) => {
        scores[id] = average(scored.map((r) => r.pillarScores[id] || 0));
        return scores;
      }, {} as Record<ChallengePillarId, number>);

      const ranked = PILLARS.map((id) => ({
        name: config.pillars[id]?.name || id,
        score: pillarScores[id],
      })).sort((a, b) => b.score - a.score);

      const overallScore = average(scored.map((r) => r.overallScore));
      weeks.push({
        week: weeks.length + 1,
        startDay: index + 1,
        endDay: index + weekReports.length,
        overallScore,
        grade: getGrade(overallScore),
        bestPillar: ranked[0]?.name || 'None',
        worstPillar: ranked[ranked.length - 1]?.name || 'None',
        pillarScores,
      });
    }
    return weeks;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#06070a]/85 backdrop-blur-md cursor-pointer"
      />

      {/* Sheet panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-[#0E1015] border border-[#242A39] rounded-2xl p-6 shadow-2xl flex flex-col overflow-y-auto space-y-6 scrollbar-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#12B886] uppercase">
              MISSION ANALYTICS
            </span>
            <h2 className="text-2xl font-black text-white mt-1">90-Day Lock-In Details</h2>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-xl border border-[#242A39] bg-[#141822] hover:bg-[#1C2030] text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 90-Day Timeline Grid */}
        <section className="rounded-2xl border border-[#242A39] bg-[#11131B] p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white">90-Day Timeline</h3>
              <p className="text-xs text-gray-500 mt-1">Tap any unlocked day for a pillar breakdown.</p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-gray-500">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#2ECC71]" /> Complete</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#F39C12]" /> Partial</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#E74C3C]" /> Missed</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#1a1b1e] border border-gray-800" /> Future</span>
            </div>
          </div>
          <div className="overflow-x-auto scroll-hide pb-2">
            <div className="grid grid-flow-col grid-rows-3 auto-cols-[56px] gap-2 min-w-max">
              {reports.map((report) => {
                const isToday = report.dayNumber === currentDay;
                const isFuture = report.future;
                return (
                  <button
                    key={report.dayNumber}
                    type="button"
                    onClick={() => !isFuture && setSelectedReport(report)}
                    disabled={isFuture}
                    className={`relative h-14 rounded-xl border text-left p-2 transition ${
                      isToday ? 'border-[#FF6B35] ring-1 ring-[#FF6B35]/30' : 'border-[#272D3C]'
                    } ${isFuture ? 'cursor-not-allowed opacity-40' : 'hover:scale-[1.03]'}`}
                    style={{ backgroundColor: getTimelineColor(report) }}
                  >
                    <span className={`block text-[10px] font-mono font-black ${isFuture ? 'text-gray-500' : 'text-black'}`}>
                      D{report.dayNumber}
                    </span>
                    <span className={`mt-1 block text-[9px] font-mono ${isFuture ? 'text-gray-600' : 'text-black/70'}`}>
                      {isFuture ? 'LOCK' : `${report.overallScore}%`}
                    </span>
                    {isFuture && (
                      <Lock className="absolute bottom-1.5 right-1.5 h-3 w-3 text-gray-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Reports & Milestones split */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Weekly Reports */}
          <div className="rounded-2xl border border-[#242A39] bg-[#11131B] p-5">
            <h3 className="text-base font-extrabold text-white mb-4">Weekly Report Cards</h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {weeklyReports.map((week) => {
                const isOpen = openWeek === week.week;
                return (
                  <div key={week.week} className="rounded-xl border border-[#242A39] bg-[#151722] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenWeek(isOpen ? 0 : week.week)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <div>
                        <div className="text-sm font-extrabold text-white">Week {week.week}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Days {week.startDay}–{week.endDay}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-black ${getScoreTone(week.overallScore)}`}>
                          {week.grade}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#202637] bg-[#0E1015] px-4 py-4 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {PILLARS.map((pillarId) => {
                            const pillar = config.pillars[pillarId];
                            const score = week.pillarScores[pillarId] || 0;
                            if (!pillar) return null;
                            return (
                              <div key={pillarId} className="rounded-xl bg-[#151722] border border-[#222838] p-2.5 text-left">
                                <div className="text-[9px] font-bold text-gray-500 uppercase">{pillar.name}</div>
                                <div className="mt-1 flex items-baseline justify-between">
                                  <span className="text-base font-black font-mono text-white">{score}%</span>
                                  <span style={{ color: pillar.color }} className="text-[10px] font-bold">
                                    {getGrade(score)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="rounded-lg border border-[#2ECC71]/20 bg-[#2ECC71]/5 px-3 py-2 text-[#2ECC71]">
                            🔥 Best: {week.bestPillar}
                          </div>
                          <div className="rounded-lg border border-[#E74C3C]/20 bg-[#E74C3C]/5 px-3 py-2 text-[#FF7B72]">
                            ⚠️ Low: {week.worstPillar}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestone Badges */}
          <div className="rounded-2xl border border-[#242A39] bg-[#11131B] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-white">Milestone Badges</h3>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset the challenge start date and logs? This cannot be undone.')) {
                      onResetChallenge();
                      onClose();
                    }
                  }}
                  className="h-8 px-2.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer"
                  title="Reset 90-Day Challenge"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Challenge</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {milestones.map((milestone) => {
                  const IconComp = getMilestoneIconComp(milestone.icon);
                  return (
                    <div
                      key={milestone.day}
                      className={`rounded-xl border p-3.5 transition flex items-center gap-3 ${
                        milestone.unlocked
                          ? 'border-[#F1C40F]/30 bg-[#F1C40F]/5'
                          : 'border-[#242A39] bg-[#0E1015] opacity-40 grayscale'
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${
                          milestone.unlocked
                            ? 'border-[#F1C40F]/35 text-[#F1C40F] bg-[#F1C40F]/10'
                            : 'border-[#2A3040] text-gray-600 bg-[#151821]'
                        }`}
                      >
                        {milestone.unlocked ? <IconComp className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black text-white">{milestone.title}</div>
                        <div className="text-[9px] font-mono text-gray-500 mt-0.5">Day {milestone.day}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-[10px] text-gray-500 text-left mt-4 border-t border-gray-800/60 pt-3">
              Unlock milestones sequentially to reach the legendary 90-Day finish line.
            </div>
          </div>
        </section>

        {/* Dev Tools Simulator */}
        {isChallengeDevToolsEnabled && (
          <section className="rounded-2xl border border-dashed border-[#6C63FF]/30 bg-[#6C63FF]/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="text-left">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#9D97FF]">
                  <Wrench className="h-3.5 w-3.5" />
                  Dev Simulation Tools
                </div>
                <h3 className="mt-2 text-sm font-extrabold text-white">Simulate Challenge Day</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {simulatedDay != null
                    ? `Currently simulating Day ${simulatedDay} (${asOfDate}).`
                    : 'Currently using the actual calendar date.'}
                </p>
              </div>
              <div className="flex gap-2">
                {simulatedDay != null && (
                  <button
                    onClick={() => {
                      onSimulateDay(null);
                      setSliderDay(currentDay);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Reset to Real Date
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {DEV_DAY_PRESETS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSliderDay(day);
                    onSimulateDay(day);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    simulatedDay === day
                      ? 'border-[#6C63FF] bg-[#6C63FF]/20 text-[#B8B4FF]'
                      : 'border-[#2A3040] bg-[#151821] text-gray-400 hover:text-white'
                  }`}
                >
                  Day {day}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={CHALLENGE_LENGTH}
                value={sliderDay}
                onChange={(e) => setSliderDay(Number(e.target.value))}
                onMouseUp={() => onSimulateDay(sliderDay)}
                onTouchEnd={() => onSimulateDay(sliderDay)}
                className="flex-1 accent-[#6C63FF] cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-[#9D97FF]">Day {sliderDay} / 90</span>
            </div>
          </section>
        )}

        {/* Inner selected report modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#2B3142] bg-[#0F1118] p-5 shadow-2xl text-left">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#12B886]">
                    {selectedReport.date}
                  </span>
                  <h4 className="text-xl font-black text-white mt-0.5">Day {selectedReport.dayNumber} Summary</h4>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="h-8 w-8 rounded-lg border border-[#242A39] bg-[#151821] text-gray-500 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-[#242A39] bg-[#0B0D12] p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Day Performance Score</span>
                <span className="text-xl font-black text-white font-mono">
                  {selectedReport.overallScore}% <span className="text-xs text-[#F1C40F]">{selectedReport.grade}</span>
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {PILLARS.map((pillarId) => {
                  const pillar = config.pillars[pillarId];
                  const score = selectedReport.pillarScores[pillarId] ?? 0;
                  if (!pillar) return null;
                  return (
                    <div key={pillarId}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-gray-300">{pillar.name}</span>
                        <span className="font-mono text-gray-500">{score}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#1A1D26] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${score}%`,
                            background: `linear-gradient(90deg, ${pillar.color}, ${pillar.accentColor})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
