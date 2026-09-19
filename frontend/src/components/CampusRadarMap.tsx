import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CampusEvent } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Compass, 
  Crosshair, 
  ExternalLink, 
  MapPin
} from 'lucide-react';

interface CampusRadarMapProps {
  onEventClick: (id: string) => void;
}

const IIITD_CENTER = {
  lat: 28.5458,
  lng: 77.2733,
  zoom: 17,
  name: 'IIIT Delhi Campus',
  address: 'Okhla Industrial Estate, Phase III, Near Govindpuri Metro Station, New Delhi 110020'
};


export const CampusRadarMap: React.FC<CampusRadarMapProps> = ({ onEventClick }) => {
  const { user, college } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayersRef = useRef<{ satellite: L.TileLayer; osm: L.TileLayer } | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radarCircleRef = useRef<L.Circle | null>(null);

  const [activeTile, setActiveTile] = useState<'osm' | 'satellite'>('osm');
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [currentCoords, setCurrentCoords] = useState({ lat: IIITD_CENTER.lat, lng: IIITD_CENTER.lng });
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 1. Fetch Events
  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        if (user) {
          const res = await api.getFeed(user.userId, IIITD_CENTER.lat, IIITD_CENTER.lng);
          if (isMounted && res.events && res.events.length > 0) {
            const domainFiltered = res.events.filter((ev: CampusEvent) => !ev.domain || ev.domain === college.domain);
            setEvents(domainFiltered);
            return;
          }
        }
      } catch (e) {
        // Fallback below
      }
      if (isMounted) {
        // Indian college student demo events (50:50 gender ratio)
        const now = new Date();
        const schedTime = (hoursFromNow: number) => new Date(now.getTime() + hoursFromNow * 3600000).toISOString();
        const expTime = (hoursFromNow: number) => new Date(now.getTime() + (hoursFromNow + 4) * 3600000).toISOString();

        setEvents([
          {
            eventId: 'evt-iiitd-1',
            hostId: 'h1',
            hostName: 'Kabir Malhotra',
            title: 'Indie Jam Session & Synth Hangout',
            description: 'Bringing my Korg synth to the SAC lawns. Need vocalists and acoustic guitar.',
            category: 'MUSIC',
            locationName: 'SAC Lawns',
            lat: 28.5448,
            lng: 77.2724,
            memberCount: 3,
            maxMembers: 4,
            status: 'ACTIVE',
            similarityScore: 0.95,
            distanceKm: 0.1,
            scheduledAt: schedTime(2),
            expiresAt: expTime(2),
            createdAt: new Date().toISOString()
          },
          {
            eventId: 'evt-iiitd-2',
            hostId: 'h2',
            hostName: 'Ananya Sharma',
            title: 'Midnight Hackathon Sprint',
            description: 'Grinding AI models on 4th floor R&D lab. Red bull provided.',
            category: 'HACK',
            locationName: 'R&D Block 4th Floor',
            lat: 28.5456,
            lng: 77.2730,
            memberCount: 2,
            maxMembers: 4,
            status: 'ACTIVE',
            similarityScore: 0.88,
            distanceKm: 0.1,
            scheduledAt: schedTime(4),
            expiresAt: expTime(4),
            createdAt: new Date().toISOString()
          },
          {
            eventId: 'evt-iiitd-3',
            hostId: 'h3',
            hostName: 'Aarav Mehta',
            title: 'Lo-Fi Study Group @ Library',
            description: 'Quiet study grind for midsems. 2nd floor library quiet room.',
            category: 'STUDY',
            locationName: 'Library 2nd Floor',
            lat: 28.5463,
            lng: 77.2736,
            memberCount: 1,
            maxMembers: 4,
            status: 'ACTIVE',
            similarityScore: 0.81,
            distanceKm: 0.1,
            scheduledAt: schedTime(6),
            expiresAt: expTime(6),
            createdAt: new Date().toISOString()
          },
          {
            eventId: 'evt-iiitd-4',
            hostId: 'h4',
            hostName: 'Priya Patel',
            title: 'Chai & Maggi Evening Crawl',
            description: 'Taking a study break to hit the canteen outside gate 1.',
            category: 'FOOD',
            locationName: 'Cafeteria Gate 1',
            lat: 28.5445,
            lng: 77.2730,
            memberCount: 4,
            maxMembers: 4,
            status: 'CREW_LOCKED',
            similarityScore: 0.72,
            distanceKm: 0.2,
            scheduledAt: schedTime(8),
            expiresAt: expTime(8),
            createdAt: new Date().toISOString()
          },
          {
            eventId: 'evt-iiitd-5',
            hostId: 'h5',
            hostName: 'Rohan Gupta',
            title: 'Campus 5K Evening Run',
            description: 'Perimeter jogging around boys hostel and academic perimeter.',
            category: 'FITNESS',
            locationName: 'Perimeter Track',
            lat: 28.5452,
            lng: 77.2742,
            memberCount: 2,
            maxMembers: 4,
            status: 'ACTIVE',
            similarityScore: 0.65,
            distanceKm: 0.2,
            scheduledAt: schedTime(10),
            expiresAt: expTime(10),
            createdAt: new Date().toISOString()
          },
          {
            eventId: 'evt-iiitd-6',
            hostId: 'h6',
            hostName: 'Rhea Sen',
            title: 'Figma Design Sprint',
            description: 'Redesigning student portal UI together. Beginners welcome to shadow.',
            category: 'HACK',
            locationName: 'Old Academic Block',
            lat: 28.5459,
            lng: 77.2728,
            memberCount: 2,
            maxMembers: 4,
            status: 'ACTIVE',
            similarityScore: 0.78,
            distanceKm: 0.1,
            scheduledAt: schedTime(12),
            expiresAt: expTime(12),
            createdAt: new Date().toISOString()
          }
        ]);
      }
    };
    loadEvents();
    return () => { isMounted = false; };
  }, [user, college.domain]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [IIITD_CENTER.lat, IIITD_CENTER.lng],
      zoom: IIITD_CENTER.zoom,
      minZoom: 15,
      maxZoom: 19,
      zoomControl: false
    });

    // Custom Zoom controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Pre-create base tile layers: Streets (OSM default) & Satellite (ArcGIS)
    const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: '&copy; Esri, Maxar, Earthstar Geographics'
    });

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    baseLayersRef.current = {
      satellite: satLayer,
      osm: osmLayer
    };

    // 250m Campus Perimeter Radar Circle
    const radarCircle = L.circle([IIITD_CENTER.lat, IIITD_CENTER.lng], {
      radius: 250,
      color: '#B8FF00',
      fillColor: '#B8FF00',
      fillOpacity: 0.05,
      weight: 1.5,
      dashArray: '6, 8'
    }).addTo(map);

    // Inner 120m Core Zone
    L.circle([IIITD_CENTER.lat, IIITD_CENTER.lng], {
      radius: 120,
      color: '#B8FF00',
      fillColor: 'transparent',
      weight: 1,
      dashArray: '3, 6',
      opacity: 0.6
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersGroup;
    radarCircleRef.current = radarCircle;

    // Track mouse coordinates
    map.on('mousemove', (e) => {
      setCurrentCoords({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5))
      });
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      baseLayersRef.current = null;
    };
  }, []);

  // 3. Switch Tile Layer cleanly between Streets and Satellite
  const handleTileSwitch = (tileKey: 'osm' | 'satellite') => {
    setActiveTile(tileKey);
    const map = mapInstanceRef.current;
    const layers = baseLayersRef.current;
    if (!map || !layers) return;

    // Remove existing base layers
    if (map.hasLayer(layers.satellite)) map.removeLayer(layers.satellite);
    if (map.hasLayer(layers.osm)) map.removeLayer(layers.osm);

    // Add selected layer
    map.addLayer(layers[tileKey]);

    // Ensure radar circles and markers stay on top
    if (radarCircleRef.current) radarCircleRef.current.bringToFront();
    if (markersLayerRef.current) (markersLayerRef.current as any).bringToFront?.();

    map.invalidateSize();
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  };

  // 4. Update Markers (Landmarks + Events)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Event Markers
    const filtered = selectedCategory === 'ALL' 
      ? events 
      : events.filter(e => e.category === selectedCategory);

    filtered.forEach((ev) => {
      const isLocked = ev.status === 'CREW_LOCKED';
      const rawScore = ev.similarityScore !== undefined ? ev.similarityScore : 0.75;
      const score = Math.max(12, Math.min(99, Math.round(rawScore * 100)));

      const eventIcon = L.divIcon({
        className: 'custom-event-marker',
        html: `
          <div class="cursor-pointer group/pin relative flex flex-col items-center pointer-events-auto">
            <div class="relative flex items-center justify-center w-8 h-8">
              <span class="absolute inline-flex h-full w-full rounded-full ${isLocked ? 'bg-white' : 'bg-cyber'} opacity-50 animate-ping"></span>
              <div class="relative w-4 h-4 rounded-full ${isLocked ? 'bg-white' : 'bg-cyber'} border-[2px] border-black shadow-[0_0_12px_${isLocked ? '#ffffff' : '#B8FF00'}] flex items-center justify-center">
                <span class="w-1.5 h-1.5 bg-black rounded-full"></span>
              </div>
            </div>
            
            <div class="bg-obsidian border-[2px] ${isLocked ? 'border-white text-white' : 'border-cyber text-cyber'} px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-pixel -mt-1 whitespace-nowrap flex items-center gap-1">
              <span>[${ev.category}]</span>
              <span>${score}%</span>
            </div>
          </div>
        `,
        iconSize: [80, 50],
        iconAnchor: [40, 25]
      });

      const marker = L.marker([ev.lat, ev.lng], { icon: eventIcon });

      // Interactive Cyberpunk Popup
      const popupHtml = `
        <div class="bg-obsidian border-[2px] border-cyber p-3 min-w-[220px] font-mono text-white shadow-pixel">
          <div class="flex justify-between items-start mb-2 border-b border-pixel-gray pb-1.5">
            <span class="text-[10px] bg-cyber text-black px-1.5 py-0.5 font-bold">[ ${ev.category} ]</span>
            <span class="text-[10px] text-cyber border border-cyber px-1">${score}% MATCH</span>
          </div>
          <div class="font-bold text-sm text-white mb-1 leading-snug">${ev.title}</div>
          <div class="text-[11px] text-gray-400 mb-2.5 font-body line-clamp-2">${ev.description}</div>
          <div class="flex items-center justify-between text-[10px] text-gray-400 border-t border-pixel-gray pt-2">
            <span>MEMBERS: <strong class="text-white">${ev.memberCount || 1}/${ev.maxMembers || 4}</strong></span>
            <span>${ev.locationName || (ev.distanceKm ? `~${ev.distanceKm} KM` : 'CAMPUS')}</span>
          </div>
          <button 
            id="join-btn-${ev.eventId}" 
            class="w-full mt-2.5 bg-cyber text-black font-bold font-mono text-xs py-1.5 border-[2px] border-cyber hover:bg-transparent hover:text-cyber transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            ⚡ JOIN SQUAD
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-cyber-popup',
        closeButton: true,
        maxWidth: 280
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`join-btn-${ev.eventId}`);
        if (btn) {
          btn.onclick = () => {
            onEventClick(ev.eventId);
          };
        }
      });

      marker.addTo(markersGroup);
    });
  }, [events, selectedCategory, onEventClick]);

  // Recenter helper
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([IIITD_CENTER.lat, IIITD_CENTER.lng], IIITD_CENTER.zoom, {
        duration: 1.2
      });
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(college.fullName)}`;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 py-8 flex flex-col min-h-[calc(100vh-100px)]">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b-[2px] border-white pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-2xl text-white font-bold tracking-tight">[ {college.code}_CAMPUS_RADAR ]</h2>
          </div>
          <p className="font-mono text-xs text-gray-400 mt-1 flex items-center gap-1.5">
            <Compass size={13} className="text-cyber" />
            <span>{college.tagline}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tile Layer Selector: Streets (Primary) & Satellite */}
          <div className="border-[2px] border-pixel-gray flex bg-obsidian">
            <button
              onClick={() => handleTileSwitch('osm')}
              className={`px-3 py-1 font-mono text-xs font-bold transition-colors ${
                activeTile === 'osm' ? 'bg-cyber text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              STREETS
            </button>
            <button
              onClick={() => handleTileSwitch('satellite')}
              className={`px-3 py-1 font-mono text-xs font-bold transition-colors ${
                activeTile === 'satellite' ? 'bg-cyber text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              SATELLITE
            </button>
          </div>

          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            className="border-[2px] border-white bg-obsidian text-white hover:bg-white hover:text-black px-2.5 py-1 font-mono text-xs font-bold flex items-center gap-1 transition-colors"
            title="Recenter map to campus"
          >
            <Crosshair size={13} />
            <span>CAMPUS</span>
          </button>

          {/* External Google Maps Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-[2px] border-cyber bg-obsidian text-cyber hover:bg-cyber hover:text-black px-2.5 py-1 font-mono text-xs font-bold flex items-center gap-1 transition-colors shadow-pixel"
            title="Open exact location in Google Maps"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">GOOGLE MAPS</span>
          </a>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 scrollbar-hide text-xs font-mono">
        <span className="text-gray-500 text-[10px] mr-1">FILTER:</span>
        {['ALL', 'HACK', 'MUSIC', 'STUDY', 'FOOD', 'FITNESS', 'CHILL'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-0.5 border-[2px] transition-colors whitespace-nowrap font-bold ${
              selectedCategory === cat
                ? 'bg-white text-black border-white'
                : 'bg-obsidian text-gray-400 border-pixel-gray hover:border-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="ml-auto text-gray-500 text-[11px] hidden md:inline">
          {events.length} ACTIVE CREWS DETECTED
        </span>
      </div>

      {/* Map Canvas Container */}
      <div className="flex-1 min-h-[520px] border-[2px] border-white shadow-pixel-white bg-obsidian relative overflow-hidden flex flex-col">
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="w-full h-full min-h-[520px] z-10"></div>

        {/* Floating HUD Coordinate Tracker (Top-Left) */}
        <div className="absolute top-3 left-3 bg-black/85 border-[2px] border-pixel-gray px-2.5 py-1.5 font-mono text-[10px] text-cyber z-20 shadow-pixel pointer-events-none flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyber animate-pulse"></span>
          <span>CUR: {currentCoords.lat}° N, {currentCoords.lng}° E</span>
        </div>

        {/* Floating Instructions Banner (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 bg-obsidian/90 border border-pixel-gray px-3 py-1 font-mono text-[10px] text-gray-400 z-20 hidden sm:flex items-center gap-1.5 shadow-md pointer-events-none">
          <MapPin size={11} className="text-cyber" />
          <span>DRAG / SCROLL TO EXPLORE {college.name} • CLICK BLIPS TO JOIN</span>
        </div>
      </div>

      {/* Custom Leaflet Overrides */}
      <style>{`
        .cyber-dark-canvas .leaflet-tile {
          filter: brightness(0.65) invert(1) contrast(3.2) hue-rotate(200deg) saturate(0.25) !important;
        }
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
        .leaflet-popup-tip {
          background: #B8FF00 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          line-height: inherit !important;
        }
        .leaflet-container {
          background: #080808 !important;
          font-family: 'JetBrains Mono', monospace !important;
        }
        .leaflet-bar {
          border: 2px solid #ffffff !important;
          border-radius: 0 !important;
          box-shadow: 4px 4px 0px 0px rgba(184, 255, 0, 1) !important;
        }
        .leaflet-bar a {
          background-color: #080808 !important;
          color: #B8FF00 !important;
          border-bottom: 2px solid #262626 !important;
          border-radius: 0 !important;
        }
        .leaflet-bar a:hover {
          background-color: #B8FF00 !important;
          color: #000000 !important;
        }
      `}</style>
    </div>
  );
};
