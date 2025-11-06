import React, { useState, useEffect, useRef } from 'react';
import { ConfirmModal } from './ConfirmRemovalModal';
import { UploadIcon } from './Icons';
import { RoscaCycle, AppUser } from '../types';

interface ImportDataModalProps {
  onClose: () => void;
  onImport: (data: { cycles: RoscaCycle[], users: AppUser[] }) => Promise<void>;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({ onClose, onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [parsedData, setParsedData] = useState<{ cycles: RoscaCycle[], users: AppUser[] } | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const handleImportClick = () => {
    if (!jsonInput.trim()) {
      setError('Please paste the JSON data into the text area.');
      return;
    }
    try {
      const data = JSON.parse(jsonInput);
      if (!data.cycles || !Array.isArray(data.cycles) || !data.users || !Array.isArray(data.users)) {
        setError("Invalid JSON format. The data must contain 'cycles' and 'users' arrays.");
        return;
      }
      setError('');
      setParsedData(data);
      setConfirmOpen(true);
    } catch (e) {
      setError('Invalid JSON. Please check the format and try again.');
    }
  };

  const handleConfirmImport = async () => {
    if (parsedData) {
      await onImport(parsedData);
      setConfirmOpen(false);
      onClose();
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isConfirmOpen) onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isConfirmOpen]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
        <div ref={modalContentRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
          <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Import Application Data</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Paste the previously exported JSON data below. 
            <span className="font-bold text-red-600 dark:text-red-400"> Warning: This will overwrite all existing data.</span>
          </p>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Paste your JSON data here...'
            className="w-full flex-grow bg-slate-100 dark:bg-slate-900 rounded-md p-3 text-sm font-mono border border-slate-300 dark:border-slate-700 resize-none focus:ring-primary-500 focus:border-primary-500"
            aria-label="Paste JSON data for import"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
              Cancel
            </button>
            <button onClick={handleImportClick} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500">
              <UploadIcon className="w-5 h-5"/>
              Import Data
            </button>
          </div>
        </div>
      </div>
      {isConfirmOpen && (
        <ConfirmModal
          isOpen={isConfirmOpen}
          title="Confirm Data Import"
          message={
            <>
              <p>Are you sure you want to import this data?</p>
              <p className="font-bold text-red-600 dark:text-red-400 mt-2">
                This will ERASE all current data in the application. This action cannot be undone.
              </p>
            </>
          }
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmImport}
          confirmButtonText="Yes, Import and Overwrite"
          variant="danger"
        />
      )}
    </>
  );
};
