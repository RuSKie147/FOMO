import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { VibeCheckModal } from './components/VibeCheckModal';
import { EventFeed } from './components/EventFeed';
import { CampusRadarMap } from './components/CampusRadarMap';
import { HostEventModal } from './components/HostEventModal';
import { SquadRoomModal } from './components/SquadRoomModal';
import { InvitationsModal } from './components/InvitationsModal';
import { Plus } from 'lucide-react';

const AppContent = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'feed' | 'radar'>('feed');
  const [showHost, setShowHost] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [urlInviteId, setUrlInviteId] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPendingInvites = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await api.getPendingInvitations(user.email);
      setPendingCount(res.count || 0);
    } catch (e) {
      // Ignore network errors in polling
    }
  }, [user?.email]);

  // Check URL query parameters for ?invite=token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    if (inviteParam) {
      setUrlInviteId(inviteParam);
      setShowInvitations(true);
    }
  }, []);

  // Poll for pending invitations
  useEffect(() => {
    if (!user) return;
    fetchPendingInvites();
    const interval = setInterval(fetchPendingInvites, 10000);
    return () => clearInterval(interval);
  }, [user, fetchPendingInvites, refreshKey]);

  if (!user) {
    return <AuthModal />;
  }

  if (!user.hasCompletedVibeCheck) {
    return <VibeCheckModal />;
  }

  const handleCloseInvitations = () => {
    setShowInvitations(false);
    setUrlInviteId(null);
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    fetchPendingInvites();
  };

  return (
    <div className="min-h-screen pb-24">
      <Navbar 
        currentView={view} 
        setView={setView} 
        onOpenInvitations={() => setShowInvitations(true)}
        pendingCount={pendingCount}
      />
      
      <main>
        {view === 'feed' ? (
          <EventFeed key={refreshKey} onJoinEvent={id => setActiveEvent(id)} />
        ) : (
          <CampusRadarMap key={refreshKey} onEventClick={id => setActiveEvent(id)} />
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
            setRefreshKey(k => k + 1);
            setView('feed');
            fetchPendingInvites();
          }} 
        />
      )}

      {showInvitations && (
        <InvitationsModal 
          initialInviteId={urlInviteId}
          onClose={handleCloseInvitations}
          onAccepted={(eventId) => {
            handleCloseInvitations();
            setActiveEvent(eventId);
            setRefreshKey(k => k + 1);
          }}
        />
      )}
      
      {activeEvent && (
        <SquadRoomModal 
          eventId={activeEvent} 
          onClose={() => {
            setActiveEvent(null);
            setRefreshKey(k => k + 1);
            fetchPendingInvites();
          }} 
        />
      )}
    </div>
  );
};

export const App = () => {
  return <AppContent />;
};
