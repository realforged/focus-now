import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Dumbbell,
  Flame,
  Leaf,
  Lock,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  ChallengeConfig,
  ChallengePillar,
  ChallengePillarId,
  Category,
  DayReport,
  Habit,
  MilestoneBadge,
} from '../types';
import { dateToday, isHabitScheduledForDate } from '../data';
import {
  buildAllDayReports,
  buildWeeklyReports,
  CHALLENGE_LENGTH,
  createDefaultConfig,
  defaultPillars,
  getChallengeAsOfDate,
  getCurrentStreak,
  getEffectiveCurrentDay,
  getDayReport,
  getGrade,
  getMilestoneStatus,
  getPillarStreak,
  getScoreTone,
  getTimelineColor,
  isChallengeDevToolsEnabled,
  MILESTONES,
  PILLARS,
  readConfig,
  readDevSimulatedDay,
  readSeenMilestones,
  resetChallengeStorage,
  saveConfig,
  saveSeenMilestones,
  setDevSimulatedDay,
  toggleTargetComplete,
  isTargetComplete,
  readTargetLogs,
} from '../challengeEngine';

interface ChallengePageProps {
  habits: Habit[];
}

const CATEGORIES: Category[] = ['Fitness', 'Diet', 'Career', 'Recovery', 'Mind'];
const DEV_DAY_PRESETS = [1, 7, 21, 30, 60, 90];

const getPillarIcon = (pillar: ChallengePillar) => {
  if (pillar.icon === 'dumbbell') return Dumbbell;
  if (pillar.icon === 'leaf') return Leaf;
  if (pillar.icon === 'briefcase') return BriefcaseBusiness;
  return Target;
};

const getMilestoneIcon = (icon: string) => {
  if (icon === 'Flame') return Flame;
  if (icon === 'BadgeCheck') return BadgeCheck;
  if (icon === 'Zap') return Zap;
  if (icon === 'Trophy') return Trophy;
  return Sparkles;
};

const CONFETTI_COLORS = ['#FF6B35', '#2ECC71', '#6C63FF', '#F1C40F', '#E74C3C', '#FFD43B'];

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, index) => ({
        id: index,
        left: `${(index * 2.7) % 100}%`,
        delay: `${(index % 8) * 0.08}s`,
        duration: `${2.2 + (index % 5) * 0.25}s`,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="challenge-confetti-piece"
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          }}
        />
      ))}
    </div>
  );
}

function DevDaySimulator({
  currentDay,
  simulatedDay,
  asOfDate,
  onSimulateDay,
  onReplayMilestone,
}: {
  currentDay: number;
  simulatedDay: number | null;
  asOfDate: string;
  onSimulateDay: (day: number | null) => void;
  onReplayMilestone: () => void;
}) {
  const [sliderDay, setSliderDay] = useState(simulatedDay ?? currentDay);

  useEffect(() => {
    setSliderDay(simulatedDay ?? currentDay);
  }, [simulatedDay, currentDay]);

  return (
    <section className="rounded-2xl border border-dashed border-[#6C63FF]/40 bg-[#6C63FF]/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#9D97FF]">
            <Wrench className="h-3.5 w-3.5" />
            Dev Tools
          </div>
          <h2 className="mt-2 text-sm font-extrabold text-white">Simulate Challenge Day</h2>
          <p className="mt-1 text-xs text-gray-500">
            Preview timeline, milestones, and reports as if the challenge were on a different day.
            {simulatedDay != null ? ` Currently simulating Day ${simulatedDay} (${asOfDate}).` : ' Using real date.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReplayMilestone}
            className="rounded-lg border border-[#F1C40F]/30 bg-[#F1C40F]/10 px-3 py-2 text-[11px] font-bold text-[#F1C40F] hover:bg-[#F1C40F]/15 transition"
          >
            Replay Milestone
          </button>
          {simulatedDay != null && (
            <button
              type="button"
              onClick={() => onSimulateDay(null)}
              className="rounded-lg border border-[#2A3040] bg-[#151821] px-3 py-2 text-[11px] font-bold text-gray-300 hover:text-white transition"
            >
              Use Real Date
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {DEV_DAY_PRESETS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => {
              setSliderDay(day);
              onSimulateDay(day);
            }}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition ${
              simulatedDay === day
                ? 'border-[#6C63FF] bg-[#6C63FF]/20 text-[#B8B4FF]'
                : 'border-[#2A3040] bg-[#151821] text-gray-400 hover:text-white'
            }`}
          >
            Day {day}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="range"
          min={1}
          max={CHALLENGE_LENGTH}
          value={sliderDay}
          onChange={(event) => setSliderDay(Number(event.target.value))}
          onMouseUp={() => onSimulateDay(sliderDay)}
          onTouchEnd={() => onSimulateDay(sliderDay)}
          className="w-full sm:flex-1 accent-[#6C63FF]"
          aria-label="Simulate challenge day"
        />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-black font-mono text-white w-16 text-right">Day {sliderDay}</span>
          <button
            type="button"
            onClick={() => onSimulateDay(sliderDay)}
            className="rounded-lg bg-[#6C63FF] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#5B4FE8] transition"
          >
            Apply
          </button>
        </div>
      </div>
    </section>
  );
}

export default function ChallengePage({ habits }: ChallengePageProps) {
  const [config, setConfig] = useState<ChallengeConfig | null>(() => readConfig());
  const [draftPillars, setDraftPillars] = useState<Record<ChallengePillarId, ChallengePillar>>(
    () => defaultPillars
  );
  const [targetInputs, setTargetInputs] = useState<Record<ChallengePillarId, string>>({
    fitness: '',
    diet: '',
    career: '',
    goals: '',
  });
  const [targetLogs, setTargetLogs] = useState(() => readTargetLogs());
  const [selectedReport, setSelectedReport] = useState<DayReport | null>(null);
  const [openWeek, setOpenWeek] = useState<number>(1);
  const [celebration, setCelebration] = useState<MilestoneBadge | null>(null);
  const [devSimDay, setDevSimDayState] = useState<number | null>(() => readDevSimulatedDay());
  const [milestoneReplayTick, setMilestoneReplayTick] = useState(0);

  const challengeAsOfDate = config ? getChallengeAsOfDate(config) : dateToday;
  const isSimulating = devSimDay != null;

  const reports = useMemo(() => {
    if (!config) return [];
    return buildAllDayReports(config, habits, targetLogs, challengeAsOfDate);
  }, [config, habits, targetLogs, challengeAsOfDate]);

  const rawCurrentDay = config ? getEffectiveCurrentDay(config.startDate, challengeAsOfDate) : 1;
  const currentDay = Math.min(CHALLENGE_LENGTH, Math.max(1, rawCurrentDay));
  const todayReport = config
    ? getDayReport(config, habits, challengeAsOfDate, targetLogs, challengeAsOfDate)
    : null;
  const completedDays = config ? Math.min(Math.max(rawCurrentDay, 0), CHALLENGE_LENGTH) : 0;
  const overallCompletion = todayReport?.overallScore ?? 0;
  const daysRemaining = Math.max(0, CHALLENGE_LENGTH - completedDays);
  const currentStreak = config ? getCurrentStreak(reports, currentDay) : 0;
  const weeklyReports = useMemo(
    () => (config ? buildWeeklyReports(reports, config) : []),
    [config, reports]
  );

  const milestones = useMemo<MilestoneBadge[]>(() => {
    if (!config) return [];
    return getMilestoneStatus(config, rawCurrentDay);
  }, [config, rawCurrentDay, milestoneReplayTick]);

  useEffect(() => {
    const nextMilestone = milestones.find((milestone) => milestone.unlocked && !milestone.seen);
    if (!nextMilestone) return;
    const seen = readSeenMilestones();
    seen.add(nextMilestone.day);
    saveSeenMilestones(seen);
    setCelebration({ ...nextMilestone, seen: true });
  }, [milestones]);

  const startChallenge = () => {
    const nextConfig: ChallengeConfig = { ...createDefaultConfig(), pillars: draftPillars };
    saveConfig(nextConfig);
    localStorage.removeItem('challenge_seen_milestones');
    setConfig(nextConfig);
  };

  const resetChallenge = () => {
    resetChallengeStorage();
    setConfig(null);
    setDraftPillars(defaultPillars);
    setTargetLogs({});
    setSelectedReport(null);
    setCelebration(null);
    setDevSimDayState(null);
  };

  const handleToggleTarget = (pillarId: ChallengePillarId, targetId: string) => {
    const next = toggleTargetComplete(challengeAsOfDate, pillarId, targetId);
    setTargetLogs(next);
  };

  const handleDevSimulateDay = (day: number | null) => {
    setDevSimulatedDay(day);
    setDevSimDayState(day);
  };

  const handleReplayMilestone = () => {
    const milestoneToReplay = [...MILESTONES].reverse().find((day) => day <= rawCurrentDay);
    if (!milestoneToReplay) return;
    const seen = readSeenMilestones();
    seen.delete(milestoneToReplay);
    saveSeenMilestones(seen);
    setCelebration(null);
    setMilestoneReplayTick((tick) => tick + 1);
  };

  const toggleCategory = (pillarId: ChallengePillarId, category: Category) => {
    setDraftPillars((current) => {
      const pillar = current[pillarId];
      const nextCategories = pillar.categories.includes(category)
        ? pillar.categories.filter((item) => item !== category)
        : [...pillar.categories, category];
      return {
        ...current,
        [pillarId]: {
          ...pillar,
          categories: nextCategories.length > 0 ? nextCategories : pillar.categories,
        },
      };
    });
  };

  const addTarget = (pillarId: ChallengePillarId) => {
    const label = targetInputs[pillarId].trim();
    if (!label) return;
    setDraftPillars((current) => ({
      ...current,
      [pillarId]: {
        ...current[pillarId],
        customTargets: [
          ...current[pillarId].customTargets,
          { id: `${pillarId}-${Date.now()}`, label },
        ],
      },
    }));
    setTargetInputs((current) => ({ ...current, [pillarId]: '' }));
  };

  const removeTarget = (pillarId: ChallengePillarId, targetId: string) => {
    setDraftPillars((current) => ({
      ...current,
      [pillarId]: {
        ...current[pillarId],
        customTargets: current[pillarId].customTargets.filter((target) => target.id !== targetId),
      },
    }));
  };

  if (!config) {
    return (
      <div className="page-content max-w-7xl mx-auto space-y-6">
        <section className="relative overflow-hidden rounded-[1.25rem] border border-[#252B3A] bg-[#0D0F15] p-6 md:p-8 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF6B35] via-[#2ECC71] to-[#6C63FF]" />
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/30 bg-[#FF6B35]/10 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF8C42]">
                <Flame className="h-3.5 w-3.5" />
                90-Day Lock-In
              </div>
              <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-normal text-white">
                Start Your 90-Day Lock-In
              </h1>
              <p className="mt-3 text-sm md:text-base leading-7 text-gray-400 max-w-xl">
                Lock a start date, map the four pillars to your existing habit categories, and let
                Focus Now score the journey automatically from your daily logs.
              </p>
            </div>
            <button
              type="button"
              onClick={startChallenge}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-extrabold text-white shadow-[0_0_24px_rgba(255,107,53,0.25)] transition hover:bg-[#FF8C42] active:scale-[0.98]"
            >
              <Zap className="h-4 w-4" />
              Confirm &amp; Lock Start Date
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {PILLARS.map((pillarId) => {
            const pillar = draftPillars[pillarId];
            const Icon = getPillarIcon(pillar);
            return (
              <div key={pillar.id} className="rounded-2xl border border-[#242A39] bg-[#10131A] p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="h-11 w-11 shrink-0 rounded-xl border flex items-center justify-center"
                    style={{
                      borderColor: `${pillar.color}45`,
                      backgroundColor: `${pillar.color}16`,
                      color: pillar.color,
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-extrabold text-white">{pillar.name}</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose which existing habit categories power this pillar.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => {
                    const active = pillar.categories.includes(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(pillarId, category)}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                          active
                            ? 'text-white'
                            : 'border-[#2A3040] bg-[#151821] text-gray-500 hover:text-gray-300'
                        }`}
                        style={
                          active
                            ? {
                                borderColor: `${pillar.color}60`,
                                backgroundColor: `${pillar.color}18`,
                                color: pillar.color,
                              }
                            : undefined
                        }
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                    Optional Daily Targets
                  </div>
                  {pillar.customTargets.map((target) => (
                    <div
                      key={target.id}
                      className="flex items-center gap-2 rounded-xl border border-[#222838] bg-[#0C0E14] px-3 py-2"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0" style={{ color: pillar.color }} />
                      <span className="min-w-0 flex-1 text-sm text-gray-300">{target.label}</span>
                      <button
                        type="button"
                        onClick={() => removeTarget(pillarId, target.id)}
                        className="h-7 w-7 rounded-lg text-gray-600 hover:bg-[#1B1F2B] hover:text-white flex items-center justify-center"
                        aria-label={`Remove ${target.label}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={targetInputs[pillarId]}
                      onChange={(event) =>
                        setTargetInputs((current) => ({
                          ...current,
                          [pillarId]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addTarget(pillarId);
                        }
                      }}
                      placeholder="e.g. Drink 2L water"
                      className="min-w-0 flex-1 rounded-xl border border-[#262C3C] bg-[#0C0E14] px-3 py-2 text-sm text-white outline-none transition focus:border-[#6C63FF]/60"
                    />
                    <button
                      type="button"
                      onClick={() => addTarget(pillarId)}
                      className="h-10 w-10 shrink-0 rounded-xl border border-[#2A3040] bg-[#151821] text-gray-300 hover:text-white hover:bg-[#1C2130] flex items-center justify-center"
                      aria-label={`Add ${pillar.name} target`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    );
  }

  const ringBackground = `conic-gradient(#FF6B35 ${overallCompletion * 3.6}deg, #1A1D26 0deg)`;

  return (
    <div className="page-content max-w-7xl mx-auto space-y-6">
      <section className="relative overflow-hidden rounded-[1.25rem] border border-[#252B3A] bg-[#06070a] p-5 md:p-7 shadow-[0_24px_90px_rgba(0,0,0,0.38)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF6B35] via-[#2ECC71] via-[#6C63FF] to-[#F1C40F]" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/30 bg-[#FF6B35]/10 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF8C42]">
                <Flame className="h-3.5 w-3.5 streak-fire" />
                Day {currentDay} / 90
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-mono font-bold ${
                  todayReport ? getScoreTone(todayReport.overallScore) : 'border-gray-700 text-gray-400'
                }`}
              >
                {isSimulating ? 'Simulated' : 'Today'} {todayReport?.overallScore || 0}%
              </span>
              {isSimulating && (
                <span className="rounded-full border border-[#6C63FF]/35 bg-[#6C63FF]/10 px-3 py-1 text-[10px] font-mono font-bold text-[#9D97FF]">
                  as of {challengeAsOfDate}
                </span>
              )}
            </div>
            <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-normal text-white">
              90-Day Challenge
            </h1>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricTile label="Days Remaining" value={String(daysRemaining)} icon={CalendarDays} />
              <MetricTile
                label="Lock Streak"
                value={`${currentStreak}d`}
                icon={Flame}
                highlight={currentStreak > 0}
              />
              <MetricTile label="Today Grade" value={todayReport?.grade || 'F'} icon={Award} />
              <MetricTile label="Start Date" value={config.startDate.slice(5)} icon={Sparkles} />
            </div>
          </div>
          <div className="flex lg:justify-end">
            <div className="relative h-44 w-44 rounded-full p-3" style={{ background: ringBackground }}>
              <div className="h-full w-full rounded-full bg-[#06070a] border border-[#232838] flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white font-mono">{overallCompletion}%</span>
                <span className="mt-1 text-[10px] font-mono uppercase tracking-widest text-gray-500">
                  Overall
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Pillar Progress</h2>
          <span className="text-[10px] font-mono text-gray-500 md:hidden">Swipe â†’</span>
        </div>
        <div className="flex md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto scroll-hide pb-1 snap-x snap-mandatory">
          {PILLARS.map((pillarId) => {
            const pillar = config.pillars[pillarId];
            const Icon = getPillarIcon(pillar);
            const score = todayReport?.pillarScores[pillarId] || 0;
            const pillarStreak = getPillarStreak(reports, pillarId, currentDay);
            const sparkline = reports
              .slice(Math.max(0, currentDay - 7), currentDay)
              .map((report) => report.pillarScores[pillarId]);
            const scheduledCount = habits.filter(
              (habit) =>
                pillar.categories.includes(habit.category) &&
                isHabitScheduledForDate(habit, challengeAsOfDate)
            ).length;

            return (
              <div
                key={pillar.id}
                className="min-w-[280px] md:min-w-0 snap-start rounded-2xl border border-[#242A39] bg-[#10131A] p-5 overflow-hidden shrink-0 md:shrink"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center"
                      style={{
                        borderColor: `${pillar.color}45`,
                        backgroundColor: `${pillar.color}16`,
                        color: pillar.color,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-white leading-tight">{pillar.name}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {scheduledCount} habits Â· {pillarStreak}d streak
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-black ${getScoreTone(score)}`}>
                    {getGrade(score)}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                      Today
                    </span>
                    <span className="text-xl font-black font-mono text-white">{score}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#1A1D26] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${score}%`,
                        background: `linear-gradient(90deg, ${pillar.color}, ${pillar.accentColor})`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-end gap-1 h-10">
                  {sparkline.map((value, index) => (
                    <div
                      key={`${pillar.id}-${index}`}
                      className="flex-1 rounded-t bg-[#1B1F2B] overflow-hidden h-full flex items-end"
                    >
                      <div
                        className="w-full rounded-t transition-all duration-500"
                        style={{ height: `${Math.max(6, value)}%`, backgroundColor: pillar.color }}
                      />
                    </div>
                  ))}
                </div>

                {pillar.customTargets.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {pillar.customTargets.map((target) => {
                      const done = isTargetComplete(targetLogs, challengeAsOfDate, pillarId, target.id);
                      return (
                        <button
                          key={target.id}
                          type="button"
                          onClick={() => handleToggleTarget(pillarId, target.id)}
                          className={`w-full flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] transition ${
                            done
                              ? 'border-[#2ECC71]/30 bg-[#2ECC71]/10 text-[#2ECC71]'
                              : 'border-[#252B3A] bg-[#0B0D12] text-gray-400 hover:border-[#353C50]'
                          }`}
                        >
                          <span
                            className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                              done ? 'border-[#2ECC71] bg-[#2ECC71]/20' : 'border-[#3A4155]'
                            }`}
                          >
                            {done && <Check className="h-2.5 w-2.5" />}
                          </span>
                          <span className="truncate">{target.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#242A39] bg-[#10131A] p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-white">90-Day Timeline</h2>
            <p className="text-xs text-gray-500 mt-1">Tap any unlocked day for a pillar breakdown.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-gray-500">
            <Legend color="#2ECC71" label="Complete" />
            <Legend color="#F39C12" label="Partial" />
            <Legend color="#E74C3C" label="Missed" />
            <Legend color="#1a1b1e" label="Future" />
          </div>
        </div>
        <div className="overflow-x-auto scroll-hide pb-1">
          <div className="grid grid-flow-col grid-rows-3 auto-cols-[56px] gap-2 min-w-max">
            {reports.map((report) => {
              const isToday = report.date === challengeAsOfDate;
              return (
                <button
                  key={report.dayNumber}
                  type="button"
                  onClick={() => !report.future && !report.locked && setSelectedReport(report)}
                  disabled={report.future || report.locked}
                  className={`relative h-14 rounded-xl border text-left p-2 transition ${
                    isToday ? 'challenge-day-today border-[#FF6B35]' : 'border-[#272D3C]'
                  } ${report.future ? 'cursor-not-allowed' : 'hover:scale-[1.03]'}`}
                  style={{ backgroundColor: getTimelineColor(report) }}
                  aria-label={`Day ${report.dayNumber}`}
                >
                  <span
                    className={`block text-[10px] font-mono font-black ${
                      report.future ? 'text-gray-600' : 'text-black'
                    }`}
                  >
                    D{report.dayNumber}
                  </span>
                  <span
                    className={`mt-1 block text-[9px] font-mono ${
                      report.future ? 'text-gray-700' : 'text-black/70'
                    }`}
                  >
                    {report.future ? 'LOCK' : `${report.overallScore}%`}
                  </span>
                  {report.future && (
                    <Lock className="absolute bottom-2 right-2 h-3 w-3 text-gray-700" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="rounded-2xl border border-[#242A39] bg-[#10131A] p-5">
          <h2 className="text-lg font-extrabold text-white">Weekly Report Cards</h2>
          <div className="mt-4 space-y-2">
            {weeklyReports.map((week) => {
              const isOpen = openWeek === week.week;
              return (
                <div
                  key={week.week}
                  className="rounded-xl border border-[#242A39] bg-[#0B0D12] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenWeek(isOpen ? 0 : week.week)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div>
                      <div className="text-sm font-extrabold text-white">Week {week.week}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Days {week.startDay}â€“{week.endDay}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-lg border px-2.5 py-1 text-xs font-black ${getScoreTone(week.overallScore)}`}
                      >
                        {week.grade}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-500 transition ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#202637] px-4 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {PILLARS.map((pillarId) => {
                          const pillar = config.pillars[pillarId];
                          const score = week.pillarScores[pillarId];
                          return (
                            <div
                              key={pillarId}
                              className="rounded-xl bg-[#11141D] border border-[#222838] p-3"
                            >
                              <div className="text-[10px] font-bold text-gray-500">{pillar.name}</div>
                              <div className="mt-1 flex items-end justify-between">
                                <span className="text-lg font-black font-mono text-white">{score}%</span>
                                <span style={{ color: pillar.color }} className="text-xs font-black">
                                  {getGrade(score)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg border border-[#2ECC71]/20 bg-[#2ECC71]/8 px-3 py-2 text-[#2ECC71]">
                          Best pillar: {week.bestPillar}
                        </div>
                        <div className="rounded-lg border border-[#E74C3C]/20 bg-[#E74C3C]/8 px-3 py-2 text-[#FF7B72]">
                          Needs attention: {week.worstPillar}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#242A39] bg-[#10131A] p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-white">Milestone Badges</h2>
              <p className="text-xs text-gray-500 mt-1">
                Unlocked as your challenge day counter advances.
              </p>
            </div>
            <button
              type="button"
              onClick={resetChallenge}
              className="h-9 w-9 rounded-xl border border-[#2A3040] bg-[#151821] text-gray-500 hover:text-white hover:bg-[#1C2130] flex items-center justify-center"
              aria-label="Reset challenge"
              title="Reset challenge"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            {milestones.map((milestone) => {
              const Icon = getMilestoneIcon(milestone.icon);
              return (
                <div
                  key={milestone.day}
                  className={`rounded-xl border p-4 transition ${
                    milestone.unlocked
                      ? 'border-[#F1C40F]/35 bg-[#F1C40F]/10'
                      : 'border-[#242A39] bg-[#0B0D12] opacity-50 blur-[0.4px] grayscale'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center border ${
                        milestone.unlocked
                          ? 'border-[#F1C40F]/35 text-[#F1C40F] bg-[#F1C40F]/10'
                          : 'border-[#2A3040] text-gray-600 bg-[#151821]'
                      }`}
                    >
                      {milestone.unlocked ? (
                        <Icon className="h-5 w-5" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-white">{milestone.title}</div>
                      <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                        Day {milestone.day}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {isChallengeDevToolsEnabled && config && (
        <DevDaySimulator
          currentDay={currentDay}
          simulatedDay={devSimDay}
          asOfDate={challengeAsOfDate}
          onSimulateDay={handleDevSimulateDay}
          onReplayMilestone={handleReplayMilestone}
        />
      )}

      {selectedReport && (
        <DayReportModal report={selectedReport} config={config} onClose={() => setSelectedReport(null)} />
      )}
      {celebration && (
        <MilestoneModal milestone={celebration} onClose={() => setCelebration(null)} />
      )}
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#242A39] bg-[#10131A] px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-gray-500">
        <Icon className={`h-3.5 w-3.5 ${highlight ? 'streak-fire text-[#FF6B35]' : ''}`} />
        {label}
      </div>
      <div className="mt-2 text-xl font-black text-white font-mono">{value}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function DayReportModal({
  report,
  config,
  onClose,
}: {
  report: DayReport;
  config: ChallengeConfig;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close day report"
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[#2B3142] bg-[#0F1118] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.65)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
              {report.date}
            </div>
            <h2 className="mt-1 text-2xl font-black text-white">Day {report.dayNumber} Report</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-[#2A3040] bg-[#151821] text-gray-500 hover:text-white flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 rounded-xl border border-[#242A39] bg-[#0B0D12] p-4 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-400">Overall</span>
          <span className="text-2xl font-black text-white font-mono">
            {report.overallScore}%{' '}
            <span className="text-base text-[#F1C40F]">{report.grade}</span>
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {PILLARS.map((pillarId) => {
            const pillar = config.pillars[pillarId];
            const score = report.pillarScores[pillarId];
            return (
              <div key={pillarId}>
                <div className="flex items-center justify-between text-xs mb-1.5">
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
  );
}

function MilestoneModal({ milestone, onClose }: { milestone: MilestoneBadge; onClose: () => void }) {
  const Icon = getMilestoneIcon(milestone.icon);
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close milestone"
      />
      <ConfettiBurst />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#F1C40F]/35 bg-[#0F1118] p-6 text-center shadow-[0_24px_90px_rgba(241,196,15,0.18)] milestone-pop">
        <div className="mx-auto h-16 w-16 rounded-2xl border border-[#F1C40F]/40 bg-[#F1C40F]/10 text-[#F1C40F] flex items-center justify-center">
          <Icon className="h-8 w-8" />
        </div>
        <div className="mt-5 text-[10px] font-mono uppercase tracking-widest text-[#F1C40F]">
          Milestone Unlocked
        </div>
        <h2 className="mt-2 text-2xl font-black text-white">{milestone.title}</h2>
        <p className="mt-2 text-sm text-gray-400">
          Day {milestone.day} is locked in. Keep the chain alive.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#F1C40F] px-4 py-3 text-sm font-black text-black hover:bg-[#FFD43B] transition"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

