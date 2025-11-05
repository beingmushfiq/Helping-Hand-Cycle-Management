import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppUser } from '../types';
import { DollarSignIcon, SearchIcon, UserIcon } from './Icons';

interface CreateCycleModalProps {
  allUsers: AppUser[];
  onClose: () => void;
  onCreateCycle: (name: string, monthlyContribution: number, selectedUserIds: string[]) => void;
}

export const CreateCycleModal: React.FC<CreateCycleModalProps> = ({ allUsers, onClose, onCreateCycle }) => {
  const [cycleName, setCycleName] = useState('');
  const [contribution, setContribution] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const modalContentRef = useRef<HTMLDivElement>(null);

  const availableUsers = useMemo(() => {
    return allUsers.filter(user => !user.cycleId && user.email !== 'admin@gmail.com');
  }, [allUsers]);

  const filteredUsers = useMemo(() => {
    return availableUsers.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableUsers, searchQuery]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contributionAmount = parseFloat(contribution);
    if (cycleName.trim() && !isNaN(contributionAmount) && contributionAmount > 0 && selectedUserIds.size > 0) {
      onCreateCycle(cycleName.trim(), contributionAmount, Array.from(selectedUserIds));
      onClose();
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog" aria-labelledby="create-cycle-title">
      <div 
        ref={modalContentRef} 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl m-4 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="create-cycle-title" className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Create New Trust Circle</h2>
        
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="cycleName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Circle Name
              </label>
              <input
                type="text"
                id="cycleName"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Q1 2024 Circle"
                required
              />
            </div>
            <div>
              <label htmlFor="contribution" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monthly Contribution
              </label>
              <div className="relative">
                 <DollarSignIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  id="contribution"
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 1000"
                  required
                  min="1"
                />
              </div>
            </div>
          </div>

          <div className="flex-grow flex flex-col overflow-hidden">
            <h3 className="text-lg font-semibold mb-1 text-slate-800 dark:text-slate-100">Select Members</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Selected: <span className="font-bold text-primary-600 dark:text-primary-400">{selectedUserIds.size}</span>. The number of selected members will determine the cycle length.
            </p>

            <div className="relative mb-4">
              <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="flex-grow overflow-y-auto -mx-2 px-2 border-t border-b border-slate-200 dark:border-slate-700 py-2">
              {filteredUsers.length > 0 ? (
                <div className="space-y-2">
                {filteredUsers.map(user => (
                  <label key={user.uid} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedUserIds.has(user.uid) ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-300 dark:border-primary-700' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(user.uid)}
                      onChange={() => handleUserSelect(user.uid)}
                      className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <img src={`https://picsum.photos/seed/${user.name.toLowerCase()}/100`} alt={user.name} className="w-10 h-10 rounded-full mx-4" />
                    <div className="flex-grow">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{user.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </label>
                ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <UserIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {availableUsers.length === 0 ? "No registered users available." : "No users match your search."}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!cycleName.trim() || !contribution || selectedUserIds.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500 disabled:bg-slate-400 dark:disabled:bg-slate-600"
            >
              Create Cycle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};