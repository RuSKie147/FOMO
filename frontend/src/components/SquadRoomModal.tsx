import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Sparkles, MessageSquare, Mail, UserPlus, Check, Send, LogOut, Trash2, MapPin, Clock, Users, AlertTriangle, Calendar } from 'lucide-react';
import { CrewSquad, ChatMessage } from '../types';
import { formatEventDateTime } from '../utils/dateUtils';

interface SquadRoomModalProps {
  eventId: string;
  onClose: () => void;
}

const formatLikesSummary = (summary?: string) => {
  if (!summary) return 'Likes: Campus Life, Tech & Hangouts';
  let cleaned = summary.trim();
  cleaned = cleaned.replace(/^you seem like a person who likes\s*/i, '');
  cleaned = cleaned.replace(/^likes:\s*/i, '');
  cleaned = cleaned.replace(/\.+$/, '');
  return `Likes: ${cleaned}`;
};

export const SquadRoomModal: React.FC<SquadRoomModalProps> = ({ eventId, onClose }) => {
  const { user, college } = useAuth();
  const [squad, setSquad] = useState<CrewSquad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  // Group chat states
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Action states
  const [leaving, setLeaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'cancel_event' | 'leave_squad' | null>(null);

  const fetchSquad = async () => {
    if (!user) return;
    try {
      const res = await api.joinEvent(eventId, {
        userId: user.userId,
        name: user.name,
        major: user.major || 'Undeclared',
        vibeSummary: user.vibeSummary ? formatLikesSummary(user.vibeSummary) : 'Likes: Campus Explorer, Chill'
      });
      
      setSquad({
        eventId,
        status: (res.memberCount >= (res.maxMembers || 4) || res.status === 'CREW_LOCKED') ? 'CREW_LOCKED' : 'OPEN',
        members: res.members || [],
        icebreaker: res.icebreaker,
        title: res.title,
        category: res.category,
        description: res.description,
        hostId: res.hostId,
        hostName: res.hostName,
        maxMembers: res.maxMembers || 4,
        locationName: res.locationName || 'Campus Grounds',
        lat: res.lat,
        lng: res.lng,
        scheduledAt: res.scheduledAt,
        expiresAt: res.expiresAt
      });
    } catch (e) {
      setError('Event not found or no longer active');
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.getEventMessages(eventId);
      setMessages(res.messages || []);
    } catch (e) {
      // Ignore message polling errors
    }
  };

  // Initial load and live polling
  useEffect(() => {
    fetchSquad();
    fetchMessages();

    // 3s interval for live squad and chat updates
    const interval = setInterval(() => {
      fetchSquad();
      if (showChat || squad?.status === 'CREW_LOCKED') {
        fetchMessages();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [eventId, user?.userId, showChat, squad?.status]);

  useEffect(() => {
    if (showChat) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    let email = inviteEmailInput.trim().toLowerCase();
    if (!email) return;

    if (!email.includes('@') && college?.domain) {
      email = `${email}@${college.domain}`;
    }

    if (user?.email && email === user.email.toLowerCase().trim()) {
      setInviteMsg('You cannot invite yourself!');
      setTimeout(() => setInviteMsg(null), 3000);
      return;
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
      setInviteMsg(`Dispatched to ${email}!`);
      setInviteEmailInput('');
      setTimeout(() => setInviteMsg(null), 4000);
    } catch (err) {
      setInviteMsg('Failed to send invite');
    } finally {
      setInviteSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !messageInput.trim()) return;

    const text = messageInput.trim();
    setMessageInput('');
    setSendingMsg(true);
    try {
      const newMsg = await api.sendEventMessage(eventId, {
        userId: user.userId,
        userName: user.name || 'Student',
        text
      });
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const executeLeaveSquad = async () => {
    if (!user) return;
    setLeaving(true);
    try {
      await api.leaveEvent(eventId, user.userId);
      setConfirmAction(null);
      onClose();
    } catch (err) {
      console.error('Failed to leave squad:', err);
    } finally {
      setLeaving(false);
    }
  };

  const executeCancelEvent = async () => {
    if (!user) return;
    setCancelling(true);
    try {
      await api.cancelEvent(eventId, user.userId);
      setConfirmAction(null);
      onClose();
    } catch (err) {
      console.error('Failed to cancel event:', err);
    } finally {
      setCancelling(false);
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
  const isHost = user && squad.hostId === user.userId;
  const isMember = user && squad.members.some(m => m.userId === user.userId);
  const maxM = squad.maxMembers || 4;

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
        
        <button 
          onClick={onClose} 
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 p-1 text-white hover:text-cyber hover:bg-white/10 z-30 transition-colors"
        >
          <X size={22} />
        </button>
        
        {/* Header with Event Title & Status */}
        <div className="p-5 border-b-[2px] border-pixel-gray pr-14">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {squad.category && (
              <span className="font-mono text-[10px] bg-cyber text-black px-1.5 py-0.5 font-bold uppercase">
                {squad.category}
              </span>
            )}
            <span className="text-xs font-mono text-gray-400">
              HOST: <strong className="text-white">{squad.hostName || 'Aditya Sharma'}</strong>
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 ml-auto ${
              isLocked ? 'bg-cyber/20 text-cyber border border-cyber' : 'bg-white/10 text-white border border-white/40'
            }`}>
              {isLocked ? '[ CREW_LOCKED ]' : '[ ASSEMBLING ]'}
            </span>
          </div>

          <h2 className="text-2xl font-mono font-bold text-white leading-tight">
            {squad.title || 'Campus Impromptu Event'}
          </h2>

          {squad.description && (
            <p className="font-body text-xs text-gray-400 mt-1 line-clamp-2">
              {squad.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-3 text-xs font-mono border-t border-pixel-gray/40 pt-2 gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-cyber font-bold">
                {squad.members.length} / {maxM} SLOTS FILLED
              </span>
              {(squad.scheduledAt || squad.expiresAt) && (
                <span className="text-white font-mono text-[11px] flex items-center gap-1 bg-pixel-dark border border-white/40 px-2 py-0.5 font-bold shadow-sm">
                  <Calendar size={11} className="text-cyber" />
                  <span>{formatEventDateTime(squad.scheduledAt, squad.expiresAt)}</span>
                </span>
              )}
              {squad.locationName && (
                <span className="text-gray-300 font-mono text-[11px] flex items-center gap-1 bg-pixel-dark border border-pixel-gray px-1.5 py-0.5">
                  <MapPin size={11} className="text-cyber" />
                  <span>{squad.locationName}</span>
                </span>
              )}
              {squad.expiresAt && (
                <span className="text-gray-400 font-mono text-[10px] flex items-center gap-1" title="Expires">
                  <Clock size={10} />
                  <span>EXPIRES {new Date(squad.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              )}
            </div>

            {/* Tab switchers: Roster vs Chatroom */}
            <div className="flex gap-1 ml-auto">
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className={`font-mono text-xs px-2.5 py-1 border transition-colors flex items-center gap-1 ${
                  !showChat
                    ? 'bg-cyber text-black border-cyber font-bold'
                    : 'bg-obsidian text-gray-400 border-pixel-gray hover:text-white'
                }`}
              >
                <Users size={12} /> ROSTER
              </button>
              <button
                type="button"
                onClick={() => setShowChat(true)}
                className={`font-mono text-xs px-2.5 py-1 border transition-colors flex items-center gap-1 ${
                  showChat
                    ? 'bg-cyber text-black border-cyber font-bold'
                    : 'bg-obsidian text-gray-400 border-pixel-gray hover:text-white'
                }`}
              >
                <MessageSquare size={12} /> CHATROOM ({messages.length})
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Body: Either Squad Roster or Group Chat */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col">
          {showChat ? (
            /* GROUP CHAT VIEW */
            <div className="flex flex-col flex-1 min-h-[300px]">
              {squad.icebreaker && (
                <div className="border border-cyber/50 bg-cyber/10 p-3 mb-3 text-xs font-mono">
                  <div className="text-cyber font-bold flex items-center gap-1 mb-1">
                    <Sparkles size={13} /> AI ICEBREAKER PROMPT:
                  </div>
                  <div className="text-white">{squad.icebreaker}</div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 min-h-[220px] max-h-[340px]">
                {messages.length === 0 ? (
                  <div className="text-center py-10 font-mono text-xs text-gray-500">
                    No messages yet. Send a message to your squad below!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = user && m.userId === user.userId;
                    return (
                      <div
                        key={m.messageId}
                        className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 mb-0.5">
                          <span className={isMe ? 'text-cyber font-bold' : 'text-white font-bold'}>
                            {m.userName}
                          </span>
                          <span>• {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`p-2.5 font-mono text-xs border ${
                            isMe
                              ? 'bg-cyber text-black border-cyber font-bold'
                              : 'bg-pixel-dark text-white border-pixel-gray'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 mt-3 pt-3 border-t border-pixel-gray">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type message to squad..."
                  className="bg-obsidian border-[2px] border-pixel-gray p-2 text-white font-mono text-xs focus:border-cyber outline-none flex-1"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !messageInput.trim()}
                  className="bg-cyber text-black border-[2px] border-cyber font-mono text-xs font-bold px-4 py-2 hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Send size={13} />
                  SEND
                </button>
              </form>
            </div>
          ) : (
            /* SQUAD ROSTER VIEW */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {squad.members.map((m) => {
                  const isThisHost = m.userId === squad.hostId;
                  const isThisMe = user && m.userId === user.userId;

                  return (
                    <div
                      key={m.userId}
                      className={`border-[2px] p-3.5 flex items-start gap-3 bg-pixel-dark ${
                        isThisMe ? 'border-cyber shadow-pixel' : 'border-pixel-gray'
                      }`}
                    >
                      <div className="w-10 h-10 bg-white flex-shrink-0 flex items-center justify-center text-black font-mono font-bold text-lg border border-pixel-gray">
                        {m.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white text-sm truncate">{m.name || 'Anon'}</span>
                          {isThisHost && (
                            <span className="text-[9px] font-mono bg-cyber text-black px-1 font-bold">HOST</span>
                          )}
                          {isThisMe && (
                            <span className="text-[9px] font-mono border border-cyber text-cyber px-1 font-bold">YOU</span>
                          )}
                        </div>
                        <div className="text-xs text-cyber font-mono truncate">{m.major || 'Student'}</div>
                        {m.vibeSummary && (
                          <div 
                            className="text-[11px] text-gray-300 font-mono mt-0.5 line-clamp-1"
                            title={formatLikesSummary(m.vibeSummary)}
                          >
                            <span className="text-cyber font-bold">Likes:</span> {formatLikesSummary(m.vibeSummary).replace(/^Likes:\s*/i, '')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {!isLocked && Array.from({ length: Math.max(0, maxM - squad.members.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="border-[2px] border-dashed border-pixel-gray/60 p-3.5 flex items-center gap-3 bg-transparent opacity-60">
                    <div className="w-10 h-10 border border-pixel-gray flex-shrink-0 flex items-center justify-center text-pixel-gray font-mono">
                      ?
                    </div>
                    <div className="font-mono text-pixel-gray text-xs animate-pulse">
                      WAITING FOR SQUADMATE...
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Direct Invite Squadmate */}
              {!isLocked && (
                <div className="border border-pixel-gray bg-pixel-dark/80 p-3.5 mb-4">
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
                      {inviteSending ? 'SENDING...' : 'DISPATCH'}
                    </button>
                  </form>
                </div>
              )}

              {/* AI Icebreaker display */}
              {isLocked && squad.icebreaker && (
                <div className="border-[2px] border-cyber bg-cyber/5 p-4 relative mt-auto">
                  <div className="absolute -top-3 left-4 bg-cyber text-black font-mono text-xs font-bold px-2 py-0.5 flex items-center gap-1">
                    <Sparkles size={12} /> AI ICEBREAKER
                  </div>
                  <p className="font-body text-white text-sm leading-relaxed pt-2">
                    {squad.icebreaker}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="p-3.5 border-t-[2px] border-pixel-gray bg-pixel-dark flex justify-between items-center">
          <div>
            {isHost ? (
              <button
                type="button"
                onClick={() => setConfirmAction('cancel_event')}
                disabled={cancelling}
                className="font-mono text-xs text-red-400 hover:text-red-300 flex items-center gap-1 border border-red-500/40 px-2.5 py-1.5 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={13} />
                CANCEL EVENT
              </button>
            ) : isMember ? (
              <button
                type="button"
                onClick={() => setConfirmAction('leave_squad')}
                disabled={leaving}
                className="font-mono text-xs text-red-400 hover:text-red-300 flex items-center gap-1 border border-red-500/40 px-2.5 py-1.5 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={13} />
                LEAVE SQUAD
              </button>
            ) : null}
          </div>

          <div className="flex gap-2">
            {isLocked && (
              <button 
                onClick={() => setShowChat(!showChat)}
                className="bg-cyber text-black font-mono font-bold px-4 py-2 flex items-center gap-1.5 hover:bg-white transition-colors border-[2px] border-cyber text-xs"
              >
                <MessageSquare size={14} />
                {showChat ? 'VIEW ROSTER' : `SQUAD CHAT (${messages.length})`}
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-transparent text-white font-mono text-xs px-4 py-2 border border-pixel-gray hover:border-white transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Custom In-App Cyberpunk Confirmation Dialog */}
        {confirmAction && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-[70] p-4 animate-in fade-in duration-150">
            <div className="bg-obsidian border-[2px] border-red-500 w-full max-w-sm p-5 shadow-pixel relative flex flex-col gap-3.5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="absolute top-2.5 right-2.5 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2 border-b border-red-500/40 pb-2">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
                <h3 className="font-mono text-sm font-bold text-red-500 tracking-wider">
                  {confirmAction === 'cancel_event' ? '[ CANCEL EVENT ]' : '[ LEAVE SQUAD ]'}
                </h3>
              </div>

              <div className="font-mono text-xs text-gray-200 leading-relaxed">
                {confirmAction === 'cancel_event' ? (
                  <>
                    <p>
                      Are you sure you want to cancel <span className="text-cyber font-bold">"{squad.title}"</span>?
                    </p>
                    <div className="bg-pixel-dark border border-red-500/30 p-2.5 text-[11px] font-mono text-gray-300 mt-2.5">
                      ⚠️ This will remove the event from campus radar, notify all joined members, and dissolve the squad.
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      Are you sure you want to leave <span className="text-cyber font-bold">"{squad.title}"</span>?
                    </p>
                    <div className="bg-pixel-dark border border-pixel-gray p-2.5 text-[11px] font-mono text-gray-300 mt-2.5">
                      ℹ️ Your spot will be reopened to other students on campus.
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-pixel-gray">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  disabled={cancelling || leaving}
                  className="font-mono text-xs px-3 py-1.5 border border-pixel-gray hover:border-white text-gray-300 hover:text-white transition-colors"
                >
                  KEEP SQUAD
                </button>
                <button
                  type="button"
                  onClick={confirmAction === 'cancel_event' ? executeCancelEvent : executeLeaveSquad}
                  disabled={cancelling || leaving}
                  className="font-mono text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold border-[2px] border-red-400 shadow-pixel flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  {confirmAction === 'cancel_event' 
                    ? (cancelling ? 'CANCELLING...' : 'YES, CANCEL EVENT') 
                    : (leaving ? 'LEAVING...' : 'YES, LEAVE SQUAD')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
