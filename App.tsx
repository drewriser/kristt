import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ApiConfig, BatchTask, TaskStatus, DEFAULT_CONFIG, SoraCharacter, SoraPrompt, ToastMessage, Language } from './types';
import { submitGenerationTask, remixGenerationTask, checkTaskStatus, fetchTaskHistory, forceDownloadVideo } from './services/soraService';
import { getTranslation } from './locales';

// Components
import Sidebar from './components/Sidebar';
import CreateView from './components/CreateView';
import TaskList from './components/TaskList';
import VideoGallery from './components/VideoGallery';
import CharacterLibrary from './components/CharacterLibrary';
import PromptLibrary from './components/PromptLibrary';
import SettingsView from './components/SettingsView';
import ToastContainer from './components/Toast';
import { Pause, Activity } from 'lucide-react';

// --- PRESET DATA ---
const PRESET_CHARACTERS: SoraCharacter[] = [
  { id: 'char_005', name: '眉毛剪5', username: '@meimaojian5', avatarColor: 'bg-pink-500' },
  { id: 'char_003', name: '眉毛剪3', username: '@meimaojian3', avatarColor: 'bg-purple-500' },
  { id: 'char_002', name: '眉毛剪2', username: '@meimaojian2', avatarColor: 'bg-indigo-500' },
];

const PRESET_PROMPTS: SoraPrompt[] = [
  {
    id: 'script_tiktok_beauty_v2',
    title: 'TikTok Beauty Influencer (Spanish/Mexico)',
    content: `Short de TikTok de belleza estilo influencer casero pero high-end, 8K, ritmo rápido y dinámico, secuencia de cámara con toques "selfie" para sensación de confianza personal.
Protagonista: Chica joven mexicana con cabello magenta-púrpura vibrante y suave (estilo tendencia), piel radiante sin poros, cejas gruesas y bien arregladas (look natural), ojos avellana-verdes. Uñas con manicura francesa blanca impecable (detalle chic).
Tono general: Amigable, cercano, como recomiendo un producto a la amiga. No hay actitud formal—todo es natural y relatable.

Secuencia del video (con hacks de influencer):

1. Primer plano medio (ángulo selfie 45°): Yo sostengo la recortadora de cejas eléctrica de pluma, rosa-dorado metálico, contra la piel debajo del arco de la ceja. Mano izquierda (con manicura francesa) estiro suavemente la piel temporal (moviéndola un poquito, como hacemos en casa), mano derecha con la herramienta a 45°, haciendo movimientos circulares lentos y sutiles solo debajo de las cejas—mientras miro la cámara como si le dijera "mira cómo lo hago". Agarre delicado, presión suave.

2. Zoom macro extremo (corte súper rápido): Transición instantánea a macro impactante—la punta chapada en oro deslizándose por la piel. Texturas hiperrealistas: poros individuales, vello fino que se quita sin dolor, textura de las cejas intactas. Brillo metálico que refleja la luz (detalle que llama la atención). Duración del macro: 1-2 segundos (no más, para mantener el ritmo de TikTok).

3. Retorno al retrato (ángulo frontal relajado): Cámara se aleja, yo dejo de recortar, bajo la recortadora y sonrío a la cámara—una sonrisa segura, como "ya terminé, mirá qué fácil". Parpadeo natural, piel brillante con luz suave (no demasiado estudio, más como luz de ventana). Fondo: pared de color crema neutra, desenfocada (no distrae, como en mi habitación).

Restricciones estrictas (MÁS IMPORTANTE): La punta dorada nunca toca las cejas principales—siempre 1-2 mm debajo de la línea de contorno inferior, solo para los pelos sueltos debajo del hueso de la ceja. No hay daño a las cejas, todo es seguro y fácil.

Contexto: Anuncio de TikTok México para influencers, ritmo rápido (cada secuencia 3-4 segundos), enfoque en facilidad de uso y resultado visible—lo que la gente busca en un short de recomendación.`,
    tags: ['TikTok', 'Beauty', 'Spanish', 'Influencer', 'Macro'],
    usageCount: 0,
    createdAt: Date.now()
  }
];

const useStickyState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      if (stickyValue !== null) {
        const parsed = JSON.parse(stickyValue);
        if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
          return { ...defaultValue, ...parsed };
        }
        return parsed;
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

const App: React.FC = () => {
  const [config, setConfig] = useStickyState<ApiConfig>('sora_config', DEFAULT_CONFIG);
  const [tasks, setTasks] = useStickyState<BatchTask[]>('sora_tasks', []);
  const [characters, setCharacters] = useStickyState<SoraCharacter[]>('sora_characters', []);
  const [prompts, setPrompts] = useStickyState<SoraPrompt[]>('sora_prompts', []);
  const [language, setLanguage] = useStickyState<Language>('sora_language', 'zh'); 
  
  const [currentView, setCurrentView] = useState<'create' | 'queue' | 'gallery' | 'prompts' | 'characters' | 'settings'>('create');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  
  const processingRef = useRef(false);
  const tasksRef = useRef<BatchTask[]>(tasks);
  
  const t = getTranslation(language);

  // Hydration & Default Population Logic
  useEffect(() => {
    setConfig(prev => {
        let needsUpdate = false;
        let next = { ...prev };
        
        if (!next.provider) { next.provider = 'apimart'; needsUpdate = true; } // Migrate old config
        if (!next.model) { next.model = 'sora-2'; needsUpdate = true; }
        if (next.autoDownload === undefined) { next.autoDownload = true; needsUpdate = true; }
        
        // Removed hardcoded key injection. Key persistence is handled by useStickyState (LocalStorage).
        
        if (needsUpdate) return next;
        return prev;
    });

    if (characters.length === 0) setCharacters(PRESET_CHARACTERS);
    // Reset/Update prompts if empty or older version (simplification: just set if empty or forcing update logic could be complex, for now we set if empty to avoid overwriting user edits)
    if (prompts.length === 0) setPrompts(PRESET_PROMPTS);
  }, []); 

  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts(prev => [...prev, { id: uuidv4(), type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const processQueue = useCallback(async () => {
    if (!processingRef.current) return;
    const currentTasks = tasksRef.current;
    const activeCount = currentTasks.filter(t => ['SUBMITTING', 'PROCESSING', 'QUEUED'].includes(t.status)).length;

    if (activeCount >= config.concurrency) return;

    const nextTask = currentTasks.find(t => t.status === TaskStatus.PENDING);
    if (!nextTask) return;

    updateTaskStatus(nextTask.id, TaskStatus.SUBMITTING);

    let submission;
    if (nextTask.params?.isRemix && nextTask.params?.remixSourceId) {
       submission = await remixGenerationTask(nextTask.params.remixSourceId, nextTask.prompt, config);
    } else {
       let finalPrompt = nextTask.prompt;
       if (config.selectedCharacterIds?.length > 0) {
         const selectedChars = characters.filter(c => config.selectedCharacterIds.includes(c.id));
         const tags = selectedChars.map(c => c.username).filter(tag => !finalPrompt.includes(tag));
         if (tags.length > 0) {
           finalPrompt = `${finalPrompt} ${tags.join(' ')}`;
         }
       }
       submission = await submitGenerationTask(finalPrompt, config);
    }

    if (submission.success && submission.apiTaskId) {
      updateTaskStatus(nextTask.id, TaskStatus.QUEUED, { apiTaskId: submission.apiTaskId, params: { ...nextTask.params, debugPayload: submission.debugPayload } });
      addToast('info', `Task Submitted: ${submission.apiTaskId.slice(0, 8)}`);
    } else {
      updateTaskStatus(nextTask.id, TaskStatus.FAILED, { error: submission.error, params: { ...nextTask.params, debugPayload: submission.debugPayload } });
      // Error is displayed on card, redundant toast removed for cleaner UI
    }
  }, [config, characters, isQueueRunning]);

  const pollActiveTasks = useCallback(async () => {
    const activeTasks = tasksRef.current.filter(t => ['QUEUED', 'PROCESSING'].includes(t.status) && t.apiTaskId);
    for (const task of activeTasks) {
      if (!task.apiTaskId) continue;
      const result = await checkTaskStatus(task.apiTaskId, config);
      if (result.status !== task.status) {
        updateTaskStatus(task.id, result.status, {
          videoUrl: result.videoUrl,
          error: result.error,
          rawResponse: result.rawResponse
        });
        
        if (result.status === TaskStatus.COMPLETED) {
           addToast('success', `Video Ready: ${task.apiTaskId.slice(0,6)}`);
           if (config.autoDownload && result.videoUrl) {
              forceDownloadVideo(result.videoUrl, `sora_${task.apiTaskId}.mp4`);
           }
        }
      }
    }
  }, [config]);

  const updateTaskStatus = (id: string, status: TaskStatus, updates: Partial<BatchTask> = {}) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, ...updates } : t));
  };

  const handleSyncHistory = async () => {
    addToast('info', 'Syncing history...');
    const { tasks: remoteTasks, error } = await fetchTaskHistory(config);
    
    if (error) {
        if (error.includes('401')) {
           addToast('error', 'Sync Failed: Auth Error (401).');
           setCurrentView('settings');
        } else {
           // Don't show generic fetch error toasts if it's just CORS/List missing
           console.warn('Sync warning:', error);
        }
        return;
    }

    if (remoteTasks.length === 0) {
      addToast('info', 'No new tasks found.');
      return;
    }

    setTasks(prevTasks => {
      const existingIds = new Set(prevTasks.map(t => t.apiTaskId).filter(Boolean));
      const newTasks = remoteTasks.filter(rt => !existingIds.has(rt.apiTaskId));
      
      if (newTasks.length > 0) {
        addToast('success', `Synced ${newTasks.length} new tasks.`);
        return [...prevTasks, ...newTasks];
      } else {
        return prevTasks;
      }
    });
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isQueueRunning) {
      processingRef.current = true;
      interval = setInterval(() => { processQueue(); pollActiveTasks(); }, 3000);
    } else {
      processingRef.current = false;
    }
    return () => clearInterval(interval);
  }, [isQueueRunning, processQueue, pollActiveTasks]);

  const handleAddToQueue = (promptsToAdd: string[], remixTargetId?: string) => {
    if (!config.apiKey) {
      addToast('error', 'API Key missing. Please check Settings.');
      setCurrentView('settings');
      return;
    }
    
    const newTasks: BatchTask[] = promptsToAdd.map(p => ({
      id: uuidv4(),
      prompt: p,
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
      params: { 
        ...config, 
        isRemix: !!remixTargetId,
        remixSourceId: remixTargetId
      } 
    }));
    
    setTasks(prev => [...prev, ...newTasks]);
    
    if (newTasks.length > 0) {
       addToast('success', remixTargetId ? 'Remix Task Started' : 'Task Started');
    }
    
    if (!isQueueRunning) setIsQueueRunning(true);
  };

  const pendingCount = tasks.filter(t => t.status === TaskStatus.PENDING).length;
  const activeCount = tasks.filter(t => ['QUEUED','PROCESSING','SUBMITTING'].includes(t.status)).length;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-slate-200 font-sans overflow-hidden">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        queueCount={pendingCount + activeCount}
        language={language}
      />

      <main className="flex-1 flex flex-col h-full relative min-w-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10 scroll-smooth pb-20 md:pb-0">
          {currentView === 'create' && (
            <CreateView 
              config={config} 
              onUpdateConfig={setConfig}
              onAddToQueue={handleAddToQueue}
              characters={characters}
              prompts={prompts}
              language={language}
              tasks={tasks}
              onSyncHistory={handleSyncHistory}
            />
          )}

          {currentView === 'queue' && (
            <div className="min-h-full p-8 pb-24">
              <h2 className="text-2xl font-light text-white mb-6 tracking-tight">{t.nav.queue}</h2>
              <TaskList 
                tasks={tasks}
                onRetry={(id) => updateTaskStatus(id, TaskStatus.PENDING, { error: undefined })}
                onRemove={(id) => { setTasks(prev => prev.filter(t => t.id !== id)); addToast('info', 'Task Removed'); }}
              />
            </div>
          )}

          {currentView === 'gallery' && (
            <div className="min-h-full p-8 pb-24">
               <h2 className="text-2xl font-light text-white mb-6 tracking-tight">{t.nav.gallery}</h2>
               <VideoGallery 
                 videos={tasks.filter(t => t.status === TaskStatus.COMPLETED && t.videoUrl)}
                 onDelete={(ids) => { setTasks(prev => prev.filter(t => !ids.includes(t.id))); addToast('success', `Deleted ${ids.length}`); }}
               />
            </div>
          )}

          {currentView === 'characters' && (
            <CharacterWrapper characters={characters} setCharacters={setCharacters} />
          )}

          {currentView === 'prompts' && (
             <div className="min-h-full p-8 pb-24">
                <h2 className="text-2xl font-light text-white mb-6 tracking-tight">{t.nav.library}</h2>
                <PromptLibrary 
                  prompts={prompts}
                  onUpdatePrompts={setPrompts}
                  onUsePrompt={(txt) => { navigator.clipboard.writeText(txt); addToast('success', 'Copied'); setCurrentView('create'); }}
                />
             </div>
          )}

          {currentView === 'settings' && (
            <div className="min-h-full p-8 pb-24">
              <SettingsView 
                config={config} 
                onUpdateConfig={(c) => { setConfig(c); addToast('success', t.settings.savedToast); }} 
                language={language}
                onSetLanguage={setLanguage}
              />
            </div>
          )}
          
          <div className="h-24 md:h-24"></div>
        </div>

        <div className="absolute bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-2">
           <button 
             onClick={() => setIsQueueRunning(!isQueueRunning)}
             className={`flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md transition-all duration-300 shadow-xl group ${
               isQueueRunning 
                 ? 'bg-neutral-900/80 border-green-500/30 text-green-400 hover:border-green-500/60' 
                 : 'bg-neutral-900/80 border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
             }`}
           >
              {isQueueRunning ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span className="text-xs font-bold tracking-wider">{t.status.processing}</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span className="text-xs font-bold tracking-wider">{t.status.paused}</span>
                </>
              )}
              
              <div className="w-px h-3 bg-white/10 mx-1"></div>
              
              <div className="flex gap-3 text-xs font-mono">
                 <span title={t.status.active}>{activeCount}</span>
                 <span className="opacity-30">/</span>
                 <span title={t.status.pending}>{pendingCount}</span>
              </div>
           </button>
        </div>
      </main>
    </div>
  );
};

const CharacterWrapper: React.FC<{characters: SoraCharacter[], setCharacters: (c: SoraCharacter[]) => void}> = ({characters, setCharacters}) => {
  return (
    <div className="h-full">
      <CharacterLibrary isOpen={true} onClose={() => {}} characters={characters} onUpdateCharacters={setCharacters} />
    </div>
  )
}

export default App;
