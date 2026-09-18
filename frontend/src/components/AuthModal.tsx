import React, { useState } from 'react';
import { useAuth, getCollegeFromEmail } from '../context/AuthContext';
import { Zap } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const detectedCollege = email.includes('@') ? getCollegeFromEmail(email) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, name);
    setLoading(false);
  };

  const handleSetPreset = (presetEmail: string, presetName: string) => {
    setEmail(presetEmail);
    setName(presetName);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 dither-bg">
      <div className="bg-pixel-dark border-[2px] border-white w-full max-w-md shadow-pixel-white p-6 relative">
        <div className="absolute top-0 right-0 bg-white text-black font-mono text-xs px-2 py-1 font-bold">
          [ AUTH_REQUIRED ]
        </div>
        
        <h2 className="text-3xl font-mono font-bold text-white mb-6 mt-4">JOIN_CREW</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-mono text-xs text-gray-400 mb-1 block">EMAIL (.ac.in / .edu preferred)</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. alex.chen@iiitd.ac.in"
              className="w-full bg-obsidian border-[2px] border-pixel-gray p-3 text-white focus:border-cyber outline-none font-mono"
              required
            />
          </div>

          {detectedCollege && (
            <div className="bg-cyber/10 border border-cyber p-2.5 font-mono text-xs text-cyber flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400">AUTO-DETECTED CAMPUS:</span>
              <span className="font-bold text-white">{detectedCollege.fullName}</span>
              <span className="text-[10px] text-cyber/80">[{detectedCollege.tagline}]</span>
            </div>
          )}
          
          <div>
            <label className="font-mono text-xs text-gray-400 mb-1 block">NAME</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-obsidian border-[2px] border-pixel-gray p-3 text-white focus:border-cyber outline-none font-mono"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !email || !name}
            className="mt-2 bg-white text-black font-mono font-bold py-3 hover:bg-cyber transition-colors border-[2px] border-white disabled:opacity-50"
          >
            {loading ? 'INITIALIZING...' : 'ENTER'}
          </button>
        </form>
        
        <div className="mt-6 border-t-[2px] border-pixel-gray pt-4">
          <div className="font-mono text-[11px] text-gray-400 mb-2 flex items-center gap-1">
            <Zap size={13} className="text-cyber" />
            <span>QUICK DEMO CAMPUS PRESETS:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSetPreset('alex.chen@iiitd.ac.in', 'Alex Chen')}
              className="bg-obsidian border border-cyber/50 hover:border-cyber text-cyber font-mono text-[11px] py-1.5 px-2 transition-colors font-bold"
            >
              IIITD
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('sam.verma@dtu.ac.in', 'Sam Verma')}
              className="bg-obsidian border border-pixel-gray hover:border-white text-gray-300 font-mono text-[11px] py-1.5 px-2 transition-colors font-bold"
            >
              DTU
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('priya.sharma@iitd.ac.in', 'Priya Sharma')}
              className="bg-obsidian border border-pixel-gray hover:border-white text-gray-300 font-mono text-[11px] py-1.5 px-2 transition-colors font-bold"
            >
              IITD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
