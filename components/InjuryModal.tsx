import React, { useState } from 'react';
import { BodyPart, InjuryLog, InjuryStatus, Role } from '../types';
import { PREDEFINED_PAIN_TYPES } from '../constants';
import { X, AlertCircle } from 'lucide-react';

interface InjuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bodyPart: BodyPart | null;
  onSave: (log: Omit<InjuryLog, 'id' | 'athleteId' | 'dateLogged' | 'activityLog' | 'severityHistory'>) => void;
}

const InjuryModal: React.FC<InjuryModalProps> = ({ isOpen, onClose, bodyPart, onSave }) => {
  const [severity, setSeverity] = useState(5);
  const [painType, setPainType] = useState(PREDEFINED_PAIN_TYPES[0]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<InjuryStatus>(InjuryStatus.ACTIVE);

  if (!isOpen || !bodyPart) return null;

  const handleSave = () => {
    onSave({
      bodyPart,
      severity,
      painType,
      description,
      status,
    });
    // Reset
    setSeverity(5);
    setDescription('');
    setStatus(InjuryStatus.ACTIVE);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="text-emerald-500" size={24} />
            New Injury Report: <span className="text-emerald-400">{bodyPart}</span>
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Severity Slider */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 flex justify-between">
              <span>Pain Severity</span>
              <span className={`font-bold ${severity > 7 ? 'text-red-500' : severity > 3 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                {severity} / 10
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>Mild</span>
              <span>Severe</span>
            </div>
          </div>

          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Pain Type</label>
              <select
                value={painType}
                onChange={(e) => setPainType(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PREDEFINED_PAIN_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InjuryStatus)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
               {Object.values(InjuryStatus).map(s => (
                 <option key={s} value={s}>{s}</option>
               ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">What happened?</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how it happened or specific sensations..."
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default InjuryModal;