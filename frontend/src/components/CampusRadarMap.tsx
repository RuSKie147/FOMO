import React from 'react';

interface CampusRadarMapProps {
  onEventClick: (id: string) => void;
}

export const CampusRadarMap: React.FC<CampusRadarMapProps> = ({ onEventClick }) => {
  // Mock events for radar
  const mockEvents = [
    { id: '1', top: '30%', left: '40%', intensity: 'high' },
    { id: '2', top: '60%', left: '70%', intensity: 'medium' },
    { id: '3', top: '20%', left: '80%', intensity: 'low' },
    { id: '4', top: '75%', left: '25%', intensity: 'high' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 py-8 h-[calc(100vh-100px)] flex flex-col">
      <h2 className="font-mono text-2xl text-white font-bold mb-4 border-b-[2px] border-white pb-2">
        [ CAMPUS_RADAR ]
      </h2>
      
      <div className="flex-1 border-[2px] border-pixel-gray bg-obsidian relative overflow-hidden grid-bg group">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,theme('colors.cyber')_0%,transparent_70%)] pointer-events-none"></div>
        
        {/* Radar scan line effect */}
        <div className="absolute inset-0 border-t-[2px] border-cyber/30 opacity-50 pointer-events-none" 
             style={{ animation: 'scan 4s linear infinite', top: '0', height: '100%' }}></div>
             
        <style>{`
          @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          @keyframes ping-slow {
            75%, 100% { transform: scale(2); opacity: 0; }
          }
          .animate-ping-slow {
            animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}</style>
        
        {mockEvents.map((ev, i) => (
          <div 
            key={i} 
            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ top: ev.top, left: ev.left }}
            onClick={() => onEventClick(ev.id)}
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-cyber opacity-40 animate-ping-slow`} 
                    style={{ animationDuration: ev.intensity === 'high' ? '1.5s' : '3s' }}></span>
              <span className={`relative inline-flex rounded-full bg-cyber ${ev.intensity === 'high' ? 'h-4 w-4 shadow-[0_0_10px_#B8FF00]' : 'h-2 w-2'}`}></span>
            </div>
            
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black border-[1px] border-cyber px-2 py-0.5 font-mono text-[10px] text-cyber z-20">
              EVENT_{ev.id}
            </div>
          </div>
        ))}
        
        {/* Campus map abstract markers */}
        <div className="absolute top-[10%] left-[10%] font-mono text-pixel-gray text-xs opacity-50 pointer-events-none">LIBRARY</div>
        <div className="absolute bottom-[20%] right-[15%] font-mono text-pixel-gray text-xs opacity-50 pointer-events-none">HOSTELS</div>
        <div className="absolute top-[40%] right-[30%] font-mono text-pixel-gray text-xs opacity-50 pointer-events-none">ACADEMIC_BLOCK</div>
      </div>
    </div>
  );
};
