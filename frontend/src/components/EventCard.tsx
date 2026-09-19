import React from 'react';
import { CampusEvent } from '../types';
import { useAuth } from '../context/AuthContext';
import { Users, MapPin, Zap, MessageSquare, Check, Clock } from 'lucide-react';

interface EventCardProps {
  event: CampusEvent;
  onJoin: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onJoin }) => {
  const { user } = useAuth();
  const mCount = event.memberCount || 1;
  const mMax = event.maxMembers || 4;
  const isFull = mCount >= mMax;
  const isAlmostFull = mCount === mMax - 1;
  const isHost = user ? event.hostId === user.userId : false;
  const isMember = isHost || (user && event.memberIds ? event.memberIds.includes(user.userId) : false);

  return (
    <div className={`border-[2px] bg-pixel-dark flex flex-col h-full transition-all relative ${
      isFull ? 'border-cyber shadow-pixel' : 'border-pixel-gray hover:border-white'
    }`}>
      {event.imageUrl ? (
        <div className="h-40 w-full overflow-hidden bg-black relative border-b border-pixel-gray flex items-center justify-center">
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute top-2 left-2 font-mono text-[10px] bg-black/80 border border-cyber text-cyber px-2 py-0.5 font-bold">
            {event.category}
          </div>
        </div>
      ) : (
        <div className="h-24 w-full bg-obsidian border-b border-pixel-gray flex items-center justify-center relative">
          <div className="absolute inset-0 bg-cyber/5"></div>
          <span className="font-mono text-gray-500 font-bold text-xl">{event.category}</span>
        </div>
      )}
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!event.imageUrl && (
              <span className="text-xs font-mono bg-white text-black px-2 py-0.5 font-bold">
                {event.category}
              </span>
            )}
            {isHost && (
              <span className="text-[10px] font-mono bg-cyber text-black px-1.5 py-0.5 font-bold">
                HOST
              </span>
            )}
            {!isHost && isMember && (
              <span className="text-[10px] font-mono border border-cyber text-cyber px-1.5 py-0.2 font-bold flex items-center gap-0.5">
                <Check size={10} /> JOINED
              </span>
            )}
          </div>
          {event.similarityScore !== undefined && (
            <span className="text-xs font-mono text-cyber border-[1px] border-cyber px-1 whitespace-nowrap">
              [ {Math.max(12, Math.min(99, Math.round(event.similarityScore * 100)))}% MATCH ]
            </span>
          )}
        </div>
        
        <h3 className="font-mono font-bold text-xl text-white mb-1 line-clamp-1">{event.title}</h3>
        <p className="text-gray-400 text-sm mb-2 line-clamp-2 flex-1">{event.description}</p>
        
        {/* Dynamic Location & Expiration Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] font-mono">
          {event.locationName && (
            <span className="inline-flex items-center gap-1 text-cyber bg-obsidian border border-cyber/40 px-1.5 py-0.5 truncate max-w-[190px]">
              <MapPin size={10} /> {event.locationName}
            </span>
          )}
          {event.expiresAt && (
            <span className="inline-flex items-center gap-1 text-gray-400 bg-obsidian border border-pixel-gray px-1.5 py-0.5">
              <Clock size={10} /> {new Date(event.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-gray-400 mb-3 mt-auto">
          <div className="flex items-center gap-1">
            <span className="text-white">HOST:</span> {event.hostName ? event.hostName.split(' ')[0] : 'Anon'}
          </div>
          {event.distanceKm !== undefined && (
            <div className="flex items-center gap-1">
              <MapPin size={12} /> {event.distanceKm < 1 ? `${Math.round(event.distanceKm * 1000)} M` : `${event.distanceKm.toFixed(1)} KM`}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between border-t-[2px] border-pixel-gray pt-3">
          <div className="flex items-center gap-1.5 font-mono text-sm">
            <Users size={14} className={isAlmostFull ? 'text-cyber animate-pulse' : ''} />
            <span className={isAlmostFull || isMember ? 'text-cyber font-bold' : 'text-white'}>
              {mCount}/{mMax}
            </span>
            <span className="text-[10px] text-gray-400 uppercase">IN SQUAD</span>
          </div>
          
          <button 
            onClick={() => onJoin(event.eventId)}
            disabled={isFull && !isMember}
            className={`font-mono font-bold px-3 py-1 border-[2px] text-sm flex items-center gap-1 transition-colors
              ${isMember 
                ? (isFull 
                    ? 'bg-cyber text-black border-cyber hover:bg-white' 
                    : 'bg-transparent text-cyber border-cyber hover:bg-cyber hover:text-black')
                : (isFull 
                    ? 'bg-pixel-gray text-gray-500 border-pixel-gray cursor-not-allowed' 
                    : 'bg-cyber text-black border-cyber hover:bg-transparent hover:text-cyber')}`}
          >
            {isMember ? (
              isFull ? <><MessageSquare size={13} /> SQUAD CHAT</> : <><Users size={13} /> SQUAD ROOM</>
            ) : (
              isFull ? 'LOCKED' : <><Zap size={14} /> JOIN</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
