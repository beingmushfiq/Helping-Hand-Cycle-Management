import React, { useMemo, useState, useEffect } from 'react';
import { RoscaCycle, RuleType, PaymentStatus, AppUser } from '../types';
import { CycleSelector } from './CycleSelector';
import Dashboard from './Dashboard';
import { CycleHistoryView } from './CycleHistoryView';
import { UserManagement } from './UserManagement';
import { UserPlusIcon, UsersIcon, UploadIcon, DownloadIcon } from './Icons';
import { CreateCycleModal } from './CreateCycleModal';
import { ExportDataModal } from './ExportDataModal';
import { ImportDataModal } from './ImportDataModal';

interface AdminViewProps {
  roscaCycles: RoscaCycle[];
  activeCycle: RoscaCycle | undefined;
  activeCycleId: string | null;
  allUsers: AppUser[];
  onSelectCycle: (id: string) => void;
  onMarkAsPaid: (memberId: string, amount: number) => void;
  onAdvanceToNextMonth: (payoutAmount: number) => void;
  onSetRuleType: (ruleType: RuleType) => void;
  onEditMember: (memberId: string, updatedDetails: { name: string; avatarUrl: string; joiningMonthName: string; }) => void;
  onRemoveMember: (memberId: string) => void;
  onAddMember: (newUserIds: string[]) => void;
  onRenameCycle: (cycleId: string, newName: string) => void;
  onCreateCycle: (name: string, monthlyContribution: number, selectedUserIds: string[]) => void;
  onDeleteCycle: (id: string) => void;
  onArchiveCycle: (id: string) => void;
  onUpdateContribution: (monthNumber: number, memberId: string, newStatus: PaymentStatus, paymentDate?: string, amountPaid?: number) => void;
  onAddUser: (uid: string, name: string, email: string) => void;
  onEditUser: (uid: string, name: string, email: string) => void;
  onDeleteUser: (uid: string) => void;
  onImportData: (data: { cycles: RoscaCycle[], users: AppUser[] }) => Promise<void>;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const AdminView: React.FC<AdminViewProps> = (props) => {
  const { 
    roscaCycles, 
    activeCycle, 
    activeCycleId, 
    onSelectCycle, 
    onDeleteCycle,
    onRenameCycle,
    onArchiveCycle,
    theme,
    onToggleTheme,
    allUsers,
    onCreateCycle,
  } = props;

  const [view, setView] = useState<'dashboard' | 'history' | 'users'>('dashboard');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  
  useEffect(() => {
    // Don't switch view if we are on the users tab
    if (view !== 'users' && activeCycle) {
        setView('dashboard');
    } else if (view !== 'users' && !activeCycle) {
        setView('dashboard');
    }
  }, [activeCycleId, activeCycle, view]);
  
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 1024) {
            setIsSidebarExpanded(false);
        } else {
            setIsSidebarExpanded(true);
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentMonthData = useMemo(() => {
    return activeCycle?.months.find(m => m.month === activeCycle.currentMonth);
  }, [activeCycle]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <CycleSelector
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(p => !p)}
        cycles={roscaCycles}
        activeCycleId={activeCycleId}
        onSelectCycle={onSelectCycle}
        onCreateCycle={() => setCreateModalOpen(true)}
        onDeleteCycle={onDeleteCycle}
        onRenameCycle={onRenameCycle}
        onArchiveCycle={onArchiveCycle}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <div className={`transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'ml-64' : 'ml-20'}`}>
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6 border-b border-slate-300 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                    onClick={() => setView('users')}
                    className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        view === 'users'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                    }`}
                    aria-current={view === 'users' ? 'page' : undefined}
                    >
                    <UsersIcon className="w-5 h-5" />
                    Users
                    </button>
                    {activeCycle && (
                        <>
                        <button
                            onClick={() => setView('dashboard')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                view === 'dashboard'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                            }`}
                            aria-current={view === 'dashboard' ? 'page' : undefined}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setView('history')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                view === 'history'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                            }`}
                            aria-current={view === 'history' ? 'page' : undefined}
                        >
                            Payment History
                        </button>
                        </>
                    )}
                </nav>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setImportModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
                        title="Import Data"
                    >
                        <UploadIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Import</span>
                    </button>
                    <button
                        onClick={() => setExportModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
                        title="Export Data"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>
            
            {view === 'users' && (
                <UserManagement 
                    allUsers={props.allUsers}
                    cycles={props.roscaCycles}
                    onAddUser={props.onAddUser}
                    onEditUser={props.onEditUser}
                    onDeleteUser={props.onDeleteUser}
                />
            )}
            
            {view === 'dashboard' && activeCycle && currentMonthData && (
              <Dashboard
                  key={activeCycle.id}
                  roscaCycle={activeCycle}
                  currentMonthData={currentMonthData}
                  allUsers={allUsers}
                  onMarkAsPaid={props.onMarkAsPaid}
                  onAdvanceToNextMonth={props.onAdvanceToNextMonth}
                  onSetRuleType={props.onSetRuleType}
                  onEditMember={props.onEditMember}
                  onRemoveMember={props.onRemoveMember}
                  onAddMember={props.onAddMember}
                  onRenameCycle={(newName) => onRenameCycle(activeCycle.id, newName)}
                  onUpdateContribution={props.onUpdateContribution}
              />
            )}

            {view === 'history' && activeCycle && (
              <CycleHistoryView
                  key={`${activeCycle.id}-history`}
                  cycle={activeCycle}
                  onUpdateContribution={props.onUpdateContribution}
              />
            )}

            {view !== 'users' && !activeCycle && (
              <div className="flex flex-col items-center justify-center h-full text-center pt-20">
                  <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-4">Welcome, Admin!</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">Select a trust circle from the sidebar or create a new one to get started.</p>
                  <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary-600 rounded-lg shadow-sm hover:bg-primary-500"
                  >
                  <UserPlusIcon className="w-6 h-6"/>
                  Create New Circle
                  </button>
              </div>
            )}
        </main>
      </div>
      {isCreateModalOpen && (
        <CreateCycleModal
          allUsers={allUsers}
          onClose={() => setCreateModalOpen(false)}
          onCreateCycle={onCreateCycle}
        />
      )}
      {isExportModalOpen && (
        <ExportDataModal
            cycles={roscaCycles}
            users={allUsers}
            onClose={() => setExportModalOpen(false)}
        />
      )}
      {isImportModalOpen && (
        <ImportDataModal
            onClose={() => setImportModalOpen(false)}
            onImport={props.onImportData}
        />
      )}
    </div>
  );
};

export default AdminView;