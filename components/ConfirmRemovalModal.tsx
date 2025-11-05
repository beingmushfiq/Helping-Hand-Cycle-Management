import React, { useEffect, useRef } from 'react';
import { AlertTriangleIcon } from './Icons';

interface ConfirmRemovalModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmButtonText: string;
  confirmButtonClassName?: string;
}

export const ConfirmRemovalModal: React.FC<ConfirmRemovalModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmButtonText,
  confirmButtonClassName = 'bg-red-600 hover:bg-red-700',
}) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement;
      const focusableElements = modalContentRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0];
      if (firstElement) {
        firstElement.focus();
      }
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" aria-modal="true" role="dialog" aria-labelledby="confirm-modal-title">
      <div ref={modalContentRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md m-4 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 mb-4">
            <AlertTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <h2 id="confirm-modal-title" className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">{title}</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          {message}
        </p>
        
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-6 py-2 text-sm font-medium text-white rounded-md shadow-sm ${confirmButtonClassName}`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};