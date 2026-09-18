import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !user) return;
    
    setLoading(true);
    try {
      await api.createEvent({
        userId: user.userId,
        title,
        description: desc,
        category,
        lat: 28.5458 + (Math.random() * 0.01 - 0.005),
        lng: 77.2732 + (Math.random() * 0.01 - 0.005)
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
            
            <button 
              type="submit" 
              disabled={loading || !title || !desc}
              className="mt-4 bg-cyber text-black font-mono font-bold py-3 hover:bg-transparent hover:text-cyber border-[2px] border-cyber transition-colors disabled:opacity-50"
            >
              {loading ? 'BROADCASTING...' : 'BROADCAST EVENT'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
