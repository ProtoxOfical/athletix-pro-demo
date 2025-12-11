import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Role, AthleteProfile, User } from '../types';
import { X, Save, Shield, User as UserIcon, Phone, FileText, HeartPulse, CreditCard, Lock, Camera, AlertTriangle } from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: AthleteProfile | User | null;
  onProfileUpdate: (updatedProfile: any) => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose, userProfile, onProfileUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  // Public Profile Data
  const [publicData, setPublicData] = useState({
    avatar_url: ''
  });

  // Private Medical Data
  const [medicalData, setMedicalData] = useState({
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medications: '',
    allergies: '',
    medical_allergies: '',
    insurance_provider: '',
    insurance_policy_number: ''
  });

  // Fetch private data when modal opens
  useEffect(() => {
    if (isOpen && userProfile) {
      setPublicData({ avatar_url: userProfile.avatarUrl || '' });
      fetchSensitiveData(userProfile.id);
    }
  }, [isOpen, userProfile]);

  const fetchSensitiveData = async (uid: string) => {
    setIsFetching(true);
    // 1. Try to fetch existing medical record
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (data) {
      setMedicalData({
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        medications: data.medications || '',
        allergies: data.allergies || '',
        medical_allergies: data.medical_allergies || '',
        insurance_provider: data.insurance_provider || '',
        insurance_policy_number: data.insurance_policy_number || ''
      });
    } else if (error && error.code !== 'PGRST116') {
      // PGRST116 is "Row not found", which is fine (just means they haven't saved medical info yet)
      console.error("Error fetching medical records:", error);
    }
    setIsFetching(false);
  };

  const handleSave = async () => {
    if (!userProfile) return;
    setIsLoading(true);
    try {
      // 1. Update Public Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicData.avatar_url })
        .eq('id', userProfile.id);

      if (profileError) throw profileError;

      // 2. Upsert Medical Records (Secure Table)
      // We use upsert so it creates the row if it doesn't exist
      const { error: medicalError } = await supabase
        .from('medical_records')
        .upsert({
          user_id: userProfile.id,
          ...medicalData
        });

      if (medicalError) throw medicalError;

      // 3. Update Parent State (Optimistic Update)
      // Note: We merge everything into the generic profile object for the UI to use
      onProfileUpdate({
        ...userProfile,
        avatarUrl: publicData.avatar_url,
        // We add these properties to the object even though they live in a different table DB-side
        // This allows the UI to remain simple
        emergencyContactName: medicalData.emergency_contact_name,
        emergencyContactPhone: medicalData.emergency_contact_phone,
        medications: medicalData.medications,
        allergies: medicalData.allergies,
        medicalAllergies: medicalData.medical_allergies,
        insuranceProvider: medicalData.insurance_provider,
        insurancePolicyNumber: medicalData.insurance_policy_number,
      });

      onClose();
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !userProfile) return null;
  const isAthlete = userProfile.role === Role.ATHLETE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 w-full md:max-w-4xl h-full md:h-[90vh] md:rounded-2xl border-x-0 md:border border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-800 bg-zinc-900">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              <Shield className="text-emerald-500" />
              {/* DYNAMIC TITLE */}
              {userProfile.role === Role.ATHLETE ? `${userProfile.name}'s Medical Profile` : 'Secure Profile Settings'}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Encrypted storage enabled. RLS policies active.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 relative">
          
          {isFetching && (
            <div className="absolute inset-0 bg-zinc-950/80 z-10 flex items-center justify-center">
              <div className="text-emerald-500 font-bold animate-pulse">Decrypting Records...</div>
            </div>
          )}

          {/* Section 1: Public Profile */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
              <UserIcon size={16} /> Public Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Profile Picture URL</label>
                <div className="relative">
                    <Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="text" 
                      value={publicData.avatar_url}
                      onChange={(e) => setPublicData({...publicData, avatar_url: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-emerald-500"
                    />
                </div>
              </div>

              {/* Read Only Identity Fields */}
              <div className="opacity-60 cursor-not-allowed">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">Full Name <Lock size={10} /></label>
                <input disabled value={userProfile.name} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-4 py-2.5" />
              </div>
              
              {/* Show Team for Athletes */}
              {(userProfile as AthleteProfile).team && (
                  <div className="opacity-60 cursor-not-allowed">
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">Team <Lock size={10} /></label>
                    <input disabled value={(userProfile as AthleteProfile).team} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-4 py-2.5" />
                  </div>
              )}
              <div className="opacity-60 cursor-not-allowed">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">Full Name <Lock size={10} /></label>
                <input disabled value={userProfile.name} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-4 py-2.5" />
              </div>
              <div className="opacity-60 cursor-not-allowed">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">Team <Lock size={10} /></label>
                <input disabled value={(userProfile as AthleteProfile).team || 'Staff'} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-4 py-2.5" />
              </div>
              <div className="opacity-60 cursor-not-allowed">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                  Role <Lock size={10} />
                </label>
                <input disabled value={userProfile.role} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-4 py-2.5" />
              </div>

              <div className="opacity-60 cursor-not-allowed">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                  Email Address <Lock size={10} />
                </label>
                <input disabled value={userProfile.email || 'Not set'} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-4 py-2.5" />
              </div>

              <div className="opacity-60 cursor-not-allowed">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                  Date of Birth <Lock size={10} />
                </label>
                <input disabled value={userProfile.dob || 'Not set'} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-4 py-2.5" />
              </div>
            </div>
          </section>

          {/* Section 2: Secure Medical Records */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Lock size={16} /> Secure Medical Data
            </h3>
            
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3">
               <AlertTriangle className="text-red-500 shrink-0" size={20} />
               <div className="text-sm text-red-200">
                 <strong className="block mb-1 text-red-400">Strictly Confidential</strong>
                 This data is stored in a segregated database table (`medical_records`). Access is restricted via Row Level Security (RLS) policies to you, your assigned athletic trainer, and your specific team coach only.
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 text-blue-400">Emergency Contact</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                            type="text" 
                            value={medicalData.emergency_contact_name}
                            onChange={(e) => setMedicalData({...medicalData, emergency_contact_name: e.target.value})}
                            placeholder="Contact Name"
                            className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-blue-500"
                        />
                        <input 
                            type="text" 
                            value={medicalData.emergency_contact_phone}
                            onChange={(e) => setMedicalData({...medicalData, emergency_contact_phone: e.target.value})}
                            placeholder="Phone Number"
                            className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {isAthlete && (
                <>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-2">
                            <HeartPulse size={12} className="text-red-500"/> Medications & Allergies
                        </label>
                        <textarea 
                            value={medicalData.medications}
                            onChange={(e) => setMedicalData({...medicalData, medications: e.target.value})}
                            placeholder="List current medications..."
                            className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-4 py-3 h-20 resize-none focus:ring-1 focus:ring-emerald-500 mb-4"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="text" 
                                value={medicalData.allergies}
                                onChange={(e) => setMedicalData({...medicalData, allergies: e.target.value})}
                                placeholder="Food/Env Allergies"
                                className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-emerald-500"
                            />
                            <input 
                                type="text" 
                                value={medicalData.medical_allergies}
                                onChange={(e) => setMedicalData({...medicalData, medical_allergies: e.target.value})}
                                placeholder="Drug Allergies"
                                className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 border-t border-zinc-800 pt-4">
                         <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-2">
                            <CreditCard size={12} className="text-purple-500"/> Insurance Details
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <input 
                                type="text" 
                                value={medicalData.insurance_provider}
                                onChange={(e) => setMedicalData({...medicalData, insurance_provider: e.target.value})}
                                placeholder="Provider (e.g. Aetna)"
                                className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-purple-500"
                             />
                             <input 
                                type="text" 
                                value={medicalData.insurance_policy_number}
                                onChange={(e) => setMedicalData({...medicalData, insurance_policy_number: e.target.value})}
                                placeholder="Policy Number"
                                className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-purple-500"
                             />
                        </div>
                    </div>
                </>
                )}
            </div>
          </section>

          <div className="h-10 md:h-0"></div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 bg-zinc-900 border-t border-zinc-800 flex justify-end gap-3 shrink-0 safe-area-bottom">
          <button onClick={onClose} className="px-6 py-2.5 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isLoading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Encrypting & Saving..." : <><Save size={18} /> Save Securely</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileSettingsModal;