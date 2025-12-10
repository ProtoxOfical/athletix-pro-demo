export enum Role {
  ATHLETE = 'ATHLETE',
  COACH = 'COACH',
  TRAINER = 'TRAINER'
}

export enum BodyPart {
  HEAD = 'Head',
  SHOULDER_L = 'Left Shoulder',
  SHOULDER_R = 'Right Shoulder',
  ARM_L = 'Left Arm',
  ARM_R = 'Right Arm',
  CHEST = 'Chest',
  ABS = 'Abdomen',
  BACK = 'Back',
  HIP = 'Hip',
  LEG_L = 'Left Leg',
  LEG_R = 'Right Leg',
  KNEE_L = 'Left Knee',
  KNEE_R = 'Right Knee',
  ANKLE_L = 'Left Ankle',
  ANKLE_R = 'Right Ankle',
  FOOT_L = 'Left Foot',
  FOOT_R = 'Right Foot'
}

export enum InjuryStatus {
  ACTIVE = 'Active',
  RECOVERING = 'Recovering',
  RESOLVED = 'Resolved'
}

export interface ActivityLog {
  id: string;
  authorName: string;
  authorRole: Role;
  date: string;
  type: 'Treatment' | 'Note' | 'Status Update';
  content: string;
  progress?: 'Better' | 'Same' | 'Worse';
}

export interface SeverityPoint {
  date: string;
  value: number;
}

export interface InjuryLog {
  id: string;
  athleteId: string;
  bodyPart: BodyPart;
  severity: number; // Current severity 1-10
  severityHistory: SeverityPoint[]; // History for charting
  painType: string; // e.g., Sharp, Dull, Throbbing
  description: string;
  status: InjuryStatus;
  dateLogged: string;
  activityLog: ActivityLog[]; // Replaces aiAdvice with a conversation/treatment history
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatarUrl?: string;
}

export interface AthleteProfile extends User {
  role: Role.ATHLETE;
  sport: string;
  team: string;
  status: 'Healthy' | 'Injured' | 'Recovery';
}

export interface TrainingLog {
  id: string;
  athleteId: string;
  date: string;
  durationMinutes: number;
  rpe: number; // 1-10 Rate of Perceived Exertion
  stressLevel: number; // 1-10 Daily Stress
  notes?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}