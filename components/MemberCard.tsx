
import React from 'react';
import { Member } from '../types';
import { CrownIcon } from './Icons';

interface MemberCardProps {
  member: Member;
  isPayoutRecipient: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, isPayoutRecipient }) => {
  return (
    <div className={`flex items-center p-3 rounded-lg transition-all duration-300 ${isPayoutRecipient ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
      <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full mr-4 border-2 border-white dark:border-slate-600" />
      <div className="flex-grow">
        <p className="font-semibold text-slate-800 dark:text-slate-200">{member.name}</p>
      </div>
      {isPayoutRecipient && (
        <div className="flex items-center text-amber-600 dark:text-amber-400">
          <CrownIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};
