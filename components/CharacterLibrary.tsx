import React, { useState } from 'react';
import { SoraCharacter } from '../types';
import { X, Plus, Trash2, Edit2, User, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  characters: SoraCharacter[];
  onUpdateCharacters: (chars: SoraCharacter[]) => void;
}

const COLORS = [
  'bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 
  'bg-cyan-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500'
];

const CharacterLibrary: React.FC<Props> = ({ isOpen, onClose, characters, onUpdateCharacters }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null); // 'new' or ID
  const [editForm, setEditForm] = useState<{name: string, username: string}>({ name: '', username: '@' });

  if (!isOpen) return null;

  const handleStartEdit = (char?: SoraCharacter) => {
    if (char) {
      setIsEditing(char.id);
      setEditForm({ name: char.name, username: char.username });
    } else {
      setIsEditing('new');
      setEditForm({ name: '', username: '@' });
    }
  };

  const handleSave = () => {
    if (!editForm.name.trim() || !editForm.username.trim()) return;

    let newUsername = editForm.username.trim();
    if (!newUsername.startsWith('@')) newUsername = '@' + newUsername;

    if (isEditing === 'new') {
      const newChar: SoraCharacter = {
        id: uuidv4(),
        name: editForm.name,
        username: newUsername,
        avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
      onUpdateCharacters([...characters, newChar]);
    } else {
      onUpdateCharacters(characters.map(c => 
        c.id === isEditing 
          ? { ...c, name: editForm.name, username: newUsername }
          : c
      ));
    }
    setIsEditing(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个角色吗？')) {
      onUpdateCharacters(characters.filter(c => c.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              角色库 (Character Library)
            </h2>
            <p className="text-slate-500 text-xs mt-1">管理您的一致性角色，生成时可快速引用</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/50">
          
          {/* Edit/Add Form */}
          {isEditing && (
            <div className="mb-6 bg-slate-900 border border-purple-500/30 rounded-xl p-4 animate-in slide-in-from-top-2">
              <h3 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-wider">
                {isEditing === 'new' ? '添加新角色' : '编辑角色'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">角色名称 (显示用)</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    placeholder="例如：眉毛剪"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">角色 ID (Prompt 引用)</label>
                  <input 
                    type="text" 
                    value={editForm.username}
                    onChange={e => setEditForm({...editForm, username: e.target.value})}
                    placeholder="@meimaojian2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => setIsEditing(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  取消
                </button>
                <button 
                  onClick={handleSave}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" /> 保存
                </button>
              </div>
            </div>
          )}

          {/* Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Add Button */}
            {!isEditing && (
              <button 
                onClick={() => handleStartEdit()}
                className="flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-slate-800 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
              >
                <div className="p-3 bg-slate-800 rounded-full group-hover:bg-purple-500 transition-colors">
                  <Plus className="w-6 h-6 text-slate-400 group-hover:text-white" />
                </div>
                <span className="text-xs font-bold text-slate-500 group-hover:text-purple-400">添加角色</span>
              </button>
            )}

            {characters.map(char => (
              <div key={char.id} className="relative group bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 flex flex-col items-center text-center transition-all">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white mb-3 ${char.avatarColor || 'bg-slate-700'}`}>
                  {char.name[0]}
                </div>
                <h3 className="font-bold text-slate-200 text-sm">{char.name}</h3>
                <code className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded mt-1 font-mono">
                  {char.username}
                </code>

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                  <button 
                    onClick={() => handleStartEdit(char)}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg"
                    title="编辑"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(char.id)}
                    className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {characters.length === 0 && !isEditing && (
             <div className="text-center py-10">
               <p className="text-slate-500 text-sm">暂无角色，点击“添加角色”开始创建。</p>
             </div>
          )}
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
           <span>提示：创建的角色 ID 可在生成视频时自动追加到 Prompt 中。</span>
           <span>共 {characters.length} 个角色</span>
        </div>
      </div>
    </div>
  );
};

export default CharacterLibrary;