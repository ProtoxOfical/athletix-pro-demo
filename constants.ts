import { AthleteProfile, Role, BodyPart, InjuryStatus, InjuryLog, TrainingLog, Message } from './types';

export const CURRENT_USER_ID_ATHLETE = 'user_123';
export const CURRENT_USER_ID_COACH = 'coach_001';
export const CURRENT_USER_ID_TRAINER = 'trainer_001';

export const MOCK_ATHLETES: AthleteProfile[] = [
  {
    id: 'user_123',
    name: 'Jordan Rivera',
    role: Role.ATHLETE,
    sport: 'Track & Field',
    team: 'Varsity Sprinters',
    status: 'Injured',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_123'
  },
  {
    id: 'user_456',
    name: 'Sarah Chen',
    role: Role.ATHLETE,
    sport: 'Basketball',
    team: 'Lady Hawks',
    status: 'Healthy',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_456'
  },
  {
    id: 'user_789',
    name: 'Mike Johnson',
    role: Role.ATHLETE,
    sport: 'Football',
    team: 'Titans',
    status: 'Recovery',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_789'
  },
  {
    id: 'user_101',
    name: 'Alex Smith',
    role: Role.ATHLETE,
    sport: 'Cross Country',
    team: 'Varsity',
    status: 'Injured',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_101'
  },
  {
    id: 'user_202',
    name: 'Emily Davis',
    role: Role.ATHLETE,
    sport: 'Soccer',
    team: 'Lady Lions',
    status: 'Healthy',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_202'
  },
  {
    id: 'user_303',
    name: 'Chris Thompson',
    role: Role.ATHLETE,
    sport: 'Basketball',
    team: 'Hawks',
    status: 'Healthy',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_303'
  },
  {
    id: 'user_404',
    name: 'Marcus Williams',
    role: Role.ATHLETE,
    sport: 'Football',
    team: 'Titans',
    status: 'Injured',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_404'
  },
  {
    id: 'user_505',
    name: 'Jessica Lee',
    role: Role.ATHLETE,
    sport: 'Volleyball',
    team: 'Spikers',
    status: 'Recovery',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_505'
  },
  {
    id: 'user_606',
    name: 'David Kim',
    role: Role.ATHLETE,
    sport: 'Swimming',
    team: 'Dolphins',
    status: 'Healthy',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_606'
  },
  {
    id: 'user_707',
    name: 'Tom Baker',
    role: Role.ATHLETE,
    sport: 'Rugby',
    team: 'Warriors',
    status: 'Injured',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_707'
  },
  {
    id: 'user_808',
    name: 'Chloe Rodriguez',
    role: Role.ATHLETE,
    sport: 'Tennis',
    team: 'Aces',
    status: 'Healthy',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_808'
  },
  {
    id: 'user_909',
    name: 'James Wilson',
    role: Role.ATHLETE,
    sport: 'Baseball',
    team: 'Sluggers',
    status: 'Recovery',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_909'
  },
  {
    id: 'user_010',
    name: 'Mia Taylor',
    role: Role.ATHLETE,
    sport: 'Gymnastics',
    team: 'Elite Gym',
    status: 'Injured',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_010'
  },
  {
    id: 'user_111',
    name: 'Ethan Hunt',
    role: Role.ATHLETE,
    sport: 'Lacrosse',
    team: 'Raiders',
    status: 'Healthy',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_111'
  },
  {
    id: 'user_212',
    name: 'Sophia Martinez',
    role: Role.ATHLETE,
    sport: 'Softball',
    team: 'Diamonds',
    status: 'Healthy',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_212'
  },
  {
    id: 'user_313',
    name: 'Lucas Brown',
    role: Role.ATHLETE,
    sport: 'Hockey',
    team: 'Ice Kings',
    status: 'Injured',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_313'
  },
  {
    id: 'user_414',
    name: 'Ava White',
    role: Role.ATHLETE,
    sport: 'Track & Field',
    team: 'Varsity Sprinters',
    status: 'Healthy',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_414'
  },
  {
    id: 'user_515',
    name: 'Noah Green',
    role: Role.ATHLETE,
    sport: 'Basketball',
    team: 'Hawks',
    status: 'Healthy',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_515'
  }
];

export const MOCK_INJURIES: InjuryLog[] = [
  // JORDAN - RECURRING KNEE ISSUE (Current)
  {
    id: 'log_1',
    athleteId: 'user_123',
    bodyPart: BodyPart.KNEE_R,
    severity: 7,
    severityHistory: [
        { date: new Date(Date.now() - 86400000 * 2).toISOString(), value: 9 },
        { date: new Date(Date.now() - 86400000 * 1).toISOString(), value: 8 },
        { date: new Date(Date.now()).toISOString(), value: 7 }
    ],
    painType: 'Sharp',
    description: 'Felt a pop during sprint start.',
    status: InjuryStatus.ACTIVE,
    dateLogged: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    activityLog: [
      {
        id: 'act_1',
        authorName: 'Dr. Emily (Trainer)',
        authorRole: Role.TRAINER,
        date: new Date(Date.now() - 86400000 * 1.8).toISOString(),
        type: 'Treatment',
        content: 'RESTRICTION: Do not allow running or weight bearing. Needs MRI clearance. Crutches issued.',
        progress: 'Same'
      },
      {
        id: 'act_2',
        authorName: 'Jordan Rivera',
        authorRole: Role.ATHLETE,
        date: new Date(Date.now() - 86400000 * 1).toISOString(),
        type: 'Note',
        content: 'Swelling went down a bit, but still painful to walk.',
        progress: 'Better'
      }
    ]
  },
  // JORDAN - RECURRING KNEE ISSUE (Past)
  {
    id: 'log_4',
    athleteId: 'user_123',
    bodyPart: BodyPart.KNEE_R,
    severity: 1,
    severityHistory: [
        { date: new Date(Date.now() - 86400000 * 120).toISOString(), value: 5 },
        { date: new Date(Date.now() - 86400000 * 115).toISOString(), value: 3 },
        { date: new Date(Date.now() - 86400000 * 110).toISOString(), value: 1 }
    ],
    painType: 'Throbbing',
    description: 'Recurring pain in right knee.',
    status: InjuryStatus.RESOLVED,
    dateLogged: new Date(Date.now() - 86400000 * 120).toISOString(),
    activityLog: []
  },
  
  // MIKE - SHOULDER
  {
    id: 'log_2',
    athleteId: 'user_789',
    bodyPart: BodyPart.SHOULDER_L,
    severity: 4,
    severityHistory: [
        { date: new Date(Date.now() - 86400000 * 5).toISOString(), value: 7 },
        { date: new Date(Date.now() - 86400000 * 3).toISOString(), value: 5 },
        { date: new Date(Date.now()).toISOString(), value: 4 }
    ],
    painType: 'Dull Ache',
    description: 'Soreness after heavy lifting session.',
    status: InjuryStatus.RECOVERING,
    dateLogged: new Date(Date.now() - 86400000 * 5).toISOString(),
    activityLog: [
      {
        id: 'act_4',
        authorName: 'Dr. Emily (Trainer)',
        authorRole: Role.TRAINER,
        date: new Date(Date.now() - 86400000 * 4).toISOString(),
        type: 'Treatment',
        content: 'MODIFIED: Light resistance only. No overhead pressing.',
        progress: 'Better'
      }
    ]
  },
  
  // ALEX - NEW INJURY
  {
    id: 'log_5',
    athleteId: 'user_101',
    bodyPart: BodyPart.ANKLE_R,
    severity: 6,
    severityHistory: [
         { date: new Date(Date.now() - 86400000 * 1).toISOString(), value: 6 }
    ],
    painType: 'Sharp',
    description: 'Rolled ankle on trail root.',
    status: InjuryStatus.ACTIVE,
    dateLogged: new Date(Date.now() - 86400000 * 1).toISOString(),
    activityLog: [
        {
        id: 'act_5',
        authorName: 'Dr. Emily (Trainer)',
        authorRole: Role.TRAINER,
        date: new Date(Date.now() - 86400000 * 0.5).toISOString(),
        type: 'Treatment',
        content: 'RESTRICTION: Boot worn for 1 week. No impact activities.',
        progress: 'Same'
      }
    ]
  },

  // SARAH - OLD ISSUE
  {
    id: 'log_3',
    athleteId: 'user_456',
    bodyPart: BodyPart.ANKLE_L,
    severity: 0,
    severityHistory: [{ date: new Date(Date.now() - 86400000 * 10).toISOString(), value: 3 }],
    painType: 'Stiffness',
    description: 'Minor stiffness after practice.',
    status: InjuryStatus.RESOLVED,
    dateLogged: new Date(Date.now() - 86400000 * 10).toISOString(),
    activityLog: []
  },

  // MARCUS - CONCUSSION
  {
    id: 'log_6',
    athleteId: 'user_404',
    bodyPart: BodyPart.HEAD,
    severity: 8,
    severityHistory: [
         { date: new Date(Date.now() - 86400000 * 3).toISOString(), value: 9 },
         { date: new Date(Date.now() - 86400000 * 1).toISOString(), value: 8 }
    ],
    painType: 'Throbbing',
    description: 'Collision during tackling drill. Headache and sensitivity to light.',
    status: InjuryStatus.ACTIVE,
    dateLogged: new Date(Date.now() - 86400000 * 3).toISOString(),
    activityLog: [
       {
        id: 'act_6',
        authorName: 'Dr. Emily (Trainer)',
        authorRole: Role.TRAINER,
        date: new Date(Date.now() - 86400000 * 2.5).toISOString(),
        type: 'Treatment',
        content: 'CONCUSSION PROTOCOL: Stage 1. Complete rest. No screens, no school.',
        progress: 'Worse'
      }
    ]
  },
  
  // JESSICA - SHOULDER
   {
    id: 'log_7',
    athleteId: 'user_505',
    bodyPart: BodyPart.SHOULDER_R,
    severity: 5,
    severityHistory: [
         { date: new Date(Date.now() - 86400000 * 14).toISOString(), value: 6 },
         { date: new Date(Date.now() - 86400000 * 7).toISOString(), value: 5 }
    ],
    painType: 'Burning',
    description: 'Overuse from serving drills.',
    status: InjuryStatus.RECOVERING,
    dateLogged: new Date(Date.now() - 86400000 * 14).toISOString(),
    activityLog: []
  },

  // TOM - KNEE
  {
    id: 'log_8',
    athleteId: 'user_707',
    bodyPart: BodyPart.KNEE_L,
    severity: 7,
    severityHistory: [{ date: new Date(Date.now() - 86400000 * 1).toISOString(), value: 7 }],
    painType: 'Unstable',
    description: 'Knee buckled during scrum.',
    status: InjuryStatus.ACTIVE,
    dateLogged: new Date(Date.now() - 86400000 * 1).toISOString(),
    activityLog: []
  },

  // JAMES - ELBOW
  {
    id: 'log_9',
    athleteId: 'user_909',
    bodyPart: BodyPart.ARM_R,
    severity: 4,
    severityHistory: [{ date: new Date(Date.now() - 86400000 * 4).toISOString(), value: 4 }],
    painType: 'Stiffness',
    description: 'Pitcher\'s elbow flair up.',
    status: InjuryStatus.RECOVERING,
    dateLogged: new Date(Date.now() - 86400000 * 4).toISOString(),
    activityLog: []
  },

  // MIA - BACK
  {
    id: 'log_10',
    athleteId: 'user_010',
    bodyPart: BodyPart.BACK,
    severity: 6,
    severityHistory: [{ date: new Date(Date.now() - 86400000 * 2).toISOString(), value: 6 }],
    painType: 'Sharp',
    description: 'Lower back spasm on landing.',
    status: InjuryStatus.ACTIVE,
    dateLogged: new Date(Date.now() - 86400000 * 2).toISOString(),
    activityLog: []
  },

  // LUCAS - WRIST
  {
    id: 'log_11',
    athleteId: 'user_313',
    bodyPart: BodyPart.ARM_L,
    severity: 5,
    severityHistory: [{ date: new Date(Date.now() - 86400000 * 1).toISOString(), value: 5 }],
    painType: 'Dull Ache',
    description: 'Slashed on wrist during game.',
    status: InjuryStatus.ACTIVE,
    dateLogged: new Date(Date.now() - 86400000 * 1).toISOString(),
    activityLog: []
  }
];

export const MOCK_TRAINING_LOGS: TrainingLog[] = [
  {
    id: 't_1',
    athleteId: 'user_123',
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    durationMinutes: 45,
    rpe: 8,
    stressLevel: 7,
    notes: 'Felt heavy today.'
  },
  {
    id: 't_2',
    athleteId: 'user_123',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    durationMinutes: 90,
    rpe: 9,
    stressLevel: 5
  },
  {
    id: 't_3',
    athleteId: 'user_456',
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    durationMinutes: 60,
    rpe: 4,
    stressLevel: 3
  },
  {
    id: 't_4',
    athleteId: 'user_202',
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    durationMinutes: 75,
    rpe: 6,
    stressLevel: 4
  },
  {
    id: 't_5',
    athleteId: 'user_606',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    durationMinutes: 120,
    rpe: 7,
    stressLevel: 2
  },
  {
    id: 't_6',
    athleteId: 'user_909',
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    durationMinutes: 45,
    rpe: 5,
    stressLevel: 4
  },
  {
    id: 't_7',
    athleteId: 'user_111',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    durationMinutes: 90,
    rpe: 8,
    stressLevel: 6
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm_1',
    senderId: 'user_123',
    receiverId: 'coach_001',
    text: 'Coach, my knee feels weird again. Should I skip practice?',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false
  },
  {
    id: 'm_2',
    senderId: 'coach_001',
    receiverId: 'user_123',
    text: 'Yes, please take it easy. Go see the Trainer immediately.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    isRead: true
  },
  {
    id: 'm_3',
    senderId: 'user_123',
    receiverId: 'trainer_001',
    text: 'Dr. Emily, can I get some ice?',
    timestamp: new Date(Date.now() - 1700000).toISOString(),
    isRead: false
  }
];

export const PREDEFINED_PAIN_TYPES = [
  'Sharp',
  'Dull / Ache',
  'Throbbing',
  'Burning',
  'Stiffness',
  'Shooting',
  'Unstable',
  'Numbness'
];

export const SEVERITY_COLORS = {
  LOW: 'bg-emerald-500', // 1-3
  MED: 'bg-yellow-500',  // 4-6
  HIGH: 'bg-red-500'     // 7-10
};