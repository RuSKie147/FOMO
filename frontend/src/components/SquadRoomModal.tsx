import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Sparkles, MessageSquare } from 'lucide-react';
import { CrewSquad } from '../types';

interface SquadRoomModalProps {
  eventId: string;
  onClose: () => void;
}

export const SquadRoomModal: React.FC<SquadRoomModalProps> = ({ eventId, onClose }) => {
  const { user } = useAuth();
  const [squad, setSquad] = useState<CrewSquad | null>(null);

  useEffect(() => {
    const joinAndFetch = async () => {
      if (!user) return;
      try {
        const res = await api.joinEvent(eventId, {
          userId: user.userId,
          name: user.name,
          major: user.major || 'CS Major',
          vibeSummary: user.vibeSummary || 'Campus Explorer'
        });
        setSquad({
          eventId,
          status: res.memberCount >= 4 ? 'CREW_LOCKED' : 'OPEN',
          members: res.members || [],
          icebreaker: res.icebreaker
        });
      } catch (e) {
        // Mock fallback if event was already joined or testing offline
        setSquad({
          eventId,
          status: 'CREW_LOCKED',
          members: [
            { userId: user.userId, name: user.name, major: 'CS Major', vibeSummary: 'Hacker', joinedAt: '' },
            { userId: '2', name: 'Priya S.', major: 'Design Major', vibeSummary: 'Creative', joinedAt: '' },
            { userId: '3', name: 'Marcus J.', major: 'Music Major', vibeSummary: 'Social', joinedAt: '' },
            { userId: '4', name: 'Rando C.', major: 'Undeclared', vibeSummary: 'Wildcard', joinedAt: '' }
          ],
          icebreaker: "Since you all share a passion for creative campus projects, what track or hack are you most hyped about this semester?"
        });
      }
    };
    joinAndFetch();
  }, [eventId, user]);

  if (!squad) return null;

  const isLocked = squad.status === 'CREW_LOCKED';

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      {isLocked && (
        <>
          <div className="confetti-piece" style={{left: '10%', animationDelay: '0s'}}></div>
          <div className="confetti-piece" style={{left: '30%', animationDelay: '0.5s', backgroundColor: 'white'}}></div>
          <div className="confetti-piece" style={{left: '50%', animationDelay: '0.2s'}}></div>
          <div className="confetti-piece" style={{left: '70%', animationDelay: '0.8s', backgroundColor: 'white'}}></div>
          <div className="confetti-piece" style={{left: '90%', animationDelay: '0.1s'}}></div>
        </>
      )}
      
      <div className={`bg-obsidian border-[2px] w-full max-w-2xl relative flex flex-col max-h-[90vh] 
        ${isLocked ? 'border-cyber shadow-pixel' : 'border-white shadow-pixel-white'}`}>
        
        <button onClick={onClose} className="absolute top-2 right-2 text-white hover:text-cyber z-10">
          <X size={24} />
        </button>
        
        <div className="p-6 text-center border-b-[2px] border-pixel-gray">
          <h2 className={`text-3xl font-mono font-bold mb-2 ${isLocked ? 'text-cyber' : 'text-white'}`}>
            {isLocked ? '[ CREW_LOCKED ]' : '[ ASSEMBLING ]'}
          </h2>
          <p className="font-mono text-gray-400">
            {isLocked ? 'Your squad is ready. Let\'s go.' : 'Waiting for more people to join...'}
          </p>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 mb-8">
            {squad.members.map((m, i) => (
              <div key={i} className="border-[2px] border-pixel-gray p-4 flex items-center gap-4 bg-pixel-dark">
                <div className="w-12 h-12 bg-white flex-shrink-0 flex items-center justify-center text-black font-mono font-bold text-xl">
                  {m.name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-mono font-bold text-white">{m.name || 'Anon'}</div>
                  <div className="text-xs text-cyber font-mono">{m.major || 'Unknown Major'}</div>
                </div>
              </div>
            ))}
            
            {!isLocked && Array.from({length: 4 - squad.members.length}).map((_, i) => (
              <div key={`empty-${i}`} className="border-[2px] border-dashed border-pixel-gray p-4 flex items-center gap-4 bg-transparent opacity-50">
                <div className="w-12 h-12 border-[2px] border-pixel-gray flex-shrink-0 flex items-center justify-center text-pixel-gray">
                  ?
                </div>
                <div className="font-mono text-pixel-gray text-sm animate-pulse">
                  SEARCHING...
                </div>
              </div>
            ))}
          </div>
          
          {isLocked && squad.icebreaker && (
            <div className="border-[2px] border-cyber bg-cyber/5 p-5 relative mt-4">
              <div className="absolute -top-3 left-4 bg-cyber text-black font-mono text-xs font-bold px-2 py-0.5 flex items-center gap-1">
                <Sparkles size={12} /> AI ICEBREAKER
              </div>
              <p className="font-body text-white leading-relaxed pt-2">
                {squad.icebreaker}
              </p>
            </div>
          )}
        </div>
        
        {isLocked && (
          <div className="p-4 border-t-[2px] border-pixel-gray bg-pixel-dark flex justify-center">
            <button className="bg-white text-black font-mono font-bold px-8 py-3 flex items-center gap-2 hover:bg-cyber transition-colors border-[2px] border-white">
              <MessageSquare size={18} /> OPEN GROUP CHAT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
