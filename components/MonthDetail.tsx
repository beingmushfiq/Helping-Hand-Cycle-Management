import React, { useState, useEffect, useMemo } from 'react';
import { RoscaMonth, Member, PaymentStatus } from '../types';
import { ArrowRightIcon, CrownIcon, CheckCircleIcon, ClockIcon, AlertTriangleIcon, MailIcon, DollarSignIcon } from './Icons';

interface MonthDetailProps {
  monthData: RoscaMonth;
  allMonths: RoscaMonth[];
  members: Member[];
  monthlyContributionAmount: number;
  onMarkAsPaid: (memberId: string, amount: number) => void;
  onAdvanceToNextMonth: (payoutAmount: number) => void;
  isLastMonth: boolean;
  cycleName: string;
}

export const MonthDetail: React.FC<MonthDetailProps> = ({
  monthData,
  allMonths,
  members,
  monthlyContributionAmount,
  onMarkAsPaid,
  onAdvanceToNextMonth,
  isLastMonth,
  cycleName,
}) => {
  const [remindersSent, setRemindersSent] = useState<Set<string>>(new Set());
  const [inputAmounts, setInputAmounts] = useState<Record<string, string>>({});
  
  const currentMembersInCycle = useMemo(() => {
    return members.filter(m => monthData.contributions.some(c => c.memberId === m.id));
  }, [members, monthData]);
  
  const allContributionsPaid = useMemo(() => 
    monthData.contributions.every(c => c.status === PaymentStatus.PAID),
    [monthData]
  );
  
  const payoutMember = monthData.payoutMemberId ? members.find(m => m.id === monthData.payoutMemberId) : null;
  
  useEffect(() => {
    const initialAmounts: Record<string, string> = {};
    currentMembersInCycle.forEach(member => {
        const contribution = monthData.contributions.find(c => c.memberId === member.id);
        if (contribution && contribution.status !== PaymentStatus.PAID) {
            initialAmounts[member.id] = String(monthlyContributionAmount);
        }
    });
    setInputAmounts(initialAmounts);
  }, [currentMembersInCycle, monthData, monthlyContributionAmount]);

  const handleAmountChange = (memberId: string, value: string) => {
    setInputAmounts(prev => ({ ...prev, [memberId]: value }));
  };

  const handleMarkPaid = (memberId: string) => {
    const amountStr = inputAmounts[memberId] || String(monthlyContributionAmount);
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount >= 0) {
        onMarkAsPaid(memberId, amount);
    }
  };

  const totalCollectedThisMonth = useMemo(() => {
    return monthData.contributions.reduce((sum, contribution) => {
        if (contribution.status === PaymentStatus.PAID) {
            return sum + (contribution.amountPaid ?? 0);
        }
        return sum;
    }, 0);
  }, [monthData]);
    
  const calculatedPayout = totalCollectedThisMonth * 0.8;
  const [payoutAmountInput, setPayoutAmountInput] = useState('');

  useEffect(() => {
    if (allContributionsPaid) {
        setPayoutAmountInput(String(calculatedPayout));
    }
  }, [allContributionsPaid, calculatedPayout]);


  const handleSendReminder = (member: Member) => {
    const subject = `Payment Reminder for '${cycleName}'`;
    const body = `Hello ${member.name},\n\nThis is a friendly reminder that your contribution of ${monthlyContributionAmount} BDT for Month ${monthData.month} is currently pending/overdue.\n\nPlease make your payment as soon as possible.\n\nThank you,\nAdministrator`;
    const mailtoLink = `mailto:${member.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    setRemindersSent(prev => new Set(prev).add(member.id));
    setTimeout(() => {
      setRemindersSent(prev => {
        const newSet = new Set(prev);
        newSet.delete(member.id);
        return newSet;
      });
    }, 3000); 
  };

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50">
      <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">Month {monthData.month} Details</h2>
      
      <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg">
          <p className="text-sm text-white/80">Payout Recipient:</p>
          <div className="text-xl font-bold flex items-center">
            {payoutMember ? (
                <>
                  <img src={payoutMember.avatarUrl} alt={payoutMember.name} className="w-8 h-8 rounded-full mr-3 border-2 border-white/50" />
                  <span>{payoutMember.name}</span>
                </>
              ) : (
                <span className="text-slate-100 italic text-base">
                  To be determined upon finalization
                </span>
              )}
          </div>
      </div>

      <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">
        Contributions
      </h3>
      
      <div className="space-y-3 mb-8">
        {currentMembersInCycle.map(member => {
          const contribution = monthData.contributions.find(c => c.memberId === member.id);
          const actualStatus = contribution ? contribution.status : PaymentStatus.PENDING;
          
          const hasOverduePayment = allMonths.some(month => 
            month.month < monthData.month && 
            month.contributions.some(c => c.memberId === member.id && c.status === PaymentStatus.OVERDUE)
          );

          let displayStatus = actualStatus;
          if (actualStatus === PaymentStatus.PENDING && hasOverduePayment) {
            displayStatus = PaymentStatus.OVERDUE;
          }

          return (
            <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg gap-3">
              <div className="flex items-center">
                <img src={member.avatarUrl} alt={member.name} className="w-9 h-9 rounded-full mr-3" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{member.name}</span>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto sm:justify-end">
                    {displayStatus === PaymentStatus.PAID ? (
                      <div className="text-right w-full">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          Paid
                        </span>
                         {contribution?.amountPaid !== undefined && (
                           <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                             {contribution.amountPaid.toLocaleString()} BDT
                           </p>
                         )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1">
                          <DollarSignIcon className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                              type="number"
                              value={inputAmounts[member.id] || ''}
                              onChange={(e) => handleAmountChange(member.id, e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleMarkPaid(member.id)}
                              className="w-full pl-7 pr-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                              aria-label={`Payment amount for ${member.name}`}
                          />
                        </div>
                        <button
                          onClick={() => handleMarkPaid(member.id)}
                          className="px-3 py-1.5 text-sm font-semibold text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleSendReminder(member)}
                          disabled={remindersSent.has(member.id)}
                          title="Send Reminder Email"
                          className="p-2 text-white bg-sky-600 rounded-md shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                        >
                          {remindersSent.has(member.id) ? (
                              <CheckCircleIcon className="w-5 h-5" />
                          ) : (
                              <MailIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    )}
              </div>
            </div>
          );
        })}
      </div>

      {allContributionsPaid && (
          <div className="mt-6 mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 space-y-3 transition-all duration-500">
            <h4 className="text-lg font-bold text-green-800 dark:text-green-200">Ready to Finalize</h4>
            <div className="flex flex-col sm:flex-row justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Total Collected this Month:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{totalCollectedThisMonth.toLocaleString()} BDT</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Calculated Payout (80%):</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{calculatedPayout.toLocaleString()} BDT</span>
            </div>
             <div className="pt-2">
                <label htmlFor="payout-amount" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Actual Payout Amount
                </label>
                <div className="relative">
                    <DollarSignIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="number"
                        id="payout-amount"
                        value={payoutAmountInput}
                        onChange={(e) => setPayoutAmountInput(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-base font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>
          </div>
      )}

      <button
        onClick={() => onAdvanceToNextMonth(parseFloat(payoutAmountInput) || 0)}
        disabled={!allContributionsPaid}
        title={!allContributionsPaid ? "All contributions must be marked as 'Paid' to proceed." : (isLastMonth ? "Complete the cycle" : "Advance to the next month")}
        className="w-full flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 group"
      >
        {isLastMonth ? 'Complete Cycle' : 'Finalize & Advance to Next Month'}
        <ArrowRightIcon className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"/>
      </button>
    </div>
  );
};