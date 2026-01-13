import React from 'react';
import { MonitorPlay, ListVideo, LayoutGrid, FileText, Settings, User, Zap } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../locales';

type View = 'create' | 'queue' | 'gallery' | 'prompts' | 'characters' | 'settings';

interface Props {
  currentView: View;
  onChangeView: (view: View) => void;
  queueCount: number;
  language: Language;
}

const Sidebar: React.FC<Props> = ({ currentView, onChangeView, queueCount, language }) => {
  const t = getTranslation(language).nav;
  
  const navItems: { id: View; icon: React.ReactNode; tooltip: string }[] = [
    { id: 'create', icon: <MonitorPlay strokeWidth={1.5} />, tooltip: t.create },
    { id: 'queue', icon: <ListVideo strokeWidth={1.5} />, tooltip: t.queue },
    { id: 'gallery', icon: <LayoutGrid strokeWidth={1.5} />, tooltip: t.gallery },
    { id: 'prompts', icon: <FileText strokeWidth={1.5} />, tooltip: t.library },
    { id: 'characters', icon: <User strokeWidth={1.5} />, tooltip: t.cast },
  ];

  return (
    <div className="w-16 h-screen flex flex-col items-center py-6 bg-black border-r border-white/5 z-50">
      {/* Brand Icon */}
      <div className="mb-8">
        <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:scale-105 transition-transform cursor-default">
          <Zap className="w-6 h-6 fill-black" />
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-4 w-full px-2">
        {navItems.map(item => (
          <div key={item.id} className="relative group flex justify-center">
             <button
              onClick={() => onChangeView(item.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-white/10 text-white' 
                  : 'text-neutral-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="w-5 h-5">{item.icon}</div>
              
              {/* Badge for queue */}
              {item.id === 'queue' && queueCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-black" />
              )}
            </button>
            
            {/* Tooltip */}
            <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-white/10">
              {item.tooltip}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings at Bottom */}
      <div className="mt-auto relative group">
        <button
          onClick={() => onChangeView('settings')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
            currentView === 'settings' 
              ? 'bg-white/10 text-white' 
              : 'text-neutral-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
          {t.settings}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;