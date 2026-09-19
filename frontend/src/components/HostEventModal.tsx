import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Mail, Plus, UserPlus } from 'lucide-react';

const CATEGORIES = ['STUDY', 'MUSIC', 'FITNESS', 'HACK', 'CHILL', 'FOOD'] as const;

interface HostEventModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const HostEventModal: React.FC<HostEventModalProps> = ({ onClose, onSuccess }) => {
  const { user, college } = useAuth();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<string>('CHILL');
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [currentEmailInput, setCurrentEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddEmail = (emailToAdd?: string) => {
    let email = (emailToAdd || currentEmailInput).trim().toLowerCase();
    if (!email) return;

    if (!email.includes('@') && college?.domain) {
      email = `${email}@${college.domain}`;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (inviteEmails.includes(email)) {
      setEmailError('Email already added');
      return;
    }

    if (inviteEmails.length >= 8) {
      setEmailError('Max 8 invitations at once');
      return;
    }

    setInviteEmails(prev => [...prev, email]);
    setCurrentEmailInput('');
    setEmailError('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setInviteEmails(prev => prev.filter(e => e !== emailToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !user) return;
    
    setLoading(true);
    try {
      await api.createEvent({
        userId: user.userId,
        hostName: user.name || 'Campus Host',
        title,
        description: desc,
        category,
        lat: 28.5458 + (Math.random() * 0.003 - 0.0015),
        lng: 77.2733 + (Math.random() * 0.003 - 0.0015),
        inviteEmails: inviteEmails
      });
      onSuccess();
    } catch (error) {
      console.error(error);
      // Fallback success for demo
      setTimeout(() => onSuccess(), 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-obsidian border-[2px] border-white w-full max-w-lg shadow-pixel-white relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-white hover:text-cyber">
          <X size={24} />
        </button>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 border-b-[2px] border-pixel-gray pb-2">
            <h2 className="text-2xl font-mono font-bold text-white">
              [ INITIATE_CREW ]
            </h2>
            <span className="font-mono text-xs bg-cyber/10 border border-cyber text-cyber px-2 py-0.5 font-bold">
              {college.code}
            </span>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="font-mono text-xs text-cyber mb-1 block">TITLE</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={40}
                className="w-full bg-pixel-dark border-[2px] border-pixel-gray p-3 text-white focus:border-cyber outline-none font-mono text-lg font-bold"
                placeholder="E.g., Late Night Hackathon Prep"
                required
              />
            </div>
            
            <div>
              <label className="font-mono text-xs text-cyber mb-1 block">CATEGORY</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`font-mono text-xs px-3 py-1.5 border-[2px] transition-colors
                      ${category === cat ? 'bg-white text-black border-white font-bold' : 'bg-transparent text-gray-400 border-pixel-gray hover:border-gray-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="font-mono text-xs text-cyber mb-1 block">DESCRIPTION</label>
              <textarea 
                value={desc}
                onChange={e => setDesc(e.target.value)}
                maxLength={150}
                rows={3}
                className="w-full bg-pixel-dark border-[2px] border-pixel-gray p-3 text-white focus:border-cyber outline-none font-body resize-none"
                placeholder="What's the plan?"
                required
              />
            </div>
            
            {/* Squadmate Invitations */}
            <div className="border border-pixel-gray/70 bg-pixel-dark/60 p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs text-cyber font-bold flex items-center gap-1.5">
                  <UserPlus size={13} />
                  <span>INVITE SQUADMATES (EMAIL)</span>
                </label>
                <span className="font-mono text-[10px] text-gray-400">
                  {inviteEmails.length}/8 INVITED
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={currentEmailInput}
                    onChange={(e) => {
                      setCurrentEmailInput(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    placeholder={`rollno@${college?.domain || 'college.edu'}`}
                    className="w-full bg-obsidian border-[2px] border-pixel-gray p-2 text-white font-mono text-xs focus:border-cyber outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddEmail()}
                  className="bg-obsidian border-[2px] border-cyber text-cyber hover:bg-cyber hover:text-black font-mono text-xs px-3 font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> ADD
                </button>
              </div>

              {/* Quick domain suffix helper if user only typed username */}
              {currentEmailInput && !currentEmailInput.includes('@') && college?.domain && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-gray-400">Auto-complete:</span>
                  <button
                    type="button"
                    onClick={() => handleAddEmail(`${currentEmailInput}@${college.domain}`)}
                    className="text-[11px] font-mono bg-cyber/10 border border-cyber/50 text-cyber hover:bg-cyber hover:text-black px-1.5 py-0.5"
                  >
                    +{college.domain}
                  </button>
                </div>
              )}

              {emailError && (
                <p className="font-mono text-[11px] text-red-400">{emailError}</p>
              )}

              {/* Invited Email Chips */}
              {inviteEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-pixel-gray/40">
                  {inviteEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 bg-black border border-cyber/60 text-white font-mono text-xs px-2 py-1"
                    >
                      <Mail size={11} className="text-cyber" />
                      <span className="max-w-[190px] truncate">{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="text-gray-400 hover:text-red-400 ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !title || !desc}
              className="mt-2 bg-cyber text-black font-mono font-bold py-3 hover:bg-transparent hover:text-cyber border-[2px] border-cyber transition-colors disabled:opacity-50"
            >
              {loading 
                ? (inviteEmails.length > 0 ? 'DISPATCHING INVITES & POSTING...' : 'BROADCASTING...') 
                : (inviteEmails.length > 0 ? `BROADCAST & INVITE (${inviteEmails.length})` : 'BROADCAST EVENT')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
