import React from 'react';
import { Activity, Shield, ArrowRight, BarChart3, Lock } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]">
               <Activity className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
               <span className="font-bold text-xl tracking-tight block leading-none">Athletix<span className="text-emerald-500">Pro</span></span>
               <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Medical Systems</span>
            </div>
          </div>
          <button 
            onClick={onLoginClick}
            className="group relative px-5 py-2.5 rounded-lg overflow-hidden transition-all bg-zinc-900 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800"
          >
             <span className="relative z-10 text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Client Portal Login</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-24 pb-32 overflow-hidden">
        {/* Abstract Medical Background Lines */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M0,50 Q25,40 50,50 T100,50" stroke="url(#grad1)" strokeWidth="0.5" fill="none" />
                 <path d="M0,60 Q25,50 50,60 T100,60" stroke="url(#grad1)" strokeWidth="0.5" fill="none" />
                 <path d="M0,40 Q25,30 50,40 T100,40" stroke="url(#grad1)" strokeWidth="0.5" fill="none" />
                 <defs>
                     <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                         <stop offset="0%" style={{stopColor:'#10b981', stopOpacity:0}} />
                         <stop offset="50%" style={{stopColor:'#10b981', stopOpacity:1}} />
                         <stop offset="100%" style={{stopColor:'#10b981', stopOpacity:0}} />
                     </linearGradient>
                 </defs>
             </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Shield size={12} />
              <span className="tracking-wide">HIPAA & GDPR COMPLIANT</span>
           </div>
           
           <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent max-w-4xl mx-auto leading-[1.1]">
             The New Standard in <br /> Athletic Medical Records
           </h1>
           
           <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
             A unified electronic medical record (EMR) system engineered for high-performance organizations. Seamlessly integrate injury surveillance, load management, and care coordination.
           </p>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <button 
                onClick={onLoginClick}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_-10px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.5)]"
              >
                Access Medical Portal <ArrowRight size={20} />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-xl font-medium text-lg transition-all">
                Schedule Consultation
              </button>
           </div>
        </div>
      </div>

      {/* Grid Features */}
      <div className="border-y border-zinc-800 bg-zinc-900/30">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Clinical Precision Meets Athletic Performance</h2>
                <p className="text-zinc-500">Built in collaboration with lead physiotherapists from professional leagues.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                   icon={<Activity className="text-emerald-500" />}
                   title="Injury Surveillance"
                   description="Interactive body mapping and longitudinal severity tracking provides granular insights into injury patterns and recovery trajectories."
                />
                <FeatureCard 
                   icon={<BarChart3 className="text-blue-500" />}
                   title="Load Management Integration"
                   description="Correlate internal training loads (RPE) and external stressors with injury incidence to prevent overuse syndromes."
                />
                 <FeatureCard 
                   icon={<Lock className="text-purple-500" />}
                   title="Encrypted Care Coordination"
                   description="Secure, role-based communication channels ensure seamless information flow between medical staff and coaching personnel."
                />
            </div>
         </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2 opacity-50">
                <Activity className="w-5 h-5" />
                <span className="font-semibold tracking-tight">AthletixPro</span>
             </div>
             <div className="text-zinc-600 text-sm">
                © 2024 Athletix Pro Medical Systems. All rights reserved.
             </div>
             <div className="flex gap-8 text-sm text-zinc-600">
                <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-zinc-400 transition-colors">Security</a>
             </div>
          </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/30 transition-all group hover:bg-zinc-900/80">
     <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 shadow-lg group-hover:scale-110 transition-transform duration-300">
        {icon}
     </div>
     <h3 className="text-lg font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{title}</h3>
     <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
  </div>
);

export default LandingPage;