import React, { useState, useEffect } from 'react'; // Added useEffect
import BodyChart from './BodyChart';
import InjuryModal from './InjuryModal';
import InjuryDetailsModal from './InjuryDetailsModal';
import TrainingModal from './TrainingModal';
import ChatArea from './ChatArea';
import { BodyPart, InjuryLog, AthleteProfile, TrainingLog, Message, Role, ActivityLog } from '../types';
// REMOVED MOCKS
import { Plus, History, Activity, MessageSquare, Dumbbell, X, ClipboardList, Stethoscope, User } from 'lucide-react';
import { supabase } from '../supabaseClient'; // ADDED SUPABASE
interface AthleteDashboardProps {
  athlete: AthleteProfile;
}
// 1. Removed 'async' from component definition
const AthleteDashboard: React.FC<AthleteDashboardProps> = ({ athlete }) => {
  // 2. Moved these hooks INSIDE the component
  const [assignedCoachId, setAssignedCoachId] = useState<string>('');
  const [assignedTrainerId, setAssignedTrainerId] = useState<string>('');
  
  const [selectedPart, setSelectedPart] = useState<BodyPart | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<'COACH' | 'TRAINER'>('TRAINER');
  
  // State for viewing specific injury details
  const [selectedInjury, setSelectedInjury] = useState<InjuryLog | null>(null);

  // --- REAL DATA STATE ---
  const [myInjuries, setMyInjuries] = useState<InjuryLog[]>([]);
  const [myTrainingLogs, setMyTrainingLogs] = useState<TrainingLog[]>([]);
  const [myMessages, setMyMessages] = useState<Message[]>([]);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchInitialData = async () => {
      if(!athlete?.id) return;

      // 1. Fetch Staff info for Chat
      const { data: staffData } = await supabase.from('profiles').select('id, name, role').in('role', ['COACH', 'TRAINER']);
      if (staffData) {
          const coach = staffData.find(u => u.role === 'COACH');
          const trainer = staffData.find(u => u.role === 'TRAINER');
          if (coach) { setAssignedCoachId(coach.id); setCoachName(coach.name || 'Head Coach'); }
          if (trainer) { setAssignedTrainerId(trainer.id); setTrainerName(trainer.name || 'Athletic Trainer'); }
      }

      // 2. Fetch Injuries
      const { data: inj } = await supabase.from('injuries').select('*').eq('athlete_id', athlete.id).order('date_logged', {ascending: false});
      if(inj) {
          setMyInjuries(inj.map((i: any) => ({
              ...i, athleteId: i.athlete_id, bodyPart: i.body_part, painType: i.pain_type, dateLogged: i.date_logged, severityHistory: i.severity_history || [], activityLog: i.activity_log || []
          })));
      }

      // 3. Fetch Training
      const { data: train } = await supabase.from('training_logs').select('*').eq('athlete_id', athlete.id).order('date', {ascending: false});
      if(train) {
          setMyTrainingLogs(train.map((t: any) => ({
              ...t, athleteId: t.athlete_id, durationMinutes: t.duration_minutes, stressLevel: t.stress_level
          })));
      }

      // 4. Fetch Messages
      const { data: msgs } = await supabase.from('messages').select('*').or(`sender_id.eq.${athlete.id},receiver_id.eq.${athlete.id}`).order('timestamp', {ascending: true});
      if(msgs) {
          setMyMessages(msgs.map((m: any) => ({
              ...m, senderId: m.sender_id, receiverId: m.receiver_id, isRead: m.is_read
          })));
      }
    };
    fetchInitialData();
  }, [athlete.id]);
  // --- REALTIME SUBSCRIPTION (LIVE UPDATES) ---
  useEffect(() => {
    if (!athlete?.id) return;

    // Create a connection
    const subscription = supabase
      .channel('athlete-dashboard-realtime')
      
      // 1. Listen for NEW MESSAGES
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsgRaw = payload.new;
        // Only show if it involves me
        if (newMsgRaw.sender_id === athlete.id || newMsgRaw.receiver_id === athlete.id) {
            const newMsg = {
                id: newMsgRaw.id,
                senderId: newMsgRaw.sender_id,
                receiverId: newMsgRaw.receiver_id,
                text: newMsgRaw.text,
                timestamp: newMsgRaw.timestamp,
                isRead: newMsgRaw.is_read
            };
            // Use functional state update to handle rapid updates safely
            setMyMessages((prev) => [...prev, newMsg]);
        }
      })

      // 2. Listen for INJURY UPDATES (e.g. Coach changes status)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'injuries' }, (payload) => {
         const updatedRow = payload.new as any;
         
         // If it's my injury
         if (updatedRow.athlete_id === athlete.id) {
             const mappedInjury = {
                ...updatedRow,
                athleteId: updatedRow.athlete_id,
                bodyPart: updatedRow.body_part,
                painType: updatedRow.pain_type,
                dateLogged: updatedRow.date_logged,
                severityHistory: updatedRow.severity_history || [],
                activityLog: updatedRow.activity_log || []
             };

             setMyInjuries((prev) => {
                 // If INSERT (New), add to top
                 if (payload.eventType === 'INSERT') return [mappedInjury, ...prev];
                 // If UPDATE, replace existing
                 if (payload.eventType === 'UPDATE') return prev.map(i => i.id === mappedInjury.id ? mappedInjury : i);
                 return prev;
             });
             
             // Update selected injury if viewing it
             if (selectedInjury?.id === mappedInjury.id) setSelectedInjury(mappedInjury);
         }
      })
      .subscribe();

    // Cleanup when leaving page
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [athlete.id, selectedInjury]); // Re-bind if selectedInjury changes

  // Filter messages based on who we are talking to
  // Use the REAL IDs we fetched. Fallback to empty string if no staff exists yet.
  const targetId = chatTarget === 'COACH' ? assignedCoachId : assignedTrainerId;
  const filteredMessages = myMessages.filter(m => 
    (m.senderId === athlete.id && m.receiverId === targetId) || 
    (m.senderId === targetId && m.receiverId === athlete.id)
  );
const handlePartSelect = (part: BodyPart) => {
    setSelectedPart(part);
    setIsModalOpen(true);
  };

  const handleSaveInjury = async (data: any) => {
    const newLog = {
      athlete_id: athlete.id,
      body_part: data.bodyPart,
      severity: data.severity,
      pain_type: data.painType,
      description: data.description,
      status: data.status,
      date_logged: new Date().toISOString(),
      severity_history: [{ date: new Date().toISOString(), value: data.severity }],
      activity_log: []
    };

    const { data: inserted, error } = await supabase
        .from('injuries')
        .insert([newLog])
        .select()
        .single();

    if (inserted && !error) {
         const mapped = {
            ...inserted,
            athleteId: inserted.athlete_id,
            bodyPart: inserted.body_part,
            painType: inserted.pain_type,
            dateLogged: inserted.date_logged,
            severityHistory: inserted.severity_history,
            activityLog: inserted.activity_log
         };
         setMyInjuries([mapped, ...myInjuries]);
    }
  };
// --- FUNCTION 1: SAVES NOTES & PROGRESS ---
  const handleAddActivity = async (injuryId: string, activity: any) => {
    // 1. Find the injury in local state to get current logs
    const injury = myInjuries.find(i => i.id === injuryId);
    if (!injury) return;

    // 2. Create the new log object
    const newActivity = {
        id: `act_${Date.now()}`,
        date: new Date().toISOString(),
        authorName: athlete.name, // Real name
        authorRole: Role.ATHLETE, // Real role
        ...activity // Contains 'content', 'type', 'progress'
    };
    
    // 3. Prepend to existing logs (Newest first)
    const updatedLogs = [newActivity, ...injury.activityLog];
    
    // 4. Update Supabase
    const { error } = await supabase
        .from('injuries')
        .update({ activity_log: updatedLogs }) // Save the whole JSON array
        .eq('id', injuryId);
    
    // 5. Update Local State (So you see it immediately without refreshing)
    if (!error) {
           const updatedList = myInjuries.map(i => {
               if (i.id === injuryId) {
                   const updated = { ...i, activityLog: updatedLogs };
                   // Also update the modal view if it's open
                   if (selectedInjury?.id === injuryId) setSelectedInjury(updated);
                   return updated;
               }
               return i;
           });
           setMyInjuries(updatedList);
    }
  };
// --- FUNCTION 2: UPDATES STATUS & RECOVERY CHART ---
  const handleUpdateInjury = async (injuryId: string, updates: Partial<InjuryLog>) => {
      // 1. Find current injury to get history
      const injury = myInjuries.find(i => i.id === injuryId);
      if (!injury) return;

      // 2. Prepare DB updates
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.severity !== undefined) dbUpdates.severity = updates.severity;

      // 3. HANDLE CHART DATA (Severity History)
      // If severity changed, we must add a point to the history graph
      let newHistory = injury.severityHistory || [];
      if (updates.severity !== undefined) {
          const newPoint = { 
              date: new Date().toISOString(), 
              value: updates.severity as number 
          };
          newHistory = [...newHistory, newPoint];
          dbUpdates.severity_history = newHistory; // Update JSON column
      }

      // 4. Send to Supabase
      const { error } = await supabase
          .from('injuries')
          .update(dbUpdates)
          .eq('id', injuryId);

      // 5. Update Local State
      if (!error) {
           const updatedList = myInjuries.map(i => {
               if (i.id === injuryId) {
                   const updated = { ...i, ...updates, severityHistory: newHistory };
                   // Update the open modal
                   if (selectedInjury?.id === injuryId) setSelectedInjury(updated);
                   return updated;
               }
               return i;
           });
           setMyInjuries(updatedList);
      }
  };

  const handleSaveTraining = async (data: any) => {
    const newLog = {
      athlete_id: athlete.id,
      date: new Date().toISOString(),
      duration_minutes: data.durationMinutes,
      rpe: data.rpe,
      stress_level: data.stressLevel,
      notes: data.notes
    };
    
    const { data: inserted } = await supabase.from('training_logs').insert([newLog]).select().single();
    if(inserted) {
        const mapped = {
            ...inserted,
            athleteId: inserted.athlete_id,
            durationMinutes: inserted.duration_minutes,
            stressLevel: inserted.stress_level
        };
        setMyTrainingLogs([mapped, ...myTrainingLogs]);
    }
  };

  // --- FUNCTION 3: REAL CHAT MESSAGING ---
  const handleSendMessage = async (text: string) => {
    if (!targetId) {
        alert("No staff member found for this role yet.");
        return;
    }
    const newMsg = {
        sender_id: athlete.id,
        receiver_id: targetId,
        text: text,
        timestamp: new Date().toISOString(),
        is_read: false
    };
    
    // Just insert. The Realtime subscription will handle the UI update.
    await supabase.from('messages').insert([newMsg]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 relative min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Welcome back, {athlete.name}</h1>
          <p className="text-zinc-400 text-sm md:text-base">Team {athlete.team} • {athlete.sport}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <button 
            onClick={() => setIsTrainingModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-600/50 rounded-lg hover:bg-blue-600/20 transition-all text-sm font-medium"
          >
            <Dumbbell size={18} />
            Log Training
          </button>
          
          <div className={`px-4 py-2 rounded-full border text-sm font-medium ${
            athlete.status === 'Healthy' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
            athlete.status === 'Injured' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
            'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
          } flex items-center gap-2 w-fit`}>
            <div className={`w-2 h-2 rounded-full ${
              athlete.status === 'Healthy' ? 'bg-emerald-500' :
              athlete.status === 'Injured' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            Status: {athlete.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Body Map */}
        <div className="lg:col-span-1 order-1 lg:order-none">
          {/* Sticky only on desktop */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-xl lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="text-emerald-500" size={20} />
              Tap Body Part to Log
            </h2>
            <BodyChart 
              onSelectPart={handlePartSelect} 
              selectedPart={selectedPart}
              injuries={myInjuries}
            />
          </div>
        </div>

        {/* Right Column: History & Stats */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-none">
          
          {/* Active Issues */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-xl">
             <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="text-red-500" size={20} />
              Active Issues
            </h2>
            
            <div className="space-y-4">
              {myInjuries.filter(i => i.status !== 'Resolved').length === 0 ? (
                <div className="text-center py-6 text-zinc-500 bg-zinc-800/20 rounded-xl border border-dashed border-zinc-800">
                  <p>No active injuries logged. Stay healthy!</p>
                </div>
              ) : (
                myInjuries.filter(i => i.status !== 'Resolved').map(injury => (
                  <div 
                    key={injury.id} 
                    onClick={() => setSelectedInjury(injury)}
                    className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 hover:border-emerald-500/50 cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-emerald-400 font-bold text-lg mr-2 group-hover:underline">{injury.bodyPart}</span>
                        <span className="text-zinc-400 text-sm">({injury.painType})</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        injury.severity > 6 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        Severity: {injury.severity}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-sm mb-3">{injury.description}</p>
                    
                    {/* Activity Preview */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-700/50 text-xs text-zinc-500">
                       <ClipboardList size={14} />
                       {injury.activityLog.length > 0 
                         ? `${injury.activityLog.length} updates • Last from ${injury.activityLog[0].authorName}`
                         : "No treatment logs yet"
                       }
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Training Loads */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Dumbbell className="text-blue-500" size={20} />
              Recent Training
            </h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {myTrainingLogs.slice(0, 3).map(log => (
                  <div key={log.id} className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700">
                    <div className="text-zinc-400 text-xs mb-1">{new Date(log.date).toLocaleDateString()}</div>
                    <div className="font-bold text-white text-lg">{log.durationMinutes} min</div>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <span className="text-blue-400">RPE: {log.rpe}</span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-purple-400">Stress: {log.stressLevel}</span>
                    </div>
                  </div>
                ))}
                {myTrainingLogs.length === 0 && (
                  <div className="col-span-3 text-center text-zinc-500 py-4">No training logs yet.</div>
                )}
             </div>
          </div>

          {/* Past Logs */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-xl opacity-80">
            <h2 className="text-lg font-semibold text-zinc-400 mb-4 flex items-center gap-2">
              <History size={20} />
              Resolved History
            </h2>
             <div className="space-y-3">
               {myInjuries.filter(i => i.status === 'Resolved').length === 0 && (
                 <p className="text-zinc-600 text-sm">No resolved history yet.</p>
               )}
               {myInjuries.filter(i => i.status === 'Resolved').map(injury => (
                 <div 
                    key={injury.id} 
                    onClick={() => setSelectedInjury(injury)}
                    className="flex justify-between items-center p-3 border-b border-zinc-800 hover:bg-zinc-800/50 cursor-pointer rounded-lg"
                  >
                    <span className="text-zinc-300">{injury.bodyPart}</span>
                    <span className="text-zinc-500 text-sm">Resolved on {new Date().toLocaleDateString()}</span>
                 </div>
               ))}
             </div>
          </div>

        </div>
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-105"
          >
            <MessageSquare size={24} />
          </button>
        ) : (
          <div className="w-[calc(100vw-48px)] md:w-96 shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-5 bg-zinc-900 border border-zinc-700">
            {/* Chat Header with Toggle */}
            <div className="bg-zinc-800 p-3 flex justify-between items-center border-b border-zinc-700">
              <div className="flex gap-2">
                 <button 
                   onClick={() => setChatTarget('TRAINER')}
                   className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors ${chatTarget === 'TRAINER' ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
                 >
                    <Stethoscope size={14} /> Medical
                 </button>
                 <button 
                   onClick={() => setChatTarget('COACH')}
                   className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors ${chatTarget === 'COACH' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
                 >
                    <User size={14} /> Coach
                 </button>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-zinc-700 p-1 rounded text-zinc-400">
                <X size={18} />
              </button>
            </div>
            
            <ChatArea 
              currentUserId={athlete.id}
              otherUserName={chatTarget === 'TRAINER' ? 'Athletic Trainer' : 'Head Coach'}
              messages={filteredMessages}
              onSendMessage={handleSendMessage}
              className="h-[400px] border-none rounded-none"
            />
          </div>
        )}
      </div>

      {/* Log New Injury Modal */}
      <InjuryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPart(null);
        }}
        bodyPart={selectedPart}
        onSave={handleSaveInjury}
      />

      {/* View/Edit Injury Details Modal */}
      <InjuryDetailsModal 
        isOpen={!!selectedInjury}
        onClose={() => setSelectedInjury(null)}
        injury={selectedInjury}
        currentUserRole={Role.ATHLETE}
        onAddActivity={handleAddActivity}
        onUpdateInjury={handleUpdateInjury}
      />

      <TrainingModal 
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
        onSave={handleSaveTraining}
      />
    </div>
  );
};

export default AthleteDashboard;

function setCoachName(arg0: any) {
  throw new Error('Function not implemented.');
}
function setTrainerName(arg0: any) {
  throw new Error('Function not implemented.');
}

