import React, { useState, useMemo } from 'react';
import { AppUser, RoscaCycle } from '../types';
import { AddUserModal } from './AddUserModal';
import { EditUserModal } from './EditUserModal';
import { ConfirmRemovalModal } from './ConfirmRemovalModal';
import { UserPlusIcon, PencilIcon, TrashIcon, SearchIcon } from './Icons';

interface UserManagementProps {
  allUsers: AppUser[];
  cycles: RoscaCycle[];
  onAddUser: (uid: string, name: string, email: string) => void;
  onEditUser: (uid: string, name: string, email: string) => void;
  onDeleteUser: (uid: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ allUsers, cycles, onAddUser, onEditUser, onDeleteUser }) => {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const cycleMap = useMemo(() => {
    const map = new Map<string, string>();
    cycles.forEach(cycle => map.set(cycle.id, cycle.name));
    return map;
  }, [cycles]);

  const filteredUsers = useMemo(() => {
    return allUsers
      .filter(user => user.email !== 'admin@gmail.com')
      .filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [allUsers, searchQuery]);

  const handleEditClick = (user: AppUser) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };
  
  const handleDeleteClick = (user: AppUser) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      onDeleteUser(selectedUser.uid);
    }
    setDeleteModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">User Management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add, edit, or remove users from the system.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg shadow-sm hover:bg-primary-500"
        >
          <UserPlusIcon className="w-5 h-5"/>
          Add New User
        </button>
      </div>

      <div className="relative mb-4">
          <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full max-w-sm pl-10 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-100/80 dark:bg-slate-700/50">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Email</th>
              <th className="p-3">Assigned Cycle</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredUsers.map(user => (
              <tr key={user.uid}>
                <td className="p-3 font-medium text-slate-900 dark:text-white">
                  <div className="flex items-center gap-3">
                    <img src={`https://picsum.photos/seed/${user.name.toLowerCase()}/100`} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                    <span>{user.name}</span>
                  </div>
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">{user.email}</td>
                <td className="p-3 text-slate-500 dark:text-slate-400">
                  {user.cycleId ? (
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">
                      {cycleMap.get(user.cycleId) || 'Unknown Cycle'}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEditClick(user)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600" aria-label={`Edit ${user.name}`}>
                      <PencilIcon className="w-4 h-4"/>
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(user)} 
                      disabled={!!user.cycleId}
                      className="p-2 rounded-full text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent disabled:cursor-not-allowed" 
                      aria-label={`Delete ${user.name}`}
                      title={user.cycleId ? 'Cannot delete user assigned to a cycle' : 'Delete user'}
                    >
                      <TrashIcon className="w-4 h-4"/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <AddUserModal
          onClose={() => setAddModalOpen(false)}
          onAddUser={onAddUser}
        />
      )}
      {isEditModalOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setEditModalOpen(false)}
          onEditUser={onEditUser}
        />
      )}
      {isDeleteModalOpen && selectedUser && (
        <ConfirmRemovalModal
          isOpen={isDeleteModalOpen}
          title="Delete User"
          message={<>Are you sure you want to delete <span className="font-bold">{selectedUser.name}</span>? This action cannot be undone.</>}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          confirmButtonText="Delete User"
        />
      )}
    </div>
  );
};