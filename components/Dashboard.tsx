import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RoscaCycle, RoscaMonth, RuleType, PaymentStatus, Member, AppUser } from '../types';
import { MonthDetail } from './MonthDetail';
import { EditMemberModal } from './EditMemberModal';
import { ConfirmRemovalModal } from './ConfirmRemovalModal';
import { CycleCompletionSummary } from './CycleCompletionSummary';
import { PaymentHistoryModal } from './PaymentHistoryModal';
import { AddMemberModal } from './AddMemberModal';
import { CalendarIcon, DollarSignIcon, SearchIcon, PencilIcon, TrashIcon, CrownIcon, ChevronUpIcon, ChevronDownIcon, TrendingUpIcon, EyeIcon, UserPlusIcon } from './Icons';
import { CycleCharts } from './CycleCharts';

interface DashboardProps {
  roscaCycle: RoscaCycle;
  currentMonthData: RoscaMonth;
  allUsers: AppUser[];
  onMarkAsPaid: (memberId: string, amount: number) => void;
  onAdvanceToNextMonth: (payoutAmount: number) => void;
  onSetRuleType: (ruleType: RuleType) => void;
  onEditMember: (memberId: string, updatedDetails: { name: string; avatarUrl: string; joiningMonthName: string; }) => void;
  onRemoveMember: (memberId: string) => void;
  onAddMember: (newUserIds: string[]) => void;
  onRenameCycle: (newName: string) => void;
  onUpdateContribution: (monthNumber: number, memberId: string, newStatus: PaymentStatus, paymentDate?: string, amountPaid?: number) => void;
}

interface EnrichedMember extends Member {
  totalContributions: number;
  hasBeenPaidOut: boolean;
  currentMonthStatus: PaymentStatus;
}

const Dashboard: React.FC<DashboardProps> = ({
  roscaCycle,
  currentMonthData,
  allUsers,
  onMarkAsPaid,
  onAdvanceToNextMonth,
  onSetRuleType,
  onEditMember,
  onRemoveMember,
  onAddMember,
  onRenameCycle,
  onUpdateContribution,
}) => {
  const { members, monthlyContributionAmount, currentMonth, months, ruleType, name, cycleLength, savingsFund } = roscaCycle;
  const isCycleComplete = currentMonth > cycleLength;
  
  const totalCollectedThisMonth = useMemo(() => {
    return currentMonthData?.contributions.reduce((sum, contribution) => {
        if (contribution.status === PaymentStatus.PAID) {
            return sum + (contribution.amountPaid ?? 0);
        }
        return sum;
    }, 0) ?? 0;
  }, [currentMonthData]);

  const monthlyPayout = totalCollectedThisMonth * 0.8;
  
  const [isEditMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [isRemoveModalOpen, setRemoveModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [memberForHistory, setMemberForHistory] = useState<Member | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [cycleNameInput, setCycleNameInput] = useState(name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [sortConfig, setSortConfig] = useState<{ key: keyof EnrichedMember; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
    }
  }, [isEditingName]);
  
  const handleRename = () => {
    if (cycleNameInput.trim()) {
        onRenameCycle(cycleNameInput.trim());
    } else {
        setCycleNameInput(name); // Reset if empty
    }
    setIsEditingName(false);
  };

  const filteredMembers = useMemo<EnrichedMember[]>(() => {
    return members.map(member => {
      const totalContributions = months
        .filter(month => month.month <= currentMonth)
        .reduce((acc, month) => {
          const contribution = month.contributions.find(c => c.memberId === member.id);
          if (contribution?.status === PaymentStatus.PAID) {
            return acc + (contribution.amountPaid ?? monthlyContributionAmount);
          }
          return acc;
        }, 0);

      const hasBeenPaidOut = months.some(m => m.month < currentMonth && m.payoutMemberId === member.id);

      const currentContribution = currentMonthData.contributions.find(c => c.memberId === member.id);
      let status = currentContribution?.status ?? PaymentStatus.PENDING;

      if (status === PaymentStatus.PENDING) {
        const hasOverduePayment = months.some(month =>
          month.month < currentMonth &&
          month.contributions.some(c => c.memberId === member.id && c.status === PaymentStatus.OVERDUE)
        );
        if (hasOverduePayment) {
          status = PaymentStatus.OVERDUE;
        }
      }

      return {
        ...member,
        totalContributions,
        hasBeenPaidOut,
        currentMonthStatus: status,
      };
    }).filter(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, months, currentMonth, monthlyContributionAmount, currentMonthData, searchQuery]);
  
  const sortedMembers = useMemo(() => {
    const sortableItems = [...filteredMembers];
    sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA < valB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });
    return sortableItems;
  }, [filteredMembers, sortConfig]);

  const requestSort = (key: keyof EnrichedMember) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof EnrichedMember) => {
    if (sortConfig.key !== key) return <span className="w-4 h-4 opacity-30"></span>;
    return sortConfig.direction === 'ascending' 
        ? <ChevronUpIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" /> 
        : <ChevronDownIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
  };
  
  useEffect(() => {
    setCycleNameInput(name);
  }, [name]);

  const handleOpenEditModal = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setMemberToEdit(member);
      setEditMemberModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setMemberToEdit(null);
    setEditMemberModalOpen(false);
  };

  const handleOpenRemoveModal = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setMemberToRemove(member);
      setRemoveModalOpen(true);
    }
  };

  const handleCloseRemoveModal = () => {
    setMemberToRemove(null);
    setRemoveModalOpen(false);
  };

  const handleConfirmRemove = () => {
    if (memberToRemove) {
      onRemoveMember(memberToRemove.id);
      handleCloseRemoveModal();
    }
  };

  const handleOpenHistoryModal = (member: Member) => {
    setMemberForHistory(member);
    setHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setMemberForHistory(null);
    setHistoryModalOpen(false);
  };

  const statusIndicator: { [key in PaymentStatus]: { className: string; title: string } } = {
    [PaymentStatus.PAID]: { className: 'bg-green-500', title: 'Paid' },
    [PaymentStatus.PENDING]: { className: 'bg-yellow-500', title: 'Pending' },
    [PaymentStatus.OVERDUE]: { className: 'bg-red-500', title: 'Overdue' },
  };
  
  if (isCycleComplete) {
      return (
          <CycleCompletionSummary roscaCycle={roscaCycle} />
      );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-6 text-center group">
        <div className="relative inline-flex items-center justify-center">
            {isEditingName ? (
                <input
                    ref={nameInputRef}
                    type="text"
                    value={cycleNameInput}
                    onChange={(e) => setCycleNameInput(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-primary-500 focus:outline-none text-center"
                />
            ) : (
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent py-1">
                    {name}
                </h1>
            )}
            <button
                onClick={() => setIsEditingName(!isEditingName)}
                className={`ml-3 p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity ${isEditingName ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                aria-label="Rename cycle"
            >
                <PencilIcon className="w-5 h-5"/>
            </button>
        </div>
        <p className="text-lg text-slate-500 dark:text-slate-400">{members.length} Members, {cycleLength} Months Cycle</p>
      </header>
      
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl shadow-lg mb-8 border border-white/50 dark:border-slate-700/50">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className='flex items-center gap-2'>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Joining Rule:</span>
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => onSetRuleType(RuleType.STRICT)}
                  className={`px-4 py-2 text-sm font-medium ${ruleType === RuleType.STRICT ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200'} border border-slate-200 dark:border-slate-600 rounded-l-lg hover:bg-slate-100 dark:hover:bg-slate-600`}
                >
                  Strict
                </button>
                <button
                  type="button"
                  onClick={() => onSetRuleType(RuleType.FLEXIBLE)}
                  className={`px-4 py-2 text-sm font-medium ${ruleType === RuleType.FLEXIBLE ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200'} border border-slate-200 dark:border-slate-600 rounded-r-md hover:bg-slate-100 dark:hover:bg-slate-600`}
                >
                  Flexible
                </button>
              </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-sky-500 to-cyan-400 text-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-full">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium">Current Month</p>
            <p className="text-2xl font-bold">{currentMonth} / {cycleLength}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-teal-400 text-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-full">
             <DollarSignIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium">This Month's Payout (80%)</p>
            <p className="text-2xl font-bold">{monthlyPayout.toLocaleString()} BDT</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-400 text-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-full">
            <TrendingUpIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium">Total Savings Fund</p>
            <p className="text-2xl font-bold">{savingsFund.toLocaleString()} BDT</p>
          </div>
        </div>
      </div>

      <CycleCharts roscaCycle={roscaCycle} currentMonthData={currentMonthData} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <MonthDetail
              monthData={currentMonthData}
              allMonths={months}
              members={members}
              monthlyContributionAmount={monthlyContributionAmount}
              onMarkAsPaid={onMarkAsPaid}
              onAdvanceToNextMonth={onAdvanceToNextMonth}
              isLastMonth={currentMonth === cycleLength}
              cycleName={name}
            />
        </div>
        <div className="md:col-span-1">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50">
                <div className="flex items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-grow">
                        Member Details
                        <span className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 text-xs font-bold px-2.5 py-1 rounded-full">
                            {members.length}
                        </span>
                    </h2>
                    <button onClick={() => setAddMemberModalOpen(true)} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Add new member">
                        <UserPlusIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        aria-label="Search members"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-100/80 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-4 py-3 cursor-pointer select-none" onClick={() => requestSort('name')}>
                                    <div className="flex items-center gap-1">Member {getSortIcon('name')}</div>
                                </th>
                                <th scope="col" className="px-4 py-3 cursor-pointer select-none" onClick={() => requestSort('currentMonthStatus')}>
                                    <div className="flex items-center gap-1">Status {getSortIcon('currentMonthStatus')}</div>
                                </th>
                                <th scope="col" className="px-4 py-3 cursor-pointer select-none text-right" onClick={() => requestSort('totalContributions')}>
                                    <div className="flex items-center justify-end gap-1">Total Paid {getSortIcon('totalContributions')}</div>
                                </th>
                                <th scope="col" className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMembers.length > 0 ? (
                                sortedMembers.map(member => {
                                    const status = statusIndicator[member.currentMonthStatus];
                                    return (
                                        <tr key={member.id} className="bg-white/80 dark:bg-slate-800/80 border-b dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-900/30 align-top">
                                            <td scope="row" className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                                <div className="flex items-start gap-3">
                                                    <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                                    <div className="flex-1">
                                                        <span>{member.name}</span>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">Joined M{member.joinMonth}</div>
                                                        {member.hasBeenPaidOut && (
                                                            <span className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                                <CrownIcon className="w-3 h-3" /> Payout Received
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-3 h-3 rounded-full ${status.className}`} title={`Current month status: ${status.title}`}></span>
                                                    <span>{status.title}</span>
                                                </div>
                                            </td>
                                             <td className="px-4 py-3 font-mono text-right">{member.totalContributions.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => handleOpenHistoryModal(member)} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600" aria-label={`View history for ${member.name}`}>
                                                      <EyeIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleOpenEditModal(member.id)} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600" aria-label={`Edit ${member.name}`}>
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleOpenRemoveModal(member.id)} className="p-1.5 rounded-full text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50" aria-label={`Remove ${member.name}`}>
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8">
                                        <p className="text-slate-500 dark:text-slate-400">No members found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
      
      {isEditMemberModalOpen && (
          <EditMemberModal
            member={memberToEdit}
            onClose={handleCloseEditModal}
            onSave={onEditMember}
          />
      )}
      {isAddMemberModalOpen && (
        <AddMemberModal
            allUsers={allUsers}
            currentMemberIds={members.map(m => m.id)}
            onClose={() => setAddMemberModalOpen(false)}
            onAddMembers={onAddMember}
        />
      )}
      {isRemoveModalOpen && memberToRemove && (
        <ConfirmRemovalModal
          isOpen={isRemoveModalOpen}
          title="Confirm Removal"
          message={<>Are you sure you want to remove <span className="font-bold">{memberToRemove.name}</span> from the cycle? This will make them available to join other cycles.</>}
          onClose={handleCloseRemoveModal}
          onConfirm={handleConfirmRemove}
          confirmButtonText="Remove Member"
        />
      )}
      {isHistoryModalOpen && memberForHistory && (
        <PaymentHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={handleCloseHistoryModal}
          member={memberForHistory}
          cycle={roscaCycle}
          onUpdateContribution={onUpdateContribution}
        />
      )}
    </div>
  );
};

export default Dashboard;