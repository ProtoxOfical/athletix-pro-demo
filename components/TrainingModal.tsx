import React, { useState } from 'react';
import { X, Dumbbell, Activity } from 'lucide-react';
import { TrainingLog } from '../types';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<TrainingLog, 'id' | 'athleteId'>) => void;
}

const TrainingModal: React.FC<TrainingModalProps> = ({ isOpen, onClose, onSave }) => {
  const [duration, setDuration] = useState(60);
  const [rpe, setRpe] = useState(5);
  const [stress, setStress] = useState(3);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      date: new Date().toISOString(),
      durationMinutes: duration,
      rpe,
      stressLevel: stress,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="text-blue-500" size={24} />
            Log Training Load
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Duration (Minutes)</label>
            <div className="flex items-center gap-4">
                <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-bold"
                />
            </div>
          </div>

          {/* RPE Slider */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 flex justify-between">
              <span>RPE (Exertion 1-10)</span>
              <span className={`font-bold ${rpe > 7 ? 'text-red-500' : rpe > 4 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                {rpe}
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={rpe}
              onChange={(e) => setRpe(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
             <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>Easy</span>
              <span>Max Effort</span>
            </div>
          </div>

          {/* Stress Slider */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 flex justify-between">
              <span>Daily Stress Level</span>
              <span className={`font-bold ${stress > 7 ? 'text-red-500' : 'text-zinc-300'}`}>
                {stress}
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={stress}
              onChange={(e) => setStress(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did you feel?"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-3 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
            Save Workout
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingModal;