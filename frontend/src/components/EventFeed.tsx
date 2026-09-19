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
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (user) {
          const res = await api.getFeed(user.userId, 28.5458, 77.2732);
          if (!ignore) {
            const domainEvents = (res.events || []).filter((ev: CampusEvent) => !ev.domain || ev.domain === college.domain);
            setEvents(domainEvents);
          }
        }
      } catch (e) {
        if (!ignore) {
          setError('Failed to load nearby crews. Please try again.');
          setEvents([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [user, college, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

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
      
      {error ? (
        <div className="text-center py-20 border-[2px] border-dashed border-red-500/50 bg-red-500/5">
          <p className="font-mono text-red-400 mb-4">{error}</p>
          <button 
            onClick={handleRetry}
            className="font-mono text-sm bg-obsidian border-[1px] border-red-500 text-red-500 px-4 py-2 hover:bg-red-500/10 transition-colors">
            [ RETRY ]
          </button>
        </div>
      ) : events.length === 0 ? (
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
