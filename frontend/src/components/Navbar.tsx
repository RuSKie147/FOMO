import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Map, List, X, Sparkles, RefreshCw, Mail } from 'lucide-react';

interface NavbarProps {
  currentView: 'feed' | 'radar';
  setView: (view: 'feed' | 'radar') => void;
  onOpenInvitations: () => void;
  pendingCount?: number;
}

const INTEREST_OPTIONS = [
  'Coding & Hackathons',
  'Music & Jamming',
  'Sports & Fitness',
  'Art & Design',
  'Food & Cafes',
  'Late-Night Owl',
  'Study Groups',
  'Startups & AI'
];

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, onOpenInvitations, pendingCount = 0 }) => {
  const { user, logout, updateUser } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editMajor, setEditMajor] = useState(user?.major || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditName(user?.name || '');
    setEditMajor(user?.major || '');
    if (user?.vibeSummary) {
      const matched = INTEREST_OPTIONS.filter(opt => 
        user.vibeSummary?.toLowerCase().includes(opt.toLowerCase().split(' ')[0])
      );
      setSelectedInterests(matched.length > 0 ? matched : [INTEREST_OPTIONS[0]]);
    } else {
      setSelectedInterests([INTEREST_OPTIONS[0]]);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileOpen]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter(i => i !== interest));
      }
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const newSummary = selectedInterests.join(', ') || user?.vibeSummary || 'Campus Explorer';
    try {
      if (user?.userId) {
        await api.submitVibeCheck(user.userId, [
          selectedInterests.join(' '),
          editMajor,
          editName,
          'Active campus student',
          'Collaborative crew member'
        ]);
      }
    } catch (e) {
      console.warn('Vibe check API save fallback', e);
    }
    if (updateUser) {
      updateUser({ 
        name: editName, 
        major: editMajor,
        vibeSummary: newSummary
      });
    }
    setIsSaving(false);
    setIsProfileOpen(false);
  };

  const handleRetakeVibeCheck = () => {
    if (updateUser) {
      updateUser({ hasCompletedVibeCheck: false });
    }
    setIsProfileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-obsidian border-b-[2px] border-white relative">
      <div className="flex justify-between items-center p-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-cyber text-black font-mono font-bold text-xl px-2 py-1 shadow-pixel">FOMO</div>
        </div>
        
        <nav className="flex gap-4">
          <button 
            onClick={() => setView('feed')}
            className={`font-mono font-bold text-sm flex items-center gap-1 ${currentView === 'feed' ? 'text-cyber' : 'text-white'}`}
          >
            <List size={16} /> FEED
          </button>
          <button 
            onClick={() => setView('radar')}
            className={`font-mono font-bold text-sm flex items-center gap-1 ${currentView === 'radar' ? 'text-cyber' : 'text-white'}`}
          >
            <Map size={16} /> RADAR
          </button>
        </nav>
        
        <div className="flex items-center gap-3">
          {user && (
            <button 
              onClick={onOpenInvitations}
              className={`font-mono font-bold text-xs flex items-center gap-1.5 px-3 py-1.5 border-[2px] transition-all ${
                pendingCount > 0
                  ? 'border-cyber bg-cyber/15 text-cyber shadow-pixel animate-pulse'
                  : 'border-pixel-gray text-gray-400 hover:border-white hover:text-white bg-obsidian'
              }`}
              title="Squad Invitations"
            >
              <Mail size={14} className={pendingCount > 0 ? 'text-cyber' : 'text-gray-400'} />
              <span className="hidden sm:inline">INVITES</span>
              {pendingCount > 0 && (
                <span className="bg-cyber text-black px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-sm">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          <div className="relative" ref={dropdownRef}>
            {user && (
              <>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)} 
                  className="flex items-center gap-2 border-[2px] border-white px-3 py-1 rounded-full hover:border-cyber hover:text-cyber transition-colors"
                >
                <div className="w-6 h-6 rounded-full bg-cyber flex items-center justify-center text-black font-bold text-xs">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="font-mono text-xs hidden sm:block">{user.name?.split(' ')[0] || 'User'}</span>
              </button>
              
              {isProfileOpen && (
                <div className="absolute top-full mt-4 right-0 w-80 max-h-[85vh] overflow-y-auto bg-pixel-dark border-[2px] border-white shadow-pixel p-4 z-50 text-white flex flex-col gap-3.5">
                  <div className="flex justify-between items-start border-b border-pixel-gray pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyber flex items-center justify-center text-black font-bold text-lg border-[2px] border-white">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold font-mono">{user.name || 'User'}</span>
                        <span className="text-xs text-gray-400 font-mono truncate max-w-[160px]">{user.email}</span>
                      </div>
                    </div>
                    <button onClick={() => setIsProfileOpen(false)} className="text-gray-400 hover:text-white">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-xs text-cyber font-bold">NAME</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-obsidian border-[2px] border-pixel-gray focus:border-cyber outline-none font-mono text-xs px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-xs text-cyber font-bold">MAJOR / BRANCH</label>
                    <input 
                      type="text" 
                      value={editMajor}
                      onChange={(e) => setEditMajor(e.target.value)}
                      placeholder="e.g. CS Major, Design, etc."
                      className="bg-obsidian border-[2px] border-pixel-gray focus:border-cyber outline-none font-mono text-xs px-2.5 py-1.5 text-white"
                    />
                  </div>

                  {/* Interests customizer */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-xs text-cyber font-bold flex items-center gap-1">
                        <Sparkles size={12} /> CAMPUS INTERESTS
                      </label>
                      <span className="text-[10px] text-gray-400 font-mono">{selectedInterests.length} SELECTED</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {INTEREST_OPTIONS.map((interest) => {
                        const isSelected = selectedInterests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={`text-[11px] font-mono px-2 py-1 border transition-all ${
                              isSelected
                                ? 'bg-cyber text-black border-cyber font-bold'
                                : 'bg-obsidian text-gray-300 border-pixel-gray hover:border-gray-400'
                            }`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Retake Vibe Check button */}
                  <button
                    type="button"
                    onClick={handleRetakeVibeCheck}
                    className="w-full flex items-center justify-center gap-1.5 bg-obsidian border border-cyber/50 hover:border-cyber text-cyber font-mono text-xs py-2 transition-colors mt-1"
                  >
                    <RefreshCw size={13} />
                    <span>RE-TAKE 5-STEP VIBE CHECK</span>
                  </button>

                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-cyber text-black font-mono font-bold py-2 border-[2px] border-white hover:bg-[#a3e600] disabled:opacity-50"
                  >
                    {isSaving ? 'SAVING VIBE...' : 'SAVE PROFILE'}
                  </button>

                  <button 
                    onClick={logout}
                    className="text-red-500 font-mono text-xs font-bold border border-red-500/60 py-1.5 hover:bg-red-500 hover:text-black transition-colors"
                  >
                    LOGOUT
                  </button>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>
      <div className="h-1 bg-cyber w-full"></div>
    </header>
  );
};
