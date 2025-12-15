import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Tv } from 'lucide-react';
import { Button } from '../components/Button';

const TvLogin: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const hostname = window.location.hostname;
  const isTvSubdomain = hostname === 'tv.menupi.com' || hostname.includes('tv.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length >= 6) {
      const upperCode = code.toUpperCase();
      // On TV subdomain, navigate to /[code], otherwise use /tv/[code]
      if (isTvSubdomain) {
        navigate(`/${upperCode}`);
      } else {
        navigate(`/tv/${upperCode}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-6">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <Tv className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black text-white tracking-tighter">MENUPI TV</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Enter Screen Code</h1>
            <p className="text-slate-400 mt-2">
              Enter your 6-character screen code to start displaying your digital menu on this screen.
            </p>
            <p className="text-slate-500 text-sm mt-3">
              Find your screen code in the <span className="text-slate-400 font-medium">MENUPI Dashboard</span> under the Screens section.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative">
                <input
                    type="text"
                    maxLength={6}
                    className="w-full text-center text-5xl font-mono font-bold tracking-[0.2em] uppercase border-b-2 border-slate-700 py-4 focus:border-indigo-500 focus:outline-none placeholder-slate-800 text-white transition-colors bg-transparent"
                    placeholder="------"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    autoFocus
                />
                <p className="text-center text-xs text-slate-500 mt-2">Example: A9X2B4</p>
            </div>
            
            <Button size="lg" className="w-full h-14 text-lg font-bold shadow-lg shadow-indigo-500/20" disabled={code.length < 6}>
                Launch Player <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
        </form>
        
        <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-slate-600 font-medium tracking-wide uppercase">Powered by MENUPI Digital Signage</p>
        </div>
      </div>
    </div>
  );
};

export default TvLogin;