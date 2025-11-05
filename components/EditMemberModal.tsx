import React, { useState, useEffect, useRef } from 'react';
import { Member } from '../types';
import { PencilIcon } from './Icons';

interface EditMemberModalProps {
  member: Member | null;
  onClose: () => void;
  onSave: (memberId: string, updatedDetails: { name: string; avatarUrl: string; joiningMonthName: string; }) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [joiningMonthName, setJoiningMonthName] = useState('');

  const modalContentRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<Element | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setAvatarUrl(member.avatarUrl);
      setJoiningMonthName(member.joiningMonthName);
    }
  }, [member]);

  useEffect(() => {
    triggerElementRef.current = document.activeElement;

    const focusableElements = modalContentRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0];
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalContentRef.current) return;
        // Fix: Cast element to a type with a 'disabled' property to satisfy TypeScript, as the base HTMLElement type lacks it.
        const focusableElements = Array.from(
          modalContentRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !(el as HTMLInputElement).disabled);
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const isFirstElement = document.activeElement === firstElement;
        const isLastElement = document.activeElement === lastElement;

        if (e.shiftKey) { // Shift + Tab
          if (isFirstElement) {
            // FIX: Explicitly cast to HTMLElement to resolve type inference issue.
            (lastElement as HTMLElement).focus();
            e.preventDefault();
          }
        } else { // Tab
          if (isLastElement) {
            // FIX: Explicitly cast to HTMLElement to resolve type inference issue.
            (firstElement as HTMLElement).focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (triggerElementRef.current instanceof HTMLElement) {
        triggerElementRef.current.focus();
      }
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (member && name.trim() && joiningMonthName.trim()) {
      let finalAvatarUrl = avatarUrl.trim();
      if (!finalAvatarUrl) {
        finalAvatarUrl = `https://picsum.photos/seed/${name.trim().toLowerCase()}/100`;
      }
      onSave(member.id, { name: name.trim(), avatarUrl: finalAvatarUrl, joiningMonthName: joiningMonthName.trim() });
      onClose();
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog" aria-labelledby="edit-member-title">
      <div ref={modalContentRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md m-4">
        <h2 id="edit-member-title" className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Edit Member Details</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-col items-center">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Member Avatar
            </label>
            <div className="relative">
              <img 
                src={avatarUrl} 
                alt="Avatar preview" 
                onClick={handleAvatarClick}
                className="w-24 h-24 rounded-full object-cover border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <button 
                type="button" 
                onClick={handleAvatarClick} 
                className="absolute -bottom-1 -right-1 bg-primary-600 text-white rounded-full p-2 hover:bg-primary-500 shadow-md"
                aria-label="Upload new avatar"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              className="hidden" 
              accept="image/png, image/jpeg, image/gif"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="editMemberName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Member Name
            </label>
            <input
              type="text"
              id="editMemberName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="editJoiningMonthName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Joining Month Name
            </label>
            <input
              type="text"
              id="editJoiningMonthName"
              value={joiningMonthName}
              onChange={(e) => setJoiningMonthName(e.target.value)}
              className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !joiningMonthName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500 disabled:bg-slate-400 dark:disabled:bg-slate-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};