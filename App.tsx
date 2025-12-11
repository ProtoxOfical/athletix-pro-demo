import React, { useState, useEffect } from 'react';
import { Role } from './types';
import AthleteDashboard from './components/AthleteDashboard';
import CoachDashboard from './components/CoachDashboard';
import LandingPage from './components/LandingPage';
import { LogOut, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from './supabaseClient'; 
import SignUpPage from './components/SignUpPage';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [authStep, setAuthStep] = useState<'LOADING' | 'LANDING' | 'LOGIN' | 'REGISTER' | 'APPROVAL_PENDING' | 'AUTHENTICATED'>('LOADING');  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // --- RESTORED MISSING STATE VARIABLES ---
  const [userId, setUserId] = useState<string | null>(null);
  const [athleteData, setAthleteData] = useState<any>(null);

  // --- 1. SESSION MANAGEMENT (Auto-Login Logic) ---
  useEffect(() => {
    // Check for an existing session immediately when app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setAuthStep('LANDING');
      }
    });

    // Listen for background changes (like tab closes or timeouts)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Only fetch if we aren't already logged in as this user
        if (session.user.id !== userId) {
             fetchProfile(session.user.id);
        }
      } else {
        // Logged out
        setAuthStep('LANDING');
        setUserId(null);
        setCurrentRole(null);
        setAthleteData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [userId]);

  // Helper to load user data from the 'profiles' table
  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error || !data) {
        console.error("Profile not found");
        await supabase.auth.signOut(); 
        setAuthStep('LANDING');
        return;
      }

      // --- NEW: CHECK APPROVAL STATUS ---
      // If they are an athlete and NOT approved, block access
      if (data.role === 'ATHLETE' && !data.is_approved) {
        setAuthStep('APPROVAL_PENDING');
        // We still set these so we can show their name on the waiting screen if needed
        setUserId(data.id);
        setAthleteData(data);
        return; 
      }

      setUserId(data.id);
      setAthleteData(data);
      
      if (data.role === 'COACH') setCurrentRole(Role.COACH);
      else if (data.role === 'TRAINER') setCurrentRole(Role.TRAINER);
      else setCurrentRole(Role.ATHLETE);

      setAuthStep('AUTHENTICATED');
    } catch (err) {
      console.error(err);
      setAuthStep('LANDING');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Secure Login
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      // On success, the useEffect listener above handles the redirect

    } catch (error: any) {
      alert("Login Failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Attempt standard sign out
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Force local cleanup regardless of server response
      // This ensures the user is never stuck in a "zombie" logged-in state
      setAuthStep('LANDING');
      setUserId(null);
      setCurrentRole(null);
      setAthleteData(null);
      
      // Optional: Clear local storage manually if Supabase fails to do so
      localStorage.clear(); 
    }
  };

  // --- RENDERING ---

  if (authStep === 'LOADING') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-emerald-500 font-bold text-xl">Loading AthletixPro...</div>
      </div>
    );
  }

  if (authStep === 'LANDING') return <LandingPage onLoginClick={() => setAuthStep('LOGIN')} />;
  
  if (authStep === 'REGISTER') {
    return (
      <SignUpPage 
        onBack={() => setAuthStep('LOGIN')} 
        onSuccess={(newEmail) => {
           setEmail(newEmail);
           setAuthStep('LOGIN');
        }} 
      />
    );
  }

  if (authStep === 'LOGIN') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <button onClick={() => setAuthStep('LANDING')} className="absolute top-8 left-8 text-zinc-500 hover:text-white z-20">← Back</button>
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Athletix<span className="text-emerald-500">Pro</span></h1>
            <p className="text-zinc-500 text-sm">Secure Login</p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 p-8 rounded-2xl shadow-xl">
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                {isLoading ? "Verifying..." : <><Lock size={18} /> Sign In</>}
              </button>
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-800">
                <p className="text-zinc-500 text-xs">No account?</p>
                <button type="button" onClick={() => setAuthStep('REGISTER')} className="text-emerald-400 text-xs font-bold hover:text-emerald-300">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
  if (authStep === 'APPROVAL_PENDING') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-yellow-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-zinc-400 mb-6">
            Your account has been created, but you have not been approved by your Head Coach yet.
          </p>
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg mb-6 text-sm text-zinc-500">
            Please contact your coach and tell them to approve 
            <span className="text-white font-bold block mt-1">{athleteData?.name || 'your account'}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }
  // AUTHENTICATED STATE
  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col overflow-hidden">
      {/* 
         FIX: Changed bg-zinc-900/50 to bg-zinc-900/95 with backdrop-blur 
         This stops content from looking "messy" when scrolling under it.
      */}
      <nav className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-xl p-4 flex justify-between items-center z-40 flex-shrink-0">
        <div className="font-bold text-xl">Athletix<span className="text-emerald-500">Pro</span></div>
        <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white flex items-center gap-2">
            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
        </button>
      </nav>
      
      {/* 
         FIX: Removed 'overflow-hidden' from main to let specific dashboards handle their own scroll 
         or inherit correctly.
      */}
      <main className="flex-1 w-full relative overflow-hidden">
         {currentRole === Role.ATHLETE ? (
           // Athlete dashboard needs its own scroll container
           <div className="h-full overflow-y-auto">
             <AthleteDashboard athlete={athleteData} />
           </div>
         ) : (
           <CoachDashboard 
              currentUserRole={currentRole!} 
              currentUserId={userId} 
              currentUserName={athleteData?.name || 'Staff'}
              userProfile={athleteData} 
           />
         )}
      </main>
    </div>
  );
};
export default App;