import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Role } from '../types';
import { Shield, User, Lock, ArrowLeft, Users } from 'lucide-react';

interface SignUpPageProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onBack, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [role, setRole] = useState<Role>(Role.ATHLETE);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  
  // Athlete Specific
  const [joinCode, setJoinCode] = useState('');
  const [year, setYear] = useState('Freshman');

  // Coach Specific
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSport, setNewTeamSport] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let assignedTeamId = null;
      let teamNameString = null;
      let sportString = null;
      let requiresApproval = false;

      // 1. If Athlete, validate the Code FIRST
      if (role === Role.ATHLETE) {
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('join_code', joinCode)
          .single();

        if (teamError || !teamData) {
          throw new Error("Invalid Team Join Code. Please ask your coach for the correct code.");
        }

        assignedTeamId = teamData.id;
        teamNameString = teamData.name;
        sportString = teamData.sport;
        requiresApproval = teamData.requires_approval;
      }

      // 2. Create User in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user created");

      // 3. Create Profile
      const fullName = `${firstName} ${lastName}`;
      
      const newProfile = {
        id: authData.user.id,
        email: email,
        name: fullName,
        role: role,
        dob: dob,
        avatar_url: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
        
        // Athlete Logic
        team_id: role === Role.ATHLETE ? assignedTeamId : null,
        team: role === Role.ATHLETE ? teamNameString : null, // Legacy string
        sport: role === Role.ATHLETE ? sportString : null,    // Legacy string
        year: role === Role.ATHLETE ? year : null,
        status: 'Healthy',
        
        // Approval Logic
        // Coaches/Trainers auto-approved for now (or you can restrict them later)
        // Athletes are approved ONLY if the team doesn't require it
        is_approved: role === Role.ATHLETE ? !requiresApproval : true 
      };

      const { error: profileError } = await supabase.from('profiles').insert([newProfile]);
      if (profileError) throw profileError;

      // 4. If Coach, Create the Team immediately
      if (role === Role.COACH) {
        // Generate a random 6-char code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const { error: teamCreateError } = await supabase.from('teams').insert([{
          coach_id: authData.user.id,
          name: newTeamName,
          sport: newTeamSport,
          join_code: code,
          requires_approval: true // Default to requiring approval
        }]);

        if (teamCreateError) throw teamCreateError;
      }

      alert("Account created! You can now log in.");
      onSuccess(email);

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="text-zinc-500 hover:text-white mb-6 flex items-center gap-2 transition-colors">
          <ArrowLeft size={16} /> Back to Login
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-zinc-500 text-sm">Join your team or create a new one.</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-8 rounded-2xl shadow-xl">
          <form onSubmit={handleSignUp} className="space-y-5">
            
            {/* ROLE SELECTION */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-3">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {[Role.ATHLETE, Role.COACH, Role.TRAINER].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                      role === r 
                      ? 'bg-emerald-600/20 border-emerald-500 text-white' 
                      : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {r === Role.ATHLETE ? 'Athlete' : r === Role.COACH ? 'Coach' : 'Medical'}
                  </button>
                ))}
              </div>
            </div>

            {/* BASIC INFO */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">First Name</label>
                <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Last Name</label>
                <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
            </div>

            {/* ATHLETE: JOIN TEAM */}
            {role === Role.ATHLETE && (
              <div className="p-4 bg-blue-900/10 border border-blue-500/30 rounded-xl space-y-3">
                 <div className="flex items-center gap-2 mb-1">
                    <Users className="text-blue-400" size={16} />
                    <span className="text-xs font-bold text-blue-400 uppercase">Join Team</span>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Team Code</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Enter code (e.g. TITANS)" 
                      value={joinCode} 
                      onChange={e => setJoinCode(e.target.value.toUpperCase())} 
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm tracking-widest font-mono uppercase" 
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Get this code from your Coach.</p>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Year</label>
                    <select value={year} onChange={e => setYear(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm">
                        <option>Freshman</option>
                        <option>Sophomore</option>
                        <option>Junior</option>
                        <option>Senior</option>
                    </select>
                 </div>
              </div>
            )}

            {/* COACH: CREATE TEAM */}
            {role === Role.COACH && (
              <div className="p-4 bg-emerald-900/10 border border-emerald-500/30 rounded-xl space-y-3">
                 <div className="flex items-center gap-2 mb-1">
                    <Shield className="text-emerald-400" size={16} />
                    <span className="text-xs font-bold text-emerald-400 uppercase">Create New Team</span>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Team Name</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Varsity Football" 
                      value={newTeamName} 
                      onChange={e => setNewTeamName(e.target.value)} 
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Sport</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Football" 
                      value={newTeamSport} 
                      onChange={e => setNewTeamSport(e.target.value)} 
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" 
                    />
                 </div>
              </div>
            )}

            {/* DOB */}
            <div>
               <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date of Birth</label>
               <input required type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>

            {/* CREDENTIALS */}
            <div className="pt-2 border-t border-zinc-800">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email</label>
              <div className="relative mb-3">
                <User size={16} className="absolute left-3 top-2.5 text-zinc-500" />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm" />
              </div>
              
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-2.5 text-zinc-500" />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm" placeholder="Minimum 6 characters" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4 transition-all">
              {isLoading ? "Creating..." : <><Shield size={18} /> Create Account</>}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;