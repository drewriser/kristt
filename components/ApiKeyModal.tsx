import React, { useState } from 'react';
import { ApiConfig } from '../types';
import { Key, Lock, AlertTriangle } from 'lucide-react';

interface Props {
  config: ApiConfig;
  onSave: (key: string) => void;
  isOpen: boolean;
}

const ApiKeyModal: React.FC<Props> = ({ config, onSave, isOpen }) => {
  const [key, setKey] = useState(config.apiKey);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-850 border border-gray-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="bg-indigo-600/20 p-6 border-b border-indigo-500/30 flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">需要授权</h2>
            <p className="text-indigo-200 text-sm">请输入您的 APIMart 凭证</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">API 密钥 (Bearer Token)</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
              <input 
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="ey..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <p className="text-xs text-gray-500">您的密钥仅保存在本地浏览器中，刷新页面后可能需要重新输入。</p>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200/80">
              注意：此工具使用真实 API 调用，每次生成都会消耗您的账户余额。建议先使用 1 条简单的提示词进行测试。
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-900/50 flex justify-end">
          <button 
            onClick={() => onSave(key)}
            disabled={!key}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            进入控制台
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;