import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EventCard } from './EventCard';
import { CampusEvent } from '../types';

interface EventFeedProps {
  onJoinEvent: (eventId: string) => void;
}

export const EventFeed: React.FC<EventFeedProps> = ({ onJoinEvent }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (user) {
          const res = await api.getFeed(user.userId, 28.5458, 77.2732);
          setEvents(res.events || []);
        }
      } catch (e) {
        // Mock data fallback
        setEvents([
          {
            eventId: '1', hostId: 'h1', hostName: 'Riya S.', title: 'Late Night Hackathon Prep',
            description: 'Grinding leetcode and building side projects. Coffee on me.',
            category: 'HACK', lat: 28.546, lng: 77.273, memberCount: 3, maxMembers: 4,
            status: 'ACTIVE', similarityScore: 0.95, distanceKm: 0.2, createdAt: new Date().toISOString()
          },
          {
            eventId: '2', hostId: 'h2', hostName: 'Kabir', title: 'Indie Rock Jam Session',
            description: 'Bringing my acoustic. Need a bassist and someone who can harmonize.',
            category: 'MUSIC', lat: 28.545, lng: 77.275, memberCount: 1, maxMembers: 4,
            status: 'ACTIVE', similarityScore: 0.82, distanceKm: 0.5, createdAt: new Date().toISOString()
          },
          {
            eventId: '3', hostId: 'h3', hostName: 'Aman', title: 'Night Canteen Run',
            description: 'Craving maggi. Who is in?',
            category: 'FOOD', lat: 28.548, lng: 77.271, memberCount: 4, maxMembers: 4,
            status: 'CREW_LOCKED', similarityScore: 0.6, distanceKm: 0.8, createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [user]);

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
        <h2 className="font-mono text-2xl text-white font-bold">[ YOUR_FEED ]</h2>
        <span className="font-mono text-cyber text-sm">{events.length} ACTIVE</span>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-20 border-[2px] border-dashed border-pixel-gray">
          <p className="font-mono text-gray-500">NO CREWS FOUND NEARBY</p>
          <p className="font-mono text-sm text-cyber mt-2">&gt; INITIATE YOUR OWN</p>
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
