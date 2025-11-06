import React, { useMemo, useState, useEffect, useRef } from 'react';
import { RoscaCycle, AppUser } from '../types';
import { CheckCircleIcon, ClipboardIcon, DownloadIcon } from './Icons';

interface ExportDataModalProps {
  cycles: RoscaCycle[];
  users: AppUser[];
  onClose: () => void;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({ cycles, users, onClose }) => {
  const [copied, setCopied] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const dataToExport = useMemo(() => ({ cycles, users }), [cycles, users]);
  const jsonString = useMemo(() => JSON.stringify(dataToExport, null, 2), [dataToExport]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helping-hand-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div ref={modalContentRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Export Application Data</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Copy the JSON data below or download it as a file. This is a complete backup of all cycles and users.</p>
        <textarea
          readOnly
          value={jsonString}
          className="w-full flex-grow bg-slate-100 dark:bg-slate-900 rounded-md p-3 text-sm font-mono border border-slate-300 dark:border-slate-700 resize-none"
          aria-label="Exported JSON data"
        />
        <div className="mt-6 flex justify-between items-center">
          <div>
            <button onClick={handleCopy} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500">
              {copied ? <CheckCircleIcon className="w-5 h-5"/> : <ClipboardIcon className="w-5 h-5"/>}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button onClick={handleDownload} className="ml-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
              <DownloadIcon className="w-5 h-5" />
              Download File
            </button>
          </div>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
