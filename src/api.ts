import { Habit, Routine, Category, SubHabit } from './types';
import { supabase, isSupabaseConfigured } from './supabase';
import { mapLegacyCategory, dateToday } from './data';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function isRateLimitError(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return error?.status === 429 || message.includes('rate limit') || message.includes('too many requests');
}

function isNetworkError(error: any): boolean {
  if (!error) return false;
  const msg = String(error?.message || error).toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('enotfound') ||
    msg.includes('load failed') ||
    msg.includes('connection refused') ||
    msg.includes('abort') ||
    error.name === 'TypeError' ||
    error.status === 0 ||
    error.status === 502 ||
    error.status === 503 ||
    error.status === 504
  );
}

function hasDemoCredentials(): boolean {
  return Boolean(import.meta.env.VITE_DEMO_EMAIL && import.meta.env.VITE_DEMO_PASSWORD);
}

// ─── LOCAL STORAGE REPOSITORY (OFFLINE-FIRST / FALLBACK ENGINE) ────────────────

interface LocalUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface LocalSession {
  id: string;
  email: string;
  token: string;
}

const LOCAL_USERS_KEY = 'focus_auth_users';
const LOCAL_SESSION_KEY = 'focus_session_user';
const LOCAL_PROFILE_PREFIX = 'focus_profile_';
const LOCAL_HABITS_PREFIX = 'focus_habits_';
const LOCAL_ROUTINES_PREFIX = 'focus_routines_';

async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(password + '_focus_salt_90days');
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }
  return btoa(password + '_focus_salt_90days');
}

function getLocalUsers(): Record<string, LocalUser> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUsers(users: Record<string, LocalUser>): void {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function getLocalSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalSession(session: LocalSession): void {
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('habit_mountain_token', session.token);
}

function clearLocalSession(): void {
  localStorage.removeItem(LOCAL_SESSION_KEY);
  localStorage.removeItem('habit_mountain_token');
}

function getLocalProfile(userId: string, email?: string) {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_PREFIX + userId);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const defaultProfile = {
    id: userId,
    email: email || 'Guest User',
    total_points: 0,
    locked_in_days: 0,
    consecutive_locked_in_streak: 0,
    journey_start_date: dateToday,
  };
  saveLocalProfile(defaultProfile);
  return defaultProfile;
}

function saveLocalProfile(profile: any) {
  if (!profile?.id) return;
  localStorage.setItem(LOCAL_PROFILE_PREFIX + profile.id, JSON.stringify(profile));
}

function createDefaultHabits(userId: string): Habit[] {
  const ts = Date.now();
  return [
    {
      id: `habit_${ts}_1`,
      name: 'Power Workout',
      category: 'Fitness',
      points: 30,
      type: 'Count',
      target: 1,
      unit: 'workout',
      repeat: 'Daily',
      enableFocusTimer: false,
      createdAt: dateToday,
      history: {},
    },
    {
      id: `habit_${ts}_2`,
      name: 'Deep Work Session',
      category: 'Career',
      points: 15,
      type: 'Timer',
      target: 30,
      unit: 'min',
      repeat: 'Daily',
      enableFocusTimer: true,
      createdAt: dateToday,
      history: {},
    },
    {
      id: `habit_${ts}_3`,
      name: 'Mindfulness & Clarity',
      category: 'Mind',
      points: 10,
      type: 'Timer',
      target: 10,
      unit: 'min',
      repeat: 'Daily',
      enableFocusTimer: true,
      createdAt: dateToday,
      history: {},
    },
    {
      id: `habit_${ts}_4`,
      name: 'Track Clean Diet',
      category: 'Diet',
      points: 15,
      type: 'Count',
      target: 1,
      unit: 'day',
      repeat: 'Daily',
      enableFocusTimer: false,
      createdAt: dateToday,
      history: {},
    },
    {
      id: `habit_${ts}_5`,
      name: '8 Hours Quality Sleep',
      category: 'Recovery',
      points: 20,
      type: 'Count',
      target: 8,
      unit: 'hours',
      repeat: 'Daily',
      enableFocusTimer: false,
      createdAt: dateToday,
      history: {},
    },
  ];
}

function getLocalHabits(userId: string): Habit[] {
  try {
    const raw = localStorage.getItem(LOCAL_HABITS_PREFIX + userId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((h: any) => ({
          ...h,
          category: mapLegacyCategory(h.category),
        }));
      }
    }
  } catch {
    // ignore
  }
  const defaults = createDefaultHabits(userId);
  saveLocalHabits(userId, defaults);
  return defaults;
}

function saveLocalHabits(userId: string, habits: Habit[]): void {
  localStorage.setItem(LOCAL_HABITS_PREFIX + userId, JSON.stringify(habits));
}

function getLocalRoutines(userId: string): Routine[] {
  try {
    const raw = localStorage.getItem(LOCAL_ROUTINES_PREFIX + userId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveLocalRoutines(userId: string, routines: Routine[]): void {
  localStorage.setItem(LOCAL_ROUTINES_PREFIX + userId, JSON.stringify(routines));
}

// Track whether remote Supabase has proven unreachable to avoid repeated lag
let supabaseKnownOffline = !isSupabaseConfigured;

// Routine helpers for remote Supabase
async function appendHabitToRoutine(routineId: string, habitId: string): Promise<void> {
  const { data: routine, error: fetchError } = await supabase
    .from('routines')
    .select('habit_ids')
    .eq('id', routineId)
    .maybeSingle();
  if (fetchError) throw new ApiError(fetchError.message, 500);
  if (!routine) throw new ApiError('Routine not found.', 404);

  const currentIds = Array.isArray(routine.habit_ids) ? routine.habit_ids : [];
  if (currentIds.includes(habitId)) return;

  const { error: updateError } = await supabase
    .from('routines')
    .update({ habit_ids: [...currentIds, habitId] })
    .eq('id', routineId);
  if (updateError) throw new ApiError(updateError.message, 500);
}

async function removeHabitFromRoutine(routineId: string, habitId: string): Promise<void> {
  const { data: routine, error: fetchError } = await supabase
    .from('routines')
    .select('habit_ids')
    .eq('id', routineId)
    .maybeSingle();
  if (fetchError) throw new ApiError(fetchError.message, 500);
  if (!routine) return;

  const currentIds = Array.isArray(routine.habit_ids) ? routine.habit_ids : [];
  if (!currentIds.includes(habitId)) return;

  const { error: updateError } = await supabase
    .from('routines')
    .update({ habit_ids: currentIds.filter((id: string) => id !== habitId) })
    .eq('id', routineId);
  if (updateError) throw new ApiError(updateError.message, 500);
}

// Helper to determine effective user id (remote or local)
async function getEffectiveUserId(): Promise<string> {
  if (!supabaseKnownOffline) {
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (userAuth?.user?.id) return userAuth.user.id;
    } catch {
      supabaseKnownOffline = true;
    }
  }
  const session = getLocalSession();
  if (session?.id) return session.id;
  // Fallback to guest
  return 'guest_user';
}

export const api = {
  // ─── AUTHENTICATION & PROFILE ─────────────────────────────────────────────

  async login(emailStr: string, passwordStr: string) {
    const email = emailStr.trim().toLowerCase();

    // 1. Try Supabase if not flagged offline
    if (!supabaseKnownOffline) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: passwordStr });
        if (error) {
          if (isNetworkError(error)) {
            supabaseKnownOffline = true;
          } else {
            throw new ApiError(error.message, error.status || 400);
          }
        } else if (data?.session) {
          const profile = await this.getProfile();
          setLocalSession({ id: data.session.user.id, email, token: data.session.access_token });
          return { token: data.session.access_token, user: profile };
        }
      } catch (err: any) {
        if (isNetworkError(err)) {
          supabaseKnownOffline = true;
        } else if (err instanceof ApiError) {
          throw err;
        }
      }
    }

    // 2. Local Mode Authentication
    const users = getLocalUsers();
    const existing = users[email];
    if (!existing) {
      throw new ApiError('No account found for this email. Click "Create Account" below to register.', 404);
    }

    const hash = await hashPassword(passwordStr);
    if (existing.passwordHash !== hash) {
      throw new ApiError('Incorrect password. Please try again.', 401);
    }

    const token = 'local_token_' + existing.id;
    const session: LocalSession = { id: existing.id, email, token };
    setLocalSession(session);
    const profile = getLocalProfile(existing.id, email);
    return { token, user: profile };
  },

  async logout() {
    clearLocalSession();
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors during signout
    }
  },

  async register(emailStr: string, passwordStr: string) {
    const email = emailStr.trim().toLowerCase();

    if (!supabaseKnownOffline) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: passwordStr,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          if (isNetworkError(error) || isRateLimitError(error)) {
            supabaseKnownOffline = true;
          } else {
            throw new ApiError(error.message, error.status || 400);
          }
        } else if (data?.session) {
          const profile = await this.getProfile();
          setLocalSession({ id: data.session.user.id, email, token: data.session.access_token });
          return { token: data.session.access_token, user: profile };
        } else if (data?.user && !data.session) {
          // Email confirmation required in Supabase
          throw new ApiError('Registration successful. Please check your email to verify your account, then sign in.', 202);
        }
      } catch (err: any) {
        if (isNetworkError(err) || (err instanceof ApiError && err.status === 429)) {
          supabaseKnownOffline = true;
        } else if (err instanceof ApiError) {
          throw err;
        }
      }
    }

    // Local Mode Registration
    const users = getLocalUsers();
    if (users[email]) {
      throw new ApiError('An account with this email already exists. Please sign in.', 400);
    }

    const userId = 'user_' + Date.now();
    const hash = await hashPassword(passwordStr);
    const newUser: LocalUser = {
      id: userId,
      email,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };
    users[email] = newUser;
    saveLocalUsers(users);

    const token = 'local_token_' + userId;
    const session: LocalSession = { id: userId, email, token };
    setLocalSession(session);

    // Initialize baseline profile & habits
    const profile = getLocalProfile(userId, email);
    getLocalHabits(userId); // triggers seed if empty

    return { token, user: profile };
  },

  async loginDemoAccount() {
    if (hasDemoCredentials()) {
      return this.login(import.meta.env.VITE_DEMO_EMAIL, import.meta.env.VITE_DEMO_PASSWORD);
    }
    return this.startGuestSession();
  },

  async startGuestSession() {
    // 1. Try Supabase anonymous login if online
    if (!supabaseKnownOffline) {
      try {
        const { data: existing } = await supabase.auth.getSession();
        if (existing?.session) {
          const profile = await this.getProfile();
          setLocalSession({ id: existing.session.user.id, email: 'guest@focusnow.app', token: existing.session.access_token });
          return { token: existing.session.access_token, user: profile };
        }

        const { data, error } = await supabase.auth.signInAnonymously({
          options: {
            data: { display_name: 'Guest User' },
          },
        });

        if (error) {
          supabaseKnownOffline = true;
        } else if (data?.session) {
          const profile = await this.getProfile();
          setLocalSession({ id: data.session.user.id, email: 'guest@focusnow.app', token: data.session.access_token });
          return { token: data.session.access_token, user: profile };
        }
      } catch {
        supabaseKnownOffline = true;
      }
    }

    // 2. Instant Local Guest Session
    const guestId = 'guest_user';
    const guestEmail = 'guest@focusnow.app';
    const token = 'local_token_guest';
    const session: LocalSession = { id: guestId, email: guestEmail, token };
    setLocalSession(session);

    const profile = getLocalProfile(guestId, guestEmail);
    getLocalHabits(guestId); // seeds habits if empty

    return { token, user: profile };
  },

  getCurrentSession() {
    return getLocalSession();
  },

  setLocalSessionSync(session: LocalSession) {
    setLocalSession(session);
  },

  async getProfile() {
    const session = getLocalSession();
    // In local mode or if using a local token, immediately use local profile
    if (!isSupabaseConfigured || supabaseKnownOffline || session?.token?.startsWith('local_token_')) {
      const userId = session?.id || 'guest_user';
      return getLocalProfile(userId, session?.email || 'charan@focusnow.app');
    }

    if (!supabaseKnownOffline) {
      try {
        const { data: userAuth, error: authError } = await supabase.auth.getUser();
        if (authError || !userAuth?.user) {
          if (session) {
            return getLocalProfile(session.id, session.email);
          }
          if (isNetworkError(authError)) {
            supabaseKnownOffline = true;
          } else {
            throw new ApiError('Not authenticated', 401);
          }
        } else {
          const { data, error } = await supabase.from('profiles').select('*').eq('id', userAuth.user.id).maybeSingle();
          if (error) {
            if (isNetworkError(error)) supabaseKnownOffline = true;
            else throw new ApiError(error.message, 500);
          } else if (data) {
            return data;
          } else {
            const { data: created, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userAuth.user.id,
                email: userAuth.user.email || 'Focus User',
                total_points: 0,
                locked_in_days: 0,
                consecutive_locked_in_streak: 0,
              })
              .select()
              .single();
            if (createError) throw new ApiError(createError.message, 500);
            return created;
          }
        }
      } catch (err: any) {
        if (isNetworkError(err)) supabaseKnownOffline = true;
        else if (session) return getLocalProfile(session.id, session.email);
        else throw err;
      }
    }

    // Local fallback
    const userId = session?.id || 'guest_user';
    return getLocalProfile(userId, session?.email || 'charan@focusnow.app');
  },

  async syncJourney(stats: {
    journey_start_date?: string | null;
    total_points?: number;
    locked_in_days?: number;
    consecutive_locked_in_streak?: number;
  }) {
    const userId = await getEffectiveUserId();

    // Always update local profile backup
    const localProfile = getLocalProfile(userId);
    const updatedLocal = { ...localProfile, ...stats };
    saveLocalProfile(updatedLocal);

    if (!supabaseKnownOffline) {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (userAuth?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .update(stats)
            .eq('id', userAuth.user.id)
            .select()
            .single();
          if (error) {
            if (isNetworkError(error)) supabaseKnownOffline = true;
            else throw new ApiError(error.message, 500);
          } else if (data) {
            return data;
          }
        }
      } catch (err: any) {
        if (isNetworkError(err)) supabaseKnownOffline = true;
      }
    }

    return updatedLocal;
  },

  async resetAllData() {
    const userId = await getEffectiveUserId();

    // Reset local store
    saveLocalProfile({
      id: userId,
      email: getLocalSession()?.email || 'Focus User',
      total_points: 0,
      locked_in_days: 0,
      consecutive_locked_in_streak: 0,
      journey_start_date: null,
    });
    saveLocalHabits(userId, createDefaultHabits(userId));
    saveLocalRoutines(userId, []);

    if (!supabaseKnownOffline) {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (userAuth?.user) {
          const uid = userAuth.user.id;
          await supabase.from('profiles').update({
            total_points: 0,
            locked_in_days: 0,
            consecutive_locked_in_streak: 0,
            journey_start_date: null,
          }).eq('id', uid);

          await supabase.from('habits').delete().eq('user_id', uid);
          await supabase.from('routines').delete().eq('user_id', uid);

          const baselineHabits = createDefaultHabits(uid).map((h) => ({
            name: h.name,
            category: h.category,
            points: h.points,
            type: h.type,
            target: h.target,
            unit: h.unit,
            repeat: h.repeat,
            enable_focus_timer: h.enableFocusTimer,
            user_id: uid,
          }));
          await supabase.from('habits').insert(baselineHabits);
        }
      } catch {
        supabaseKnownOffline = true;
      }
    }
  },

  // ─── HABITS ───────────────────────────────────────────────────────────────

  async getHabits(): Promise<Habit[]> {
    const userId = await getEffectiveUserId();

    if (!supabaseKnownOffline) {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (userAuth?.user) {
          const { data: habits, error: hErr } = await supabase.from('habits').select('*').eq('user_id', userAuth.user.id);
          if (hErr) {
            if (isNetworkError(hErr)) supabaseKnownOffline = true;
            else throw new ApiError(hErr.message, 500);
          } else if (habits) {
            const { data: logs, error: lErr } = await supabase.from('habit_logs').select('*').eq('user_id', userAuth.user.id);
            if (lErr && !isNetworkError(lErr)) throw new ApiError(lErr.message, 500);

            const logsList = logs || [];
            const result: Habit[] = habits.map((h: any) => {
              const hLogs = logsList.filter((l: any) => l.habit_id === h.id);
              const historyMap: { [date: string]: number } = {};
              hLogs.forEach((l: any) => {
                historyMap[l.date] = Number(l.value);
              });
              return {
                id: h.id,
                name: h.name,
                category: mapLegacyCategory(h.category),
                points: h.points,
                type: h.type,
                target: h.target,
                unit: h.unit,
                repeat: h.repeat,
                repeatDays: h.repeat_days,
                timeOfDay: h.time_of_day,
                enableFocusTimer: h.enable_focus_timer,
                routineId: h.routine_id,
                createdAt: h.created_at,
                history: historyMap,
              };
            });
            saveLocalHabits(userId, result);
            return result;
          }
        }
      } catch (err: any) {
        if (isNetworkError(err)) supabaseKnownOffline = true;
        else throw err;
      }
    }

    return getLocalHabits(userId);
  },

  async createHabit(habitData: Partial<Habit>): Promise<Habit> {
    const userId = await getEffectiveUserId();

    if (!supabaseKnownOffline) {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (userAuth?.user) {
          const payload = {
            user_id: userAuth.user.id,
            name: habitData.name,
            category: habitData.category,
            points: habitData.points || 10,
            type: habitData.type || 'Count',
            target: habitData.target || 1,
            unit: habitData.unit || 'reps',
            repeat: habitData.repeat || 'Daily',
            repeat_days: habitData.repeatDays || null,
            time_of_day: habitData.timeOfDay || null,
            enable_focus_timer: habitData.enableFocusTimer || false,
            routine_id: habitData.routineId || null,
          };

          const { data, error } = await supabase.from('habits').insert([payload]).select().single();
          if (error) {
            if (isNetworkError(error)) supabaseKnownOffline = true;
            else throw new ApiError(error.message, 500);
          } else if (data) {
            if (habitData.routineId) {
              await appendHabitToRoutine(habitData.routineId, data.id);
            }
            const newHabit: Habit = {
              id: data.id,
              name: data.name,
              category: mapLegacyCategory(data.category),
              points: data.points,
              type: data.type,
              target: data.target,
              unit: data.unit,
              repeat: data.repeat,
              repeatDays: data.repeat_days,
              timeOfDay: data.time_of_day,
              enableFocusTimer: data.enable_focus_timer,
              routineId: data.routine_id,
              createdAt: data.created_at,
              subHabits: habitData.subHabits || [],
              history: {},
            };
            const currentLocal = getLocalHabits(userId);
            saveLocalHabits(userId, [...currentLocal, newHabit]);
            return newHabit;
          }
        }
      } catch (err: any) {
        if (isNetworkError(err)) supabaseKnownOffline = true;
        else throw err;
      }
    }

    // Local create
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      name: habitData.name || 'New Habit',
      category: habitData.category || 'Fitness',
      points: habitData.points || 10,
      type: habitData.type || 'Count',
      target: habitData.target || 1,
      unit: habitData.unit || 'reps',
      repeat: habitData.repeat || 'Daily',
      repeatDays: habitData.repeatDays,
      timeOfDay: habitData.timeOfDay,
      enableFocusTimer: habitData.enableFocusTimer || false,
      routineId: habitData.routineId,
      createdAt: dateToday,
      subHabits: habitData.subHabits || [],
      history: {},
    };

    const habits = getLocalHabits(userId);
    habits.push(newHabit);
    saveLocalHabits(userId, habits);

    if (habitData.routineId) {
      const routines = getLocalRoutines(userId);
      const rt = routines.find((r) => r.id === habitData.routineId);
      if (rt && !rt.habitIds.includes(newHabit.id)) {
        rt.habitIds.push(newHabit.id);
        saveLocalRoutines(userId, routines);
      }
    }

    return newHabit;
  },

  async logHabit(habitId: string, date: string, value: number) {
    const userId = await getEffectiveUserId();

    // Update local store immediately
    const habits = getLocalHabits(userId);
    const habit = habits.find((h) => h.id === habitId);
    let newValue = value;
    if (habit) {
      newValue = (habit.history[date] || 0) + value;
      habit.history[date] = newValue;
      saveLocalHabits(userId, habits);
    }

    if (!supabaseKnownOffline) {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (userAuth?.user) {
          const { data: current } = await supabase
            .from('habit_logs')
            .select('value')
            .eq('habit_id', habitId)
            .eq('date', date)
            .maybeSingle();

          const dbNewValue = current ? Number(current.value) + value : value;
          const { error } = await supabase
            .from('habit_logs')
            .upsert(
              { habit_id: habitId, user_id: userAuth.user.id, date, value: dbNewValue },
              { onConflict: 'habit_id,date' }
            );
          if (error && !isNetworkError(error)) throw new ApiError(error.message, 500);
        }
      } catch (err: any) {
        if (isNetworkError(err)) supabaseKnownOffline = true;
      }
    }

    return { habitId, date, value: newValue };
  },

  async logHabitAbsolute(habitId: string, date: string, value: number) {
    const userId = await getEffectiveUserId();

    const habits = getLocalHabits(userId);
    const habit = habits.find((h) => h.id === habitId);
    if (habit) {
      habit.history[date] = value;
      saveLocalHabits(userId, habits);
    }

    if (!supabaseKnownOffline) {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (userAuth?.user) {
          await supabase
            .from('habit_logs')
            .upsert(
              { habit_id: habitId, user_id: userAuth.user.id, date, value },
              { onConflict: 'habit_id,date' }
            );
        }
      } catch (err: any) {
        if (isNetworkError(err)) supabaseKnownOffline = true;
      }
    }

    return { habitId, date, value };
  },

  async updateHabit(habitId: string, habitData: Partial<Habit>): Promise<Habit> {
    const userId = await getEffectiveUserId();

    const habits = getLocalHabits(userId);
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) throw new ApiError('Habit not found', 404);

    const prevRoutineId = habit.routineId;
    Object.assign(habit, habitData);
    saveLocalHabits(userId, habits);

    if (habitData.routineId !== undefined && habitData.routineId !== prevRoutineId) {
      const routines = getLocalRoutines(userId);
      if (prevRoutineId) {
        const oldRt = routines.find((r) => r.id === prevRoutineId);
        if (oldRt) oldRt.habitIds = oldRt.habitIds.filter((id) => id !== habitId);
      }
      if (habitData.routineId) {
        const newRt = routines.find((r) => r.id === habitData.routineId);
        if (newRt && !newRt.habitIds.includes(habitId)) newRt.habitIds.push(habitId);
      }
      saveLocalRoutines(userId, routines);
    }

    if (!supabaseKnownOffline) {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (userAuth?.user) {
          const payload: any = {};
          if (habitData.name !== undefined) payload.name = habitData.name;
          if (habitData.category !== undefined) payload.category = habitData.category;
          if (habitData.points !== undefined) payload.points = habitData.points;
          if (habitData.type !== undefined) payload.type = habitData.type;
          if (habitData.target !== undefined) payload.target = habitData.target;
          if (habitData.unit !== undefined) payload.unit = habitData.unit;
          if (habitData.repeat !== undefined) payload.repeat = habitData.repeat;
          if (habitData.repeatDays !== undefined) payload.repeat_days = habitData.repeatDays;
          if (habitData.timeOfDay !== undefined) payload.time_of_day = habitData.timeOfDay;
          if (habitData.enableFocusTimer !== undefined) payload.enable_focus_timer = habitData.enableFocusTimer;
          if (habitData.routineId !== undefined) payload.routine_id = habitData.routineId;

          await supabase.from('habits').update(payload).eq('id', habitId);
        }
      } catch (err: any) {
        if (isNetworkError(err)) supabaseKnownOffline = true;
      }
    }

    return habit;
  },

  async deleteHabit(habitId: string) {
    const userId = await getEffectiveUserId();

    const habits = getLocalHabits(userId).filter((h) => h.id !== habitId);
    saveLocalHabits(userId, habits);

    const routines = getLocalRoutines(userId);
    routines.forEach((r) => {
      r.habitIds = r.habitIds.filter((id) => id !== habitId);
    });
    saveLocalRoutines(userId, routines);

    if (!supabaseKnownOffline) {
      try {
        await supabase.from('habits').delete().eq('id', habitId);
      } catch {
        supabaseKnownOffline = true;
      }
    }
  },

  // ─── SUB-HABITS ───────────────────────────────────────────────────────────

  async addSubHabit(habitId: string, title: string): Promise<Habit> {
    const userId = await getEffectiveUserId();
    const habits = getLocalHabits(userId);
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) throw new ApiError('Habit not found', 404);

    if (!habit.subHabits) habit.subHabits = [];
    const newSub: SubHabit = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      completedHistory: {},
    };
    habit.subHabits.push(newSub);
    saveLocalHabits(userId, habits);
    return habit;
  },

  async toggleSubHabit(habitId: string, subHabitId: string, dateStr: string): Promise<{ habit: Habit; allSubHabitsDone: boolean }> {
    const userId = await getEffectiveUserId();
    const habits = getLocalHabits(userId);
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) throw new ApiError('Habit not found', 404);

    if (!habit.subHabits) habit.subHabits = [];
    const sub = habit.subHabits.find((s) => s.id === subHabitId);
    if (!sub) throw new ApiError('Sub-habit not found', 404);

    if (!sub.completedHistory) sub.completedHistory = {};
    const currentlyDone = Boolean(sub.completedHistory[dateStr]);
    sub.completedHistory[dateStr] = !currentlyDone;

    // Check if all subhabits are now completed
    const allDone = habit.subHabits.length > 0 && habit.subHabits.every((s) => Boolean(s.completedHistory?.[dateStr]));
    if (allDone) {
      habit.history[dateStr] = Math.max(habit.history[dateStr] || 0, habit.target);
    }

    saveLocalHabits(userId, habits);
    return { habit, allSubHabitsDone: allDone };
  },

  async deleteSubHabit(habitId: string, subHabitId: string): Promise<Habit> {
    const userId = await getEffectiveUserId();
    const habits = getLocalHabits(userId);
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) throw new ApiError('Habit not found', 404);

    if (habit.subHabits) {
      habit.subHabits = habit.subHabits.filter((s) => s.id !== subHabitId);
    }
    saveLocalHabits(userId, habits);
    return habit;
  },

  async resetMission(startDateStr?: string): Promise<any> {
    const newStartDate = startDateStr || dateToday;
    localStorage.setItem('journey_start_date', newStartDate);
    return this.syncJourney({
      journey_start_date: newStartDate,
      locked_in_days: 0,
      consecutive_locked_in_streak: 0,
    });
  },

  // ─── ROUTINES ─────────────────────────────────────────────────────────────

  async getRoutines(): Promise<Routine[]> {
    const userId = await getEffectiveUserId();

    if (!supabaseKnownOffline) {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (userAuth?.user) {
          const { data: routines, error: rErr } = await supabase.from('routines').select('*').eq('user_id', userAuth.user.id);
          if (rErr) {
            if (isNetworkError(rErr)) supabaseKnownOffline = true;
            else throw new ApiError(rErr.message, 500);
          } else if (routines) {
            const { data: logs } = await supabase.from('routine_logs').select('*').eq('user_id', userAuth.user.id);
            const logsList = logs || [];

            const result: Routine[] = routines.map((rt: any) => {
              const rLogs = logsList.filter((l: any) => l.routine_id === rt.id);
              const completedMap: { [date: string]: boolean } = {};
              rLogs.forEach((l: any) => {
                completedMap[l.date] = l.completed;
              });
              return {
                id: rt.id,
                name: rt.name,
                points: rt.points,
                timeBlock: rt.time_block,
                repeat: rt.repeat,
                repeatDays: rt.repeat_days,
                habitIds: Array.isArray(rt.habit_ids) ? rt.habit_ids : [],
                completedHistory: completedMap,
              };
            });
            saveLocalRoutines(userId, result);
            return result;
          }
        }
      } catch (err: any) {
        if (isNetworkError(err)) supabaseKnownOffline = true;
      }
    }

    return getLocalRoutines(userId);
  },

  async createRoutine(rtData: {
    name: string;
    points: number;
    timeBlock: 'Morning' | 'Evening' | 'Night' | 'Constant';
    repeat: 'Daily' | 'Custom Days' | 'Today Only';
    habitIds: string[];
  }): Promise<Routine> {
    const userId = await getEffectiveUserId();

    const newRoutine: Routine = {
      id: `routine_${Date.now()}`,
      name: rtData.name,
      points: rtData.points || 50,
      timeBlock: rtData.timeBlock,
      repeat: rtData.repeat || 'Daily',
      habitIds: rtData.habitIds || [],
      completedHistory: {},
    };

    const routines = getLocalRoutines(userId);
    routines.push(newRoutine);
    saveLocalRoutines(userId, routines);

    // Link habits to this routine
    if (rtData.habitIds && rtData.habitIds.length > 0) {
      const habits = getLocalHabits(userId);
      habits.forEach((h) => {
        if (rtData.habitIds.includes(h.id)) {
          h.routineId = newRoutine.id;
        }
      });
      saveLocalHabits(userId, habits);
    }

    if (!supabaseKnownOffline) {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (userAuth?.user) {
          const payload = {
            user_id: userAuth.user.id,
            name: rtData.name,
            points: rtData.points || 50,
            time_block: rtData.timeBlock,
            repeat: rtData.repeat || 'Daily',
            habit_ids: rtData.habitIds,
          };
          const { data, error } = await supabase.from('routines').insert([payload]).select().single();
          if (!error && data) {
            newRoutine.id = data.id;
          }
        }
      } catch {
        supabaseKnownOffline = true;
      }
    }

    return newRoutine;
  },

  async setRoutineStatus(routineId: string, date: string, completed: boolean) {
    const userId = await getEffectiveUserId();

    const routines = getLocalRoutines(userId);
    const rt = routines.find((r) => r.id === routineId);
    if (rt) {
      rt.completedHistory[date] = completed;
      saveLocalRoutines(userId, routines);
    }

    if (!supabaseKnownOffline) {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (userAuth?.user) {
          await supabase
            .from('routine_logs')
            .upsert(
              { routine_id: routineId, user_id: userAuth.user.id, date, completed },
              { onConflict: 'routine_id,date' }
            );
        }
      } catch {
        supabaseKnownOffline = true;
      }
    }
  },

  async updateRoutine(routineId: string, rtData: {
    name?: string;
    points?: number;
    timeBlock?: 'Morning' | 'Evening' | 'Night' | 'Constant';
    repeat?: 'Daily' | 'Custom Days' | 'Today Only';
  }): Promise<void> {
    const userId = await getEffectiveUserId();

    const routines = getLocalRoutines(userId);
    const rt = routines.find((r) => r.id === routineId);
    if (rt) {
      if (rtData.name !== undefined) rt.name = rtData.name;
      if (rtData.points !== undefined) rt.points = rtData.points;
      if (rtData.timeBlock !== undefined) rt.timeBlock = rtData.timeBlock;
      if (rtData.repeat !== undefined) rt.repeat = rtData.repeat;
      saveLocalRoutines(userId, routines);
    }

    if (!supabaseKnownOffline) {
      try {
        const payload: any = {};
        if (rtData.name !== undefined) payload.name = rtData.name;
        if (rtData.points !== undefined) payload.points = rtData.points;
        if (rtData.timeBlock !== undefined) payload.time_block = rtData.timeBlock;
        if (rtData.repeat !== undefined) payload.repeat = rtData.repeat;
        await supabase.from('routines').update(payload).eq('id', routineId);
      } catch {
        supabaseKnownOffline = true;
      }
    }
  },

  async deleteRoutine(routineId: string) {
    const userId = await getEffectiveUserId();

    const routines = getLocalRoutines(userId).filter((r) => r.id !== routineId);
    saveLocalRoutines(userId, routines);

    const habits = getLocalHabits(userId);
    habits.forEach((h) => {
      if (h.routineId === routineId) h.routineId = undefined;
    });
    saveLocalHabits(userId, habits);

    if (!supabaseKnownOffline) {
      try {
        await supabase.from('routines').delete().eq('id', routineId);
        await supabase.from('habits').update({ routine_id: null }).eq('routine_id', routineId);
      } catch {
        supabaseKnownOffline = true;
      }
    }
  },
};
