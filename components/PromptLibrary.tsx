import React, { useState } from 'react';
import { SoraPrompt } from '../types';
import { Search, Plus, Trash2, Edit2, Play, Copy, Tag, FileText, Save, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  prompts: SoraPrompt[];
  onUpdatePrompts: (prompts: SoraPrompt[]) => void;
  onUsePrompt: (content: string) => void;
}

const PromptLibrary: React.FC<Props> = ({ prompts, onUpdatePrompts, onUsePrompt }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null); // 'new' or ID
  const [editForm, setEditForm] = useState<{title: string, content: string, tags: string}>({ title: '', content: '', tags: '' });

  const filteredPrompts = prompts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartEdit = (prompt?: SoraPrompt) => {
    if (prompt) {
      setIsEditing(prompt.id);
      setEditForm({ title: prompt.title, content: prompt.content, tags: prompt.tags.join(', ') });
    } else {
      setIsEditing('new');
      setEditForm({ title: '', content: '', tags: '' });
    }
  };

  const handleSave = () => {
    if (!editForm.content.trim()) return;

    const tagsArray = editForm.tags.split(',').map(t => t.trim()).filter(t => t);

    if (isEditing === 'new') {
      const newPrompt: SoraPrompt = {
        id: uuidv4(),
        title: editForm.title || '未命名提示词',
        content: editForm.content,
        tags: tagsArray,
        usageCount: 0,
        createdAt: Date.now()
      };
      onUpdatePrompts([newPrompt, ...prompts]);
    } else {
      onUpdatePrompts(prompts.map(p => 
        p.id === isEditing 
          ? { ...p, title: editForm.title, content: editForm.content, tags: tagsArray }
          : p
      ));
    }
    setIsEditing(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条提示词吗？')) {
      onUpdatePrompts(prompts.filter(p => p.id !== id));
    }
  };

  const handleUse = (prompt: SoraPrompt) => {
    // Increment usage count
    onUpdatePrompts(prompts.map(p => 
      p.id === prompt.id ? { ...p, usageCount: p.usageCount + 1 } : p
    ));
    onUsePrompt(prompt.content);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="搜索提示词标题、内容或标签..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => handleStartEdit()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" /> 添加提示词
        </button>
      </div>

      {/* Edit Modal / Form Area */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                {isEditing === 'new' ? '添加新提示词' : '编辑提示词'}
              </h3>
              <button onClick={() => setIsEditing(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400">标题</label>
                <input 
                  type="text" 
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none mt-1"
                  placeholder="给提示词起个名字"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400">Prompt 内容</label>
                <textarea 
                  value={editForm.content}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                  className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none mt-1 resize-none"
                  placeholder="详细的视频描述..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400">标签 (逗号分隔)</label>
                <input 
                  type="text" 
                  value={editForm.tags}
                  onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none mt-1"
                  placeholder="风景, 动漫, 4k..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
              <button 
                onClick={() => setIsEditing(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded-lg"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> 保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid List */}
      <div className="space-y-3">
        {filteredPrompts.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800/50">
             <FileText className="w-12 h-12 text-slate-700 mb-4" />
             <p className="text-slate-500">没有找到提示词</p>
           </div>
        ) : (
          filteredPrompts.map(prompt => (
            <div key={prompt.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/30 transition-all group">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-200">{prompt.title}</h3>
                    <div className="flex gap-1">
                      {prompt.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded-full border border-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50 font-mono">
                    {prompt.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    <span>使用 {prompt.usageCount} 次</span>
                    <span>创建于 {new Date(prompt.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => handleUse(prompt)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
                  >
                    <Play className="w-3.5 h-3.5" /> 使用
                  </button>
                  <button 
                    onClick={() => copyToClipboard(prompt.content)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="复制内容"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleStartEdit(prompt)}
                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(prompt.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="text-center text-xs text-slate-600 pt-4">
        共 {filteredPrompts.length} 条提示词
      </div>
    </div>
  );
};

export default PromptLibrary;