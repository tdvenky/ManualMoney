import { useState, useRef } from 'react';
import type { AppData } from '../types';
import * as api from '../api/client';

export function DataPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manualmoney-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Data exported successfully');
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data: AppData = JSON.parse(text);

      if (!confirm('This will replace all existing data. Are you sure?')) {
        return;
      }

      await api.importData(data);
      setSuccess('Data imported successfully');
    } catch (err) {
      setError('Failed to import data. Make sure the file is valid JSON.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Data Management</h1>

      {error && (
        <div className="bg-red-50 border-[0.5px] border-red-200 text-red-700 px-4 py-3 rounded-[10px] text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border-[0.5px] border-emerald-200 text-emerald-700 px-4 py-3 rounded-[10px] text-sm">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-slate-800 mb-1">Export Data</h2>
          <p className="text-sm text-slate-500 mb-3">
            Download all your data as a JSON file for backup or transfer.
          </p>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-[7px] hover:bg-emerald-700"
          >
            Export to JSON
          </button>
        </div>

        <hr className="border-[0.5px] border-slate-200" />

        <div>
          <h2 className="font-semibold text-slate-800 mb-1">Import Data</h2>
          <p className="text-sm text-slate-500 mb-3">
            Import data from a previously exported JSON file. This will replace all existing data.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:border-0 file:rounded-[7px]
              file:text-sm file:font-medium
              file:bg-slate-100 file:text-slate-700
              hover:file:bg-slate-200"
          />
        </div>
      </div>
    </div>
  );
}
