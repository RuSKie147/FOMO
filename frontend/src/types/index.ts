export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  major?: string;
  gradYear?: string;
  collegeName?: string;
  domain?: string;
  vibeVector?: number[];
  vibeSummary?: string;
  hasCompletedVibeCheck: boolean;
  createdAt: string;
}

export interface CampusEvent {
  eventId: string;
  hostId: string;
  hostName: string;
  domain?: string;
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

export interface EventInvitation {
  inviteId: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  hostId: string;
  hostName: string;
  inviteeEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
  eventStatus?: string;
  memberCount?: number;
  maxMembers?: number;
  eventDescription?: string;
}

