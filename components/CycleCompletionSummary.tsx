import React from 'react';
import { RoscaCycle, Member } from '../types';
import { PartyPopperIcon, DollarSignIcon, TrendingUpIcon } from './Icons';

interface CycleCompletionSummaryProps {
  roscaCycle: RoscaCycle;
}

const getMemberSummary = (member: Member, roscaCycle: RoscaCycle) => {
    const { months, monthlyContributionAmount } = roscaCycle;

    const totalContributions = months.reduce((acc, month) => {
        const contribution = month.contributions.find(c => c.memberId === member.id);
        // We assume all contributions are paid by the end of the cycle for this summary.
        // The logic correctly handles members who joined late by only including them in months they were part of.
        if (contribution) {
            return acc + (contribution.amountPaid ?? monthlyContributionAmount);
        }
        return acc;
    }, 0);

    const payoutMonth = months.find(m => m.payoutMemberId === member.id);
    const payoutReceived = payoutMonth?.payoutAmount ?? 0;
    
    // This is the one-time premium paid for joining late, as tracked in the Member object.
    const lateFeePaid = member.lateFeePaid;

    return {
        ...member,
        totalContributions,
        payoutReceived,
        lateFeePaid,
    };
};

export const CycleCompletionSummary: React.FC<CycleCompletionSummaryProps> = ({ roscaCycle }) => {
    const summaryData = roscaCycle.members.map(member => getMemberSummary(member, roscaCycle));

    return (
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-green-50 via-blue-50 to-violet-100 dark:from-slate-800 dark:via-slate-900 dark:to-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
            <PartyPopperIcon className="w-24 h-24 text-violet-500 mb-6" />
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2 bg-gradient-to-r from-green-500 via-primary-500 to-violet-500 bg-clip-text text-transparent">Congratulations!</h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">The Helping Hand Trust Circle is complete.</p>

            <div className="w-full max-w-lg mb-8 bg-green-100 dark:bg-green-900/50 p-6 rounded-xl shadow-lg border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Total Savings Fund Accumulated</h3>
                <p className="text-4xl font-bold text-green-700 dark:text-green-300">{roscaCycle.savingsFund.toLocaleString()} BDT</p>
            </div>
            
            <div className="w-full max-w-4xl text-left">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">Cycle Summary</h2>
                <div className="space-y-4">
                    {summaryData.map(member => (
                        <div key={member.id} className="bg-white/60 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm transition-all duration-300 backdrop-blur-sm border border-white/50 dark:border-slate-600/50">
                            <div className="flex items-center mb-3">
                                <img src={member.avatarUrl} alt={member.name} className="w-12 h-12 rounded-full mr-4 border-2 border-white dark:border-slate-600" />
                                <p className="font-bold text-lg text-slate-800 dark:text-slate-200">{member.name}</p>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center text-slate-600 dark:text-slate-300">
                                        <TrendingUpIcon className="w-4 h-4 mr-2" />
                                        Total Contributions
                                    </span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{member.totalContributions.toLocaleString()} BDT</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center text-slate-600 dark:text-slate-300">
                                        <DollarSignIcon className="w-4 h-4 mr-2 text-green-500" />
                                        Payout Received
                                    </span>
                                    <span className="font-semibold text-green-600 dark:text-green-400">{member.payoutReceived.toLocaleString()} BDT</span>
                                </div>
                                {member.lateFeePaid > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center text-slate-600 dark:text-slate-300">
                                            <DollarSignIcon className="w-4 h-4 mr-2 text-red-500" />
                                            Late Join Premium
                                        </span>
                                        <span className="font-semibold text-red-500 dark:text-red-300">{member.lateFeePaid.toLocaleString()} BDT</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};