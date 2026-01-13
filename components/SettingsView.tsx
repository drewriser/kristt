import React, { useState } from 'react';
import { ApiConfig, Language, ApiProvider } from '../types';
import { Key, Globe, ShieldAlert, Settings, Languages, ChevronDown, Wallet, Loader2, Download, Zap, Edit3, Server } from 'lucide-react';
import { getTranslation } from '../locales';
import { fetchBalance } from '../services/soraService';

interface Props {
  config: ApiConfig;
  onUpdateConfig: (config: ApiConfig) => void;
  language: Language;
  onSetLanguage: (lang: Language) => void;
}

const PROVIDER_DEFAULTS = {
  apimart: {
    url: 'https://api.apimart.ai',
    key: '' 
  },
  kie: {
    url: 'https://api.kie.ai',
    key: '' 
  }
};

const SettingsView: React.FC<Props> = ({ config, onUpdateConfig, language, onSetLanguage }) => {
  const [localKey, setLocalKey] = useState(config.apiKey);
  const [localUrl, setLocalUrl] = useState(config.baseUrl);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Custom model state
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState(config.model);

  const t = getTranslation(language).settings;

  const handleSave = () => {
    onUpdateConfig({
      ...config,
      apiKey: localKey,
      baseUrl: localUrl,
      model: customModelName as any // Allow string override
    });
  };

  const handleProviderChange = (provider: ApiProvider) => {
    const defaults = PROVIDER_DEFAULTS[provider];
    const newUrl = defaults.url;
    // Keep current key if switching unless empty, or use default if exists (which is empty now)
    const newKey = localKey || defaults.key; 

    setLocalUrl(newUrl);
    setLocalKey(newKey);
    
    onUpdateConfig({
      ...config,
      provider,
      baseUrl: newUrl,
      apiKey: newKey,
      // Reset endpoint pattern for Apimart if switching back, Kie uses fixed paths in service
      queryEndpointPattern: provider === 'apimart' ? '/v1/tasks/{id}' : config.queryEndpointPattern 
    });
  };

  const handleCheckBalance = async () => {
    setIsLoadingBalance(true);
    const res = await fetchBalance({ ...config, apiKey: localKey, baseUrl: localUrl });
    setBalanceData(res);
    setIsLoadingBalance(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-neutral-800 rounded-xl">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{t.title}</h2>
          <p className="text-neutral-500">{t.subtitle}</p>
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Languages className="w-5 h-5 text-neutral-400" />
          {t.language}
        </h3>
        
        <div className="flex gap-3">
           <button 
             onClick={() => onSetLanguage('zh')}
             className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${
               language === 'zh' 
                 ? 'bg-white text-black border-white' 
                 : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-white'
             }`}
           >
             中文 (Chinese)
           </button>
           <button 
             onClick={() => onSetLanguage('en')}
             className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${
               language === 'en' 
                 ? 'bg-white text-black border-white' 
                 : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-white'
             }`}
           >
             English
           </button>
        </div>
      </div>

      {/* API Provider Selection */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-neutral-400" />
          API Provider
        </h3>
        <div className="grid grid-cols-2 gap-4">
             <button
               onClick={() => handleProviderChange('apimart')}
               className={`flex flex-col items-start p-4 rounded-xl border transition-all ${config.provider === 'apimart' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
             >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-bold">APIMart</span>
                  {config.provider === 'apimart' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                </div>
                <span className="text-[10px] opacity-70">Standard Sora-2 API</span>
             </button>
             <button
               onClick={() => handleProviderChange('kie')}
               className={`flex flex-col items-start p-4 rounded-xl border transition-all ${config.provider === 'kie' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
             >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-bold">Kie.ai</span>
                  {config.provider === 'kie' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                </div>
                <span className="text-[10px] opacity-70">New Alternative</span>
             </button>
        </div>
      </div>

      {/* Global Config Section (Model & Auto) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-neutral-400" />
          Global Parameters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auto Download */}
            <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-900 rounded-lg text-indigo-400">
                    <Download className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-neutral-200">Auto Download</p>
                    <p className="text-xs text-neutral-500">Save to disk on finish</p>
                </div>
            </div>
            <button 
                onClick={() => onUpdateConfig({...config, autoDownload: !config.autoDownload})}
                className={`relative w-12 h-6 rounded-full transition-colors ${config.autoDownload ? 'bg-indigo-600' : 'bg-neutral-800'}`}
            >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config.autoDownload ? 'translate-x-6' : ''}`} />
            </button>
            </div>

            {/* Model Name Override */}
             <div className="flex flex-col gap-2 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                 <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-neutral-200">Default Model ID</label>
                    <button onClick={() => setIsCustomModel(!isCustomModel)} className="text-xs text-indigo-400 flex items-center gap-1">
                        <Edit3 className="w-3 h-3"/> Edit
                    </button>
                 </div>
                 {isCustomModel ? (
                     <input 
                       type="text" 
                       value={customModelName}
                       onChange={(e) => setCustomModelName(e.target.value as any)}
                       className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white focus:border-indigo-500 outline-none"
                     />
                 ) : (
                     <p className="text-xs text-neutral-500 font-mono bg-neutral-900 px-2 py-1 rounded">
                        {customModelName}
                     </p>
                 )}
                 <p className="text-[10px] text-neutral-600">
                    Active: <span className="text-indigo-400">{config.provider === 'kie' ? 'sora-2-text-to-video (Fixed)' : customModelName}</span>
                 </p>
             </div>
        </div>
      </div>

      {/* API Key Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-neutral-400" />
            {t.auth}
            </h3>
             <button 
              onClick={handleCheckBalance}
              disabled={isLoadingBalance || config.provider === 'kie'}
              className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-950/30 px-3 py-1.5 rounded-lg border border-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingBalance ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wallet className="w-3 h-3" />}
              Check Balance
            </button>
        </div>

        {/* Balance Display */}
        {balanceData && (
            <div className={`p-3 rounded-xl border text-sm flex justify-between items-center animate-in slide-in-from-top-2 ${balanceData.success ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200' : 'bg-red-950/30 border-red-500/30 text-red-300'}`}>
                {balanceData.success ? (
                    <>
                        <div className="flex gap-4">
                            <span>Remaining: <span className="font-bold text-white">{balanceData.unlimited_quota ? '∞' : balanceData.remain_balance}</span></span>
                            <span>Used: <span className="text-white">{balanceData.used_balance}</span></span>
                        </div>
                         {balanceData.unlimited_quota && <span className="text-[10px] bg-indigo-500 text-white px-1.5 rounded font-bold">UNLIMITED</span>}
                    </>
                ) : (
                    <span>Error: {balanceData.message}</span>
                )}
            </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-400">API Key (Bearer Token)</label>
          <div className="flex gap-3">
            <input 
              type="password"
              value={localKey}
              onChange={e => setLocalKey(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white outline-none placeholder-neutral-700"
              placeholder={t.apiKeyPlaceholder}
            />
            <button 
              onClick={handleSave}
              className="px-6 py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl transition-colors"
            >
              {t.save}
            </button>
          </div>
          <p className="text-xs text-neutral-600">{t.helpText}</p>
        </div>
      </div>

      {/* Connection Settings */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-neutral-400" />
          {t.connection}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">{t.baseUrl}</label>
            <input 
              type="text"
              value={localUrl}
              onChange={e => setLocalUrl(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-white outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">{t.concurrency}</label>
             <select 
               value={config.concurrency}
               onChange={e => onUpdateConfig({...config, concurrency: Number(e.target.value)})}
               className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-white outline-none"
             >
               <option value="1">1 ({t.safe})</option>
               <option value="2">2 ({t.fast})</option>
               <option value="5">5 ({t.turbo})</option>
             </select>
          </div>
        </div>
      </div>

      <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl flex gap-3">
         <ShieldAlert className="w-6 h-6 text-neutral-500 shrink-0" />
         <div>
            <p className="text-neutral-400 text-xs mt-1">
               {t.helpText}
            </p>
         </div>
      </div>
    </div>
  );
};

export default SettingsView;
