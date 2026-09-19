import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Sparkles, MessageSquare, Mail, UserPlus, Check } from 'lucide-react';
import { CrewSquad } from '../types';

interface SquadRoomModalProps {
  eventId: string;
  onClose: () => void;
}

export const SquadRoomModal: React.FC<SquadRoomModalProps> = ({ eventId, onClose }) => {
  const { user, college } = useAuth();
  const [squad, setSquad] = useState<CrewSquad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const joinAndFetch = async () => {
      if (!user) return;
      try {
        const res = await api.joinEvent(eventId, {
          userId: user.userId,
          name: user.name,
          major: user.major || 'Undeclared',
          vibeSummary: user.vibeSummary || 'FOMO member'
        });
        
        if (!ignore) {
          setSquad({
            eventId,
            status: res.memberCount >= 4 ? 'CREW_LOCKED' : 'OPEN',
            members: res.members || [],
            icebreaker: res.icebreaker
          });
        }
      } catch (e) {
        if (!ignore) {
          setError('Event not found or no longer active');
        }
      }
    };

    joinAndFetch();

    return () => {
      ignore = true;
    };
  }, [eventId, user]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    let email = inviteEmailInput.trim().toLowerCase();
    if (!email) return;

    if (!email.includes('@') && college?.domain) {
      email = `${email}@${college.domain}`;
    }

    setInviteSending(true);
    setInviteMsg(null);
    try {
      await api.sendInvitations({
        eventId,
        hostId: user.userId,
        hostName: user.name || 'Squad Member',
        inviteEmails: [email]
      });
      setInviteMsg(`Invite dispatched to ${email}!`);
      setInviteEmailInput('');
      setTimeout(() => setInviteMsg(null), 4000);
    } catch (err) {
      setInviteMsg('Failed to send invite');
    } finally {
      setInviteSending(false);
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
        <div className="bg-obsidian border-[2px] border-pixel-gray w-full max-w-md relative flex flex-col p-6 text-center shadow-pixel">
          <button onClick={onClose} className="absolute top-2 right-2 text-white hover:text-cyber z-10">
            <X size={24} />
          </button>
          <h2 className="text-2xl font-mono text-red-500 mb-4 font-bold">[ ERROR ]</h2>
          <p className="font-mono text-white">{error}</p>
        </div>
      </div>
    );
  }

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
            
            {!isLocked && Array.from({length: Math.max(0, 4 - squad.members.length)}).map((_, i) => (
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
          
          {/* Direct Invite Squadmate if not locked */}
          {!isLocked && (
            <div className="border border-pixel-gray bg-pixel-dark/80 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-xs text-cyber font-bold flex items-center gap-1.5">
                  <UserPlus size={14} />
                  <span>KNOW SOMEONE? INVITE DIRECTLY</span>
                </div>
                {inviteMsg && (
                  <span className="font-mono text-xs text-cyber flex items-center gap-1">
                    <Check size={12} /> {inviteMsg}
                  </span>
                )}
              </div>
              <form onSubmit={handleSendInvite} className="flex gap-2">
                <input
                  type="text"
                  value={inviteEmailInput}
                  onChange={(e) => setInviteEmailInput(e.target.value)}
                  placeholder={`friend@${college?.domain || 'college.edu'}`}
                  className="bg-obsidian border-[2px] border-pixel-gray p-2 text-white font-mono text-xs focus:border-cyber outline-none flex-1"
                />
                <button
                  type="submit"
                  disabled={inviteSending || !inviteEmailInput.trim()}
                  className="bg-cyber text-black border-[2px] border-cyber font-mono text-xs font-bold px-4 py-2 hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Mail size={13} />
                  {inviteSending ? 'SENDING...' : 'DISPATCH INVITE'}
                </button>
              </form>
            </div>
          )}

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
            <button 
              onClick={() => alert('Group chat coming soon! Share this with your crew 🎉')}
              className="bg-white text-black font-mono font-bold px-8 py-3 flex items-center gap-2 hover:bg-cyber transition-colors border-[2px] border-white">
              <MessageSquare size={18} /> OPEN GROUP CHAT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
