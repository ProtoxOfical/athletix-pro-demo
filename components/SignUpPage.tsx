import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Role } from '../types';
import { Shield, ArrowRight, User, Lock, ArrowLeft } from 'lucide-react';

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
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Athlete Specific
  const [team, setTeam] = useState('');
  const [sport, setSport] = useState('');
  const [year, setYear] = useState('Freshman');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Create User in Supabase Secure Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user created");

      // 2. Create Profile entry linked to the Auth ID
      const fullName = `${firstName} ${lastName}`;
      
      const newProfile = {
        id: authData.user.id, // IMPORTANT: Link to the Secure User ID
        email: email,
        name: fullName,
        role: role,
        dob: dob,
        avatar_url: avatarUrl || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
        team: role === Role.ATHLETE ? team : null,
        sport: role === Role.ATHLETE ? sport : null,
        year: role === Role.ATHLETE ? year : null,
        status: 'Healthy'
      };

      const { error: profileError } = await supabase.from('profiles').insert([newProfile]);

      if (profileError) throw profileError;

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
          <p className="text-zinc-500 text-sm">Secure Sign Up</p>
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

            {/* ATHLETE SPECIFIC */}
            {role === Role.ATHLETE && (
              <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 space-y-3">
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Team Name</label>
                    <input required type="text" placeholder="e.g. Varsity Sprinters" value={team} onChange={e => setTeam(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Sport</label>
                        <input required type="text" placeholder="e.g. Track" value={sport} onChange={e => setSport(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
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
              </div>
            )}

            {/* DOB & PIC */}
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date of Birth</label>
                    <input required type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Photo URL</label>
                    <input type="text" placeholder="https://..." value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
                 </div>
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
              {isLoading ? "Creating..." : <><Shield size={18} /> Create Secure Account</>}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;