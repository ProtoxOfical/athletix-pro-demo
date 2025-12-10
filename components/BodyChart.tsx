import React from 'react';
import { BodyPart, InjuryLog, InjuryStatus } from '../types';

interface BodyChartProps {
  onSelectPart?: (part: BodyPart) => void;
  selectedPart?: BodyPart | null;
  injuries?: InjuryLog[];
  mode?: 'individual' | 'heatmap';
}

const BodyChart: React.FC<BodyChartProps> = ({ onSelectPart, selectedPart, injuries = [], mode = 'individual' }) => {
  
  const getFillColor = (part: BodyPart) => {
    if (mode === 'heatmap') {
      const count = injuries.filter(i => i.bodyPart === part).length;
      if (selectedPart === part) return '#3b82f6'; // Highlight selected part in heatmap mode
      
      if (count === 0) return '#3f3f46'; // zinc-700 for better silhouette
      if (count === 1) return '#f59e0b'; 
      if (count >= 2) return '#ef4444'; 
      return '#3f3f46';
    }

    if (selectedPart === part) return '#3b82f6';
    
    const activeInjury = injuries.find(i => i.bodyPart === part && i.status === InjuryStatus.ACTIVE);
    if (activeInjury) {
        return activeInjury.severity > 6 ? '#ef4444' : '#f59e0b';
    }
    
    // Default inactive color - making it lighter than background to stand out as a silhouette
    return '#3f3f46'; 
  };

  const getOpacity = (part: BodyPart) => {
      if (mode !== 'heatmap') return '1';
      if (selectedPart === part) return '1'; // Selected is always solid
      
      const count = injuries.filter(i => i.bodyPart === part).length;
      if (count === 0) return '0.4'; 
      return Math.min(0.6 + (count * 0.2), 1).toString();
  }

  const handleClick = (part: BodyPart) => {
    if (onSelectPart) onSelectPart(part);
  };

  // Helper for interactive body parts
  const BodyPartPath = ({ part, d }: { part: BodyPart, d: string }) => (
    <path
      d={d}
      fill={getFillColor(part)}
      fillOpacity={mode === 'heatmap' ? getOpacity(part) : 1}
      stroke={selectedPart === part ? '#60a5fa' : "#18181b"}
      strokeWidth={selectedPart === part ? "2" : "1.5"}
      strokeLinejoin="round"
      className={`${onSelectPart ? 'cursor-pointer' : ''} transition-all duration-200 hover:fill-blue-400/80`}
      onClick={() => handleClick(part)}
    />
  );

  return (
    <div className={`relative w-full flex justify-center items-center rounded-xl p-4 overflow-hidden ${mode === 'heatmap' ? 'h-full' : 'aspect-[3/4] md:aspect-auto md:h-[500px]'}`}>
      <svg
        viewBox="0 0 200 450"
        className="h-full w-auto max-h-[500px] drop-shadow-xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Head */}
        <BodyPartPath part={BodyPart.HEAD} d="M100,20 C88,20 80,30 80,45 C80,62 88,72 100,72 C112,72 120,62 120,45 C120,30 112,20 100,20 Z" />

        {/* Neck (Visual only, attached to chest for interaction usually, or separate) */}
        <path d="M92,70 L108,70 L112,85 L88,85 Z" fill="#3f3f46" stroke="#18181b" strokeWidth="1" />

        {/* Chest / Torso Upper */}
        <BodyPartPath part={BodyPart.CHEST} d="M88,85 L112,85 L130,90 L125,145 L75,145 L70,90 Z" />

        {/* Abs / Torso Lower */}
        <BodyPartPath part={BodyPart.ABS} d="M75,145 L125,145 L120,185 L80,185 Z" />

        {/* Hips / Pelvis */}
        <BodyPartPath part={BodyPart.HIP} d="M80,185 L120,185 L130,215 L70,215 Z" />

        {/* Left Shoulder */}
        <BodyPartPath part={BodyPart.SHOULDER_L} d="M70,90 L45,95 L40,115 L72,105 Z" />

        {/* Right Shoulder */}
        <BodyPartPath part={BodyPart.SHOULDER_R} d="M130,90 L155,95 L160,115 L128,105 Z" />

        {/* Left Arm (Upper + Lower combined for simplicity in this map, or split) */}
        <BodyPartPath part={BodyPart.ARM_L} d="M40,115 L30,170 L25,190 L45,185 L50,165 L55,115 Z" />

        {/* Right Arm */}
        <BodyPartPath part={BodyPart.ARM_R} d="M160,115 L170,170 L175,190 L155,185 L150,165 L145,115 Z" />

        {/* Left Thigh */}
        <BodyPartPath part={BodyPart.LEG_L} d="M70,215 L100,215 L95,290 L65,285 Z" />

        {/* Right Thigh */}
        <BodyPartPath part={BodyPart.LEG_R} d="M100,215 L130,215 L135,285 L105,290 Z" />

        {/* Left Knee */}
        <BodyPartPath part={BodyPart.KNEE_L} d="M65,285 L95,290 L92,315 L62,310 Z" />

        {/* Right Knee */}
        <BodyPartPath part={BodyPart.KNEE_R} d="M105,290 L135,285 L138,310 L108,315 Z" />

        {/* Left Lower Leg (Ankle area included) */}
        <BodyPartPath part={BodyPart.ANKLE_L} d="M62,310 L92,315 L90,380 L65,380 Z" />

        {/* Right Lower Leg */}
        <BodyPartPath part={BodyPart.ANKLE_R} d="M108,315 L138,310 L135,380 L110,380 Z" />

        {/* Left Foot */}
        <BodyPartPath part={BodyPart.FOOT_L} d="M65,380 L90,380 L95,400 L60,400 Z" />

        {/* Right Foot */}
        <BodyPartPath part={BodyPart.FOOT_R} d="M110,380 L135,380 L140,400 L105,400 Z" />

      </svg>
      
      <div className="absolute bottom-2 left-2 text-xs text-zinc-400/80 pointer-events-none">
        {mode === 'heatmap' ? 'Frequency' : 'Severity'}
      </div>
    </div>
  );
};

export default BodyChart;