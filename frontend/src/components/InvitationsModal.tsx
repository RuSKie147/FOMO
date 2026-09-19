import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EventInvitation } from '../types';
import { X, Mail, Check, AlertCircle, Sparkles } from 'lucide-react';

interface InvitationsModalProps {
  onClose: () => void;
  onAccepted: (eventId: string) => void;
  initialInviteId?: string | null;
}

export const InvitationsModal: React.FC<InvitationsModalProps> = ({ onClose, onAccepted, initialInviteId }) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<EventInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'debug_sent'>('pending');
  const [recentSent, setRecentSent] = useState<any[]>([]);

  const fetchInvitations = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPendingInvitations(user.email);
      setInvitations(res.invitations || []);

      // If initialInviteId is passed from URL, fetch its details if not in list
      if (initialInviteId && !(res.invitations || []).some((i: EventInvitation) => i.inviteId === initialInviteId)) {
        try {
          const directInvite = await api.getInvitation(initialInviteId);
          if (directInvite && directInvite.status === 'PENDING') {
            setInvitations(prev => [directInvite, ...prev]);
          }
        } catch (e) {
          console.warn('Could not load specific invite from URL', e);
        }
      }
    } catch (e) {
      console.error('Failed to fetch pending invitations', e);
      setError('Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSent = async () => {
    try {
      const data = await api.getRecentSentEmails();
      setRecentSent(data.sentEmails || []);
    } catch (e) {
      console.warn('Failed to fetch recent sent emails', e);
    }
  };

  useEffect(() => {
    fetchInvitations();
    fetchRecentSent();
  }, [user?.email, initialInviteId]);

  const handleAccept = async (invite: EventInvitation) => {
    if (!user) return;
    setActionLoading(invite.inviteId);
    setError(null);
    try {
      await api.acceptInvitation(invite.inviteId, {
        userId: user.userId,
        name: user.name || 'Student',
        major: user.major || 'Undeclared',
        vibeSummary: user.vibeSummary || 'Ready to vibe'
      });
      // Remove from list
      setInvitations(prev => prev.filter(i => i.inviteId !== invite.inviteId));
      onAccepted(invite.eventId);
    } catch (err: any) {
      console.error('Failed to accept invitation', err);
      setError(err?.message || 'Failed to accept invitation. Squad might be full.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      await api.declineInvitation(inviteId);
      setInvitations(prev => prev.filter(i => i.inviteId !== inviteId));
    } catch (err) {
      console.error('Failed to decline invitation', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-obsidian border-[2px] border-white w-full max-w-lg shadow-pixel-white relative flex flex-col max-h-[85vh]">
        <button onClick={onClose} className="absolute top-2 right-2 text-white hover:text-cyber z-10">
          <X size={24} />
        </button>

        <div className="p-5 border-b-[2px] border-pixel-gray">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="text-cyber" size={20} />
            <h2 className="text-xl font-mono font-bold text-white">
              [ SQUAD_INVITATIONS ]
            </h2>
          </div>
          <p className="font-mono text-xs text-gray-400">
            Invitations addressed to: <span className="text-cyber font-bold">{user?.email}</span>
          </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setActiveTab('pending')}
              className={`font-mono text-xs px-3 py-1 border transition-colors ${
                activeTab === 'pending'
                  ? 'bg-cyber text-black border-cyber font-bold'
                  : 'bg-obsidian text-gray-400 border-pixel-gray hover:text-white'
              }`}
            >
              PENDING ({invitations.length})
            </button>
            <button
              onClick={() => setActiveTab('debug_sent')}
              className={`font-mono text-xs px-3 py-1 border transition-colors ${
                activeTab === 'debug_sent'
                  ? 'bg-cyber text-black border-cyber font-bold'
                  : 'bg-obsidian text-gray-400 border-pixel-gray hover:text-white'
              }`}
            >
              OUTBOX LOGS ({recentSent.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-2.5 bg-red-950/80 border border-red-500 flex items-center gap-2 text-red-200 font-mono text-xs">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
          {activeTab === 'pending' ? (
            loading ? (
              <div className="py-12 text-center font-mono text-sm text-gray-400 animate-pulse">
                SCANNING SQUAD FREQUENCIES...
              </div>
            ) : invitations.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 border border-pixel-gray flex items-center justify-center text-gray-500">
                  <Mail size={24} />
                </div>
                <div className="font-mono text-sm text-gray-300 font-bold">NO PENDING INVITATIONS</div>
                <p className="font-mono text-xs text-gray-500 max-w-xs">
                  When a classmate invites your email when creating a crew or via squad room, it will appear right here!
                </p>
              </div>
            ) : (
              invitations.map((invite) => (
                <div
                  key={invite.inviteId}
                  className="bg-pixel-dark border-[2px] border-pixel-gray p-4 hover:border-cyber transition-colors flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] bg-cyber/15 border border-cyber text-cyber px-1.5 py-0.2 font-bold">
                          {invite.eventCategory}
                        </span>
                        <span className="font-mono text-xs text-gray-400">
                          by <strong className="text-white">{invite.hostName || 'Host'}</strong>
                        </span>
                      </div>
                      <h3 className="font-mono font-bold text-white text-base">
                        {invite.eventTitle}
                      </h3>
                      {invite.eventDescription && (
                        <p className="font-mono text-xs text-gray-400 mt-1 line-clamp-2">
                          {invite.eventDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-pixel-gray/50 pt-3 gap-2">
                    <span className="font-mono text-[10px] text-gray-500">
                      TOKEN: {invite.inviteId.slice(0, 8)}...
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecline(invite.inviteId)}
                        disabled={actionLoading === invite.inviteId}
                        className="font-mono text-xs px-3 py-1.5 border border-red-500/60 text-red-400 hover:bg-red-500 hover:text-black transition-colors disabled:opacity-50"
                      >
                        DECLINE
                      </button>
                      <button
                        onClick={() => handleAccept(invite)}
                        disabled={actionLoading === invite.inviteId}
                        className="font-mono text-xs font-bold px-4 py-1.5 bg-cyber text-black border border-cyber hover:bg-white transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <Check size={14} />
                        {actionLoading === invite.inviteId ? 'JOINING...' : 'ACCEPT & JOIN'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Outbox Log Tab (useful for demo & testing mock email dispatch) */
            <div className="flex flex-col gap-3">
              <div className="text-[11px] font-mono text-gray-400 border-b border-pixel-gray pb-2 flex items-center justify-between">
                <span>SIMULATED EMAIL DISPATCH OUTBOX</span>
                <span className="text-cyber">{recentSent.length} EMAILS DISPATCHED</span>
              </div>
              {recentSent.length === 0 ? (
                <p className="text-center font-mono text-xs text-gray-500 py-8">
                  No emails have been dispatched during this session yet.
                </p>
              ) : (
                recentSent.map((mail, idx) => (
                  <div key={idx} className="bg-obsidian border border-pixel-gray p-3 flex flex-col gap-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center text-gray-400 text-[10px]">
                      <span>TO: <strong className="text-white">{mail.to}</strong></span>
                      <span className="text-cyber">[{mail.mode || 'LOCAL_MOCK'}]</span>
                    </div>
                    <div className="text-white font-bold">{mail.subject}</div>
                    <div className="text-[11px] text-gray-300 break-all bg-pixel-dark p-2 border border-pixel-gray/40">
                      Link: <span className="text-cyber">{mail.inviteLink}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="p-3 border-t-[2px] border-pixel-gray bg-pixel-dark flex justify-between items-center text-xs font-mono text-gray-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Sparkles size={12} className="text-cyber" /> Direct token links auto-accept on visit
          </span>
          <button
            onClick={() => { fetchInvitations(); fetchRecentSent(); }}
            className="text-cyber hover:underline text-xs"
          >
            [ REFRESH ]
          </button>
        </div>
      </div>
    </div>
  );
};
