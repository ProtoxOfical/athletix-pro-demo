import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient'; 
import { AthleteProfile, InjuryLog, Role, ActivityLog, BodyPart, InjuryStatus, Message, TrainingLog, Team } from '../types';
import BodyChart from './BodyChart';
import ChatArea from './ChatArea';
import InjuryDetailsModal from './InjuryDetailsModal';
import InjuryModal from './InjuryModal';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Users, AlertTriangle, Search, Flame, Activity, Shield, Ban, CheckCircle2, Plus, X, Stethoscope, UserCircle2, MessageCircle, History, HeartPulse, ArrowLeft, Mail, Calendar, Clock, Infinity, Trash2, RefreshCw, Filter, FileText, ChevronDown } from 'lucide-react';
import ProfileSettingsModal from './ProfileSettingsModal'; 
import { User} from '../types';
interface DashboardProps {
  currentUserRole: Role;
  currentUserId: string | null;
  userProfile: AthleteProfile | User | null; // <--- Changed from currentUserName
}


type TabType = 'overview' | 'roster' | 'staff';
type RosterFilterType = 'ALL' | 'INJURED_ACTIVE' | 'NOT_CLEARED' | 'RECURRING';
type OverviewWidgetType = 'not_cleared' | 'priority' | 'recent_activity';

// Mock Staff for the new tab
// ... existing state
const CoachDashboard: React.FC<DashboardProps> = ({ currentUserRole, currentUserId, userProfile }) => { 
  const [staffList, setStaffList] = useState<any[]>([]); // Replaces MOCK_STAFF
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const currentUserName = userProfile?.name || 'Staff'; // Fallback logic
  const isTrainer = currentUserRole === Role.TRAINER;
  // Use passed ID or fallback to demo IDs if testing without full login flow
  const myId = currentUserId || (isTrainer ? 'trainer_001' : 'coach_001');
  const [myTeam, setMyTeam] = useState<any>(null);
  const [pendingAthletes, setPendingAthletes] = useState<AthleteProfile[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [heatmapRange, setHeatmapRange] = useState<'week' | 'month' | 'season'>('month');
  const [rosterFilter, setRosterFilter] = useState<RosterFilterType>('ALL');
  const [selectedHeatmapPart, setSelectedHeatmapPart] = useState<BodyPart | null>(null);
  const [activeWidget, setActiveWidget] = useState<OverviewWidgetType>('not_cleared');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isAthleteMedicalOpen, setIsAthleteMedicalOpen] = useState(false);
  
  // NEW: Team Data & Filtering
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  // Roster Management State
  const [isManageRosterOpen, setIsManageRosterOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  // Invite Code Generation State
  const [inviteDuration, setInviteDuration] = useState<'1d' | '7d' | '30d' | 'forever'>('7d');
  const [inviteUsesType, setInviteUsesType] = useState<'limited' | 'unlimited'>('unlimited');
  const [inviteMaxUses, setInviteMaxUses] = useState<number>(10);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // State for Trainer Actions
  const [isLogInjuryModalOpen, setIsLogInjuryModalOpen] = useState(false);
  const [newInjuryBodyPart, setNewInjuryBodyPart] = useState<BodyPart | null>(null);
  const [isBodyPartSelectorOpen, setIsBodyPartSelectorOpen] = useState(false);

  // --- REAL DATA STATE ---
  const [injuries, setInjuries] = useState<InjuryLog[]>([]);
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [selectedInjury, setSelectedInjury] = useState<InjuryLog | null>(null);

  // --- INITIAL DATA FETCH ---
  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchAllData = async () => {
        // 0. FETCH ALL TEAMS (For filtering)
        const { data: teamsData } = await supabase.from('teams').select('*');
        if (teamsData) {
            setAllTeams(teamsData.map((t: any) => ({
                id: t.id,
                name: t.name,
                sport: t.sport,
                joinCode: t.join_code,
                coachId: t.coach_id,
                requiresApproval: t.requires_approval
            })));
        }

        // 1. Fetch Athletes based on Role
        if (currentUserRole === Role.COACH) {
            // Coach: Fetch MY team info first
            const { data: teamData } = await supabase
                .from('teams')
                .select('*')
                .eq('coach_id', myId)
                .single();
            
            if (teamData) {
                setMyTeam(teamData);
                
                // Coach: Fetch ONLY athletes in my team
                const { data: teamAthletes } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('team_id', teamData.id)
                    .eq('role', 'ATHLETE');

                if (teamAthletes) {
                    const mappedAthletes = teamAthletes.map((p: any) => ({
                        ...p,
                        avatarUrl: p.avatar_url,
                        teamId: p.team_id // Vital for filtering
                    }));
                    
                    setAthletes(mappedAthletes.filter((a: any) => a.is_approved));
                    setPendingAthletes(mappedAthletes.filter((a: any) => !a.is_approved));
                }
            }
        } else {
            // Trainer: Fetch ALL athletes
            const { data: pros } = await supabase.from('profiles').select('*').eq('role', 'ATHLETE');
            if (pros) {
                setAthletes(pros.map((p: any) => ({ 
                    ...p, 
                    avatarUrl: p.avatar_url,
                    teamId: p.team_id // Vital for filtering
                })));
            }
        }

        // 2. Fetch Staff (The Directory)
        const { data: staffData } = await supabase.from('profiles').select('*').in('role', ['COACH', 'TRAINER']);
        if (staffData) {
            setStaffList(staffData.map((s: any) => ({
                id: s.id, name: s.name, role: s.role === 'COACH' ? 'Head Coach' : 'Medical Staff', department: s.role === 'COACH' ? 'Coaching' : 'Medical', avatar: s.avatar_url
            })));
        }

        // 3. Fetch All Injuries
        const { data: inj } = await supabase.from('injuries').select('*').order('date_logged', {ascending: false});
        if (inj) {
            setInjuries(inj.map((i: any) => ({
                ...i, athleteId: i.athlete_id, bodyPart: i.body_part, painType: i.pain_type, dateLogged: i.date_logged, severityHistory: i.severity_history || [], activityLog: i.activity_log || []
            })));
        }

        // 4. Fetch Messages
        const { data: msgs } = await supabase.from('messages').select('*').order('timestamp', {ascending: true});
        if (msgs) {
            setMessages(msgs.map((m: any) => ({ ...m, senderId: m.sender_id, receiverId: m.receiver_id, isRead: m.is_read })));
        }

        // 5. Fetch Training Logs (For the Graph)
        const { data: logs } = await supabase.from('training_logs').select('*');
        if (logs) {
            setTrainingLogs(logs.map((l: any) => ({ ...l, athleteId: l.athlete_id, durationMinutes: l.duration_minutes, stressLevel: l.stress_level })));
        }
    };
    fetchAllData();
  }, []);
  // --- REALTIME SUBSCRIPTIONS (COACH) ---
  useEffect(() => {
    const subscription = supabase
      .channel('coach-dashboard-realtime')

      // 1. LISTEN FOR ANY NEW MESSAGES
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const m = payload.new;
          setMessages((prev) => [...prev, {
              id: m.id, senderId: m.sender_id, receiverId: m.receiver_id, text: m.text, timestamp: m.timestamp, isRead: m.is_read
          }]);
      })

      // Inside the useEffect for 'postgres_changes' on 'injuries'

.on('postgres_changes', { event: '*', schema: 'public', table: 'injuries' }, (payload) => {
    const row = payload.new as any;
    const mapped = {
        ...row,
        athleteId: row.athlete_id,
        bodyPart: row.body_part,
        painType: row.pain_type,
        dateLogged: row.date_logged,
        severityHistory: row.severity_history || [],
        activityLog: row.activity_log || []
    };

    setInjuries((prev) => {
        if (payload.eventType === 'INSERT') {
            // --- THE FIX: DEDUPLICATION ---
            // Check if this ID is already in our list (added locally). 
            // If yes, ignore this event.
            if (prev.some(i => i.id === mapped.id)) {
                return prev;
            }
            return [mapped, ...prev];
        }
        
        // Handle Updates
        return prev.map(i => i.id === mapped.id ? mapped : i);
    });
    
    if (selectedInjury?.id === mapped.id) setSelectedInjury(mapped);
})

      // NEW: Listen for Profile Approvals/Status Changes
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
          const p = payload.new;
          
          // 1. Handle Status Updates (Healthy/Injured)
          setAthletes((prev) => prev.map(a => a.id === p.id ? { ...a, status: p.status } : a));
          
          // 2. Handle Approvals (Pending -> Active)
          if (p.is_approved === true) {
             setPendingAthletes(prev => prev.filter(a => a.id !== p.id));
             // Add to main roster if not already there
             setAthletes(prev => {
                if(prev.find(a => a.id === p.id)) return prev;
                return [...prev, { ...p, avatarUrl: p.avatar_url }];
             });
          }
      })
      .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
  }, [selectedInjury, selectedAthlete]);
// --- DATA HELPERS ---

  const getAthleteInjuries = (id: string) => injuries.filter(i => i.athleteId === id);
  const getAthleteLogs = (id: string) => trainingLogs.filter(l => l.athleteId === id);
  
  const getAthleteMessages = (id: string) => messages.filter(m => 
    (m.senderId === id && m.receiverId === myId) || 
    (m.senderId === myId && m.receiverId === id)
  );
  
  const getStaffMessages = (staffId: string) => messages.filter(m => 
    (m.senderId === staffId && m.receiverId === myId) || 
    (m.senderId === myId && m.receiverId === staffId)
  );
  
  const getAthleteName = (id: string) => athletes.find(a => a.id === id)?.name || 'Unknown Athlete';

  const getRecurringIssues = (athleteId: string) => {
      const userInjuries = getAthleteInjuries(athleteId);
      const partCounts: Record<string, number> = {};
      const recurringParts: string[] = [];
      userInjuries.forEach(i => { partCounts[i.bodyPart] = (partCounts[i.bodyPart] || 0) + 1; });
      Object.entries(partCounts).forEach(([part, count]) => { if (count > 1) recurringParts.push(part); });
      return recurringParts;
  };

  const isRecurringAthlete = (athleteId: string) => getRecurringIssues(athleteId).length > 0;

  const filteredAthletes = athletes.filter(a => {
    // 1. Text Search
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.sport.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Team Filter (Trainer Only usually, but works for all)
    if (teamFilter !== 'ALL' && a.teamId !== teamFilter) return false;

    // 3. Status Filter
    if (rosterFilter === 'NOT_CLEARED') return a.status === 'Injured';
    if (rosterFilter === 'INJURED_ACTIVE') return a.status === 'Recovery';
    if (rosterFilter === 'RECURRING') return isRecurringAthlete(a.id);
    
    return true;
  });

  const filteredInjuriesByTime = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (heatmapRange === 'week') cutoff.setDate(now.getDate() - 7);
    if (heatmapRange === 'month') cutoff.setDate(now.getDate() - 30);
    if (heatmapRange === 'season') cutoff.setMonth(now.getMonth() - 6);
    return injuries.filter(i => new Date(i.dateLogged) >= cutoff);
  }, [injuries, heatmapRange]);
  // --- REAL CHART CALCULATION ---
    const chartData = useMemo(() => {
        // 1. Setup last 6 weeks
        const weeks = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - (i * 7));
            const label = `${d.getMonth() + 1}/${d.getDate()}`; // e.g. "12/10"
            weeks.push({ label, start: d.getTime() - (7 * 24 * 60 * 60 * 1000), end: d.getTime(), load: 0, injuries: 0 });
        }

        // 2. Sum Training Load (Duration * RPE)
        // Note: In a real app, filtering 'trainingLogs' by date first is faster
        // Here we just loop all for the demo since n < 1000
        trainingLogs.forEach(log => {
            const logTime = new Date(log.date).getTime();
            const week = weeks.find(w => logTime > w.start && logTime <= w.end);
            if (week) {
                week.load += (log.durationMinutes * log.rpe);
            }
        });

        // 3. Count Injuries
        injuries.forEach(inj => {
            const injTime = new Date(inj.dateLogged).getTime();
            const week = weeks.find(w => injTime > w.start && injTime <= w.end);
            if (week) {
                week.injuries += 1;
            }
        });

        return weeks;
    }, [trainingLogs, injuries]);
  const topInjuredParts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInjuriesByTime.forEach(i => { counts[i.bodyPart] = (counts[i.bodyPart] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [filteredInjuriesByTime]);

  const selectedHeatmapInjuries = useMemo(() => {
    if (!selectedHeatmapPart) return [];
    return filteredInjuriesByTime.filter(i => i.bodyPart === selectedHeatmapPart);
  }, [filteredInjuriesByTime, selectedHeatmapPart]);

  // --- ACTIONS ---

  const handleUpdateAthleteStatus = async (athleteId: string, newStatus: 'Healthy' | 'Injured' | 'Recovery') => {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', athleteId);
      if (!error) {
          setAthletes(athletes.map(a => a.id === athleteId ? { ...a, status: newStatus } : a));
          if (selectedAthlete && selectedAthlete.id === athleteId) {
              setSelectedAthlete({ ...selectedAthlete, status: newStatus });
          }
      }
  };

  // Inside CoachDashboard.tsx

const handleCreateInjury = async (data: any) => {
    if (!selectedAthlete) return;

    // 1. Prepare the data object
    const newLogPayload = {
        athlete_id: selectedAthlete.id,
        body_part: data.bodyPart,
        severity: data.severity,
        pain_type: data.painType,
        description: data.description,
        status: data.status,
        date_logged: new Date().toISOString(), // Use ISO string
        severity_history: [{ date: new Date().toISOString(), value: data.severity }],
        activity_log: [{
            id: `act_${Date.now()}`,
            authorName: currentUserName,
            authorRole: currentUserRole,
            date: new Date().toISOString(),
            type: 'Treatment',
            content: 'Initial injury report filed by staff.',
            progress: 'Worse'
        }]
    };

    // 2. Send to Supabase
    const { data: inserted, error } = await supabase
        .from('injuries')
        .insert([newLogPayload])
        .select()
        .single();

    if (error) {
        // --- ERROR HANDLING ---
        console.error("Error logging injury:", error);
        alert(`Failed to log injury: ${error.message}`); // Simple alert for now
        return; 
    }

    if (inserted) {
        // --- SUCCESS: UPDATE UI INSTANTLY ---
        
        // Map snake_case (DB) to camelCase (React)
        const mapped = {
            ...inserted,
            athleteId: inserted.athlete_id,
            bodyPart: inserted.body_part,
            painType: inserted.pain_type,
            dateLogged: inserted.date_logged,
            severityHistory: inserted.severity_history,
            activityLog: inserted.activity_log
        };

        // Update State immediately (The useEffect duplicate check prevents this from being added twice)
        setInjuries(prev => [mapped, ...prev]);

        // --- UPDATE STATUS TO YELLOW (RECOVERY) ---
        handleUpdateAthleteStatus(selectedAthlete.id, 'Recovery');
        
        // Close modals
        setIsLogInjuryModalOpen(false);
        setNewInjuryBodyPart(null);
    }
};

  const handleUpdateInjury = async (injuryId: string, updates: Partial<InjuryLog>) => {
      const injury = injuries.find(i => i.id === injuryId);
      if(!injury) return;

      const dbUpdates: any = {};
      if(updates.status) dbUpdates.status = updates.status;
      if(updates.severity !== undefined) dbUpdates.severity = updates.severity;

      let newHistory = injury.severityHistory || [];
      if(updates.severity !== undefined) {
           newHistory = [...newHistory, { date: new Date().toISOString(), value: updates.severity as number }];
           dbUpdates.severity_history = newHistory;
      }

      const { error } = await supabase.from('injuries').update(dbUpdates).eq('id', injuryId);
      if(!error) {
          setInjuries(injuries.map(i => {
              if (i.id === injuryId) {
                  const updated = { ...i, ...updates, severityHistory: newHistory };
                  if (selectedInjury?.id === injuryId) setSelectedInjury(updated);
                  
                  // Auto-resolve check
                  if (selectedAthlete && i.athleteId === selectedAthlete.id) {
                      if (updates.status === InjuryStatus.RESOLVED) {
                           const otherActive = injuries.some(other => other.id !== injuryId && other.athleteId === selectedAthlete.id && other.status !== InjuryStatus.RESOLVED);
                           if (!otherActive) handleUpdateAthleteStatus(selectedAthlete.id, 'Healthy');
                      }
                  }
                  return updated;
              }
              return i;
          }));
      }
  };

  const handleAddActivity = async (injuryId: string, activity: any) => {
       const injury = injuries.find(i => i.id === injuryId);
       if (!injury) return;
       
       const newActivity = {
            id: `act_${Date.now()}`,
            date: new Date().toISOString(),
            authorName: currentUserName,
            authorRole: currentUserRole,
            ...activity
       };
       const updatedLogs = [newActivity, ...injury.activityLog];
       
       const { error } = await supabase.from('injuries').update({ activity_log: updatedLogs }).eq('id', injuryId);
       if(!error) {
           setInjuries(injuries.map(i => i.id === injuryId ? { ...i, activityLog: updatedLogs } : i));
           if (selectedInjury?.id === injuryId) setSelectedInjury({ ...selectedInjury, activityLog: updatedLogs });
       }
  };

  const handleSendMessage = async (text: string, recipientId: string) => {
    const newMsg = {
        sender_id: myId,
        receiver_id: recipientId,
        text: text,
        timestamp: new Date().toISOString(),
        is_read: false
    };
    
    // We only Insert. We DO NOT setMessages manually anymore.
    // The useEffect listener will catch the insert and update the UI automatically.
    await supabase.from('messages').insert([newMsg]);
  };

  // --- SUB-COMPONENTS ---
  const handleGenerateCode = async () => {
      if (!myTeam) return;
      setIsGeneratingCode(true);

      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      let expiresAt = null;
      
      const now = new Date();
      if (inviteDuration === '1d') expiresAt = new Date(now.setDate(now.getDate() + 1)).toISOString();
      if (inviteDuration === '7d') expiresAt = new Date(now.setDate(now.getDate() + 7)).toISOString();
      if (inviteDuration === '30d') expiresAt = new Date(now.setDate(now.getDate() + 30)).toISOString();
      
      const maxUses = inviteUsesType === 'limited' ? inviteMaxUses : null;

      const { error } = await supabase
          .from('teams')
          .update({ 
              join_code: newCode,
              join_code_expires_at: expiresAt,
              join_code_max_uses: maxUses,
              join_code_uses_count: 0
          })
          .eq('id', myTeam.id);

      if (!error) {
          setMyTeam({ ...myTeam, join_code: newCode }); // Optimistic update
      }
      setIsGeneratingCode(false);
  };

  const handleDeclineAthlete = async (athleteId: string) => {
      // Logic: Set team_id to NULL so they are detached from the roster
      const { error } = await supabase
          .from('profiles')
          .update({ team_id: null, is_approved: false })
          .eq('id', athleteId);
      
      if (!error) {
          setPendingAthletes(prev => prev.filter(p => p.id !== athleteId));
      }
  };
  const NavItem = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <button
        onClick={() => { setActiveTab(id); setSelectedAthlete(null); setSelectedStaffId(null); }}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2 ${
            activeTab === id 
            ? 'bg-zinc-800 border-emerald-500 text-white' 
            : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
        }`}
    >
        <Icon size={18} />
        {label}
    </button>
  );

  // Body Part Selector Modal for Trainer
  const BodyPartSelectorModal = () => {
      if (!isBodyPartSelectorOpen) return null;
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
              <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                      <h3 className="text-white font-bold text-lg">Select Body Part to Injure</h3>
                      <button onClick={() => setIsBodyPartSelectorOpen(false)} className="hover:bg-zinc-800 p-1 rounded-full"><X className="text-zinc-500" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/50">
                     <p className="text-zinc-400 text-sm mb-4 text-center">Tap a body part on the diagram below to log a new injury record for {selectedAthlete?.name}.</p>
                     <BodyChart 
                        onSelectPart={(part) => {
                            setNewInjuryBodyPart(part);
                            setIsBodyPartSelectorOpen(false);
                            setIsLogInjuryModalOpen(true);
                        }}
                     />
                  </div>
              </div>
          </div>
      );
  };

  const renderAthleteDetail = () => {
      if (!selectedAthlete) return null;
      return (
          <div className="max-w-6xl mx-auto animate-in fade-in duration-300 pb-24">
             
             {/* Header Controls */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                 <button 
                    onClick={() => setSelectedAthlete(null)}
                    className="flex items-center gap-2 text-sm px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Roster
                 </button>

                 {/* ACCESS MEDICAL RECORDS BUTTON */}
                 <button 
                    onClick={() => setIsAthleteMedicalOpen(true)}
                    className="flex items-center gap-2 text-sm px-4 py-2 bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-900/40 transition-colors font-medium"
                >
                    <FileText size={16} />
                    View Medical Records
                 </button>
             </div>
             {/* Profile Card */}
             <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50 mb-8">
                 <img src={selectedAthlete.avatarUrl} className="w-24 h-24 rounded-full border-4 border-zinc-900 object-cover shadow-2xl shrink-0" alt="" />
                 
                 <div className="text-center md:text-left flex-1 min-w-0">
                     <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 truncate">{selectedAthlete.name}</h1>
                     
                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-zinc-400 text-sm">
                         {/* Show Team Name if available */}
                         {(selectedAthlete as any).team && (
                             <span className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700/50">
                                 <Shield size={14} className="shrink-0"/> 
                                 <span className="truncate max-w-[150px]">{(selectedAthlete as any).team}</span>
                             </span>
                         )}
                         <span className="bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700/50">
                             {selectedAthlete.sport}
                         </span>
                         <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                             selectedAthlete.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                             selectedAthlete.status === 'Injured' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                             'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                         }`}>
                             {selectedAthlete.status}
                         </span>
                     </div>
                 </div>
             </div>

             {/* Trainer Control Panel (Only for Trainer) */}
             {isTrainer && (
                 <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8 shadow-lg">
                     <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                         <Stethoscope size={16} className="text-emerald-500"/>
                         Medical Management
                     </h3>
                     {/* FIX: Dynamic Buttons based on current status */}
                     <div className="flex flex-col sm:flex-row gap-4">
                         {/* Always allow logging new injury */}
                         <button 
                             onClick={() => setIsBodyPartSelectorOpen(true)}
                             className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-all font-medium"
                         >
                             <Plus size={18} />
                             Log Injury
                         </button>

                         {/* Logic: 
                             If Healthy -> Can Set Active (Yellow) or Restrict (Red)
                             If Recovery (Yellow) -> Can Restrict (Red) or Clear (Green)
                             If Injured (Red) -> Can Set Active (Yellow) or Clear (Green)
                         */}
                         
                         {selectedAthlete.status === 'Healthy' && (
                            <button 
                                onClick={() => handleUpdateAthleteStatus(selectedAthlete.id, 'Recovery')}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600/10 text-yellow-400 border border-yellow-600/30 rounded-lg hover:bg-yellow-600/20 transition-all font-medium"
                            >
                                <Activity size={18} />
                                Set Active / Monitor
                            </button>
                         )}

                         {selectedAthlete.status === 'Recovery' && (
                            <button 
                                onClick={() => handleUpdateAthleteStatus(selectedAthlete.id, 'Injured')}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/20 transition-all font-medium"
                            >
                                <Ban size={18} />
                                Restrict (Not Cleared)
                            </button>
                         )}

                         {selectedAthlete.status !== 'Healthy' && (
                             <button 
                                onClick={() => handleUpdateAthleteStatus(selectedAthlete.id, 'Healthy')}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600/10 text-emerald-400 border border-emerald-600/30 rounded-lg hover:bg-emerald-600/20 transition-all font-medium"
                             >
                                <CheckCircle2 size={18} />
                                Clear to Play
                             </button>
                         )}
                     </div>
                 </div>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Left Col: Status & Body */}
                 <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                         <h3 className="text-lg font-bold text-white mb-4">Injury Status</h3>
                         <BodyChart injuries={getAthleteInjuries(selectedAthlete.id)} />
                    </div>
                 </div>

                 {/* Right Col: Details */}
                 <div className="lg:col-span-2 space-y-6">
                     {/* Injury History List */}
                     <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Injury Records</h3>
                        <div className="space-y-4">
                             {getAthleteInjuries(selectedAthlete.id).length === 0 ? (
                                 <div className="text-zinc-500 italic">No injuries on record.</div>
                             ) : (
                                getAthleteInjuries(selectedAthlete.id).map(inj => (
                                    <div 
                                        key={inj.id} 
                                        onClick={() => setSelectedInjury(inj)}
                                        className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-zinc-500 cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-emerald-400 text-lg group-hover:underline">{inj.bodyPart}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    inj.status === 'Active' ? 'bg-red-500/20 text-red-400' :
                                                    inj.status === 'Recovering' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-emerald-500/20 text-emerald-400'
                                                }`}>{inj.status}</span>
                                            </div>
                                            <span className="text-xs text-zinc-500">{new Date(inj.dateLogged).toLocaleDateString()}</span>
                                        </div>
                                        {/* HIPAA Masking for Description */}
                                        <p className="text-zinc-300 text-sm line-clamp-2">
                                            {isTrainer ? inj.description : <span className="text-zinc-500 italic">Medical detail hidden for privacy.</span>}
                                        </p>
                                    </div>
                                ))
                             )}
                        </div>
                     </div>

                     {/* Chat */}
                     <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden h-96 flex flex-col">
                        <div className="p-4 border-b border-zinc-800 font-bold text-white">Direct Message</div>
                        <ChatArea 
                            currentUserId={currentUserId!} // FIX: Added non-null assertion or handle null properly
                            otherUserName={selectedAthlete.name}
                            messages={getAthleteMessages(selectedAthlete.id)}
                            onSendMessage={(txt) => handleSendMessage(txt, selectedAthlete.id)}
                            className="flex-1 border-none rounded-none"
                            showHeader={false}
                        />
                     </div>
                 </div>
             </div>
          </div>
      );
  };

  const renderStaff = () => {
    // USE REAL DATA
    const visibleStaff = staffList.filter(s => s.id !== currentUserId);
    const selectedStaffMember = staffList.find(s => s.id === selectedStaffId);

    return (
        // FIX: Fixed height container (100vh - offsets) prevents window scrolling and fixes chat layout
        <div className="animate-in fade-in duration-300 flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
            
            {/* Header - Hidden on mobile when chat is open to maximize space */}
            <header className={`mb-4 shrink-0 ${selectedStaffId ? 'hidden lg:block' : 'block'}`}>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Staff Directory</h1>
                <p className="text-zinc-400 text-sm">Coordinate directly with medical and coaching staff.</p>
            </header>

            <div className="flex flex-1 overflow-hidden gap-6 relative">
                
                {/* 
                   FIX: Staff List Column
                   Mobile: Hidden if a staff member is selected (Show chat instead)
                   Desktop: Always visible (w-1/3)
                */}
                <div className={`
                    w-full lg:w-1/3 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col
                    ${selectedStaffId ? 'hidden lg:flex' : 'flex'}
                `}>
                    <div className="p-4 border-b border-zinc-800 shrink-0">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase">Available Staff</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {visibleStaff.map(staff => (
                            <div 
                                key={staff.id}
                                onClick={() => setSelectedStaffId(staff.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedStaffId === staff.id 
                                    ? 'bg-blue-600/20 border border-blue-600/50' 
                                    : 'hover:bg-zinc-800 border border-transparent'
                                }`}
                            >
                                <img src={staff.avatar} className="w-10 h-10 rounded-full bg-zinc-800" alt="" />
                                <div>
                                    <h4 className="font-bold text-white text-sm">{staff.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-400">{staff.role}</span>
                                        <span className={`w-1.5 h-1.5 rounded-full ${staff.department === 'Medical' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 
                   FIX: Chat Area Column
                   Mobile: Hidden if NO staff selected. Full width if selected.
                   Desktop: Always visible (w-2/3)
                */}
                <div className={`
                    w-full lg:w-2/3 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col
                    ${selectedStaffId ? 'flex' : 'hidden lg:flex'}
                `}>
                    {selectedStaffMember ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 md:p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-800/30 shrink-0">
                                {/* FIX: Back Button (Mobile Only) */}
                                <button 
                                    onClick={() => setSelectedStaffId(null)}
                                    className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                                    <UserCircle2 className="text-zinc-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm md:text-base">{selectedStaffMember.name}</h3>
                                    <p className="text-xs text-zinc-400">{selectedStaffMember.role} • {selectedStaffMember.department}</p>
                                </div>
                            </div>
                            
                            {/* Chat Content */}
                            <ChatArea 
                                currentUserId={currentUserId!}
                                otherUserName={selectedStaffMember.name}
                                messages={getStaffMessages(selectedStaffMember.id)}
                                onSendMessage={(txt) => handleSendMessage(txt, selectedStaffMember.id)}
                                className="flex-1 border-none rounded-none"
                                showHeader={false} // FIX: Disable double header
                            />
                        </>
                    ) : (
                         <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
                             <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                 <MessageCircle size={32} className="opacity-50"/>
                             </div>
                             <p className="text-lg font-medium">Select a staff member</p>
                             <p className="text-sm">Start a secure conversation.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const renderRoster = () => {
    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">Team Roster</h2>
                    <p className="text-zinc-400">Manage athlete status and availability.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                     {/* Manage Roster Button (Red Box Area) */}
                     {currentUserRole === Role.COACH && (
                         <button 
                            onClick={() => setIsManageRosterOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 transition-all font-medium text-sm relative"
                         >
                            <Users size={16} />
                            Manage Roster
                            {pendingAthletes.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full animate-pulse">
                                    {pendingAthletes.length}
                                </span>
                            )}
                         </button>
                     )}

                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search athletes..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-64"
                        />
                     </div>

                     {/* TEAM FILTER (Visible to Trainers) */}
                     {currentUserRole === Role.TRAINER && (
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <select
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                                className="pl-10 pr-8 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer w-full sm:w-48 text-sm"
                            >
                                <option value="ALL">All Teams</option>
                                {allTeams
                                    // Optional: Only show teams that actually have players (based on athletes state if you want strictly that)
                                    // .filter(t => athletes.some(a => a.teamId === t.id))
                                    .map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
                        </div>
                     )}
                     <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-700 overflow-x-auto">
                         <button 
                            onClick={() => setRosterFilter('ALL')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap ${rosterFilter === 'ALL' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                        >
                            All
                         </button>
                         <button 
                            onClick={() => setRosterFilter('INJURED_ACTIVE')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${rosterFilter === 'INJURED_ACTIVE' ? 'bg-yellow-900/50 text-yellow-200' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <Activity size={14} />
                            Injured (Active)
                        </button>
                         <button 
                            onClick={() => setRosterFilter('NOT_CLEARED')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${rosterFilter === 'NOT_CLEARED' ? 'bg-red-900/50 text-red-200' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <AlertTriangle size={14} />
                            Not Cleared
                        </button>
                         <button 
                            onClick={() => setRosterFilter('RECURRING')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${rosterFilter === 'RECURRING' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <History size={14} />
                            Recurring
                        </button>
                     </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAthletes.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                        No athletes found matching filters.
                    </div>
                ) : (
                    filteredAthletes.map(athlete => {
                        const recurring = isRecurringAthlete(athlete.id);
                        return (
                            <div 
                                key={athlete.id}
                                onClick={() => setSelectedAthlete(athlete)} 
                                className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-emerald-500/50 transition-all hover:shadow-lg cursor-pointer relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 p-2 rounded-bl-xl ${
                                    athlete.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-500' :
                                    athlete.status === 'Injured' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                    {athlete.status === 'Healthy' ? <CheckCircle2 size={18} /> : 
                                     athlete.status === 'Injured' ? <Ban size={18} /> : <HeartPulse size={18} />}
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                    <img src={athlete.avatarUrl} className="w-14 h-14 rounded-full bg-zinc-800 object-cover" alt={athlete.name} />
                                    <div>
                                        <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{athlete.name}</h3>
                                        <p className="text-xs text-zinc-500">{athlete.sport}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Status</span>
                                        <span className={`font-medium ${
                                            athlete.status === 'Healthy' ? 'text-emerald-400' :
                                            athlete.status === 'Injured' ? 'text-red-400' : 'text-yellow-400'
                                        }`}>
                                            {athlete.status === 'Injured' ? 'Not Cleared' : 
                                             athlete.status === 'Recovery' ? 'Active (Injured)' : 'Cleared'}
                                        </span>
                                    </div>
                                </div>
                                
                                {recurring && (
                                     <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs text-yellow-500">
                                         <History size={14} />
                                         <span>Recurring Issue History</span>
                                     </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
  };

  const renderOverview = () => {
    // Dynamic Widget Content
    const notClearedAthletes = athletes.filter(a => a.status === 'Injured');
    const priorityAthletes = athletes.filter(a => a.status === 'Recovery' || isRecurringAthlete(a.id));
    const recentActivities = injuries.slice(0, 5);
    
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* 
            FIX: Changed flex layout.
            Mobile: flex-col (Stack Title on top of Stats)
            Desktop: flex-row (Side by side)
        */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Team Overview</h1>
                <p className="text-zinc-400 text-sm md:text-base">Real-time injury surveillance and training load analytics.</p>
            </div>
            
            {/* 
                FIX: Made width full on mobile to allow scrolling 
            */}
            <div className="flex gap-3 overflow-x-auto w-full xl:w-auto pb-2 no-scrollbar">
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 md:px-6 md:py-4 rounded-xl flex flex-col items-center min-w-[100px] flex-1 md:flex-none">
                    <span className="text-2xl md:text-3xl font-bold text-emerald-500">{athletes.filter(a => a.status === 'Healthy').length}</span>
                    <span className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-wider">Active</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 md:px-6 md:py-4 rounded-xl flex flex-col items-center min-w-[100px]VF flex-1 md:flex-none">
                    <span className="text-2xl md:text-3xl font-bold text-red-500">{athletes.filter(a => a.status === 'Injured').length}</span>
                    <span className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-wider">Injured</span>
                </div>
                 <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 md:px-6 md:py-4 rounded-xl flex flex-col items-center min-w-[100px] flex-1 md:flex-none">
                    <span className="text-2xl md:text-3xl font-bold text-yellow-500">{athletes.filter(a => a.status === 'Recovery').length}</span>
                    <span className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-wider">Modified</span>
                </div>
            </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Heatmap Section */}
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg h-fit">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Flame className="text-orange-500" size={20} />
                        Injury Heatmap
                    </h2>
                    <select 
                        value={heatmapRange}
                        onChange={(e) => setHeatmapRange(e.target.value as any)}
                        className="bg-zinc-800 text-xs text-white border-none rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value="week">7 Days</option>
                        <option value="month">30 Days</option>
                        <option value="season">Season</option>
                    </select>
                </div>
                
                <BodyChart 
                    mode="heatmap" 
                    injuries={filteredInjuriesByTime} 
                    selectedPart={selectedHeatmapPart}
                    onSelectPart={setSelectedHeatmapPart}
                />
                
                <div className="mt-6 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase">Top Risk Areas</h3>
                    {topInjuredParts.map(([part, count], idx) => (
                        <div key={part} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="text-zinc-500 font-mono text-sm">0{idx + 1}</span>
                                <span className="text-zinc-300 font-medium">{part}</span>
                            </div>
                            <span className="text-orange-400 font-bold">{count} cases</span>
                        </div>
                    ))}
                </div>
            </div>

             {/* Right Column Analysis */}
             <div className="lg:col-span-2 space-y-6">
                 
                 {/* QUICK INSIGHTS WIDGET (Fills the empty space) */}
                 <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                         <h3 className="text-lg font-bold text-white flex items-center gap-2">
                             <Activity className="text-blue-500" size={20} />
                             Quick Insights
                         </h3>
                         <div className="flex bg-zinc-800 rounded-lg p-1">
                             <button 
                                onClick={() => setActiveWidget('not_cleared')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeWidget === 'not_cleared' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                             >
                                Not Cleared ({notClearedAthletes.length})
                             </button>
                             <button 
                                onClick={() => setActiveWidget('priority')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeWidget === 'priority' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                             >
                                Priority ({priorityAthletes.length})
                             </button>
                             <button 
                                onClick={() => setActiveWidget('recent_activity')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeWidget === 'recent_activity' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                             >
                                Recent Logs
                             </button>
                         </div>
                     </div>

                     <div className="min-h-[200px]">
                         {activeWidget === 'not_cleared' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {notClearedAthletes.length === 0 ? (
                                    <div className="col-span-full text-zinc-500 text-center py-8">All athletes are cleared to play.</div>
                                ) : (
                                    notClearedAthletes.map(a => (
                                        <div key={a.id} onClick={() => setSelectedAthlete(a)} className="bg-red-900/10 border border-red-900/30 p-4 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-red-900/20 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-red-500 font-bold">
                                                <Ban size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{a.name}</div>
                                                <div className="text-xs text-red-400">Strictly No Activity</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                         )}

                         {activeWidget === 'priority' && (
                             <div className="space-y-3">
                                 {priorityAthletes.map(a => (
                                     <div key={a.id} onClick={() => setSelectedAthlete(a)} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors border-l-2 border-yellow-500">
                                         <div className="flex items-center gap-3">
                                             <img src={a.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                                             <span className="text-zinc-200 font-medium">{a.name}</span>
                                         </div>
                                         <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Monitor Load</span>
                                     </div>
                                 ))}
                                 {priorityAthletes.length === 0 && <div className="text-zinc-500 text-center py-8">No high priority monitoring needed.</div>}
                             </div>
                         )}

                         {activeWidget === 'recent_activity' && (
                             <div className="space-y-2">
                                 {recentActivities.map(l => (
                                     <div key={l.id} className="text-sm p-3 border-b border-zinc-800/50 flex justify-between items-center">
                                         <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${l.status === 'Active' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                            <span className="text-zinc-300">{getAthleteName(l.athleteId)}</span>
                                            <span className="text-zinc-500">• {l.bodyPart}</span>
                                         </div>
                                         <span className="text-xs text-zinc-600">{new Date(l.dateLogged).toLocaleDateString()}</span>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                 </div>

                 {/* Specific Body Part Drilldown */}
                 {selectedHeatmapPart && (
                     <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-6 border-l-4 border-l-blue-500 animate-in slide-in-from-right-5">
                         <div className="flex justify-between items-start mb-4">
                             <div>
                                <h3 className="text-xl font-bold text-white">{selectedHeatmapPart} Analysis</h3>
                                <p className="text-zinc-400 text-sm">Drilldown of injuries for selected region.</p>
                             </div>
                             <button onClick={() => setSelectedHeatmapPart(null)} className="text-zinc-500 hover:text-white"><X size={18}/></button>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-500">
                                    <tr>
                                        <th className="p-3 rounded-l-lg">Athlete</th>
                                        <th className="p-3">Severity</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 rounded-r-lg">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedHeatmapInjuries.map(inj => (
                                        <tr key={inj.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                            <td className="p-3 font-medium text-white">{getAthleteName(inj.athleteId)}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-16 h-1.5 rounded-full bg-zinc-700 overflow-hidden`}>
                                                        <div className={`h-full ${inj.severity > 6 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${inj.severity * 10}%` }}></div>
                                                    </div>
                                                    <span className="text-xs">{inj.severity}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">{inj.status}</td>
                                            <td className="p-3">{new Date(inj.dateLogged).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {selectedHeatmapInjuries.length === 0 && (
                                        <tr><td colSpan={4} className="p-4 text-center">No records for this body part in selected range.</td></tr>
                                    )}
                                </tbody>
                            </table>
                         </div>
                     </div>
                 )}
               
                 {/* Workload vs Injury Chart (Mock visual) */}
                 <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                     <h3 className="text-lg font-bold text-white mb-6">Workload vs. Injury Rate</h3>
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[ chartData
                              
                            ]}>
                                <XAxis dataKey="label" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                    itemStyle={{ color: '#e4e4e7' }}
                                />
                                <Line yAxisId="left" type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name="Training Load (AU)" />
                                <Line yAxisId="right" type="monotone" dataKey="injuries" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name="Injury Count" />
                            </LineChart>
                        </ResponsiveContainer>
                     </div>
                 </div>
             </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
      if (selectedAthlete) return renderAthleteDetail();
      
      switch (activeTab) {
          case 'overview': return renderOverview();
          case 'roster': return renderRoster();
          case 'staff': return renderStaff();
          default: return renderOverview();
      }
  };

  return (
    <div className="flex h-full flex-col md:flex-row bg-zinc-950">
        {/* 
            FIX: DESKTOP SIDEBAR 
            Changed 'w-20' to 'hidden md:flex'. 
            It is now completely hidden on mobile to save space.
        */}
        <div className="hidden md:flex w-64 bg-zinc-900 border-r border-zinc-800 flex-shrink-0 flex-col pt-6">
            <div className="flex-1 space-y-2">
                <NavItem id="overview" label="Overview" icon={Activity} />
                <NavItem id="roster" label="Master Roster" icon={Users} />
                <NavItem id="staff" label="Staff" icon={Stethoscope} />
            </div>
            
            <div className="p-4 border-t border-zinc-800">
            {/* REPLACE THIS BLOCK */}
            <div 
                onClick={() => setIsProfileOpen(true)} // <--- CLICK TRIGGER
                className="bg-zinc-800/50 rounded-xl p-4 cursor-pointer hover:bg-zinc-800 hover:border-zinc-700 border border-transparent transition-all group"
            >
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-2 group-hover:text-emerald-500 transition-colors">My Profile</h4>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img 
                           src={userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserName)}&background=10b981&color=fff`} 
                           alt={currentUserName}
                           className="w-8 h-8 rounded-full object-cover border border-zinc-600 group-hover:border-emerald-500 transition-colors"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-0.5">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-900"></div>
                        </div>
                    </div>
                    <div className="hidden md:block min-w-0">
                        <p className="text-sm text-white font-medium truncate group-hover:underline decoration-zinc-500 underline-offset-2">{currentUserName}</p>
                        <p className="text-xs text-zinc-500 truncate">
                            {currentUserRole === Role.TRAINER ? 'Head Athletic Trainer' : 
                             currentUserRole === Role.COACH ? 'Head Coach' : 'Staff'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>

        {/* 
            FIX: MAIN CONTENT AREA
            Added 'pb-24' to ensure content doesn't get hidden behind the new mobile bottom bar.
        */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative pb-24 md:pb-8">
            {renderContent()}
        </div>

        {/* 
            FIX: MOBILE BOTTOM NAVIGATION 
            This only appears on small screens (md:hidden).
            It replaces the cramped sidebar.
        */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50 px-6 py-3 flex justify-between items-center safe-area-bottom">
            <button 
                onClick={() => setActiveTab('overview')} 
                className={`flex flex-col items-center gap-1 ${activeTab === 'overview' ? 'text-emerald-500' : 'text-zinc-500'}`}
            >
                <Activity size={24} />
                <span className="text-[10px] font-medium">Overview</span>
            </button>
            <button 
                onClick={() => setActiveTab('roster')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'roster' ? 'text-emerald-500' : 'text-zinc-500'}`}
            >
                <Users size={24} />
                <span className="text-[10px] font-medium">Roster</span>
            </button>
            <button 
                onClick={() => setActiveTab('staff')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'staff' ? 'text-emerald-500' : 'text-zinc-500'}`}
            >
                <Stethoscope size={24} />
                <span className="text-[10px] font-medium">Staff</span>
            </button>
        </div>
        <ProfileSettingsModal 
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            userProfile={userProfile}
            onProfileUpdate={() => { /* Handle local update if needed */ }}
        />
        
        {/* NEW: Modal for Viewing Athlete Medical Data */}
        <ProfileSettingsModal 
            isOpen={isAthleteMedicalOpen}
            onClose={() => setIsAthleteMedicalOpen(false)}
            userProfile={selectedAthlete} 
            onProfileUpdate={(updated) => {
                // If the trainer edits the athlete info, update the local state to reflect changes instantly
                if (selectedAthlete && selectedAthlete.id === updated.id) {
                    setSelectedAthlete(updated);
                    setAthletes(prev => prev.map(a => a.id === updated.id ? updated : a));
                }
            }}
        />

        <InjuryDetailsModal 
            isOpen={!!selectedInjury}
            onClose={() => setSelectedInjury(null)}
            injury={selectedInjury}
            currentUserRole={currentUserRole}
            onAddActivity={handleAddActivity}
            onUpdateInjury={handleUpdateInjury}
        />

        {isBodyPartSelectorOpen && <BodyPartSelectorModal />}

        <InjuryModal
            isOpen={isLogInjuryModalOpen}
            onClose={() => {
                setIsLogInjuryModalOpen(false);
                setNewInjuryBodyPart(null);
            }}
            bodyPart={newInjuryBodyPart}
            onSave={handleCreateInjury}
        />

        {/* --- MANAGE ROSTER POPUP --- */}
        {isManageRosterOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                <div className="bg-zinc-900 border border-zinc-700 w-full max-w-4xl rounded-2xl flex flex-col max-h-[85vh] shadow-2xl">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 rounded-t-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users size={20} className="text-emerald-500"/> Roster Management
                            </h2>
                            <p className="text-zinc-400 text-sm mt-1">Review pending requests and manage team access.</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsInviteModalOpen(true)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                <Plus size={16} /> Invite Athletes
                            </button>
                            <button onClick={() => setIsManageRosterOpen(false)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Pending Approvals List */}
                    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/50">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4 flex items-center gap-2">
                            Pending Approvals 
                            <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-xs">{pendingAthletes.length}</span>
                        </h3>

                        {pendingAthletes.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
                                <CheckCircle2 size={48} className="mx-auto text-zinc-700 mb-3" />
                                <p className="text-zinc-500">All caught up! No pending requests.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {pendingAthletes.map(athlete => (
                                    <div key={athlete.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-zinc-700">
                                        
                                        {/* Athlete Info */}
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <img src={athlete.avatarUrl} className="w-12 h-12 rounded-full border-2 border-zinc-800 object-cover" />
                                            <div>
                                                <h4 className="font-bold text-white text-lg">{athlete.name}</h4>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                                                    <span className="flex items-center gap-1"><Calendar size={12}/> DOB: {athlete.dob || 'N/A'}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span className="flex items-center gap-1"><Mail size={12}/> {athlete.email}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0">
                                            <button 
                                                onClick={() => handleDeclineAthlete(athlete.id)}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={16} /> Decline
                                            </button>
                                            <button 
    onClick={async () => {
        // 1. Update Database
        const { error } = await supabase
            .from('profiles')
            .update({ is_approved: true })
            .eq('id', athlete.id);

        if (error) {
            alert("Error approving athlete: " + error.message);
            return;
        }

        // 2. Manual State Update (Immediate UI Refresh)
        // Remove from Pending list
        setPendingAthletes(prev => prev.filter(p => p.id !== athlete.id));
        
        // Add to Active list (so they appear in the main roster immediately)
        setAthletes(prev => {
            // Check if already exists to prevent duplicates
            if (prev.find(p => p.id === athlete.id)) return prev;
            return [...prev, { ...athlete, status: 'Healthy' }]; // Default status upon approval
        });
    }}
    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
>
    <CheckCircle2 size={16} /> Approve
</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- INVITE GENERATION MODAL --- */}
        {isInviteModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
                <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                        <h3 className="text-white font-bold text-lg">Invite Athletes</h3>
                        <button onClick={() => setIsInviteModalOpen(false)} className="hover:bg-zinc-800 p-1 rounded text-zinc-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Current Code Display */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2 font-semibold">Current Active Code</p>
                            <div 
                                onClick={() => myTeam?.join_code && navigator.clipboard.writeText(myTeam.join_code)}
                                className="text-4xl font-mono font-bold text-white tracking-widest cursor-pointer hover:scale-105 transition-transform select-all"
                            >
                                {myTeam?.join_code || '----'}
                            </div>
                            <p className="text-zinc-600 text-xs mt-2 flex items-center justify-center gap-1">
                                {myTeam?.join_code ? 'Click to copy' : 'Generate a code to start'}
                            </p>
                        </div>

                        {/* Generation Controls */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Duration</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['1d', '7d', '30d', 'forever'].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setInviteDuration(d as any)}
                                            className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                                                inviteDuration === d 
                                                ? 'bg-emerald-600/20 border-emerald-500 text-white' 
                                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                                            }`}
                                        >
                                            {d === 'forever' ? <Infinity size={16} className="mx-auto"/> : d.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Usage Limit</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setInviteUsesType('unlimited')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                                            inviteUsesType === 'unlimited'
                                            ? 'bg-blue-600/20 border-blue-500 text-white' 
                                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                    >
                                        <Infinity size={16} /> Unlimited
                                    </button>
                                    <button
                                        onClick={() => setInviteUsesType('limited')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                                            inviteUsesType === 'limited'
                                            ? 'bg-blue-600/20 border-blue-500 text-white' 
                                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                    >
                                        Set Limit
                                    </button>
                                </div>
                                {inviteUsesType === 'limited' && (
                                    <input 
                                        type="number" 
                                        value={inviteMaxUses}
                                        onChange={(e) => setInviteMaxUses(parseInt(e.target.value))}
                                        className="w-full mt-3 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500"
                                    />
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerateCode}
                            disabled={isGeneratingCode}
                            className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isGeneratingCode ? <RefreshCw size={18} className="animate-spin"/> : <RefreshCw size={18} />}
                            Generate New Code
                        </button>
                        
                        <div className="pt-4 border-t border-zinc-800">
                             <button disabled className="w-full py-3 bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-xl font-medium flex items-center justify-center gap-2 cursor-not-allowed">
                                 <Mail size={18} /> Send Email Invite (Coming Soon)
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CoachDashboard;