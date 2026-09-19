import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EventCard } from './EventCard';
import { CampusEvent } from '../types';
import { Search, Filter } from 'lucide-react';

const CATEGORIES = ['ALL', 'HACK', 'STUDY', 'CHILL', 'MUSIC', 'FOOD', 'FITNESS'] as const;

interface EventFeedProps {
  onJoinEvent: (eventId: string) => void;
}

export const EventFeed: React.FC<EventFeedProps> = ({ onJoinEvent }) => {
  const { user, college } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTab, setViewTab] = useState<'all' | 'my_squads'>('all');

  useEffect(() => {
    let ignore = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (user) {
          const centerLat = college.code === 'DTU' ? 28.7499 : (college.code === 'IITD' ? 28.5450 : (college.code === 'NSUT' ? 28.6091 : 28.5458));
          const centerLng = college.code === 'DTU' ? 77.1170 : (college.code === 'IITD' ? 77.1926 : (college.code === 'NSUT' ? 77.0352 : 77.2733));
          const res = await api.getFeed(user.userId, centerLat, centerLng);
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

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      // My Squads tab filter
      if (viewTab === 'my_squads') {
        const isMember = (user && ev.memberIds && ev.memberIds.includes(user.userId)) || (user && ev.hostId === user.userId);
        if (!isMember) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && ev.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title?.toLowerCase().includes(q);
        const matchDesc = ev.description?.toLowerCase().includes(q);
        const matchHost = ev.hostName?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchHost) return false;
      }

      return true;
    });
  }, [events, selectedCategory, searchQuery, viewTab, user]);

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
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 min-w-0 max-w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 border-b-[2px] border-white pb-3 gap-2">
        <div>
          <h2 className="font-mono text-2xl text-white font-bold">[ YOUR_FEED ]</h2>
          <span className="font-mono text-xs text-cyber font-bold mt-0.5 block">CAMPUS: {college.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTab('all')}
            className={`font-mono text-xs px-3 py-1.5 border-[2px] transition-colors ${
              viewTab === 'all'
                ? 'bg-cyber text-black border-cyber font-bold'
                : 'bg-obsidian text-gray-400 border-pixel-gray hover:text-white'
            }`}
          >
            ALL CREWS ({events.length})
          </button>
          <button
            onClick={() => setViewTab('my_squads')}
            className={`font-mono text-xs px-3 py-1.5 border-[2px] transition-colors ${
              viewTab === 'my_squads'
                ? 'bg-cyber text-black border-cyber font-bold'
                : 'bg-obsidian text-gray-400 border-pixel-gray hover:text-white'
            }`}
          >
            MY SQUADS
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col gap-3 mb-6 bg-pixel-dark border-[2px] border-pixel-gray p-3 sm:p-3.5 shadow-pixel min-w-0 max-w-full">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, plan, or host..."
            className="w-full bg-obsidian border-[2px] border-pixel-gray pl-9 pr-3 py-2 text-white font-mono text-xs focus:border-cyber outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-gray-400 hover:text-white text-xs font-mono"
            >
              CLEAR
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-1 min-w-0 max-w-full pb-1">
          <Filter size={13} className="text-cyber flex-shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`font-mono text-[11px] px-2.5 py-1 border whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-obsidian text-gray-400 border-pixel-gray hover:border-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
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
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 border-[2px] border-dashed border-pixel-gray">
          <p className="font-mono text-gray-400 font-bold">
            {viewTab === 'my_squads' ? 'YOU HAVE NOT JOINED ANY CREWS YET' : 'NO MATCHING CREWS FOUND'}
          </p>
          <p className="font-mono text-xs text-cyber mt-2">
            {viewTab === 'my_squads' 
              ? '> Browse the feed and click JOIN on an event to find your squad!' 
              : '> Try adjusting your category filter or search keywords.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(ev => (
            <EventCard key={ev.eventId} event={ev} onJoin={onJoinEvent} />
          ))}
        </div>
      )}
    </div>
  );
};
