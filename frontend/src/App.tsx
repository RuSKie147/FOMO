import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { VibeCheckModal } from './components/VibeCheckModal';
import { EventFeed } from './components/EventFeed';
import { CampusRadarMap } from './components/CampusRadarMap';
import { HostEventModal } from './components/HostEventModal';
import { SquadRoomModal } from './components/SquadRoomModal';
import { Plus } from 'lucide-react';

const AppContent = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'feed' | 'radar'>('feed');
  const [showHost, setShowHost] = useState(false);
  const [activeEvent, setActiveEvent] = useState<string | null>(null);

  if (!user) {
    return <AuthModal />;
  }

  if (!user.hasCompletedVibeCheck) {
    return <VibeCheckModal />;
  }

  return (
    <div className="min-h-screen pb-24">
      <Navbar currentView={view} setView={setView} />
      
      <main>
        {view === 'feed' ? (
          <EventFeed onJoinEvent={id => setActiveEvent(id)} />
        ) : (
          <CampusRadarMap onEventClick={id => setActiveEvent(id)} />
        )}
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowHost(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-cyber border-[2px] border-white shadow-pixel flex items-center justify-center hover:bg-white transition-colors z-40"
      >
        <Plus size={32} className="text-black" />
      </button>

      {showHost && (
        <HostEventModal 
          onClose={() => setShowHost(false)} 
          onSuccess={() => {
            setShowHost(false);
            setView('feed');
          }} 
        />
      )}
      
      {activeEvent && (
        <SquadRoomModal 
          eventId={activeEvent} 
          onClose={() => setActiveEvent(null)} 
        />
      )}
    </div>
  );
};

export const App = () => {
  return <AppContent />;
};
