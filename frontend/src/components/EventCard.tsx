import React from 'react';
import { CampusEvent } from '../types';
import { Users, MapPin, Zap } from 'lucide-react';

interface EventCardProps {
  event: CampusEvent;
  onJoin: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onJoin }) => {
  const mCount = event.memberCount || 0;
  const mMax = event.maxMembers || 4;
  const isFull = mCount >= mMax;
  const isAlmostFull = mCount === mMax - 1;

  return (
    <div className="bg-obsidian border-[2px] border-pixel-gray hover:border-white transition-colors relative overflow-hidden group flex flex-col h-full">
      {event.imageUrl ? (
        <div className="h-32 w-full bg-pixel-gray relative overflow-hidden border-b-[2px] border-pixel-gray group-hover:border-white">
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="h-32 w-full bg-pixel-dark dither-bg border-b-[2px] border-pixel-gray group-hover:border-white flex items-center justify-center">
          <span className="font-mono text-gray-500 font-bold text-xl">{event.category}</span>
        </div>
      )}
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-mono bg-white text-black px-2 py-0.5 font-bold">
            {event.category}
          </span>
          {event.similarityScore !== undefined && (
            <span className="text-xs font-mono text-cyber border-[1px] border-cyber px-1">
              [ {Math.round(event.similarityScore * 100)}% MATCH ]
            </span>
          )}
        </div>
        
        <h3 className="font-mono font-bold text-xl text-white mb-1 line-clamp-1">{event.title}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2 flex-1">{event.description}</p>
        
        <div className="flex items-center gap-4 text-xs font-mono text-gray-400 mb-4 mt-auto">
          <div className="flex items-center gap-1">
            <span className="text-white">HOST:</span> {event.hostName ? event.hostName.split(' ')[0] : 'Anon'}
          </div>
          {event.distanceKm !== undefined && (
            <div className="flex items-center gap-1">
              <MapPin size={12} /> {event.distanceKm.toFixed(1)} KM
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between border-t-[2px] border-pixel-gray pt-3">
          <div className="flex items-center gap-1 font-mono text-sm">
            <Users size={14} className={isAlmostFull ? 'text-cyber animate-pulse' : ''} />
            <span className={isAlmostFull ? 'text-cyber' : 'text-white'}>
              {mCount}/{mMax}
            </span>
          </div>
          
          <button 
            onClick={() => onJoin(event.eventId)}
            disabled={isFull}
            className={`font-mono font-bold px-3 py-1 border-[2px] text-sm flex items-center gap-1 transition-colors
              ${isFull 
                ? 'bg-pixel-gray text-gray-500 border-pixel-gray cursor-not-allowed' 
                : 'bg-cyber text-black border-cyber hover:bg-transparent hover:text-cyber'}`}
          >
            {isFull ? 'LOCKED' : <><Zap size={14} /> JOIN</>}
          </button>
        </div>
      </div>
    </div>
  );
};
