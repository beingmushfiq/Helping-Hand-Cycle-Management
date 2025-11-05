


import React from 'react';
import { RoscaCycle, Member, PaymentStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { LogOutIcon, DollarSignIcon, CheckCircleIcon, ClockIcon, AlertTriangleIcon, CrownIcon, CalendarIcon, TrendingUpIcon, SunIcon, MoonIcon } from './Icons';

interface MemberDashboardProps {
  cycle: RoscaCycle;
  member: Member;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ cycle, member, theme, onToggleTheme }) => {
    const { months, monthlyContributionAmount, currentMonth } = cycle;
    const { logout } = useAuth();

    const memberSummary = React.useMemo(() => {
        const totalContributions = months
            .reduce((sum, month) => {
                const contribution = month.contributions.find(c => c.memberId === member.id);
                if (contribution?.status === PaymentStatus.PAID) {
                    return sum + (contribution.amountPaid ?? monthlyContributionAmount);
                }
                return sum;
            }, 0);
        
        const currentMonthContribution = months
            .find(m => m.month === currentMonth)?.contributions
            .find(c => c.memberId === member.id);
        
        let currentMonthStatus = currentMonthContribution?.status ?? PaymentStatus.PENDING;
        
        const hasOverduePayment = months.some(month => 
            month.month < currentMonth && 
            month.contributions.some(c => c.memberId === member.id && c.status === PaymentStatus.OVERDUE)
        );

        if (currentMonthStatus === PaymentStatus.PENDING && hasOverduePayment) {
            currentMonthStatus = PaymentStatus.OVERDUE;
        }

        const payoutMonth = months.find(m => m.payoutMemberId === member.id);
        const hasBeenPaidOut = payoutMonth ? payoutMonth.month < currentMonth : false;

        return { totalContributions, currentMonthStatus, payoutMonth, hasBeenPaidOut };
    }, [cycle, member]);

    const statusIndicator = {
        [PaymentStatus.PAID]: { text: 'Paid', Icon: CheckCircleIcon, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
        [PaymentStatus.PENDING]: { text: 'Pending', Icon: ClockIcon, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
        [PaymentStatus.OVERDUE]: { text: 'Overdue', Icon: AlertTriangleIcon, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };

    const currentStatusInfo = statusIndicator[memberSummary.currentMonthStatus];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome, {member.name}!</h1>
                    <p className="text-slate-500 dark:text-slate-400">Your dashboard for the "{cycle.name}" circle.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={logout}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600"
                    >
                        <LogOutIcon className="w-5 h-5" />
                        Logout
                    </button>
                    <button
                        onClick={onToggleTheme}
                        className="p-2 rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </header>

            <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Total Contributed</p>
                            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                                <TrendingUpIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{memberSummary.totalContributions.toLocaleString()} BDT</p>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Current Month Status</p>
                            <div className={`${currentStatusInfo.className} p-2 rounded-full`}>
                                <currentStatusInfo.Icon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{currentStatusInfo.text}</p>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-slate-500 dark:text-slate-400 font-medium">My Payout Month</p>
                            <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full">
                                <CrownIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                        {memberSummary.payoutMonth ? (
                            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                                Month {memberSummary.payoutMonth.month}
                                {memberSummary.hasBeenPaidOut && <span className="text-base font-medium text-green-600 dark:text-green-400 align-middle"> (Received)</span>}
                            </p>
                        ) : (
                            <p className="text-2xl italic text-slate-500 dark:text-slate-400 mt-1">To be determined</p>
                        )}
                    </div>
                </div>

                {/* Contribution History */}
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50">
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">My Contribution History</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {months.map(month => {
                            const contribution = month.contributions.find(c => c.memberId === member.id);
                            if (!contribution) return null;
                            
                            const status = month.month >= currentMonth && memberSummary.currentMonthStatus === PaymentStatus.OVERDUE ? PaymentStatus.OVERDUE : contribution.status;
                            const statusInfo = statusIndicator[status];

                            return (
                                <div key={month.month} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">Month {month.month}</p>
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                                        <statusInfo.Icon className="w-3.5 h-3.5" />
                                        {statusInfo.text}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MemberDashboard;