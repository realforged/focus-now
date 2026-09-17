import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import HabitsPage from './components/HabitsPage';
import ProgressPage from './components/ProgressPage';
import ProfilePage from './components/ProfilePage';
import AuthPage from './components/AuthPage';
import { CreateHabitModal, CreateRoutineModal } from './components/Modals';
import { ToastProvider, useToast, ConfirmDialog } from './components/Toast';
import { Habit, Category, Routine } from './types';
import { calculateMomentum, dateToday, calculateTotalEarnedPoints, getScheduledHabits, getRoutineHabits } from './data';
import { api, ApiError } from './api';
import { Zap, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

function AppInner() {
  const toast = useToast();

  const [token, setToken] = useState<string | null>(() => {
    const direct = localStorage.getItem('habit_mountain_token');
    if (direct) return direct;
    const session = api.getCurrentSession();
    if (session?.token) {
      localStorage.setItem('habit_mountain_token', session.token);
      return session.token;
    }
    return null;
  });
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const [currentTab, setTab] = useState<string>('dashboard');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [appLoading, setAppLoading] = useState<boolean>(true);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [showDietModalDirectly, setShowDietModalDirectly] = useState(false);
  const [showJournalModalDirectly, setShowJournalModalDirectly] = useState(false);
  const [showGoalsModalDirectly, setShowGoalsModalDirectly] = useState(false);
  const [showTargetsModalDirectly, setShowTargetsModalDirectly] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const openConfirm = (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }) => setConfirmDialog({ isOpen: true, ...opts });

  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));


  // States for routine timeline details
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<Category | null>(null);

  // State for Create dialogue modals
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [prefilledRoutineId, setPrefilledRoutineId] = useState<string | undefined>(undefined);

  // Fetch all user details, habits, routines on mounting/authentication
  const loadAllData = async () => {
    let activeToken = token;
    if (!activeToken) {
      // Try to restore a local session even if habit_mountain_token is temporarily missing
      const localSession = api.getCurrentSession();
      if (localSession?.token) {
        localStorage.setItem('habit_mountain_token', localSession.token);
        setToken(localSession.token);
        activeToken = localSession.token;
      } else {
        setAppLoading(false);
        return;
      }
    }
    setAppLoading(true);
    try {
      // 1. Fetch profiles
      const profile = await api.getProfile();
      setCurrentUser(profile);
      // 2. Fetch habits
      const hData = await api.getHabits();
      setHabits(hData);

      // 3. Fetch routines
      const rData = await api.getRoutines();
      setRoutines(rData);

      const computedPoints = calculateTotalEarnedPoints(hData, rData);
      setUserPoints(computedPoints);
      if ((profile?.total_points || 0) !== computedPoints) {
        await api.syncJourney({ total_points: computedPoints });
      }

    } catch (err: any) {
      console.error('Error loading full-stack assets:', err);
      // Local-first: never force logout on background error, keep session intact
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  // Auth helper success callback
  const handleAuthSuccess = (newToken: string, user: any) => {
    localStorage.setItem('habit_mountain_token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    setUserPoints(user.total_points || 0);
  };

  // Sign out handle
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('habit_mountain_token');
    setToken(null);
    setCurrentUser(null);
    setHabits([]);
    setRoutines([]);
    setUserPoints(0);
  };

  // Automated Routine Completion Handler Check
  useEffect(() => {
    if (!token || habits.length === 0 || routines.length === 0) return;

    let pointsBonus = 0;
    const routinesToUpdate: { id: string; completed: boolean }[] = [];

    routines.forEach((rt) => {
      const routineHabits = getScheduledHabits(
        getRoutineHabits(rt, habits),
        dateToday
      );
      const allDoneToday =
        routineHabits.length > 0 &&
        routineHabits.every((h) => (h.history[dateToday] || 0) >= h.target);
      const wasDoneEarlierToday = rt.completedHistory[dateToday] || false;

      if (allDoneToday && !wasDoneEarlierToday) {
        pointsBonus += rt.points;
        routinesToUpdate.push({ id: rt.id, completed: true });
      }
    });

    if (routinesToUpdate.length > 0) {
      const syncRoutinesCompletions = async () => {
        try {
          for (const item of routinesToUpdate) {
            await api.setRoutineStatus(item.id, dateToday, true);
          }

          const updatedRoutines = await api.getRoutines();
          setRoutines(updatedRoutines);

          const nextPoints = calculateTotalEarnedPoints(habits, updatedRoutines);
          setUserPoints(nextPoints);
          await api.syncJourney({ total_points: nextPoints });

          toast.success(`Routine mastered! +${pointsBonus} bonus points earned!`);
        } catch (err) {
          console.error('Error synchronizing routine chains:', err);
        }
      };

      syncRoutinesCompletions();
    }
  }, [habits, routines, token]);


  // Handler: Log count/timer progress against a specific habit
  const handleLogHabit = (id: string, value: number) => {
    return handleLogHabitForDate(id, dateToday, value);
  };

  // Handler: Log count/timer progress against a specific habit for a custom date
  const handleLogHabitForDate = async (id: string, dateStr: string, value: number) => {
    try {
      const targetHabit = habits.find((h) => h.id === id);
      if (!targetHabit) return;

      const curVal = targetHabit.history[dateStr] || 0;
      const newVal = curVal + value;

      const wasCompleted = curVal >= targetHabit.target;
      const nowCompleted = newVal >= targetHabit.target;

      if (newVal < 0 || (wasCompleted && nowCompleted)) return;

      await api.logHabit(id, dateStr, value);

      const updatedHabits = await api.getHabits();
      setHabits(updatedHabits);

      // Recalculate routines for this specific date
      let updatedRoutines = routines;
      const routinesToUpdate: { id: string; completed: boolean }[] = [];
      let pointsBonus = 0;

      routines.forEach((rt) => {
        if (rt.habitIds.includes(id)) {
          const routineHabits = updatedHabits.filter((h) => rt.habitIds.includes(h.id));
          const allDone =
            routineHabits.length > 0 &&
            routineHabits.every((h) => (h.history[dateStr] || 0) >= h.target);
          const wasDoneEarlier = rt.completedHistory[dateStr] || false;

          if (allDone && !wasDoneEarlier) {
            pointsBonus += rt.points;
            routinesToUpdate.push({ id: rt.id, completed: true });
          } else if (!allDone && wasDoneEarlier) {
            pointsBonus -= rt.points;
            routinesToUpdate.push({ id: rt.id, completed: false });
          }
        }
      });

      if (routinesToUpdate.length > 0) {
        for (const item of routinesToUpdate) {
          await api.setRoutineStatus(item.id, dateStr, item.completed);
        }
        updatedRoutines = await api.getRoutines();
        setRoutines(updatedRoutines);
      }

      const nextPoints = calculateTotalEarnedPoints(updatedHabits, updatedRoutines);
      setUserPoints(nextPoints);
      await api.syncJourney({ total_points: nextPoints });

      if (pointsBonus > 0) {
        toast.success(`Routine mastered! +${pointsBonus} bonus points earned!`);
      } else if (pointsBonus < 0) {
        toast.info(`Routine status updated. Points adjusted.`);
      }

    } catch (err: any) {
      console.error('Failed to sync logged progression:', err);
      toast.error('Network logging failure: ' + err.message);
    }
  };


  // Handler: Save newly created habit
  const handleCreateHabitSubmit = async (habitData: Partial<Habit>) => {
    try {
      const payload: Partial<Habit> = {
        name: habitData.name || 'Untitled Habit',
        category: habitData.category || 'Fitness',
        points: habitData.points || 10,
        type: habitData.type || 'Count',
        target: Math.max(1, Number(habitData.target) || 1),
        unit: habitData.type === 'Timer' ? 'min' : habitData.unit || 'reps',
        repeat: habitData.repeat || 'Daily',
        timeOfDay: habitData.timeOfDay,
        enableFocusTimer: habitData.enableFocusTimer || false,
        routineId: habitData.routineId,
        subHabits: habitData.subHabits || [],
      };

      await api.createHabit(payload);
      
      // Reload lists
      const nextHabits = await api.getHabits();
      setHabits(nextHabits);

      // If linked to routine, update local arrays representation too
      if (habitData.routineId) {
        const nextRoutines = await api.getRoutines();
        setRoutines(nextRoutines);
      }

      closeHabitModal();
      toast.success('Habit created successfully!');
    } catch (err: any) {
      toast.error('Error creating habit: ' + err.message);
    }
  };


  const closeHabitModal = () => {
    setIsHabitModalOpen(false);
    setHabitToEdit(null);
    setPrefilledRoutineId(undefined);
  };

  const openCreateHabit = () => {
    setHabitToEdit(null);
    setPrefilledRoutineId(undefined);
    setIsHabitModalOpen(true);
  };



  // Inline quick-add: create a habit by name only, linked to a routine
  const handleCreateHabitInRoutine = async (routineId: string, name: string, category: Habit['category']) => {
    try {
      await api.createHabit({
        name,
        category,
        points: 10,
        type: 'Count',
        target: 1,
        unit: 'reps',
        repeat: 'Daily',
        enableFocusTimer: false,
        routineId,
      });
      const [nextHabits, nextRoutines] = await Promise.all([api.getHabits(), api.getRoutines()]);
      setHabits(nextHabits);
      setRoutines(nextRoutines);
      toast.success(`"${name}" added to routine!`);
    } catch (err: any) {
      toast.error('Failed to add habit: ' + err.message);
    }
  };

  const openEditHabit = (habit: Habit) => {
    setHabitToEdit(habit);
    setIsHabitModalOpen(true);
  };

  const handleUpdateHabitSubmit = async (id: string, habitData: Partial<Habit>) => {
    try {
      const payload: Partial<Habit> = {
        name: habitData.name || 'Untitled Habit',
        category: habitData.category || 'Fitness',
        points: habitData.points || 10,
        type: habitData.type || 'Count',
        target: Math.max(1, Number(habitData.target) || 1),
        unit: habitData.type === 'Timer' ? 'min' : habitData.unit || 'reps',
        repeat: habitData.repeat || 'Daily',
        timeOfDay: habitData.timeOfDay,
        enableFocusTimer: habitData.enableFocusTimer || false,
        routineId: habitData.routineId,
        ...(habitData.subHabits !== undefined ? { subHabits: habitData.subHabits } : {}),
      };

      await api.updateHabit(id, payload);

      const nextHabits = await api.getHabits();
      const nextRoutines = await api.getRoutines();
      setHabits(nextHabits);
      setRoutines(nextRoutines);

      closeHabitModal();
      toast.success('Habit updated!');
    } catch (err: any) {
      toast.error('Error updating habit: ' + err.message);
    }
  };


  const handleRevertHabit = async (id: string) => {
    try {
      await api.logHabitAbsolute(id, dateToday, 0);

      const updatedHabits = await api.getHabits();
      setHabits(updatedHabits);
      const nextPoints = calculateTotalEarnedPoints(updatedHabits, routines);
      setUserPoints(nextPoints);
      await api.syncJourney({ total_points: nextPoints });
      toast.info('Habit reverted to active.');
    } catch (err: any) {
      toast.error('Failed to revert habit: ' + err.message);
    }
  };


  // Handler: Save newly created routine and auto-create corresponding template habits
  const handleCreateRoutineSubmit = async (rtData: {
    name: string;
    points: number;
    timeBlock: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Constant';
    category: Category;
    repeat: 'Daily' | 'Custom Days' | 'Today Only';
    habitNames: string[];
  }) => {
    try {
      const generatedHabitIds: string[] = [];

      // Create each listed habit sequentially in backend SQLite DB
      for (let i = 0; i < rtData.habitNames.length; i++) {
        const name = rtData.habitNames[i];
        const hRes = await api.createHabit({
          name,
          category: rtData.category || 'Career',
          points: 10,
          type: 'Count',
          target: 10,
          unit: 'reps',
          repeat: rtData.repeat
        });
        generatedHabitIds.push(hRes.id);
      }

      // Create Routine representing the linked chain
      await api.createRoutine({
        name: rtData.name,
        points: rtData.points,
        timeBlock: rtData.timeBlock,
        repeat: rtData.repeat,
        habitIds: generatedHabitIds
      });

      // Reload fresh database structures
      const nextHabits = await api.getHabits();
      const nextRoutines = await api.getRoutines();
      setHabits(nextHabits);
      setRoutines(nextRoutines);

      setIsRoutineModalOpen(false);
      toast.success(`Routine "${rtData.name}" created!`);
    } catch (err: any) {
      toast.error('Error building routine: ' + err.message);
    }
  };


  // Navigate straight to routine
  const handleNavigateToRoutine = (routineId: string) => {
    setSelectedRoutineId(routineId);
    setTab('habits');
  };




  // Handler: Delete routine
  const handleDeleteRoutine = async (routineId: string) => {
    const routineToDelete = routines.find((r) => r.id === routineId);
    if (!routineToDelete) return;
    openConfirm({
      title: 'Delete Routine',
      message: `Delete "${routineToDelete.name}" routine? This will also unlink all habits from this routine.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.deleteRoutine(routineId);
          const nextHabits = await api.getHabits();
          const nextRoutines = await api.getRoutines();
          setHabits(nextHabits);
          setRoutines(nextRoutines);
          setSelectedRoutineId(null);
          toast.success(`"${routineToDelete.name}" deleted.`);
        } catch (err: any) {
          toast.error('Failed to delete routine: ' + err.message);
        }
      },
    });
  };

  // Handler: Delete habit permanently
  const handleDeleteHabit = async (id: string) => {
    const habitToDelete = habits.find((habit) => habit.id === id);
    if (!habitToDelete || deletingHabitId) return;

    openConfirm({
      title: 'Delete Habit',
      message: `Delete "${habitToDelete.name}" permanently? Its progress history will also be removed.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        setDeletingHabitId(id);
        try {
          await api.deleteHabit(id);
          setHabits((currentHabits) => currentHabits.filter((habit) => habit.id !== id));
          setRoutines((currentRoutines) =>
            currentRoutines.map((routine) => ({
              ...routine,
              habitIds: routine.habitIds.filter((habitId) => habitId !== id)
            }))
          );
          toast.success(`"${habitToDelete.name}" deleted.`);
        } catch (err: any) {
          toast.error('Failed to delete habit: ' + err.message);
        } finally {
          setDeletingHabitId(null);
        }
      },
    });
  };


  // Reset database state completely
  const handleResetApp = async () => {
    openConfirm({
      title: 'Reset All Data',
      message: 'Reset all tracked points and habit logs to start fresh? This cannot be undone.',
      confirmLabel: 'Reset Everything',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        setAppLoading(true);
        try {
          await api.resetAllData();
          await loadAllData();
          setTab('dashboard');
          toast.success('All data reset to baseline!');
        } catch (err: any) {
          toast.error('Failure processing reset: ' + err.message);
        } finally {
          setAppLoading(false);
        }
      },
    });
  };

  // Reset 90-Day Mission countdown back to Day 1
  const handleResetMission = async () => {
    openConfirm({
      title: 'Reset 90-Day Mission',
      message: 'Reset your 90-Day Transformation countdown back to Day 1 (today)? You can lock in again with full focus.',
      confirmLabel: 'Restart Day 1',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.resetMission(dateToday);
          localStorage.setItem('journey_start_date', dateToday);
          await loadAllData();
          toast.success('90-Day Mission restarted at Day 1! Stay consistent.');
        } catch (err: any) {
          toast.error('Failed to reset mission: ' + err.message);
        }
      },
    });
  };

  // Sub-Habits management
  const handleAddSubHabit = async (habitId: string, title: string) => {
    try {
      await api.addSubHabit(habitId, title);
      const nextHabits = await api.getHabits();
      setHabits(nextHabits);
      toast.success('Action step added!');
    } catch (err: any) {
      toast.error('Failed to add step: ' + err.message);
    }
  };

  const handleToggleSubHabit = async (habitId: string, subHabitId: string, dateStr: string) => {
    try {
      const { allSubHabitsDone } = await api.toggleSubHabit(habitId, subHabitId, dateStr);
      const nextHabits = await api.getHabits();
      setHabits(nextHabits);

      const nextPoints = calculateTotalEarnedPoints(nextHabits, routines);
      setUserPoints(nextPoints);
      await api.syncJourney({ total_points: nextPoints });

      if (allSubHabitsDone) {
        toast.success('All action steps completed! Habit marked done.');
      }
    } catch (err: any) {
      toast.error('Failed to toggle step: ' + err.message);
    }
  };

  const handleDeleteSubHabit = async (habitId: string, subHabitId: string) => {
    try {
      await api.deleteSubHabit(habitId, subHabitId);
      const nextHabits = await api.getHabits();
      setHabits(nextHabits);
      toast.info('Step removed.');
    } catch (err: any) {
      toast.error('Failed to delete step: ' + err.message);
    }
  };


  // Loading buffer
  if (appLoading) {
    return (
      <div className="flex flex-col font-sans items-center justify-center min-h-screen bg-[#06070a] text-white">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <Zap className="w-5 h-5 text-indigo-400 absolute animate-pulse" />
        </div>
        <p className="text-xs uppercase tracking-widest text-gray-500 font-mono">
          Assembling Summit Environment...
        </p>
      </div>
    );
  }

  // Render Login/Register Overlay if not authenticated
  if (!token) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Compute momentum live score
  const { score: currentLiveMomentumScore } = calculateMomentum(habits, routines);

  return (
    <div className="flex flex-col md:flex-row bg-white min-h-screen text-gray-900 font-sans antialiased overflow-x-hidden">
      
      {/* 1. Sidebar Left */}
      <Sidebar
        currentTab={currentTab}
        setTab={(t) => {
          setTab(t);
          setSelectedRoutineId(null);
          setSelectedCategoryId(null);
        }}
        userPoints={userPoints}
        momentumScore={currentLiveMomentumScore}
        onReset={handleResetApp}
        onAddClick={() => setIsAddMenuOpen(true)}
      />

      {/* 2. Main Content Body */}
      <main className="flex-1 pb-24 md:pb-10 max-h-screen overflow-y-auto relative bg-[#F4F6F9]">
        {/* Tab Routing orchestrations */}
        {currentTab === 'dashboard' && (
          <Dashboard
            habits={habits}
            routines={routines}
            userPoints={userPoints}
            onLogHabit={handleLogHabit}
            setTab={setTab}
            onNavigateToRoutine={handleNavigateToRoutine}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            onDeleteHabit={handleDeleteHabit}
            onEditHabit={openEditHabit}
            onCreateHabitInRoutine={handleCreateHabitInRoutine}
            showDietModalDirectly={showDietModalDirectly}
            onCloseDietModalDirectly={() => setShowDietModalDirectly(false)}
            showJournalModalDirectly={showJournalModalDirectly}
            onCloseJournalModalDirectly={() => setShowJournalModalDirectly(false)}
            showGoalsModalDirectly={showGoalsModalDirectly}
            onCloseGoalsModalDirectly={() => setShowGoalsModalDirectly(false)}
            showTargetsModalDirectly={showTargetsModalDirectly}
            onCloseTargetsModalDirectly={() => setShowTargetsModalDirectly(false)}
            onResetMission={handleResetMission}
            onAddSubHabit={handleAddSubHabit}
            onToggleSubHabit={handleToggleSubHabit}
            onDeleteSubHabit={handleDeleteSubHabit}
            openCreateHabit={openCreateHabit}
          />
        )}

        {currentTab === 'habits' && (
          <HabitsPage
            habits={habits}
            routines={routines}
            onLogHabit={handleLogHabit}
            onDeleteHabit={handleDeleteHabit}
            deletingHabitId={deletingHabitId}
            openCreateHabit={openCreateHabit}
            openCreateRoutine={() => setIsRoutineModalOpen(true)}
            onEditHabit={openEditHabit}
            onRevertHabit={handleRevertHabit}
            onDeleteRoutine={handleDeleteRoutine}
            selectedRoutineId={selectedRoutineId}
            setSelectedRoutineId={setSelectedRoutineId}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            onAddSubHabit={handleAddSubHabit}
            onToggleSubHabit={handleToggleSubHabit}
            onDeleteSubHabit={handleDeleteSubHabit}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressPage
            habits={habits}
            routines={routines}
            userPoints={userPoints}
            onResetMission={handleResetMission}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            userPoints={userPoints}
            habits={habits}
            momentumScore={currentLiveMomentumScore}
            onLogout={handleLogout}
            onReset={handleResetApp}
            setTab={setTab}
          />
        )}
      </main>

      {/* Fixed bottom navigation for mobile viewports */}
      <BottomNav
        currentTab={currentTab}
        setTab={(t) => {
          setTab(t);
          setSelectedRoutineId(null);
          setSelectedCategoryId(null);
        }}
        onAddClick={() => setIsAddMenuOpen(true)}
      />

      {/* Add Action Bottom Sheet */}
      <AnimatePresence>
        {isAddMenuOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center"
            onClick={() => setIsAddMenuOpen(false)}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Create</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Add something to your mission</p>
                </div>
                <button
                  onClick={() => setIsAddMenuOpen(false)}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Grid — 2x3 */}
              <div className="grid grid-cols-2 gap-3">
                {/* Habit */}
                <button
                  onClick={() => { setIsAddMenuOpen(false); openCreateHabit(); }}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-green-50 hover:border-green-200 text-left transition-all active:scale-[0.97] cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                    <span className="text-xl font-black text-green-600">H</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">Habit</p>
                  <p className="text-xs text-gray-500 mt-0.5">Track one daily action</p>
                </button>

                {/* Routine */}
                <button
                  onClick={() => { setIsAddMenuOpen(false); setIsRoutineModalOpen(true); }}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-left transition-all active:scale-[0.97] cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                    <span className="text-xl font-black text-blue-600">R</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">Routine</p>
                  <p className="text-xs text-gray-500 mt-0.5">Stack habits together</p>
                </button>

                {/* Pillar Goal */}
                <button
                  onClick={() => { setIsAddMenuOpen(false); setTab('dashboard'); setShowGoalsModalDirectly(true); }}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-200 text-left transition-all active:scale-[0.97] cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                    <span className="text-xl font-black text-purple-600">G</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">Pillar Goal</p>
                  <p className="text-xs text-gray-500 mt-0.5">Add a 90-day target</p>
                </button>

                {/* Diet Targets */}
                <button
                  onClick={() => { setIsAddMenuOpen(false); setTab('dashboard'); setShowTargetsModalDirectly(true); }}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-yellow-50 hover:border-yellow-200 text-left transition-all active:scale-[0.97] cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-yellow-100 flex items-center justify-center mb-3">
                    <span className="text-xl font-black text-yellow-600">D</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">Diet Targets</p>
                  <p className="text-xs text-gray-500 mt-0.5">Edit macros and calories</p>
                </button>

                {/* Food Log */}
                <button
                  onClick={() => { setIsAddMenuOpen(false); setTab('dashboard'); setShowDietModalDirectly(true); }}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 text-left transition-all active:scale-[0.97] cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                    <span className="text-xl font-black text-orange-600">F</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">Food Log</p>
                  <p className="text-xs text-gray-500 mt-0.5">Log a meal with macros</p>
                </button>

                {/* Journal */}
                <button
                  onClick={() => { setIsAddMenuOpen(false); setTab('dashboard'); setShowJournalModalDirectly(true); }}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-all active:scale-[0.97] cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
                    <span className="text-xl font-black text-indigo-600">J</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">Journal</p>
                  <p className="text-xs text-gray-500 mt-0.5">Capture a reflection</p>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Global Control Modals */}
      <CreateHabitModal
        isOpen={isHabitModalOpen}
        onClose={closeHabitModal}
        routines={routines}
        onCreate={handleCreateHabitSubmit}
        onSave={handleUpdateHabitSubmit}
        onDelete={handleDeleteHabit}
        habitToEdit={habitToEdit}
        prefilledRoutineId={prefilledRoutineId}
      />

      <CreateRoutineModal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        onCreate={handleCreateRoutineSubmit}
      />



      {/* Polished confirm dialog — replaces browser confirm() */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
