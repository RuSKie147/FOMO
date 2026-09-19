import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EventCard } from './EventCard';
import { CampusEvent } from '../types';
import { Search, Plus, Radio, Users, Crown, RefreshCw } from 'lucide-react';

interface MyEventsProps {
  onOpenSquadRoom: (eventId: string) => void;
  onOpenHost: () => void;
}

export const MyEvents: React.FC<MyEventsProps> = ({ onOpenSquadRoom, onOpenHost }) => {
  const { user, college } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'hosted' | 'joined'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchMyEvents = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const centerLat = college.code === 'DTU' ? 28.7499 : (college.code === 'IITD' ? 28.5450 : (college.code === 'NSUT' ? 28.6091 : 28.5458));
        const centerLng = college.code === 'DTU' ? 77.1170 : (college.code === 'IITD' ? 77.1926 : (college.code === 'NSUT' ? 77.0352 : 77.2733));
        const res = await api.getFeed(user.userId, centerLat, centerLng);
        if (isMounted) {
          const allEvents: CampusEvent[] = res.events || [];
          // Filter to only events user is involved in (hosted or joined)
          const myEvents = allEvents.filter(ev => {
            const isHost = ev.hostId === user.userId;
            const isMember = ev.memberIds && ev.memberIds.includes(user.userId);
            return isHost || isMember;
          });
          setEvents(myEvents);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load your events. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMyEvents();
    return () => {
      isMounted = false;
    };
  }, [user, college, refreshCount]);

  const hostedCount = useMemo(() => {
    if (!user) return 0;
    return events.filter(e => e.hostId === user.userId).length;
  }, [events, user]);

  const joinedCount = useMemo(() => {
    if (!user) return 0;
    return events.filter(e => e.hostId !== user.userId && e.memberIds?.includes(user.userId)).length;
  }, [events, user]);

  const filteredEvents = useMemo(() => {
    if (!user) return [];
    return events.filter(ev => {
      const isHost = ev.hostId === user.userId;
      const isJoinedMember = !isHost && (ev.memberIds?.includes(user.userId) || false);

      if (activeSubTab === 'hosted' && !isHost) return false;
      if (activeSubTab === 'joined' && !isJoinedMember) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title?.toLowerCase().includes(q);
        const matchDesc = ev.description?.toLowerCase().includes(q);
        const matchCat = ev.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [events, activeSubTab, searchQuery, user]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 py-8">
        <div className="h-8 w-48 bg-pixel-gray animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 border-[2px] border-pixel-gray bg-pixel-dark animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 border-b-[2px] border-white pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-2xl text-white font-bold tracking-tight">[ MY_EVENTS ]</h2>
            <span className="font-mono text-xs bg-cyber text-black font-bold px-2 py-0.5 shadow-pixel">
              {events.length} TOTAL
            </span>
          </div>
          <span className="font-mono text-xs text-cyber font-bold mt-1 block">
            CAMPUS: {college.name} • USER: {user?.name || 'Anon'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshCount(c => c + 1)}
            className="font-mono text-xs text-gray-300 border-[2px] border-pixel-gray hover:border-white p-2 bg-obsidian transition-colors"
            title="Refresh my events"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={onOpenHost}
            className="font-mono text-xs text-black bg-cyber hover:bg-white border-[2px] border-cyber font-bold px-3 py-2 shadow-pixel transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} /> HOST NEW CREW
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`font-mono text-xs px-3.5 py-2 border-[2px] font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'all'
                ? 'bg-cyber text-black border-cyber shadow-pixel'
                : 'bg-obsidian text-gray-400 border-pixel-gray hover:text-white'
            }`}
          >
            <Radio size={14} /> ALL ({events.length})
          </button>

          <button
            onClick={() => setActiveSubTab('hosted')}
            className={`font-mono text-xs px-3.5 py-2 border-[2px] font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'hosted'
                ? 'bg-cyber text-black border-cyber shadow-pixel'
                : 'bg-obsidian text-gray-400 border-pixel-gray hover:text-white'
            }`}
          >
            <Crown size={14} /> HOSTED BY ME ({hostedCount})
          </button>

          <button
            onClick={() => setActiveSubTab('joined')}
            className={`font-mono text-xs px-3.5 py-2 border-[2px] font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'joined'
                ? 'bg-cyber text-black border-cyber shadow-pixel'
                : 'bg-obsidian text-gray-400 border-pixel-gray hover:text-white'
            }`}
          >
            <Users size={14} /> JOINED CREWS ({joinedCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search my events..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-pixel-dark border-[2px] border-pixel-gray pl-8 pr-3 py-1.5 text-xs text-white font-mono focus:border-cyber outline-none"
          />
        </div>
      </div>

      {/* Content List */}
      {error && (
        <div className="border border-red-500 bg-red-950/40 p-4 font-mono text-xs text-red-400 mb-6">
          {error}
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="border-[2px] border-dashed border-pixel-gray p-12 text-center bg-pixel-dark/40">
          <p className="font-mono text-sm text-gray-300 font-bold mb-2">
            {activeSubTab === 'hosted'
              ? 'NO HOSTED EVENTS FOUND'
              : activeSubTab === 'joined'
              ? 'NO JOINED SQUADS FOUND'
              : 'NO EVENTS IN YOUR ROSTER'}
          </p>
          <p className="font-mono text-xs text-gray-400 max-w-md mx-auto mb-6">
            {activeSubTab === 'hosted'
              ? 'You have not broadcasted any campus events yet. Create one to rally fellow students!'
              : activeSubTab === 'joined'
              ? 'You have not joined any squads hosted by other students. Explore the FEED or RADAR to hop into a squad!'
              : 'Host a new event or browse the live feed to join active campus squads.'}
          </p>
          <button
            onClick={onOpenHost}
            className="font-mono text-xs text-black bg-cyber hover:bg-white border-[2px] border-cyber font-bold px-4 py-2 shadow-pixel transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> BROADCAST FIRST CREW
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map(event => (
            <EventCard
              key={event.eventId}
              event={event}
              onJoin={() => onOpenSquadRoom(event.eventId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
