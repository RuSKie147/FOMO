import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Mail, Plus, UserPlus, MapPin, Calendar } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CATEGORIES = ['STUDY', 'MUSIC', 'FITNESS', 'HACK', 'CHILL', 'FOOD'] as const;

interface HostEventModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const HostEventModal: React.FC<HostEventModalProps> = ({ onClose, onSuccess }) => {
  const { user, college } = useAuth();

  // Campus Center Coords
  const centerLat = college.code === 'DTU' ? 28.7499 : (college.code === 'IITD' ? 28.5450 : (college.code === 'NSUT' ? 28.6091 : 28.5458));
  const centerLng = college.code === 'DTU' ? 77.1170 : (college.code === 'IITD' ? 77.1926 : (college.code === 'NSUT' ? 77.0352 : 77.2733));

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<string>('CHILL');
  const [maxMembers, setMaxMembers] = useState<number>(4);

  // Dynamic Location State
  const [selectedLat, setSelectedLat] = useState<number>(centerLat);
  const [selectedLng, setSelectedLng] = useState<number>(centerLng);
  const [locationName, setLocationName] = useState<string>('Campus Grounds');

  // Date / Time & Expiration State
  const getInitialLocalDateTime = () => {
    const now = new Date(Date.now() + 15 * 60000);
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };
  const [scheduledAt, setScheduledAt] = useState<string>(getInitialLocalDateTime);
  const [durationHours, setDurationHours] = useState<number>(4);

  const setQuickTime = (type: 'now' | 'tonight7' | 'tonight9' | 'tomorrow6') => {
    const d = new Date();
    if (type === 'now') {
      d.setMinutes(d.getMinutes() + 15);
    } else if (type === 'tonight7') {
      d.setHours(19, 0, 0, 0);
      if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    } else if (type === 'tonight9') {
      d.setHours(21, 0, 0, 0);
      if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    } else if (type === 'tomorrow6') {
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
    }
    const offset = d.getTimezoneOffset() * 60000;
    setScheduledAt(new Date(d.getTime() - offset).toISOString().slice(0, 16));
  };

  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [currentEmailInput, setCurrentEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Landmarks per college
  const landmarks = [
    { name: 'Library', lat: centerLat + 0.0005, lng: centerLng + 0.0003 },
    { name: 'SAC Lawns', lat: centerLat - 0.0008, lng: centerLng - 0.0009 },
    { name: 'R&D Block', lat: centerLat - 0.0002, lng: centerLng - 0.0003 },
    { name: 'Canteen', lat: centerLat - 0.0013, lng: centerLng - 0.0003 },
    { name: 'Hostel Quad', lat: centerLat - 0.0006, lng: centerLng + 0.0009 },
  ];

  // Initialize mini Leaflet Map (Ola / Uber style centered pin)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const miniMap = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 17,
      minZoom: 15,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(miniMap);

    const onMapMove = () => {
      setIsMapMoving(true);
      const center = miniMap.getCenter();
      setSelectedLat(center.lat);
      setSelectedLng(center.lng);
    };

    const onMapMoveEnd = () => {
      setIsMapMoving(false);
      const center = miniMap.getCenter();
      setSelectedLat(center.lat);
      setSelectedLng(center.lng);
    };

    miniMap.on('movestart', () => setIsMapMoving(true));
    miniMap.on('move', onMapMove);
    miniMap.on('moveend', onMapMoveEnd);

    miniMap.on('click', (e: L.LeafletMouseEvent) => {
      miniMap.panTo(e.latlng, { animate: true });
    });

    mapInstanceRef.current = miniMap;

    // Invalidate size after modal render animation
    setTimeout(() => {
      miniMap.invalidateSize();
    }, 200);

    return () => {
      miniMap.remove();
      mapInstanceRef.current = null;
    };
  }, [centerLat, centerLng]);

  const handleSelectLandmark = (landmark: { name: string; lat: number; lng: number }) => {
    setSelectedLat(landmark.lat);
    setSelectedLng(landmark.lng);
    setLocationName(landmark.name);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([landmark.lat, landmark.lng], { animate: true });
    }
  };

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

    const userEmail = user?.email?.toLowerCase().trim();
    if (userEmail && email === userEmail) {
      setEmailError("You cannot invite yourself (you're already the host!)");
      return;
    }

    if (inviteEmails.includes(email)) {
      setEmailError('Email already added');
      return;
    }

    const maxAllowedInvites = Math.max(1, maxMembers - 1);
    if (inviteEmails.length >= maxAllowedInvites) {
      setEmailError(`Squad capacity allows max ${maxAllowedInvites} guests (Host takes 1 slot)`);
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
      // Calculate ISO expiration ensuring future timestamp
      const schedDate = new Date(scheduledAt);
      const schedIso = isNaN(schedDate.getTime()) ? new Date().toISOString() : schedDate.toISOString();
      const baseMs = Math.max(isNaN(schedDate.getTime()) ? Date.now() : schedDate.getTime(), Date.now());
      const expiresDate = new Date(baseMs + durationHours * 3600000);
      const expiresIso = expiresDate.toISOString();

      await api.createEvent({
        userId: user.userId,
        hostName: user.name || 'Aditya Sharma',
        title,
        description: desc,
        category,
        maxMembers,
        locationName: locationName.trim() || 'Campus Grounds',
        lat: selectedLat,
        lng: selectedLng,
        scheduledAt: schedIso,
        expiresAt: expiresIso,
        inviteEmails: inviteEmails
      });
      onSuccess();
    } catch (error) {
      console.error(error);
      setTimeout(() => onSuccess(), 1000);
    } finally {
      setLoading(false);
    }
  };

  // Preview computed expiration string
  const expirationPreview = (() => {
    try {
      const dt = new Date(scheduledAt);
      const baseMs = Math.max(isNaN(dt.getTime()) ? Date.now() : dt.getTime(), Date.now());
      const exp = new Date(baseMs + durationHours * 3600000);
      return exp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    } catch {
      return 'in ' + durationHours + ' hours';
    }
  })();

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-obsidian border-[2px] border-white w-full max-w-lg max-h-[92vh] flex flex-col shadow-pixel-white relative my-auto">
        <button onClick={onClose} className="absolute top-3 right-3 text-white hover:text-cyber z-10">
          <X size={24} />
        </button>
        
        {/* Modal Header */}
        <div className="p-5 border-b-[2px] border-pixel-gray flex justify-between items-center bg-pixel-dark/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
              [ INITIATE_CREW ]
            </h2>
            <p className="font-mono text-[10px] text-gray-400 mt-0.5">BROADCAST A CAMPUS SQUAD RADAR EVENT</p>
          </div>
          <span className="font-mono text-xs bg-cyber/15 border border-cyber text-cyber px-2.5 py-1 font-bold">
            {college.code}
          </span>
        </div>
        
        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          <div>
            <label className="font-mono text-xs text-cyber mb-1 block font-bold">TITLE</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={40}
              className="w-full bg-pixel-dark border-[2px] border-pixel-gray p-2.5 text-white focus:border-cyber outline-none font-mono text-base font-bold"
              placeholder="E.g., Late Night Hackathon Prep"
              required
            />
          </div>
          
          <div>
            <label className="font-mono text-xs text-cyber mb-1 block font-bold">CATEGORY</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`font-mono text-xs px-3 py-1 border-[2px] transition-colors
                    ${category === cat ? 'bg-white text-black border-white font-bold' : 'bg-transparent text-gray-400 border-pixel-gray hover:border-gray-400'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Squad Capacity Selection (2 to 10) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-mono text-xs text-cyber block font-bold">
                SQUAD CAPACITY
              </label>
              <span className="font-mono text-xs text-white font-bold bg-cyber/15 border border-cyber/50 px-2 py-0.5">
                {maxMembers} SLOTS ({maxMembers - 1} GUESTS + YOU)
              </span>
            </div>
            <div className="grid grid-cols-9 gap-1">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setMaxMembers(num);
                    if (inviteEmails.length > num - 1) {
                      setInviteEmails(prev => prev.slice(0, num - 1));
                    }
                  }}
                  className={`py-1.5 font-mono text-xs font-bold border-[2px] transition-colors text-center ${
                    maxMembers === num
                      ? 'bg-cyber text-black border-cyber'
                      : 'bg-pixel-dark text-gray-400 border-pixel-gray hover:border-white hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] text-gray-400 mt-1">
              Range: 2 to 10 members. Crew locks once {maxMembers} students join.
            </p>
          </div>

          {/* Interactive Campus Map Location Picker */}
          <div className="border border-pixel-gray/80 bg-pixel-dark/70 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs text-cyber font-bold flex items-center gap-1.5">
                <MapPin size={13} />
                <span>SELECT LOCATION</span>
              </label>
              <span className="font-mono text-[10px] text-gray-300">
                [{selectedLat.toFixed(4)}, {selectedLng.toFixed(4)}]
              </span>
            </div>

            {/* Mini Map Canvas with Centered Stationary Pin (Ola / Uber Style) */}
            <div className="h-40 w-full border-[2px] border-pixel-gray relative overflow-hidden bg-obsidian z-0 select-none">
              <div 
                ref={mapContainerRef} 
                className="h-full w-full cursor-grab active:cursor-grabbing"
              />

              {/* Stationary Center Pin (Ola/Uber Style) */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[450] flex flex-col items-center"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }}
              >
                {/* Pin Tooltip / Badge */}
                <div className={`font-mono text-[10px] font-bold px-2 py-0.5 border border-white shadow-pixel whitespace-nowrap transition-all duration-150 flex items-center gap-1 ${
                  isMapMoving 
                    ? 'bg-white text-black -translate-y-1.5 scale-105 shadow-lg' 
                    : 'bg-cyber text-black translate-y-0'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                  {isMapMoving ? 'PINNING SPOT...' : 'SQUAD SPOT'}
                </div>

                {/* Pin Stem & Pointer */}
                <div className="w-3 h-5 bg-cyber border-[2px] border-black flex items-center justify-center -mt-[1px]">
                  <div className="w-1 h-2 bg-black rounded-full" />
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-cyber -mt-0.5" />

                {/* Ground Target Shadow Dot */}
                <div className={`w-3 h-1.5 bg-black/70 rounded-full blur-[0.5px] transition-all duration-150 ${
                  isMapMoving ? 'scale-50 opacity-30 mt-1' : 'scale-100 opacity-90 mt-0.5'
                }`} />
              </div>

              {/* Center Crosshair Reference Dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-cyber/60 pointer-events-none z-[440]" />

              {/* Move Map Instruction Badge */}
              <div className="absolute bottom-1.5 right-2 pointer-events-none z-[450] font-mono text-[9px] bg-black/85 px-2 py-0.5 border border-pixel-gray text-gray-300">
                {isMapMoving ? 'ADJUSTING SPOT...' : 'PAN MAP TO MOVE PIN'}
              </div>
            </div>

            {/* Quick Landmark Presets */}
            <div className="flex flex-wrap gap-1 items-center pt-1">
              <span className="text-[10px] font-mono text-gray-400">Quick Spot:</span>
              {landmarks.map(lm => (
                <button
                  key={lm.name}
                  type="button"
                  onClick={() => handleSelectLandmark(lm)}
                  className={`text-[10px] font-mono px-1.5 py-0.5 border transition-colors ${
                    locationName === lm.name
                      ? 'bg-cyber text-black border-cyber font-bold'
                      : 'bg-obsidian border-pixel-gray text-gray-300 hover:border-white'
                  }`}
                >
                  {lm.name}
                </button>
              ))}
            </div>

            {/* Location Description Input */}
            <div className="mt-1">
              <label className="font-mono text-[10px] text-gray-400 mb-0.5 block">SPOT NAME / FLOOR / ROOM</label>
              <input 
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                maxLength={50}
                placeholder="e.g. 2nd Floor Library Quiet Wing, SAC Table 4"
                className="w-full bg-obsidian border-[2px] border-pixel-gray p-2 text-white font-mono text-xs focus:border-cyber outline-none"
              />
            </div>
          </div>

          {/* Date, Time & Expiration */}
          <div className="border border-pixel-gray/80 bg-pixel-dark/70 p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs text-cyber font-bold flex items-center gap-1.5">
                <Calendar size={13} />
                <span>DATE &amp; TIME</span>
              </label>
              <span className="font-mono text-[10px] text-gray-300">
                EXPIRES: {expirationPreview}
              </span>
            </div>

            {/* Quick Timing Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10px] text-gray-400">PRESETS:</span>
              <button
                type="button"
                onClick={() => setQuickTime('now')}
                className="font-mono text-[11px] bg-obsidian border border-pixel-gray hover:border-cyber hover:text-cyber px-2 py-0.5 text-gray-300 transition-colors"
              >
                In 15m
              </button>
              <button
                type="button"
                onClick={() => setQuickTime('tonight7')}
                className="font-mono text-[11px] bg-obsidian border border-pixel-gray hover:border-cyber hover:text-cyber px-2 py-0.5 text-gray-300 transition-colors"
              >
                Tonight (7 PM)
              </button>
              <button
                type="button"
                onClick={() => setQuickTime('tonight9')}
                className="font-mono text-[11px] bg-obsidian border border-pixel-gray hover:border-cyber hover:text-cyber px-2 py-0.5 text-gray-300 transition-colors"
              >
                Tonight (9 PM)
              </button>
              <button
                type="button"
                onClick={() => setQuickTime('tomorrow6')}
                className="font-mono text-[11px] bg-obsidian border border-pixel-gray hover:border-cyber hover:text-cyber px-2 py-0.5 text-gray-300 transition-colors"
              >
                Tomorrow (6 PM)
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="font-mono text-[10px] text-gray-400 mb-0.5 block">CUSTOM DATE &amp; TIME</label>
                <input 
                  type="datetime-local" 
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="w-full bg-obsidian border-[2px] border-pixel-gray p-2 text-white font-mono text-xs focus:border-cyber outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-gray-400 mb-0.5 block">DURATION (TTL)</label>
                <div className="flex gap-1">
                  {[1, 2, 4, 8, 24].map(hours => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDurationHours(hours)}
                      className={`px-2 py-1.5 font-mono text-xs border transition-colors ${
                        durationHours === hours
                          ? 'bg-cyber text-black border-cyber font-bold'
                          : 'bg-obsidian text-gray-400 border-pixel-gray hover:text-white'
                      }`}
                    >
                      {hours}H
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="font-mono text-xs text-cyber mb-1 block font-bold">DESCRIPTION &amp; PLAN</label>
            <textarea 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              maxLength={150}
              rows={2}
              className="w-full bg-pixel-dark border-[2px] border-pixel-gray p-2.5 text-white focus:border-cyber outline-none font-body text-xs resize-none"
              placeholder="What's the plan? What should crew bring?"
              required
            />
          </div>
          
          {/* Squadmate Invitations */}
          <div className="border border-pixel-gray/70 bg-pixel-dark/60 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs text-cyber font-bold flex items-center gap-1.5">
                <UserPlus size={13} />
                <span>INVITE SQUADMATES (EMAIL)</span>
              </label>
              <span className="font-mono text-[10px] text-gray-400">
                {inviteEmails.length}/{Math.max(1, maxMembers - 1)} SLOTS
              </span>
            </div>

            <div className="flex gap-2">
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
                className="flex-1 bg-obsidian border-[2px] border-pixel-gray p-2 text-white font-mono text-xs focus:border-cyber outline-none"
              />
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
                    className="inline-flex items-center gap-1.5 bg-black border border-cyber/60 text-white font-mono text-xs px-2 py-0.5"
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
            className="mt-1 bg-cyber text-black font-mono font-bold py-3 hover:bg-white transition-colors border-[2px] border-cyber disabled:opacity-50 tracking-wider shadow-pixel"
          >
            {loading 
              ? 'BROADCASTING TO CAMPUS RADAR...' 
              : (inviteEmails.length > 0 ? `BROADCAST & INVITE (${inviteEmails.length})` : 'BROADCAST CREW EVENT')}
          </button>
        </form>
      </div>
    </div>
  );
};
