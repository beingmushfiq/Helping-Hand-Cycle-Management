
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { RoscaCycle, Member, RoscaMonth, PaymentStatus, RuleType, AuthUser, AppUser } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import AdminView from './components/AdminView';
import MemberDashboard from './components/MemberDashboard';
import * as db from './services/firestoreService';

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const ADMIN_EMAIL = 'admin@gmail.com';

const AppContent: React.FC = () => {
  const [roscaCycles, setRoscaCycles] = useState<RoscaCycle[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(
    () => localStorage.getItem('activeCycleId') || null
  );
  
  const [authUser, setAuthUser] = useState<AuthUser>(null);
  const { firebaseUser, loading: authLoading } = useAuth();
  const [cyclesLoaded, setCyclesLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [isResolvingUser, setIsResolvingUser] = useState(true);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (localStorage.getItem('theme') === 'dark') {
      return 'dark';
    }
    if (localStorage.getItem('theme') === 'light') {
        return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  // Set up real-time listeners for Firestore data
  useEffect(() => {
    const unsubscribeCycles = db.onCyclesUpdate(cycles => {
        setRoscaCycles(cycles);
        setCyclesLoaded(true);
    });
    const unsubscribeUsers = db.onUsersUpdate(users => {
        setAllUsers(users);
        setUsersLoaded(true);
    });

    return () => {
      unsubscribeCycles();
      unsubscribeUsers();
    };
  }, []);

  // Persist active cycle ID to local storage
  useEffect(() => {
    if (activeCycleId) {
      localStorage.setItem('activeCycleId', activeCycleId);
    } else {
      localStorage.removeItem('activeCycleId');
    }
  }, [activeCycleId]);

  // Set initial or fallback active cycle
  useEffect(() => {
    if (!cyclesLoaded) return;
    
    if (roscaCycles.length > 0) {
      const cycleExists = roscaCycles.some(c => c.id === activeCycleId);
      if (!cycleExists) {
        const firstActiveCycle = roscaCycles.find(c => !c.isArchived);
        setActiveCycleId(firstActiveCycle?.id ?? roscaCycles[0]?.id ?? null);
      }
    } else if (roscaCycles.length === 0 && activeCycleId !== null) {
      setActiveCycleId(null);
    }
  }, [roscaCycles, cyclesLoaded, activeCycleId]);


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);
  
  useEffect(() => {
    // This effect resolves the application's user state (authUser) based on loaded data.
    // It waits for auth, cycles, and users to be loaded before proceeding.
    if (authLoading || !cyclesLoaded || !usersLoaded) {
      setIsResolvingUser(true);
      return;
    }

    // Case 1: No firebase user, so no authUser.
    if (!firebaseUser) {
      setAuthUser(null);
      setIsResolvingUser(false);
      return;
    }

    // Case 2: User is the admin.
    if (firebaseUser.email === ADMIN_EMAIL) {
      setAuthUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: 'Administrator',
        role: 'admin',
      });
      setIsResolvingUser(false);
      return;
    }

    // Case 3: Handle regular members.
    const appUser = allUsers.find(u => u.uid === firebaseUser.uid);
    
    // Member is authenticated but not yet in the `users` database collection.
    if (!appUser) {
        setAuthUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            name: firebaseUser.displayName || firebaseUser.email!,
            role: 'member',
        });
        setIsResolvingUser(false);
        return;
    }

    // Member is in the database, but not assigned to a cycle.
    if (!appUser.cycleId) {
        setAuthUser({
            uid: appUser.uid,
            email: appUser.email,
            name: appUser.name,
            role: 'member',
        });
        setIsResolvingUser(false);
        return;
    }

    // Member is assigned to a cycle. We need to verify data consistency.
    const cycle = roscaCycles.find(c => c.id === appUser.cycleId);
    const member = cycle?.members.find(m => m.id === appUser.uid);

    if (cycle && member) {
        // Data is consistent. Create the full authUser object.
        setAuthUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            name: member.name,
            role: 'member',
            cycleId: cycle.id,
            memberId: member.id,
        });
        setIsResolvingUser(false);
    } else {
        // Data is inconsistent (e.g., user has a cycleId, but the cycle/member data isn't loaded yet or is invalid).
        // We keep `isResolvingUser` true, showing the loader until a Firestore update provides consistent data.
        setIsResolvingUser(true);
    }
  }, [firebaseUser, authLoading, roscaCycles, allUsers, cyclesLoaded, usersLoaded]);


  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const activeCycle = useMemo(() => roscaCycles.find(c => c.id === activeCycleId), [roscaCycles, activeCycleId]);
  
  const handleUpdateCycle = async (cycle: RoscaCycle) => {
      try {
          await db.updateCycle(cycle.id, cycle);
      } catch (error) {
          console.error("Error updating cycle: ", error);
          alert("Failed to update cycle.");
      }
  };
  
  const handleMarkAsPaid = useCallback((memberId: string, amount: number) => {
    if (!activeCycle) return;

    const cycle = activeCycle;
    const currentMonthObject = cycle.months.find(m => m.month === cycle.currentMonth);
    const contribution = currentMonthObject?.contributions.find(c => c.memberId === memberId);

    if (contribution?.status === PaymentStatus.PAID) {
      return;
    }
    
    const savingsFromThisPayment = amount * 0.20;
    const newSavingsFund = cycle.savingsFund + savingsFromThisPayment;

    const updatedCycle = {
      ...cycle,
      savingsFund: newSavingsFund,
      months: cycle.months.map(month =>
        month.month === cycle.currentMonth
          ? {
              ...month,
              contributions: month.contributions.map(c =>
                c.memberId === memberId ? { ...c, status: PaymentStatus.PAID, paymentDate: new Date().toISOString(), amountPaid: amount } : c
              ),
            }
          : month
      ),
    };
    handleUpdateCycle(updatedCycle);
  }, [activeCycle]);

  const handleUpdateContribution = useCallback((monthNumber: number, memberId: string, newStatus: PaymentStatus, paymentDate?: string, amountPaid?: number) => {
    if (!activeCycle) return;
    const cycle = activeCycle;

    const monthToUpdate = cycle.months.find(m => m.month === monthNumber);
    if (!monthToUpdate) return;

    const originalContribution = monthToUpdate.contributions.find(c => c.memberId === memberId);
    if (!originalContribution) return;

    const originalAmountPaid = originalContribution.amountPaid || 0;
    const newAmountPaid = newStatus === PaymentStatus.PAID ? (amountPaid !== undefined ? amountPaid : cycle.monthlyContributionAmount) : 0;
    
    const savingsFundAdjustment = (newAmountPaid * 0.20) - (originalAmountPaid * 0.20);
    const newSavingsFund = cycle.savingsFund + savingsFundAdjustment;

    const updatedMonths = cycle.months.map(month => {
        if (month.month === monthNumber) {
            return {
                ...month,
                contributions: month.contributions.map(c => {
                    if (c.memberId === memberId) {
                        const updatedContribution: any = { ...c, status: newStatus, paymentDate: paymentDate || c.paymentDate };
                        if (newStatus === PaymentStatus.PAID) {
                            updatedContribution.amountPaid = newAmountPaid;
                        } else {
                            delete updatedContribution.amountPaid;
                        }
                        return updatedContribution;
                    }
                    return c;
                })
            };
        }
        return month;
    });
    
    const updatedCycle = { ...cycle, months: updatedMonths, savingsFund: newSavingsFund };
    handleUpdateCycle(updatedCycle);
  }, [activeCycle]);

  const handleAdvanceToNextMonth = useCallback((payoutAmount: number) => {
    if (!activeCycle) return;
    const cycle = activeCycle;
    
    const currentMonthIndex = cycle.currentMonth - 1;
    const currentMonthObject = cycle.months[currentMonthIndex];

    if (!currentMonthObject || currentMonthIndex >= cycle.months.length) return;

    const paidOutMemberIds = new Set(cycle.months.filter(m => m.payoutMemberId).map(m => m.payoutMemberId!));
    // FIX: Explicitly type 'm' as 'Member' to resolve a potential TypeScript inference error where 'm' is treated as 'unknown'.
    const eligibleMembers = cycle.members.filter((m: Member) => !paidOutMemberIds.has(m.id));
    let recipientIdForCurrentMonth: string | null = null;

    if (eligibleMembers.length > 0) {
        const shuffledEligible = shuffleArray(eligibleMembers);
        recipientIdForCurrentMonth = shuffledEligible[0].id;
    }

    const updatedMonths = cycle.months.map((month, index) => {
        if (index === currentMonthIndex) {
            return {
                ...month,
                payoutMemberId: recipientIdForCurrentMonth,
                payoutAmount,
                contributions: month.contributions.map(c =>
                    c.status === PaymentStatus.PENDING ? { ...c, status: PaymentStatus.OVERDUE } : c
                ),
            };
        }
        return month;
    });
    
    const nextMonthNumber = cycle.currentMonth + 1;
    
    const updatedCycle = { ...cycle, months: updatedMonths, currentMonth: nextMonthNumber };
    handleUpdateCycle(updatedCycle);
  }, [activeCycle]);

  const handleSetRuleType = useCallback((ruleType: RuleType) => {
    if (!activeCycle) return;
    handleUpdateCycle({ ...activeCycle, ruleType });
  }, [activeCycle]);

  const handleEditMember = useCallback((memberId: string, updatedDetails: { name: string; avatarUrl: string; joiningMonthName: string; }) => {
    if (!activeCycle) return;
    const updatedCycle = {
      ...activeCycle,
      members: activeCycle.members.map(member => (member.id === memberId ? { ...member, ...updatedDetails } : member)),
    };
    handleUpdateCycle(updatedCycle);
  }, [activeCycle]);

  const handleRemoveMember = useCallback(async (memberIdToRemove: string) => {
    if (!activeCycle) return;
    const cycle = activeCycle;

    if (cycle.members.length <= 1) { alert("Cannot remove the last member."); return; }
    const hasBeenPaidOut = cycle.months.some(m => m.month < cycle.currentMonth && m.payoutMemberId === memberIdToRemove);
    if (hasBeenPaidOut) { alert("A member who has already received their payout cannot be removed."); return; }
    const isCurrentRecipient = cycle.months.some(m => m.month === cycle.currentMonth && m.payoutMemberId === memberIdToRemove);
    if (isCurrentRecipient) { alert("Cannot remove the member scheduled for the current month's payout."); return; }

    const newMembersList = cycle.members.filter(m => m.id !== memberIdToRemove);
    const newCycleLength = newMembersList.length;
    
    const updatedMonths = cycle.months
      .map(m => ({
        ...m,
        payoutMemberId: m.payoutMemberId === memberIdToRemove ? null : m.payoutMemberId,
        contributions: m.contributions.filter(c => c.memberId !== memberIdToRemove)
      }))
      .slice(0, newCycleLength);
    
    const updatedCycle = { ...cycle, members: newMembersList, months: updatedMonths, cycleLength: newCycleLength };
    
    try {
        await db.removeMemberFromCycleAndUpdateUser(cycle.id, updatedCycle, memberIdToRemove);
    } catch (error) {
        console.error("Error removing member:", error);
        alert("Failed to remove member.");
    }
  }, [activeCycle]);

  const handleAddMemberToCycle = useCallback(async (newUserIds: string[]) => {
    if (!activeCycle) return;
    const cycle = activeCycle;
    const usersToAdd = allUsers.filter(u => newUserIds.includes(u.uid));
    if (usersToAdd.length === 0) return;

    const newMembers: Member[] = usersToAdd.map(user => ({
        id: user.uid,
        name: user.name,
        email: user.email,
        avatarUrl: `https://picsum.photos/seed/${user.name.toLowerCase()}/100`,
        joinMonth: cycle.currentMonth,
        joiningMonthName: `Month ${cycle.currentMonth}`,
        lateFeePaid: 0,
    }));

    const updatedMembers = [...cycle.members, ...newMembers];
    const newCycleLength = updatedMembers.length;

    let updatedMonths = cycle.months.map(month => {
        if (month.month >= cycle.currentMonth) {
            const newContributions = newMembers.map(m => ({ memberId: m.id, status: PaymentStatus.PENDING }));
            return { ...month, contributions: [...month.contributions, ...newContributions] };
        }
        return month;
    });

    if (newCycleLength > cycle.months.length) {
        for (let i = cycle.months.length + 1; i <= newCycleLength; i++) {
            updatedMonths.push({
                month: i, payoutMemberId: null, payoutAmount: null,
                contributions: updatedMembers.map(m => ({ memberId: m.id, status: PaymentStatus.PENDING })),
            });
        }
    }
    
    const updatedCycle = { ...cycle, members: updatedMembers, months: updatedMonths, cycleLength: newCycleLength };
    
    try {
        await db.addMembersToCycleAndUpdateUsers(cycle.id, updatedCycle, newUserIds);
    } catch (error) {
        console.error("Error adding members:", error);
        alert("Failed to add members.");
    }
  }, [activeCycle, allUsers]);

  const handleCreateCycle = useCallback(async (name: string, monthlyContribution: number, selectedUserIds: string[]) => {
    const selectedUsers = allUsers.filter(u => selectedUserIds.includes(u.uid));
    
    const members: Member[] = selectedUsers.map(user => ({
      id: user.uid, name: user.name, email: user.email,
      avatarUrl: `https://picsum.photos/seed/${user.name.toLowerCase()}/100`,
      joinMonth: 1, joiningMonthName: 'Month 1', lateFeePaid: 0,
    }));

    const cycleLength = members.length;
    const months: RoscaMonth[] = Array.from({ length: cycleLength }, (_, i) => ({
      month: i + 1, payoutMemberId: null, payoutAmount: null,
      contributions: members.map(m => ({ memberId: m.id, status: PaymentStatus.PENDING })),
    }));
    
    const newCycleData: Omit<RoscaCycle, 'id'> = {
      name, members, monthlyContributionAmount: monthlyContribution, currentMonth: 1,
      months, ruleType: RuleType.STRICT, joiningFee: 0, cycleLength,
      isArchived: false, savingsFund: 0,
    };
    
    try {
        const newCycleId = await db.createCycleAndUpdateUsers(newCycleData, selectedUserIds);
        setActiveCycleId(newCycleId);
    } catch (error) {
        console.error("Error creating cycle: ", error);
        alert("Failed to create cycle.");
    }
  }, [allUsers]);

  const handleDeleteCycle = useCallback(async (cycleId: string) => {
    const cycleToDelete = roscaCycles.find(c => c.id === cycleId);
    if (!cycleToDelete) return;
    
    const memberIds = cycleToDelete.members.map(m => m.id);
    
    try {
        await db.deleteCycleAndUnassignUsers(cycleId, memberIds);
        if (activeCycleId === cycleId) {
            const remainingCycles = roscaCycles.filter(c => c.id !== cycleId && !c.isArchived);
            setActiveCycleId(remainingCycles[0]?.id ?? null);
        }
    } catch (error) {
        console.error("Error deleting cycle: ", error);
        alert("Failed to delete cycle.");
    }
  }, [roscaCycles, activeCycleId]);

  const handleRenameCycle = useCallback((cycleId: string, newName: string) => {
    if(!newName.trim()) return;
    const cycle = roscaCycles.find(c => c.id === cycleId);
    if (cycle) {
        handleUpdateCycle({ ...cycle, name: newName.trim() });
    }
  }, [roscaCycles]);
  
  const handleArchiveCycle = useCallback((cycleId: string) => {
    const cycle = roscaCycles.find(c => c.id === cycleId);
    if (cycle) {
        handleUpdateCycle({ ...cycle, isArchived: true });
    }
  }, [roscaCycles]);

  const handleAddUser = useCallback(async (uid: string, name: string, email: string) => {
    if (allUsers.some(u => u.email === email)) {
        alert('A user with this email already exists.'); return;
    }
     if (allUsers.some(u => u.uid === uid)) {
        alert('A user with this UID already exists.'); return;
    }
    const newUser: AppUser = { uid, name, email };
    try {
      await db.addUser(newUser);
    } catch (error) {
      console.error("Error adding user to database:", error);
      alert("Failed to add user to the database. The user's login may have been created, but their details are not saved. Please try again or contact support.");
    }
  }, [allUsers]);

  const handleEditUser = useCallback(async (uid: string, name: string, email: string) => {
      // FIX: Explicitly type 'm' as 'Member' to resolve TypeScript inference error.
      const cyclesToUpdate = roscaCycles.filter(c => c.members.some((m: Member) => m.id === uid));
      try {
          await db.updateUserAndCycles(uid, { name, email }, cyclesToUpdate);
      } catch (error) {
          console.error("Error updating user:", error);
          alert("Failed to update user details.");
      }
  }, [roscaCycles]);

  const handleDeleteUser = useCallback(async (uid: string) => {
    const user = allUsers.find(u => u.uid === uid);
    if (user?.cycleId) {
        alert("Cannot delete a user who is assigned to a cycle. Please remove them from the cycle first.");
        return;
    }
    try {
      await db.deleteUser(uid);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  }, [allUsers]);
  
  const handleImportData = useCallback(async (data: { cycles: RoscaCycle[], users: AppUser[] }) => {
    try {
        await db.importData(data);
        alert("Data imported successfully! The application will now reflect the new data.");
    } catch (error) {
        console.error("Error importing data: ", error);
        alert(`Failed to import data. Error: ${(error as Error).message}`);
    }
  }, []);

  const isAppLoading = authLoading || !cyclesLoaded || !usersLoaded || isResolvingUser;

  if (isAppLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginPage theme={theme} onToggleTheme={toggleTheme} />;
  }
  
  if (authUser.role === 'admin') {
    return (
      <AdminView
        roscaCycles={roscaCycles}
        activeCycle={activeCycle}
        activeCycleId={activeCycleId}
        allUsers={allUsers}
        onSelectCycle={setActiveCycleId}
        onMarkAsPaid={handleMarkAsPaid}
        onAdvanceToNextMonth={handleAdvanceToNextMonth}
        onSetRuleType={handleSetRuleType}
        onEditMember={handleEditMember}
        onRemoveMember={handleRemoveMember}
        onAddMember={handleAddMemberToCycle}
        onRenameCycle={handleRenameCycle}
        onCreateCycle={handleCreateCycle}
        onDeleteCycle={handleDeleteCycle}
        onArchiveCycle={handleArchiveCycle}
        onUpdateContribution={handleUpdateContribution}
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onImportData={handleImportData}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (authUser.role === 'member') {
     if (authUser.cycleId && authUser.memberId) {
        const memberCycle = roscaCycles.find(c => c.id === authUser.cycleId);
        const memberDetails = memberCycle?.members.find(m => m.id === authUser.memberId);
        if (memberCycle && memberDetails) {
            return <MemberDashboard cycle={memberCycle} member={memberDetails} theme={theme} onToggleTheme={toggleTheme} />;
        }
    }
    
    const { logout } = useAuth();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Welcome, {authUser.name}!</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              { allUsers.some(u => u.uid === authUser.uid) 
                ? "Your account is active. Please wait for an administrator to add you to a trust circle."
                : "Your account has not been fully registered in the system. Please contact an administrator."
              }
            </p>
            <button 
                onClick={logout}
                className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500"
            >
                Logout
            </button>
        </div>
    );
  }

  const { logout } = useAuth();
  return (
    <div className="flex items-center justify-center min-h-screen">
        <p>An error occurred. Please try logging out and back in.</p>
        <button onClick={logout}>Logout</button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App;
