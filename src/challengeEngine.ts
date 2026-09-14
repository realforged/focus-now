import { ChallengeConfig, ChallengePillar, ChallengePillarId, Category, DayReport, Habit, MilestoneBadge, Routine } from './types';
import { dateToday, formatDateString, isHabitScheduledForDate, getStandaloneHabits, getRoutineHabits, isRoutineScheduledForDate } from './data';

export const CONFIG_KEY = 'challenge_config';
export const SEEN_KEY = 'challenge_seen_milestones';
export const TARGET_LOGS_KEY = 'challenge_target_logs';
export const DEV_SIM_DAY_KEY = 'challenge_dev_simulated_day';

export const isChallengeDevToolsEnabled = import.meta.env.DEV;

export const CHALLENGE_LENGTH = 90;
export const MILESTONES = [7, 21, 30, 60, 90];
export const PILLARS: ChallengePillarId[] = ['fitness', 'diet', 'career', 'recovery', 'mind'];

export const milestoneCopy: Record<number, { title: string; icon: string }> = {
  7: { title: 'First Week Warrior', icon: 'Flame' },
  21: { title: 'Habit Former', icon: 'BadgeCheck' },
  30: { title: 'One Month Locked', icon: 'Zap' },
  60: { title: 'Halfway Hero', icon: 'Sparkles' },
  90: { title: '90-Day Legend', icon: 'Trophy' },
};

export const defaultPillars: Record<ChallengePillarId, ChallengePillar> = {
  fitness: {
    id: 'fitness',
    name: 'Fitness',
    categories: ['Fitness'],
    color: '#FF6B35',
    accentColor: '#FF8C42',
    icon: 'dumbbell',
    customTargets: [{ id: 'fit-1', label: 'Train with intent' }],
  },
  diet: {
    id: 'diet',
    name: 'Diet',
    categories: ['Diet'],
    color: '#2ECC71',
    accentColor: '#27AE60',
    icon: 'leaf',
    customTargets: [{ id: 'diet-1', label: 'Hit diet basics' }],
  },
  career: {
    id: 'career',
    name: 'Career',
    categories: ['Career'],
    color: '#6C63FF',
    accentColor: '#5B4FE8',
    icon: 'briefcase',
    customTargets: [{ id: 'career-1', label: 'One deep work block' }],
  },
  recovery: {
    id: 'recovery',
    name: 'Recovery',
    categories: ['Recovery'],
    color: '#06B6D4',
    accentColor: '#0891B2',
    icon: 'moon',
    customTargets: [{ id: 'rec-1', label: '8 hours of sleep' }],
  },
  mind: {
    id: 'mind',
    name: 'Mind',
    categories: ['Mind'],
    color: '#F1C40F',
    accentColor: '#E67E22',
    icon: 'target',
    customTargets: [{ id: 'mind-1', label: '10 min mindfulness / reading' }],
  },
};

type TargetLogs = Record<string, Record<string, boolean>>;

export interface WeeklyReport {
  week: number;
  startDay: number;
  endDay: number;
  overallScore: number;
  grade: string;
  bestPillar: string;
  worstPillar: string;
  pillarScores: Record<ChallengePillarId, number>;
}

const parseDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const daysBetween = (startDate: string, endDate: string): number => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  return Math.floor(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
      86400000
  );
};

export const addDays = (dateStr: string, offset: number): string => {
  const next = parseDate(dateStr);
  next.setDate(next.getDate() + offset);
  return formatDateString(next);
};

export const clampPercent = (value: number): number =>
  Math.min(100, Math.max(0, Math.round(value)));

export const getDayNumber = (startDate: string, dateStr = dateToday): number =>
  daysBetween(startDate, dateStr) + 1;

export const getGrade = (score: number): string => {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
};

export const getScoreTone = (score: number): string => {
  if (score >= 80) return 'bg-[#2ECC71] text-black border-[#2ECC71]';
  if (score >= 45) return 'bg-[#F39C12] text-black border-[#F39C12]';
  return 'bg-[#E74C3C] text-white border-[#E74C3C]';
};

export const getTimelineColor = (report: DayReport): string => {
  if (report.future || report.locked) return '#1a1b1e';
  if (report.overallScore >= 80) return '#2ECC71';
  if (report.overallScore >= 45) return '#F39C12';
  return '#E74C3C';
};

export const readConfig = (): ChallengeConfig | null => {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChallengeConfig;
    if (!parsed?.isActive || !parsed.startDate || !parsed.pillars) return null;
    return ensureReadingOnMind(parsed);
  } catch (error) {
    console.error('Unable to read challenge config:', error);
    return null;
  }
};

const pillarHasCategory = (config: ChallengeConfig, category: Category): boolean =>
  PILLARS.some((id) => config.pillars[id]?.categories.includes(category));

const ensureReadingOnMind = (config: ChallengeConfig): ChallengeConfig => {
  if (pillarHasCategory(config, 'Mind')) return config;
  const mind = config.pillars.mind;
  if (!mind) return config;
  return {
    ...config,
    pillars: {
      ...config.pillars,
      mind: { ...mind, categories: [...mind.categories, 'Mind'] },
    },
  };
};

export const saveConfig = (config: ChallengeConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const readDevSimulatedDay = (): number | null => {
  if (!isChallengeDevToolsEnabled) return null;
  try {
    const raw = sessionStorage.getItem(DEV_SIM_DAY_KEY);
    if (!raw) return null;
    const day = Number(raw);
    if (!Number.isFinite(day) || day < 1 || day > CHALLENGE_LENGTH) return null;
    return Math.round(day);
  } catch {
    return null;
  }
};

export const setDevSimulatedDay = (day: number | null) => {
  if (!isChallengeDevToolsEnabled) return;
  if (day == null) {
    sessionStorage.removeItem(DEV_SIM_DAY_KEY);
    return;
  }
  sessionStorage.setItem(DEV_SIM_DAY_KEY, String(Math.min(CHALLENGE_LENGTH, Math.max(1, Math.round(day)))));
};

export const getChallengeAsOfDate = (config: ChallengeConfig): string => {
  const simulatedDay = readDevSimulatedDay();
  if (simulatedDay != null) {
    return addDays(config.startDate, simulatedDay - 1);
  }
  return dateToday;
};

export const getEffectiveCurrentDay = (startDate: string, asOfDate = dateToday): number =>
  Math.min(CHALLENGE_LENGTH, Math.max(1, getDayNumber(startDate, asOfDate)));

export const readSeenMilestones = (): Set<number> => {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const values = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(values) ? values.map(Number) : []);
  } catch (error) {
    console.error('Unable to read seen milestones:', error);
    return new Set();
  }
};

export const saveSeenMilestones = (seen: Set<number>) => {
  localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)));
};

export const readTargetLogs = (): TargetLogs => {
  try {
    const raw = localStorage.getItem(TARGET_LOGS_KEY);
    return raw ? (JSON.parse(raw) as TargetLogs) : {};
  } catch (error) {
    console.error('Unable to read target logs:', error);
    return {};
  }
};

export const saveTargetLogs = (logs: TargetLogs) => {
  localStorage.setItem(TARGET_LOGS_KEY, JSON.stringify(logs));
};

export const targetKey = (pillarId: ChallengePillarId, targetId: string): string =>
  `${pillarId}:${targetId}`;

export const isTargetComplete = (
  logs: TargetLogs,
  dateStr: string,
  pillarId: ChallengePillarId,
  targetId: string
): boolean => Boolean(logs[dateStr]?.[targetKey(pillarId, targetId)]);

export const toggleTargetComplete = (
  dateStr: string,
  pillarId: ChallengePillarId,
  targetId: string
): TargetLogs => {
  const logs = readTargetLogs();
  const key = targetKey(pillarId, targetId);
  const dayLogs = { ...(logs[dateStr] || {}) };
  dayLogs[key] = !dayLogs[key];
  const next = { ...logs, [dateStr]: dayLogs };
  saveTargetLogs(next);
  return next;
};

const average = (values: number[]): number =>
  values.length === 0 ? 0 : clampPercent(values.reduce((sum, value) => sum + value, 0) / values.length);

const getRoutineDomCategory = (routine: Routine, habits: Habit[]): Category => {
  const rh = habits.filter(h => routine.habitIds.includes(h.id) || h.routineId === routine.id);
  if (rh.length === 0) return 'Mind';
  const counts: Record<string, number> = {};
  rh.forEach(h => { counts[h.category] = (counts[h.category] || 0) + 1; });
  let maxCat: Category = rh[0].category;
  let maxN = 0;
  Object.keys(counts).forEach(cat => {
    if (counts[cat]! > maxN) { maxN = counts[cat]!; maxCat = cat as Category; }
  });
  return maxCat;
};

export const getPillarProgress = (
  habits: Habit[],
  pillar: ChallengePillar,
  dateStr: string,
  targetLogs: TargetLogs = readTargetLogs(),
  routines: Routine[] = []
): number => {
  const standalone = getStandaloneHabits(habits, routines).filter(
    (habit) => pillar.categories.includes(habit.category) && isHabitScheduledForDate(habit, dateStr)
  );

  const pillarRoutines = routines.filter((r) => {
    if (!isRoutineScheduledForDate(r, dateStr)) return false;
    const domCat = getRoutineDomCategory(r, habits);
    return pillar.categories.includes(domCat) && getRoutineHabits(r, habits, dateStr).length > 0;
  });

  const habitRatios = standalone.map((habit) => {
    const target = Math.max(1, Number(habit.target) || 1);
    const value = Math.max(0, Number(habit.history?.[dateStr] || 0));
    return Math.min(1, value / target);
  });

  const routineRatios = pillarRoutines.map((r) => {
    const rh = getRoutineHabits(r, habits, dateStr);
    if (rh.length === 0) return 0;
    const done = rh.filter((h) => (h.history[dateStr] || 0) >= h.target).length;
    return done / rh.length;
  });

  const targetRatios = pillar.customTargets.map((target) =>
    isTargetComplete(targetLogs, dateStr, pillar.id, target.id) ? 1 : 0
  );

  const allRatios = [...habitRatios, ...routineRatios, ...targetRatios];
  if (allRatios.length === 0) return 0;
  return clampPercent((allRatios.reduce((sum, ratio) => sum + ratio, 0) / allRatios.length) * 100);
};

export const getDayReport = (
  config: ChallengeConfig,
  habits: Habit[],
  dateStr: string,
  targetLogs: TargetLogs = readTargetLogs(),
  asOfDate = getChallengeAsOfDate(config),
  routines: Routine[] = []
): DayReport => {
  const dayNumber = getDayNumber(config.startDate, dateStr);
  const future = daysBetween(asOfDate, dateStr) > 0;
  const locked = dayNumber < 1 || dayNumber > CHALLENGE_LENGTH;

  const pillarScores = PILLARS.reduce((scores, id) => {
    scores[id] =
      future || locked ? 0 : getPillarProgress(habits, config.pillars[id], dateStr, targetLogs, routines);
    return scores;
  }, {} as Record<ChallengePillarId, number>);

  const overallScore =
    future || locked
      ? 0
      : clampPercent(PILLARS.reduce((sum, id) => sum + pillarScores[id], 0) / PILLARS.length);

  return {
    day: dayNumber,
    date: dateStr,
    dayNumber,
    locked,
    future,
    overallScore,
    grade: getGrade(overallScore),
    pillarScores,
  };
};

export const buildAllDayReports = (
  config: ChallengeConfig,
  habits: Habit[],
  targetLogs: TargetLogs = readTargetLogs(),
  asOfDate = getChallengeAsOfDate(config),
  routines: Routine[] = []
): DayReport[] =>
  Array.from({ length: CHALLENGE_LENGTH }, (_, index) =>
    getDayReport(config, habits, addDays(config.startDate, index), targetLogs, asOfDate, routines)
  );

export const buildWeeklyReports = (
  reports: DayReport[],
  config: ChallengeConfig
): WeeklyReport[] => {
  const weeks: WeeklyReport[] = [];
  for (let index = 0; index < CHALLENGE_LENGTH; index += 7) {
    const weekReports = reports.slice(index, Math.min(index + 7, CHALLENGE_LENGTH));
    const scored = weekReports.filter((report) => !report.future && !report.locked);
    const pillarScores = PILLARS.reduce((scores, id) => {
      scores[id] = average(scored.map((report) => report.pillarScores[id]));
      return scores;
    }, {} as Record<ChallengePillarId, number>);
    const ranked = PILLARS.map((id) => ({
      name: config.pillars[id].name,
      score: pillarScores[id],
    })).sort((a, b) => b.score - a.score);
    const overallScore = average(scored.map((report) => report.overallScore));
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
};

export const getCurrentStreak = (reports: DayReport[], currentDay: number): number => {
  let streak = 0;
  for (let index = Math.min(currentDay, CHALLENGE_LENGTH) - 1; index >= 0; index -= 1) {
    const report = reports[index];
    if (!report || report.future || report.overallScore < 80) break;
    streak += 1;
  }
  return streak;
};

export const getPillarStreak = (
  reports: DayReport[],
  pillarId: ChallengePillarId,
  currentDay: number
): number => {
  let streak = 0;
  for (let index = Math.min(currentDay, CHALLENGE_LENGTH) - 1; index >= 0; index -= 1) {
    const report = reports[index];
    if (!report || report.future || (report.pillarScores[pillarId] || 0) < 80) break;
    streak += 1;
  }
  return streak;
};

export const getMilestoneStatus = (
  config: ChallengeConfig,
  currentDay: number,
  seen: Set<number> = readSeenMilestones()
): MilestoneBadge[] =>
  config.milestones.map((day) => ({
    day,
    title: milestoneCopy[day]?.title || `Day ${day}`,
    icon: milestoneCopy[day]?.icon || 'Sparkles',
    unlocked: currentDay >= day,
    seen: seen.has(day),
  }));

export const createDefaultConfig = (): ChallengeConfig => ({
  startDate: dateToday,
  pillars: defaultPillars,
  milestones: MILESTONES,
  isActive: true,
});

export const resetChallengeStorage = () => {
  localStorage.removeItem(CONFIG_KEY);
  localStorage.removeItem(SEEN_KEY);
  localStorage.removeItem(TARGET_LOGS_KEY);
  if (isChallengeDevToolsEnabled) {
    sessionStorage.removeItem(DEV_SIM_DAY_KEY);
  }
};

