import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const QUESTIONS = [
  {
    q: "What's your social energy level?",
    opts: ["Small intimate groups", "Big loud crowds", "One-on-one deep talks", "Online > IRL"]
  },
  {
    q: "When are you most alive on campus?",
    opts: ["Late-night owl 🦉", "Early bird sunrise", "Afternoon grinder", "Weekend warrior"]
  },
  {
    q: "Pick your main vibe:",
    opts: ["Coding & Hackathons", "Music & Concerts", "Sports & Fitness", "Art & Design", "Food & Coffee", "Study Groups"]
  },
  {
    q: "Your ideal weekend looks like:",
    opts: ["Building a side project", "Exploring new cafes", "Pickup sports game", "Netflix & chill", "Road trip adventure"]
  },
  {
    q: "In a crew, you're the:",
    opts: ["Planner & organizer", "Hype person & energy", "Chill vibes & listener", "Ideas machine & creative"]
  }
];

export const VibeCheckModal: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''));
  const [custom, setCustom] = useState('');
  const [_loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [summary, setSummary] = useState('');

  const handleSelect = (ans: string) => {
    const newAnswers = [...answers];
    newAnswers[step] = ans;
    setAnswers(newAnswers);
    setCustom('');
    
    if (step < 4) {
      setStep(step + 1);
    } else {
      submit(newAnswers);
    }
  };
  
  const handleCustomSubmit = () => {
    if (custom.trim()) {
      handleSelect(custom.trim());
    }
  };

  const submit = async (finalAnswers: string[]) => {
    setLoading(true);
    try {
      if (user) {
        const res = await api.submitVibeCheck(user.userId, finalAnswers);
        setSummary(res?.vibeSummary || "A unique blend of chill and grind.");
      }
    } catch (e) {
      setSummary("Tech-savvy night owl who thrives in intimate hacker groups.");
    }
    setCompleted(true);
    setLoading(false);
  };

  if (completed) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 grid-bg">
        <div className="bg-obsidian border-[2px] border-cyber shadow-pixel w-full max-w-md p-8 text-center">
          <h2 className="text-3xl font-mono font-bold text-cyber mb-4">[ VIBE_LOCKED ]</h2>
          <p className="font-body text-white mb-8">{summary}</p>
          <button 
            onClick={() => updateUser({ hasCompletedVibeCheck: true, vibeSummary: summary })}
            className="bg-cyber text-black font-mono font-bold px-6 py-2 border-[2px] border-cyber hover:bg-transparent hover:text-cyber transition-colors"
          >
            ENTER THE GRID
          </button>
        </div>
      </div>
    );
  }

  const currentQ = QUESTIONS[step];

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4">
      <div className="w-full max-w-md relative">
        <div className="mb-4 text-cyber font-mono font-bold text-lg">
          [ 0{step + 1} / 05 ]
        </div>
        
        <div className="bg-pixel-dark border-[2px] border-white p-6 shadow-pixel-white">
          <h2 className="text-xl font-bold font-mono text-white mb-6 min-h-[60px]">{currentQ.q}</h2>
          
          <div className="flex flex-col gap-3">
            {currentQ.opts.map((opt, i) => (
              <button 
                key={i}
                onClick={() => handleSelect(opt)}
                className="text-left border-[2px] border-pixel-gray hover:border-cyber hover:text-cyber bg-obsidian p-3 font-mono text-sm transition-colors"
              >
                {opt}
              </button>
            ))}
            
            <div className="mt-2 flex gap-2">
              <input 
                type="text" 
                placeholder="Or type your own..." 
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
                className="flex-1 bg-obsidian border-[2px] border-pixel-gray p-2 text-sm font-mono focus:border-white outline-none"
              />
              <button 
                onClick={handleCustomSubmit}
                disabled={!custom.trim()}
                className="bg-white text-black font-mono font-bold px-3 border-[2px] border-white disabled:opacity-50"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
