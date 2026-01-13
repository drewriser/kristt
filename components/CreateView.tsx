import React, { useState, useRef, useEffect } from 'react';
import { ApiConfig, SoraModel, SoraStyle, SoraCharacter, SoraPrompt, Language, BatchTask, TaskStatus, DEFAULT_CONFIG } from '../types';
import { ArrowUp, SlidersHorizontal, Image as ImageIcon, User, FileText, X, ChevronDown, PlayCircle, Loader2, Download, Smartphone, Monitor, Wand2, RefreshCw, Copy, AlertCircle } from 'lucide-react';
import { getTranslation } from '../locales';
import { forceDownloadVideo } from '../services/soraService';

interface Props {
  config: ApiConfig;
  onUpdateConfig: (config: ApiConfig) => void;
  onAddToQueue: (prompts: string[], remixTargetId?: string) => void;
  characters: SoraCharacter[];
  prompts: SoraPrompt[];
  language: Language;
  tasks: BatchTask[];
  onSyncHistory?: () => void;
}

const CreateView: React.FC<Props> = ({ config, onUpdateConfig, onAddToQueue, characters, prompts, language, tasks, onSyncHistory }) => {
  const [inputPrompts, setInputPrompts] = useState('');
  const [batchCount, setBatchCount] = useState(1);
  const [selectedScript, setSelectedScript] = useState<SoraPrompt | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<'none' | 'config' | 'scripts' | 'cast' | 'image'>('none');
  const [remixTarget, setRemixTarget] = useState<BatchTask | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  
  const t = getTranslation(language).create;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const safeConfig = config || DEFAULT_CONFIG;

  const handleSubmit = () => {
    let finalPrompt = '';
    
    if (selectedScript) finalPrompt += selectedScript.content;
    
    if (inputPrompts.trim()) {
        if (finalPrompt) finalPrompt += '\n\n';
        finalPrompt += inputPrompts.trim();
    }

    if (!finalPrompt.trim()) return;

    // Batch Generation: Create array of same prompt
    const promptsArray = Array(batchCount).fill(finalPrompt);

    onAddToQueue(promptsArray, remixTarget?.apiTaskId);
    setInputPrompts('');
    setRemixTarget(null);
    setBatchCount(1); // Reset batch count
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleCharacter = (id: string) => {
    const current = safeConfig.selectedCharacterIds || [];
    const next = current.includes(id) 
      ? current.filter(cid => cid !== id)
      : [...current, id];
    onUpdateConfig({ ...safeConfig, selectedCharacterIds: next });
  };

  const handleRemixClick = (task: BatchTask) => {
    setRemixTarget(task);
    setInputPrompts(task.prompt); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleSyncClick = async () => {
    if (onSyncHistory && !isSyncing) {
      setIsSyncing(true);
      await onSyncHistory();
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  const activeCharacters = characters.filter(c => safeConfig.selectedCharacterIds?.includes(c.id));
  
  // Recent tasks feed: Sort by newest first, limit to 20
  const recentTasks = [...(tasks || [])].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  const hasContentToSubmit = inputPrompts.trim().length > 0 || selectedScript !== null;
  const isVertical = safeConfig.aspectRatio === '9:16';

  return (
    <div className="w-full flex flex-col items-center pt-8 px-4 pb-20 relative min-h-full" onClick={() => setActiveOverlay('none')}>
      
      {/* Central Logo */}
      <div className={`transition-all duration-500 flex flex-col items-center mb-6 ${inputPrompts || activeOverlay !== 'none' || remixTarget ? 'opacity-60 scale-90' : 'opacity-100'}`}>
         <h1 className="text-4xl font-bold tracking-tighter text-white mb-2 flex items-center gap-2">
           SORA<span className="text-white/30">2</span>
         </h1>
         <p className="text-neutral-500 font-light tracking-widest text-[10px] uppercase">{t.subtitle}</p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl relative z-20" onClick={e => e.stopPropagation()}>
        
        {/* --- Top Pills --- */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
           {/* Model */}
           <button 
             onClick={() => setActiveOverlay(activeOverlay === 'config' ? 'none' : 'config')}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:border-white/30 transition-colors"
           >
             <span className={`w-2 h-2 rounded-full ${safeConfig.model?.includes('pro') ? 'bg-purple-500' : 'bg-green-500'}`}></span>
             {safeConfig.model === 'sora-2' ? 'Sora 2' : 'Sora 2 Pro'}
           </button>

           {/* Ratio */}
           <button 
              onClick={() => onUpdateConfig({...safeConfig, aspectRatio: safeConfig.aspectRatio === '16:9' ? '9:16' : '16:9'})}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:border-white/30 transition-colors"
           >
             {safeConfig.aspectRatio === '9:16' ? <Smartphone className="w-3 h-3 text-white" /> : <Monitor className="w-3 h-3 text-white" />}
             {safeConfig.aspectRatio}
           </button>

           {/* Duration */}
           <button 
              onClick={() => setActiveOverlay('config')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:border-white/30 transition-colors"
           >
             {safeConfig.duration}s
           </button>

           <div className="w-px h-4 bg-neutral-800 mx-1"></div>

           {/* Batch Count Pill */}
           <div className="flex items-center gap-0 bg-neutral-900 border border-neutral-800 rounded-full px-1 py-0.5">
              <button 
                 onClick={() => setBatchCount(Math.max(1, batchCount - 1))}
                 className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-white rounded-full hover:bg-white/10"
              >-</button>
              <span className="text-xs font-bold text-indigo-400 w-6 text-center">{batchCount}x</span>
              <button 
                 onClick={() => setBatchCount(Math.min(10, batchCount + 1))}
                 className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-white rounded-full hover:bg-white/10"
              >+</button>
           </div>

           <div className="w-px h-4 bg-neutral-800 mx-1"></div>

           {/* Action Pills */}
           <button 
             onClick={() => setActiveOverlay(activeOverlay === 'scripts' ? 'none' : 'scripts')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold ${
                activeOverlay === 'scripts' || selectedScript
                    ? 'bg-neutral-100 border-white text-black hover:bg-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600'
             }`}
           >
             <FileText className="w-3 h-3" />
             {selectedScript ? selectedScript.title : t.scripts}
             {selectedScript && (
                <span 
                    className="ml-1 p-0.5 rounded-full bg-black/10 hover:bg-black/20"
                    onClick={(e) => { e.stopPropagation(); setSelectedScript(null); }}
                >
                    <X className="w-3 h-3" />
                </span>
             )}
           </button>

           <button 
             onClick={() => setActiveOverlay(activeOverlay === 'cast' ? 'none' : 'cast')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold ${
                activeOverlay === 'cast' || activeCharacters.length > 0
                  ? 'bg-purple-900/40 border-purple-500/50 text-purple-200' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600'
             }`}
           >
             <User className="w-3 h-3" />
             {t.cast}
             {activeCharacters.length > 0 && <span className="ml-0.5 bg-purple-500 text-white text-[9px] px-1.5 rounded-full">{activeCharacters.length}</span>}
           </button>

           <button 
             onClick={() => setActiveOverlay(activeOverlay === 'image' ? 'none' : 'image')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold ${
                activeOverlay === 'image' || safeConfig.imageUrls?.length > 0
                  ? 'bg-blue-900/40 border-blue-500/50 text-blue-200' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600'
             }`}
           >
             <ImageIcon className="w-3 h-3" />
             {t.refImage}
             {safeConfig.imageUrls?.length > 0 && <span className="ml-0.5 bg-blue-500 text-white text-[9px] px-1.5 rounded-full">{safeConfig.imageUrls.length}</span>}
           </button>
        </div>

        {/* --- Input Box --- */}
        <div className={`
           bg-neutral-900/80 backdrop-blur-xl border transition-all duration-300 rounded-3xl overflow-hidden relative
           ${activeOverlay !== 'none' || inputPrompts || remixTarget ? 'border-neutral-500 shadow-2xl shadow-neutral-900/50' : 'border-neutral-800 hover:border-neutral-700'}
        `}>
          {/* Remix Banner */}
          {remixTarget && (
             <div className="bg-indigo-900/30 border-b border-indigo-500/20 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300">
                   <Wand2 className="w-4 h-4" />
                   <span className="text-xs font-bold uppercase tracking-wider">Remixing Video {remixTarget.apiTaskId?.slice(0,6)}...</span>
                </div>
                <button 
                  onClick={() => { setRemixTarget(null); setInputPrompts(''); }}
                  className="p-1 hover:bg-white/10 rounded-full text-indigo-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
             </div>
          )}

          <textarea
            ref={textareaRef}
            value={inputPrompts}
            onChange={e => setInputPrompts(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white placeholder-neutral-500 text-lg px-6 py-5 outline-none resize-none font-light leading-relaxed min-h-[80px] max-h-[300px]"
            placeholder={selectedScript ? t.placeholder : (remixTarget ? "Enter edit instructions (e.g. 'Add a puppy')..." : "Describe your video imagination...")}
            rows={Math.max(2, Math.min(inputPrompts.split('\n').length + 1, 8))}
          />
          
          <div className="px-6 pb-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
               {selectedScript && (
                 <div className="flex items-center gap-1.5 bg-neutral-100 border border-white text-black px-2 py-0.5 rounded-full text-xs font-bold">
                    <FileText className="w-3 h-3" />
                    <span>{t.activeScript}: {selectedScript.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedScript(null); }} className="hover:bg-black/10 rounded-full p-0.5 ml-1"><X className="w-3 h-3" /></button>
                 </div>
               )}
               {activeCharacters.map(char => (
                 <div key={char.id} className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${char.avatarColor || 'bg-purple-500'}`}></span>
                    {char.name}
                    <button onClick={(e) => { e.stopPropagation(); toggleCharacter(char.id); }} className="hover:text-white"><X className="w-3 h-3" /></button>
                 </div>
               ))}
          </div>

          <div className="flex items-center justify-between px-4 pb-4 pt-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveOverlay(activeOverlay === 'config' ? 'none' : 'config')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeOverlay === 'config' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:bg-white/5 hover:text-white'}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wide">{t.config}</span>
              </button>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={!hasContentToSubmit}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 group ${
                hasContentToSubmit
                  ? (remixTarget ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-white text-black hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]')
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wide">
                 {remixTarget ? 'Remix Video' : (batchCount > 1 ? `Batch Gen (${batchCount})` : 'Generate Video')}
              </span>
              {remixTarget ? <Wand2 className="w-4 h-4" /> : <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" strokeWidth={3} />}
            </button>
          </div>
        </div>

        {/* --- OVERLAYS --- */}
        {/* Scripts Overlay */}
        {activeOverlay === 'scripts' && (
          <div className="absolute top-full left-0 right-0 mt-4 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-4 z-50 max-h-[400px] overflow-y-auto custom-scrollbar">
             <div className="flex items-center justify-between mb-3 px-2">
               <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t.selectScript}</h3>
               <button onClick={() => setActiveOverlay('none')}><X className="w-4 h-4 text-neutral-500 hover:text-white"/></button>
             </div>
             {prompts.length === 0 ? (
               <div className="text-center py-6 text-neutral-600 text-xs">{t.noPrompts}</div>
             ) : (
               <div className="grid grid-cols-1 gap-2">
                 {prompts.map(p => (
                   <button
                     key={p.id}
                     onClick={() => { setSelectedScript(p); setActiveOverlay('none'); }}
                     className={`text-left p-3 rounded-xl border group transition-all ${selectedScript?.id === p.id ? 'bg-white/10 border-white/50' : 'hover:bg-white/5 border-transparent hover:border-white/10'}`}
                   >
                     <div className="flex items-center justify-between mb-1">
                       <span className="text-sm font-bold text-neutral-200 group-hover:text-white">{p.title}</span>
                     </div>
                     <p className="text-xs text-neutral-500 line-clamp-2 font-mono">{p.content}</p>
                   </button>
                 ))}
               </div>
             )}
          </div>
        )}

        {/* Cast Overlay */}
        {activeOverlay === 'cast' && (
          <div className="absolute top-full left-0 right-0 mt-4 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-4 z-50">
             <div className="flex items-center justify-between mb-4 px-2">
               <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">{t.selectCast}</h3>
               <button onClick={() => setActiveOverlay('none')}><X className="w-4 h-4 text-neutral-500 hover:text-white"/></button>
             </div>
             {characters.length === 0 ? (
               <div className="text-center py-6 text-neutral-600 text-xs">No characters in library.</div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                 {characters.map(char => {
                   const isSelected = safeConfig.selectedCharacterIds?.includes(char.id);
                   return (
                     <button
                       key={char.id}
                       onClick={() => toggleCharacter(char.id)}
                       className={`flex flex-col items-center p-3 rounded-xl border transition-all ${isSelected ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-neutral-800/30 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
                     >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${char.avatarColor || 'bg-neutral-700'}`}>{char.name[0]}</div>
                        <span className="text-xs font-bold truncate w-full text-center">{char.name}</span>
                     </button>
                   );
                 })}
               </div>
             )}
          </div>
        )}

        {/* Image Overlay */}
         {activeOverlay === 'image' && (
           <div className="absolute top-full left-0 right-0 mt-4 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-4 z-50">
              <div className="flex items-center justify-between mb-3 px-2">
               <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">{t.pasteImages}</h3>
               <button onClick={() => setActiveOverlay('none')}><X className="w-4 h-4 text-neutral-500 hover:text-white"/></button>
             </div>
             <textarea 
               value={safeConfig.imageUrls ? safeConfig.imageUrls.join('\n') : ''}
               onChange={e => onUpdateConfig({...safeConfig, imageUrls: e.target.value.split('\n').map(s=>s.trim()).filter(Boolean)})}
               className="w-full bg-black/40 border border-neutral-700 rounded-xl p-3 text-xs text-blue-100 font-mono h-32 focus:border-blue-500/50 outline-none resize-none placeholder-neutral-700"
               placeholder="https://..."
             />
           </div>
        )}

        {/* Config Overlay */}
        {activeOverlay === 'config' && (
          <div className="absolute top-full left-0 right-0 mt-4 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-top-4 z-50">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Advanced Configuration</h3>
                <button onClick={() => setActiveOverlay('none')}><X className="w-4 h-4 text-neutral-500 hover:text-white"/></button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">{t.model}</label>
                   <div className="flex flex-col gap-1">
                      {['sora-2', 'sora-2-pro'].map(m => (
                        <button key={m} onClick={() => onUpdateConfig({...safeConfig, model: m as SoraModel})} className={`text-left text-xs px-2 py-1.5 rounded-lg transition-colors ${safeConfig.model === m ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'}`}>
                          {m === 'sora-2' ? t.standard : t.pro}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">{t.duration}</label>
                   <div className="flex flex-col gap-1">
                      {[10, 15, 25].map(d => (
                        <button key={d} onClick={() => onUpdateConfig({...safeConfig, duration: d})} className={`text-left text-xs px-2 py-1.5 rounded-lg transition-colors ${safeConfig.duration === d ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'}`}>
                          {d}s
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* --- TASK FEED (GRID OUTPUT) --- */}
      <div className="w-full max-w-[1400px] mt-12 space-y-4 animate-in slide-in-from-bottom-10 duration-700">
         <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Current Session Feed</h3>
              <button 
                onClick={handleSyncClick}
                disabled={isSyncing}
                className={`p-1.5 rounded-full hover:bg-neutral-800 transition-all ${isSyncing ? 'animate-spin text-indigo-500' : 'text-neutral-600 hover:text-white'}`}
                title="Sync from API History"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-neutral-600 font-mono">{recentTasks.length} visible</span>
         </div>
         
         {recentTasks.length === 0 ? (
           <div className="text-center py-10 border border-dashed border-neutral-800 rounded-xl">
              <p className="text-neutral-600 text-xs">No tasks yet. Start creating or click Sync to fetch history!</p>
           </div>
         ) : (
           <div className={`grid gap-4 ${isVertical ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
             {recentTasks.map(task => (
               <div key={task.id} className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden flex flex-col hover:border-neutral-600 transition-all group relative">
                 
                 {/* Video Player / Status Container - Responsive Aspect Ratio */}
                 <div className={`w-full bg-black relative flex items-center justify-center ${isVertical ? 'aspect-[9/16]' : 'aspect-[16/9]'}`}>
                    {task.status === TaskStatus.COMPLETED && task.videoUrl ? (
                       <video 
                        src={task.videoUrl} 
                        className="w-full h-full object-cover" 
                        controls 
                        playsInline
                        preload="metadata"
                      />
                    ) : task.status === TaskStatus.FAILED ? (
                      <div 
                        className="flex flex-col items-center justify-center w-full h-full text-red-500/80 p-4 text-center cursor-pointer hover:bg-red-950/20 transition-colors"
                        onClick={() => setExpandedErrorId(expandedErrorId === task.id ? null : task.id)}
                        title="Click to see error details"
                      >
                         <AlertCircle className="w-8 h-8 mb-2" />
                         <span className="text-[10px] uppercase font-bold tracking-widest">Generation Failed</span>
                         <span className="text-[9px] mt-1 opacity-70">Click for details</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="text-[9px] text-indigo-400 mt-2 font-mono uppercase tracking-wider">{task.status}</span>
                      </div>
                    )}

                    {/* Error Overlay */}
                    {task.status === TaskStatus.FAILED && expandedErrorId === task.id && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20">
                            <h4 className="text-red-400 font-bold text-xs uppercase mb-2">Error Details</h4>
                            <p className="text-xs text-neutral-300 font-mono break-words w-full">{task.error || "Unknown Error"}</p>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setExpandedErrorId(null); }}
                                className="mt-4 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs rounded-lg"
                            >
                                Close
                            </button>
                        </div>
                    )}
                 </div>

                 {/* Content - Absolute overlay for cleaner vertical look or standard footer */}
                 <div className="p-3 flex flex-col bg-neutral-900 border-t border-neutral-800">
                    <p className="text-[10px] text-neutral-300 line-clamp-2 leading-relaxed font-light mb-2 h-[2.5em]">{task.prompt}</p>
                    
                    <div className="flex items-center justify-between">
                       <div className="flex gap-2">
                          <span className="text-[9px] text-neutral-600 font-mono bg-neutral-950 px-1.5 py-0.5 rounded">
                             {task.apiTaskId?.slice(-4) || '...'}
                          </span>
                       </div>
                       
                       <div className="flex items-center gap-1">
                          {task.status === TaskStatus.COMPLETED && task.videoUrl && (
                            <>
                              <button 
                                onClick={() => handleRemixClick(task)}
                                className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-lg transition-colors"
                                title="Remix this video"
                              >
                                <Wand2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => forceDownloadVideo(task.videoUrl!, `sora_${task.apiTaskId}.mp4`)}
                                className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-lg transition-colors"
                                title="Download MP4"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                           <button 
                            onClick={() => {
                                navigator.clipboard.writeText(task.prompt);
                            }}
                            className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-lg transition-colors"
                            title="Copy Prompt"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                       </div>
                    </div>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>

    </div>
  );
};

export default CreateView;