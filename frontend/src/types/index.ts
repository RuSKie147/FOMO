export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  major?: string;
  gradYear?: string;
  vibeVector?: number[];
  vibeSummary?: string;
  hasCompletedVibeCheck: boolean;
  createdAt: string;
}

export interface CampusEvent {
  eventId: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  category: 'STUDY' | 'MUSIC' | 'FITNESS' | 'HACK' | 'CHILL' | 'FOOD';
  imageUrl?: string;
  imageKey?: string;
  lat: number;
  lng: number;
  memberCount: number;
  maxMembers: number;
  status: 'ACTIVE' | 'CREW_LOCKED' | 'COMPLETED';
  similarityScore?: number;
  distanceKm?: number;
  createdAt: string;
}

export interface SquadMember {
  userId: string;
  name: string;
  major: string;
  vibeSummary: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface CrewSquad {
  eventId: string;
  status: 'OPEN' | 'CREW_LOCKED';
  members: SquadMember[];
  icebreaker?: string;
  finalizedAt?: string;
}
