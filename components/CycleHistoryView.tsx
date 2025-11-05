
import React, { useState, useEffect, useMemo } from 'react';
import { RoscaCycle, PaymentStatus } from '../types';
import { CheckCircleIcon } from './Icons';

interface CycleHistoryViewProps {
  cycle: RoscaCycle;
  onUpdateContribution: (monthNumber: number, memberId: string, newStatus: PaymentStatus, paymentDate?: string, amountPaid?: number) => void;
}

interface EditableContribution {
  memberId: string;
  month: number;
  status: PaymentStatus;
  paymentDate?: string;
  amountPaid?: number;
}

export const CycleHistoryView: React.FC<CycleHistoryViewProps> = ({ cycle, onUpdateContribution }) => {
  const { members, months, currentMonth, monthlyContributionAmount } = cycle;
  const [editableContributions, setEditableContributions] = useState<EditableContribution[]>([]);
  const [originalContributions, setOriginalContributions] = useState<EditableContribution[]>([]);

  useEffect(() => {
    const allContributions: EditableContribution[] = [];
    members.forEach(member => {
      months.forEach(month => {
        const contribution = month.contributions.find(c => c.memberId === member.id);
        if (contribution) {
          allContributions.push({
            memberId: member.id,
            month: month.month,
            status: contribution.status,
            paymentDate: contribution.paymentDate,
            amountPaid: contribution.amountPaid,
          });
        }
      });
    });
    setEditableContributions(allContributions);
    setOriginalContributions(JSON.parse(JSON.stringify(allContributions))); // Deep copy
  }, [cycle]);

  const handleFieldChange = (memberId: string, month: number, field: keyof EditableContribution, value: any) => {
    setEditableContributions(prev => prev.map(c => {
      if (c.memberId === memberId && c.month === month) {
        const updated = { ...c, [field]: value };
        if (field === 'status') {
          if (value === PaymentStatus.PAID) {
            if (c.status !== PaymentStatus.PAID) { // If status changes TO paid
              updated.paymentDate = new Date().toISOString();
              updated.amountPaid = c.amountPaid ?? monthlyContributionAmount;
            }
          } else {
            updated.paymentDate = undefined;
            updated.amountPaid = undefined;
          }
        }
        if (field === 'amountPaid') {
            updated.amountPaid = parseFloat(value) || 0;
        }
        return updated;
      }
      return c;
    }));
  };
  
  const handleSaveChanges = () => {
    editableContributions.forEach(edited => {
        const original = originalContributions.find(o => o.memberId === edited.memberId && o.month === edited.month);
        if (original && JSON.stringify(edited) !== JSON.stringify(original)) {
            onUpdateContribution(edited.month, edited.memberId, edited.status, edited.paymentDate, edited.amountPaid);
        }
    });
    // After saving, the parent state will update, triggering a re-render and useEffect which resets our state
  };
  
  const hasChanges = useMemo(() => {
    return JSON.stringify(editableContributions) !== JSON.stringify(originalContributions);
  }, [editableContributions, originalContributions]);

  const statusClasses: Record<PaymentStatus, string> = {
    [PaymentStatus.PAID]: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
    [PaymentStatus.PENDING]: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
    [PaymentStatus.OVERDUE]: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
  };

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50">
      <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">Full Payment History</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        View and edit the entire contribution history. Changes are applied when you click "Save Changes".
        Only months up to and including the current month ({currentMonth}) can be fully edited.
      </p>
      <div className="overflow-x-auto relative">
        <table className="w-full min-w-[1200px] text-sm text-left border-collapse">
          <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-100/80 dark:bg-slate-700/50">
            <tr>
              <th className="p-3 sticky left-0 z-10 bg-slate-100/80 dark:bg-slate-700/50 w-48">Member</th>
              {months.map(month => (
                <th key={month.month} className="p-3 text-center">Month {month.month}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800">
            {members.map(member => (
              <tr key={member.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/30">
                <td className="p-3 font-medium text-slate-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-slate-800 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <img src={member.avatarUrl} alt={member.name} className="w-9 h-9 rounded-full object-cover" />
                    <span className="truncate">{member.name}</span>
                  </div>
                </td>
                {months.map(month => {
                  const contribution = editableContributions.find(c => c.memberId === member.id && c.month === month.month);
                  if (!contribution) return <td key={`${member.id}-${month.month}`}></td>;

                  const isEditable = month.month <= currentMonth;
                  const { status, amountPaid } = contribution;
                  
                  return (
                    <td key={`${member.id}-${month.month}`} className="p-3 align-top border-b border-slate-200 dark:border-slate-700 w-40">
                      <div className="w-full">
                        <select
                          value={status}
                          onChange={(e) => handleFieldChange(member.id, month.month, 'status', e.target.value as PaymentStatus)}
                          disabled={!isEditable}
                          className={`w-full text-xs p-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${statusClasses[status]} disabled:bg-slate-200/50 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed`}
                        >
                          <option value={PaymentStatus.PAID}>Paid</option>
                          <option value={PaymentStatus.PENDING}>Pending</option>
                          <option value={PaymentStatus.OVERDUE}>Overdue</option>
                        </select>
                        {status === PaymentStatus.PAID && (
                          <input
                            type="number"
                            value={amountPaid ?? ''}
                            onChange={(e) => handleFieldChange(member.id, month.month, 'amountPaid', e.target.value)}
                            disabled={!isEditable}
                            className="mt-1.5 w-full text-xs p-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-200/50 dark:disabled:bg-slate-700/50"
                            placeholder="Amount"
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSaveChanges}
          disabled={!hasChanges}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCircleIcon className="w-5 h-5"/>
          Save Changes
        </button>
      </div>
    </div>
  );
};
