import React, { useEffect, useRef, useState } from 'react';
import { RoscaCycle, Member, PaymentStatus } from '../types';
import { CheckCircleIcon, ClockIcon, AlertTriangleIcon, CrownIcon } from './Icons';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  cycle: RoscaCycle;
  onUpdateContribution: (monthNumber: number, memberId: string, newStatus: PaymentStatus, paymentDate?: string, amountPaid?: number) => void;
}

interface EditableContribution {
  month: number;
  status: PaymentStatus;
  paymentDate?: string;
  amountPaid?: number;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ isOpen, onClose, member, cycle, onUpdateContribution }) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<Element | null>(null);
  const [editableContributions, setEditableContributions] = useState<EditableContribution[]>([]);
  const [originalContributions, setOriginalContributions] = useState<EditableContribution[]>([]);

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement;
      const focusableElements = modalContentRef.current?.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"]), input, select');
      const firstElement = focusableElements?.[0];
      if (firstElement) {
        firstElement.focus();
      }
      
      const contributions = cycle.months
        .map(month => {
          const contribution = month.contributions.find(c => c.memberId === member.id);
          if (!contribution) return null;
          return {
            month: month.month,
            status: contribution.status,
            paymentDate: contribution.paymentDate,
            amountPaid: contribution.amountPaid,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);
      
      setEditableContributions(contributions);
      setOriginalContributions(JSON.parse(JSON.stringify(contributions))); // Deep copy
    }
  }, [isOpen, cycle, member]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
        return;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (triggerElementRef.current instanceof HTMLElement) {
        triggerElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  const handleContributionChange = (month: number, field: keyof EditableContribution, value: any) => {
    setEditableContributions(prev => prev.map(c => {
        if (c.month === month) {
            const updatedContribution = { ...c, [field]: value };
            if (field === 'status') {
                if (value !== PaymentStatus.PAID) {
                    updatedContribution.paymentDate = undefined;
                    updatedContribution.amountPaid = undefined;
                } else {
                    if (!updatedContribution.paymentDate) {
                        updatedContribution.paymentDate = new Date().toISOString();
                    }
                    if (updatedContribution.amountPaid === undefined) {
                        updatedContribution.amountPaid = cycle.monthlyContributionAmount;
                    }
                }
            }
             if (field === 'amountPaid') {
                updatedContribution.amountPaid = parseFloat(value) || 0;
            }
            return updatedContribution;
        }
        return c;
    }));
  };

  const handleSaveChanges = () => {
    editableContributions.forEach((edited, index) => {
      const original = originalContributions[index];
      if (edited.status !== original.status || edited.paymentDate !== original.paymentDate || edited.amountPaid !== original.amountPaid) {
        onUpdateContribution(edited.month, member.id, edited.status, edited.paymentDate, edited.amountPaid);
      }
    });
    onClose();
  };

  const statusIndicator = {
    [PaymentStatus.PAID]: { text: 'Paid', Icon: CheckCircleIcon },
    [PaymentStatus.PENDING]: { text: 'Pending', Icon: ClockIcon },
    [PaymentStatus.OVERDUE]: { text: 'Overdue', Icon: AlertTriangleIcon },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" aria-modal="true" role="dialog" aria-labelledby="history-modal-title">
      <div ref={modalContentRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-3xl m-4">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            <img src={member.avatarUrl} alt={member.name} className="w-14 h-14 rounded-full mr-4 border-2 border-slate-200 dark:border-slate-600" />
            <div>
              <h2 id="history-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white">
                Edit Payment History
              </h2>
              <p className="text-slate-500 dark:text-slate-400">{member.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
          <table className="w-full text-left table-auto">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700 z-10">
              <tr>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Month</th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Payment Date</th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Amount</th>
                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {editableContributions.map(contribution => {
                const isEditable = cycle.months.find(m => m.month === contribution.month)!.month < cycle.currentMonth;
                const isPayoutMonth = cycle.months.find(m => m.month === contribution.month)!.payoutMemberId === member.id;

                return (
                  <tr key={contribution.month}>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">Month {contribution.month}</td>
                    <td className="p-3">
                      <select
                        value={contribution.status}
                        onChange={(e) => handleContributionChange(contribution.month, 'status', e.target.value as PaymentStatus)}
                        disabled={!isEditable}
                        className="block w-full px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-600/50"
                      >
                        <option value={PaymentStatus.PAID}>Paid</option>
                        <option value={PaymentStatus.PENDING}>Pending</option>
                        <option value={PaymentStatus.OVERDUE}>Overdue</option>
                      </select>
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">
                      <input
                        type="date"
                        value={contribution.paymentDate ? contribution.paymentDate.split('T')[0] : ''}
                        onChange={(e) => handleContributionChange(contribution.month, 'paymentDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                        disabled={!isEditable || contribution.status !== PaymentStatus.PAID}
                        className="block w-full px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-600/50"
                      />
                    </td>
                     <td className="p-3 text-slate-500 dark:text-slate-400">
                      <input
                        type="number"
                        value={contribution.amountPaid ?? ''}
                        onChange={(e) => handleContributionChange(contribution.month, 'amountPaid', e.target.value)}
                        disabled={!isEditable || contribution.status !== PaymentStatus.PAID}
                        className="block w-full px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-600/50"
                        placeholder="N/A"
                      />
                    </td>
                    <td className="p-3 text-right">
                      {isPayoutMonth && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          <CrownIcon className="w-3.5 h-3.5" />
                          Payout Recipient
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};