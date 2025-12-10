import React, { useState } from 'react';
import { InjuryLog, Role, ActivityLog, InjuryStatus } from '../types';
import { X, Plus, Clock, Stethoscope, MessageSquare, User, FileText, TrendingUp, TrendingDown, Minus, Save, Lock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface InjuryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  injury: InjuryLog | null;
  currentUserRole: Role;
  onAddActivity: (injuryId: string, activity: Omit<ActivityLog, 'id' | 'date' | 'authorRole' | 'authorName'>) => void;
  onUpdateInjury?: (injuryId: string, updates: Partial<InjuryLog>) => void;
}

const InjuryDetailsModal: React.FC<InjuryDetailsModalProps> = ({ isOpen, onClose, injury, currentUserRole, onAddActivity, onUpdateInjury }) => {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'Treatment' | 'Note'>('Note');
  const [progress, setProgress] = useState<'Better' | 'Same' | 'Worse'>('Same');
  
  // Update Logic State
  const [isUpdating, setIsUpdating] = useState(false);
  const [newSeverity, setNewSeverity] = useState(injury?.severity || 1);
  const [newStatus, setNewStatus] = useState<InjuryStatus>(injury?.status || InjuryStatus.ACTIVE);

  // Sync state when injury changes
  React.useEffect(() => {
      if (injury) {
          setNewSeverity(injury.severity);
          setNewStatus(injury.status);
      }
  }, [injury]);

  if (!isOpen || !injury) return null;

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    onAddActivity(injury.id, {
        type: noteType,
        content: newNote,
        progress: progress
    });
    setNewNote('');
    setProgress('Same');
  };

  const handleUpdateCondition = () => {
      if (onUpdateInjury) {
          // If athlete, force status to remain same, they can only update severity
          const statusToSave = currentUserRole === Role.ATHLETE ? injury.status : newStatus;

          onUpdateInjury(injury.id, {
              severity: newSeverity,
              status: statusToSave
          });
          
          // Also log this as an activity
          onAddActivity(injury.id, {
              type: 'Status Update',
              content: `Condition updated. Severity: ${newSeverity}/10. Status: ${statusToSave}.`,
              progress: newSeverity < injury.severity ? 'Better' : newSeverity > injury.severity ? 'Worse' : 'Same'
          });

          setIsUpdating(false);
      }
  };

  const getProgressIcon = (prog?: string) => {
    switch (prog) {
        case 'Better': return <TrendingUp size={14} className="text-emerald-500" />;
        case 'Worse': return <TrendingDown size={14} className="text-red-500" />;
        case 'Same': return <Minus size={14} className="text-yellow-500" />;
        default: return null;
    }
  };

  // HIPAA Logic: Coaches shouldn't see detailed Treatment logs
  const visibleLogs = currentUserRole === Role.COACH 
    ? injury.activityLog.filter(log => log.type !== 'Treatment')
    : injury.activityLog;

  const isMedicalStaff = currentUserRole === Role.TRAINER || currentUserRole === Role.COACH;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* LEFT COLUMN: Chart & Update Controls */}
        <div className="w-full md:w-2/5 bg-zinc-950/50 border-r border-zinc-800 flex flex-col p-6">
            <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                     <div>
                        <h2 className="text-2xl font-bold text-white">{injury.bodyPart}</h2>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase mt-1 inline-block ${
                            injury.status === 'Active' ? 'bg-red-500/20 text-red-400' : 
                            injury.status === 'Recovering' ? 'bg-yellow-500/20 text-yellow-400' : 
                            'bg-emerald-500/20 text-emerald-400'
                        }`}>
                            {injury.status}
                        </span>
                     </div>
                     <div className="text-right">
                         <div className={`text-4xl font-bold ${injury.severity > 6 ? 'text-red-500' : injury.severity > 3 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                             {injury.severity}
                         </div>
                         <div className="text-xs text-zinc-500 uppercase tracking-wide">Severity</div>
                     </div>
                </div>
                
                {currentUserRole !== Role.COACH ? (
                   <p className="text-zinc-300 italic text-sm mt-4 border-l-2 border-zinc-700 pl-3">"{injury.description}"</p>
                ) : (
                    <p className="text-zinc-500 italic text-sm mt-4 border-l-2 border-zinc-800 pl-3">Medical description hidden.</p>
                )}
            </div>

            {/* CHART */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 mb-6 flex-1 max-h-[250px] min-h-[200px]">
                <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2">
                    <TrendingUp size={14} /> Recovery Trend
                </h4>
                <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={injury.severityHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis 
                            dataKey="date" 
                            stroke="#52525b" 
                            fontSize={10} 
                            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})}
                        />
                        <YAxis stroke="#52525b" fontSize={10} domain={[0, 10]} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#ef4444' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={{r: 4, fill: '#ef4444'}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* UPDATE SECTION */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-auto">
                 {!isUpdating ? (
                     <button 
                        onClick={() => setIsUpdating(true)}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
                     >
                         Update Condition
                     </button>
                 ) : (
                     <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                         <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 flex justify-between">
                                New Severity
                                <span className="text-white font-bold">{newSeverity}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={newSeverity}
                                onChange={(e) => setNewSeverity(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                         </div>
                         <div>
                             <label className="block text-xs font-medium text-zinc-400 mb-1">Status</label>
                             {isMedicalStaff ? (
                               <select 
                                  value={newStatus}
                                  onChange={(e) => setNewStatus(e.target.value as InjuryStatus)}
                                  className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                               >
                                   <option value={InjuryStatus.ACTIVE}>Active (Not Cleared)</option>
                                   <option value={InjuryStatus.RECOVERING}>Recovering (Modified)</option>
                                   <option value={InjuryStatus.RESOLVED}>Resolved (Cleared)</option>
                               </select>
                             ) : (
                               <div className="w-full bg-zinc-950 border border-zinc-800 text-zinc-500 text-sm rounded-lg p-2 flex items-center gap-2 cursor-not-allowed">
                                  <Lock size={12} />
                                  <span>{injury.status} (Medical Staff Only)</span>
                               </div>
                             )}
                         </div>
                         <div className="flex gap-2">
                             <button onClick={() => setIsUpdating(false)} className="flex-1 py-1.5 text-xs text-zinc-400 hover:text-white">Cancel</button>
                             <button 
                                onClick={handleUpdateCondition}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                             >
                                 <Save size={12} /> Save
                             </button>
                         </div>
                     </div>
                 )}
            </div>
        </div>

        {/* RIGHT COLUMN: Timeline & Notes */}
        <div className="w-full md:w-3/5 flex flex-col h-full">
             {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} /> Activity & Treatment
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                    <X className="text-zinc-500 hover:text-white" size={20} />
                </button>
            </div>

            {/* Timeline Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-900/50">
                <div className="space-y-6 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-zinc-800">
                    {visibleLogs.length === 0 && (
                        <div className="ml-10 py-4 text-zinc-600 italic">No visible logs.</div>
                    )}
                    
                    {visibleLogs.map((log) => (
                        <div key={log.id} className="relative pl-10">
                            {/* Icon Node */}
                            <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-zinc-900 ${
                                log.type === 'Treatment' ? 'bg-blue-600 text-white' : 
                                log.type === 'Status Update' ? 'bg-orange-500 text-white' :
                                log.authorRole === Role.ATHLETE ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-300'
                            }`}>
                                {log.type === 'Treatment' ? <Stethoscope size={14} /> : 
                                 log.type === 'Status Update' ? <ActivityLogIcon size={14} /> :
                                 log.authorRole === Role.ATHLETE ? <User size={14} /> : <MessageSquare size={14} />}
                            </div>

                            {/* Content Card */}
                            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 hover:border-zinc-600 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className={`text-xs font-bold uppercase tracking-wider mr-2 ${
                                            log.type === 'Treatment' ? 'text-blue-400' : 
                                            log.type === 'Status Update' ? 'text-orange-400' : 'text-zinc-400'
                                        }`}>{log.type}</span>
                                        <span className="text-sm font-medium text-white">{log.authorName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {log.progress && (
                                            <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                                                log.progress === 'Better' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                                log.progress === 'Worse' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                                'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                            }`}>
                                                {getProgressIcon(log.progress)}
                                                <span>{log.progress}</span>
                                            </div>
                                        )}
                                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(log.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{log.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2">
                        {currentUserRole !== Role.ATHLETE && (
                            <button 
                                onClick={() => setNoteType('Treatment')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                                    noteType === 'Treatment' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                <Stethoscope size={14} /> Treatment
                            </button>
                        )}
                        <button 
                            onClick={() => setNoteType('Note')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                                noteType === 'Note' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <FileText size={14} /> Note / Update
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-800/50 p-1 rounded-lg border border-zinc-700">
                        <span className="text-xs text-zinc-500 px-2">Progress:</span>
                        <button 
                            onClick={() => setProgress('Worse')}
                            className={`p-1.5 rounded hover:bg-zinc-700 ${progress === 'Worse' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400'}`}
                            title="Feeling Worse"
                        >
                            <TrendingDown size={16} />
                        </button>
                        <button 
                            onClick={() => setProgress('Same')}
                            className={`p-1.5 rounded hover:bg-zinc-700 ${progress === 'Same' ? 'bg-yellow-500/20 text-yellow-400' : 'text-zinc-400'}`}
                            title="Feeling the Same"
                        >
                            <Minus size={16} />
                        </button>
                        <button 
                            onClick={() => setProgress('Better')}
                            className={`p-1.5 rounded hover:bg-zinc-700 ${progress === 'Better' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400'}`}
                            title="Feeling Better"
                        >
                            <TrendingUp size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddNote();
                            }
                        }}
                        placeholder={
                            noteType === 'Treatment' 
                            ? "Log treatment details (e.g., Ice massage, Taping, Rehab exercises)..." 
                            : "Add a note about pain levels, feedback, or observations..."
                        }
                        className="flex-1 bg-zinc-800 text-white text-sm rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-zinc-700 resize-none h-14"
                    />
                    <button 
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="bg-zinc-100 hover:bg-white text-zinc-900 p-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

// Helper icon
const ActivityLogIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

export default InjuryDetailsModal;