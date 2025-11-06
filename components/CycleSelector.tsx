import React, { useState, useRef, useEffect, useMemo } from 'react';
import { RoscaCycle } from '../types';
import { TrashIcon, PencilIcon, UserPlusIcon, ArchiveIcon, LogOutIcon, SunIcon, MoonIcon, ShieldCheckIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from './Icons';
import { ConfirmModal } from './ConfirmRemovalModal';
import { useAuth } from '../context/AuthContext';

interface CycleSelectorProps {
  cycles: RoscaCycle[];
  activeCycleId: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectCycle: (id: string) => void;
  onCreateCycle: () => void;
  onDeleteCycle: (id: string) => void;
  onRenameCycle: (id: string, newName: string) => void;
  onArchiveCycle: (id: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const CycleSelector: React.FC<CycleSelectorProps> = ({
  cycles,
  activeCycleId,
  isExpanded,
  onToggleExpand,
  onSelectCycle,
  onCreateCycle,
  onDeleteCycle,
  onRenameCycle,
  onArchiveCycle,
  theme,
  onToggleTheme,
}) => {
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { logout } = useAuth();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<RoscaCycle | null>(null);

  const { activeCycles, archivedCycles } = useMemo(() => {
    const active: RoscaCycle[] = [];
    const archived: RoscaCycle[] = [];
    cycles.forEach(cycle => {
      if (cycle.isArchived) {
        archived.push(cycle);
      } else {
        active.push(cycle);
      }
    });
    return { activeCycles: active, archivedCycles: archived };
  }, [cycles]);

  useEffect(() => {
    if (editingCycleId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCycleId]);
    
  const handleOpenDeleteModal = (e: React.MouseEvent, cycle: RoscaCycle) => {
    e.stopPropagation();
    setCycleToDelete(cycle);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setCycleToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (cycleToDelete) {
      onDeleteCycle(cycleToDelete.id);
      handleCloseDeleteModal();
    }
  };

  const handleEditClick = (e: React.MouseEvent, cycle: RoscaCycle) => {
    e.stopPropagation();
    setEditingCycleId(cycle.id);
    setEditedName(cycle.name);
  };
  
  const handleArchiveClick = (e: React.MouseEvent, cycleId: string) => {
    e.stopPropagation();
    onArchiveCycle(cycleId);
  };

  const handleRenameSubmit = (cycleId: string, originalName: string) => {
    if (editedName.trim() && editedName.trim() !== originalName) {
      onRenameCycle(cycleId, editedName.trim());
    }
    setEditingCycleId(null);
  };
    
  return (
    <>
      <aside className={`fixed top-0 left-0 h-full z-30 bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700 flex flex-col transition-[width] duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}`}>
        <button 
            onClick={onToggleExpand} 
            className="absolute -right-3 top-6 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-full p-1 z-40 text-slate-600 dark:text-slate-300 transition-transform hover:scale-110"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
            {isExpanded ? <ChevronDoubleLeftIcon className="w-4 h-4" /> : <ChevronDoubleRightIcon className="w-4 h-4" />}
        </button>

        <div className={`h-16 px-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 overflow-hidden`}>
            <ShieldCheckIcon className="w-7 h-7 text-primary-600 dark:text-primary-400 flex-shrink-0"/>
            <h2 className={`text-xl font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100 delay-150' : 'opacity-0'}`}>
                Trust Circles
            </h2>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
            {activeCycles.map(cycle => {
              const isComplete = cycle.currentMonth > cycle.cycleLength;
              const isActive = activeCycleId === cycle.id && !editingCycleId;
              return (
                <button
                  key={cycle.id}
                  title={!isExpanded ? cycle.name : undefined}
                  onClick={() => editingCycleId !== cycle.id && onSelectCycle(cycle.id)}
                  className={`w-full text-center py-3 px-2.5 rounded-lg flex flex-col items-center justify-center group transition-colors duration-200 relative overflow-hidden ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
                  }`}
                >
                  <span className={`absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-full transition-transform duration-300 ease-out ${isActive ? 'scale-y-100' : 'scale-y-0'}`}></span>
                  
                  {editingCycleId === cycle.id ? (
                     <input
                      ref={inputRef}
                      type="text"
                      value={editedName}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={() => handleRenameSubmit(cycle.id, cycle.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(cycle.id, cycle.name);
                        if (e.key === 'Escape') setEditingCycleId(null);
                      }}
                      className="w-full bg-transparent text-slate-800 dark:text-white border-b-2 border-primary-500 focus:outline-none text-center"
                    />
                  ) : (
                    <>
                    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white uppercase ${isActive ? 'bg-primary-500' : 'bg-slate-400 dark:bg-slate-500'}`}>
                            {cycle.name.charAt(0)}
                        </div>
                        <span className={`text-xs text-center truncate w-full whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100 delay-150' : 'opacity-0'}`}>{cycle.name}</span>
                    </div>

                    <div className={`absolute right-1 top-1/2 -translate-y-1/2 transition-opacity duration-200 bg-inherit flex flex-col gap-1 ${isExpanded ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                        {isComplete ? (
                          <span
                            onClick={(e) => handleArchiveClick(e, cycle.id)}
                            className={`p-1.5 rounded-full ${isActive ? 'hover:bg-primary-100 dark:hover:bg-primary-900' : 'hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                            aria-label={`Archive ${cycle.name}`} title="Archive Cycle">
                            <ArchiveIcon className="w-4 h-4 text-green-600 dark:text-green-400"/>
                          </span>
                        ) : (
                          <>
                            <span onClick={(e) => handleEditClick(e, cycle)} className={`p-1.5 rounded-full ${isActive ? 'hover:bg-primary-100 dark:hover:bg-primary-900' : 'hover:bg-slate-300 dark:hover:bg-slate-600'}`} aria-label={`Rename ${cycle.name}`} title="Rename Cycle">
                              <PencilIcon className="w-4 h-4"/>
                            </span>
                            <span onClick={(e) => handleOpenDeleteModal(e, cycle)} className={`p-1.5 rounded-full ${isActive ? 'hover:bg-primary-100 dark:hover:bg-primary-900' : 'hover:bg-red-200 dark:hover:bg-red-800 text-red-500 dark:text-red-400'}`} aria-label={`Delete ${cycle.name}`} title="Delete Cycle">
                                <TrashIcon className="w-4 h-4"/>
                            </span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </button>
              )
            })}
          
            {archivedCycles.length > 0 && (
            <>
              <div className="px-3 pt-4 pb-2">
                <h3 className={`text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100 delay-150' : 'opacity-0'}`}>
                    Archived
                </h3>
              </div>
              {archivedCycles.map(cycle => (
                  <button key={cycle.id} title={!isExpanded ? cycle.name : undefined} onClick={() => onSelectCycle(cycle.id)}
                    className={`w-full text-center py-3 px-2.5 rounded-lg flex flex-col items-center justify-center gap-1.5 group transition-colors duration-200 relative overflow-hidden ${
                      activeCycleId === cycle.id
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
                    }`} aria-label={`${cycle.name} (Archived)`} >
                      <ArchiveIcon className="w-5 h-5 flex-shrink-0" />
                      <span className={`text-xs text-center truncate w-full whitespace-nowrap italic transition-opacity duration-200 ${isExpanded ? 'opacity-100 delay-150' : 'opacity-0'}`}>{cycle.name}</span>
                  </button>
                ))}
            </>
          )}
        </nav>
        
        <div className="p-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <button onClick={onCreateCycle} title={!isExpanded ? 'Create New Circle' : undefined}
            className={`w-full flex flex-col items-center justify-center gap-1.5 py-3 px-2.5 text-sm font-medium rounded-lg transition-colors text-white bg-indigo-600 hover:bg-indigo-500`} >
            <UserPlusIcon className="w-5 h-5 flex-shrink-0"/>
            <span className={`text-xs whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100 delay-150' : 'opacity-0'}`}>Create Circle</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button onClick={logout} title={!isExpanded ? 'Logout' : undefined}
                className={`w-full flex flex-col items-center justify-center gap-1.5 py-3 px-2.5 text-sm font-medium rounded-lg transition-colors text-slate-700 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300/70 dark:hover:bg-slate-600/70`} >
              <LogOutIcon className="w-5 h-5 flex-shrink-0"/>
              <span className={`text-xs whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100 delay-150' : 'opacity-0'}`}>Logout</span>
            </button>
            <button onClick={onToggleTheme} className="flex-shrink-0 p-2.5 text-slate-700 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-700/70 rounded-lg hover:bg-slate-300/70 dark:hover:bg-slate-600/70" aria-label="Toggle theme" >
              {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
            </button>
           </div>
        </div>
      </aside>
      {isDeleteModalOpen && cycleToDelete && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title="Delete Trust Circle"
          message={<>Are you sure you want to delete the circle <span className="font-bold">{cycleToDelete.name}</span>? This action cannot be undone.</>}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          confirmButtonText="Delete Circle"
          variant="danger"
        />
      )}
    </>
  );
};