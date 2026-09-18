import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EventCard } from './EventCard';
import { CampusEvent } from '../types';

interface EventFeedProps {
  onJoinEvent: (eventId: string) => void;
}

export const EventFeed: React.FC<EventFeedProps> = ({ onJoinEvent }) => {
  const { user, college } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (user) {
          const res = await api.getFeed(user.userId, 28.5458, 77.2732);
          const domainEvents = (res.events || []).filter((ev: CampusEvent) => !ev.domain || ev.domain === college.domain);
          if (domainEvents.length > 0) {
            setEvents(domainEvents);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // Fallback to sample events below
      }

      // If no events exist yet for this college, populate demo crew events
      setEvents([
        {
          eventId: '1', hostId: 'h1', hostName: 'Riya S.', title: `${college.code} Hackathon Prep`,
          description: `Grinding leetcode and building side projects for ${college.code}. Coffee on me.`,
          category: 'HACK', domain: college.domain, lat: 28.546, lng: 77.273, memberCount: 3, maxMembers: 4,
          status: 'ACTIVE', similarityScore: 0.95, distanceKm: 0.2, createdAt: new Date().toISOString()
        },
        {
          eventId: '2', hostId: 'h2', hostName: 'Kabir', title: 'Indie Rock Jam Session',
          description: 'Bringing my acoustic. Need a bassist and someone who can harmonize.',
          category: 'MUSIC', domain: college.domain, lat: 28.545, lng: 77.275, memberCount: 1, maxMembers: 4,
          status: 'ACTIVE', similarityScore: 0.82, distanceKm: 0.5, createdAt: new Date().toISOString()
        },
        {
          eventId: '3', hostId: 'h3', hostName: 'Aman', title: 'Night Canteen Run',
          description: `Craving midnight snacks at ${college.code} canteen. Who is in?`,
          category: 'FOOD', domain: college.domain, lat: 28.548, lng: 77.271, memberCount: 4, maxMembers: 4,
          status: 'CREW_LOCKED', similarityScore: 0.6, distanceKm: 0.8, createdAt: new Date().toISOString()
        }
      ]);
      setLoading(false);
    };
    
    fetchEvents();
  }, [user, college]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 py-8">
        <h2 className="font-mono text-xl text-white mb-6 font-bold">[ DISCOVER_CREWS ]</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 border-[2px] border-pixel-gray bg-pixel-dark animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 py-8">
      <div className="flex justify-between items-end mb-6 border-b-[2px] border-white pb-2">
        <div>
          <h2 className="font-mono text-2xl text-white font-bold">[ YOUR_FEED ]</h2>
          <span className="font-mono text-xs text-cyber font-bold mt-1 block">CAMPUS: {college.name}</span>
        </div>
        <span className="font-mono text-cyber text-sm">{events.length} ACTIVE AT {college.code}</span>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-20 border-[2px] border-dashed border-pixel-gray">
          <p className="font-mono text-gray-500">NO CREWS FOUND AT {college.name}</p>
          <p className="font-mono text-sm text-cyber mt-2">&gt; INITIATE THE FIRST CREW FOR {college.code}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(ev => (
            <EventCard key={ev.eventId} event={ev} onJoin={onJoinEvent} />
          ))}
        </div>
      )}
    </div>
  );
};
