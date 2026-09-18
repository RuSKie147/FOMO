import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, name);
    setLoading(false);
  };

  const handleDemo = () => {
    setEmail('alex.chen@iitd.ac.in');
    setName('Alex Chen');
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
            <label className="font-mono text-xs text-gray-400 mb-1 block">EMAIL (.edu preferred)</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-obsidian border-[2px] border-pixel-gray p-3 text-white focus:border-cyber outline-none font-mono"
              required
            />
          </div>
          
          <div>
            <label className="font-mono text-xs text-gray-400 mb-1 block">NAME</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-obsidian border-[2px] border-pixel-gray p-3 text-white focus:border-cyber outline-none font-mono"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !email || !name}
            className="mt-4 bg-white text-black font-mono font-bold py-3 hover:bg-cyber transition-colors border-[2px] border-white disabled:opacity-50"
          >
            {loading ? 'INITIALIZING...' : 'ENTER'}
          </button>
        </form>
        
        <div className="mt-6 border-t-[2px] border-pixel-gray pt-6">
          <button 
            onClick={handleDemo}
            className="w-full flex items-center justify-center gap-2 bg-transparent text-cyber border-[2px] border-cyber py-2 hover:bg-cyber/10 font-mono text-sm"
          >
            <Zap size={16} />
            Auto-fill Demo Account
          </button>
        </div>
      </div>
    </div>
  );
};
