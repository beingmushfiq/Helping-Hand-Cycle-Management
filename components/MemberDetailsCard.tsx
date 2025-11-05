import React from 'react';
import { Member, PaymentStatus } from '../types';
import { CalendarIcon, DollarSignIcon, CrownIcon, TrendingUpIcon, PencilIcon, TrashIcon } from './Icons';

interface MemberDetailsCardProps {
  member: Member;
  totalContributions: number;
  hasBeenPaidOut: boolean;
  currentMonthStatus: PaymentStatus;
  onEdit: (memberId: string) => void;
  onRemove: (memberId: string) => void;
}

export const MemberDetailsCard: React.FC<MemberDetailsCardProps> = ({ member, totalContributions, hasBeenPaidOut, currentMonthStatus, onEdit, onRemove }) => {
  const statusIndicator = {
    [PaymentStatus.PAID]: {
      className: 'bg-green-500',
      title: 'Paid',
    },
    [PaymentStatus.PENDING]: {
      className: 'bg-yellow-500',
      title: 'Pending',
    },
    [PaymentStatus.OVERDUE]: {
      className: 'bg-red-500',
      title: 'Overdue',
    },
  };

  const status = statusIndicator[currentMonthStatus];

  return (
    <div className="relative group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg shadow-sm transition-all duration-300 border border-white/50 dark:border-slate-700/50">
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => onEdit(member.id)}
          className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-500"
          aria-label={`Edit ${member.name}`}
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onRemove(member.id)}
          className="p-1.5 rounded-full bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-700"
          aria-label={`Remove ${member.name}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center mb-4">
        <img src={member.avatarUrl} alt={member.name} className="w-12 h-12 rounded-full mr-4 border-2 border-white dark:border-slate-600" />
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-slate-800 dark:text-slate-200">{member.name}</p>
            <span className={`w-3 h-3 rounded-full ${status.className}`} title={`Current month status: ${status.title}`}></span>
          </div>
          {hasBeenPaidOut && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              <CrownIcon className="w-3 h-3" />
              Payout Received
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="flex items-center text-slate-600 dark:text-slate-300">
            <CalendarIcon className="w-4 h-4 mr-2 text-sky-600 dark:text-sky-400" />
            Joined
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{member.joiningMonthName} (M{member.joinMonth})</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center text-slate-600 dark:text-slate-300">
            <TrendingUpIcon className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
            Total Contributions
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{totalContributions.toLocaleString()} BDT</span>
        </div>
        {member.lateFeePaid > 0 && (
          <div className="flex justify-between items-center">
            <span className="flex items-center text-slate-600 dark:text-slate-300">
              <DollarSignIcon className="w-4 h-4 mr-2 text-red-600 dark:text-red-400" />
              Joining Fee Paid
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{member.lateFeePaid.toLocaleString()} BDT</span>
          </div>
        )}
      </div>
    </div>
  );
};