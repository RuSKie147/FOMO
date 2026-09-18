import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Map, List } from 'lucide-react';

interface NavbarProps {
  currentView: 'feed' | 'radar';
  setView: (view: 'feed' | 'radar') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const { user, college, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-obsidian border-b-[2px] border-white">
      <div className="flex justify-between items-center p-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-cyber text-black font-mono font-bold text-xl px-2 py-1 shadow-pixel">FOMO</div>
          <div className="hidden sm:flex items-center gap-1.5 border border-cyber/50 bg-cyber/10 px-2 py-0.5 text-[11px] font-mono text-cyber">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber animate-pulse"></span>
            <span className="font-bold">{college.code}</span>
          </div>
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
            <button onClick={logout} className="flex items-center gap-2 border-[2px] border-white px-3 py-1 rounded-full hover:border-cyber hover:text-cyber transition-colors">
              <div className="w-6 h-6 rounded-full bg-cyber flex items-center justify-center text-black font-bold text-xs">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="font-mono text-xs hidden sm:block">{user.name?.split(' ')[0] || 'User'}</span>
            </button>
          )}
        </div>
      </div>
      <div className="h-1 bg-cyber w-full"></div>
    </header>
  );
};
