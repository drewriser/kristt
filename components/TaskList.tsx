import React, { useState } from 'react';
import { BatchTask, TaskStatus } from '../types';
import { Download, Loader2, AlertCircle, CheckCircle2, Clock, Terminal, ChevronRight, PlayCircle } from 'lucide-react';

interface Props {
  tasks: BatchTask[];
  onRetry: (taskId: string) => void;
  onRemove: (taskId: string) => void;
}

const TaskList: React.FC<Props> = ({ tasks, onRetry, onRemove }) => {
  const [expandedDebugId, setExpandedDebugId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800/50">
        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
          <PlayCircle className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-slate-400 font-medium">任务队列为空</p>
        <p className="text-slate-600 text-xs mt-1">请在左侧输入框添加提示词，开始您的创作</p>
      </div>
    );
  }

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: 
        return <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-950/30 px-2 py-1 rounded border border-green-900/50"><CheckCircle2 className="w-3 h-3"/> 已完成</span>;
      case TaskStatus.FAILED: 
        return <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/30 px-2 py-1 rounded border border-red-900/50"><AlertCircle className="w-3 h-3"/> 失败</span>;
      case TaskStatus.PROCESSING: 
        return <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-950/30 px-2 py-1 rounded border border-yellow-900/50"><Loader2 className="w-3 h-3 animate-spin"/> 生成中</span>;
      case TaskStatus.SUBMITTING: 
        return <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-950/30 px-2 py-1 rounded border border-indigo-900/50"><Loader2 className="w-3 h-3 animate-spin"/> 提交中</span>;
      case TaskStatus.QUEUED: 
        return <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-950/30 px-2 py-1 rounded border border-blue-900/50"><Clock className="w-3 h-3"/> 排队中</span>;
      default: 
        return <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700"><Clock className="w-3 h-3"/> 等待中</span>;
    }
  };

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <div key={task.id} className="group relative bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5">
          <div className="flex items-start justify-between gap-4">
            
            {/* Left Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {getStatusBadge(task.status)}
                <span className="text-[10px] text-slate-500 font-mono tracking-wide">
                  ID: {task.apiTaskId ? task.apiTaskId.slice(0, 12) + '...' : 'PENDING'}
                </span>
              </div>
              <p className="text-sm text-slate-200 line-clamp-2 leading-relaxed font-medium">
                {task.prompt}
              </p>
              
              {task.error && (
                <div className="mt-2 flex items-start gap-2 text-xs text-red-400 bg-red-950/20 p-2 rounded border border-red-900/30">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  {task.error}
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
               {task.status === TaskStatus.COMPLETED && task.videoUrl && (
                <a 
                  href={task.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-green-900/20 transition-all hover:-translate-y-0.5"
                  download
                >
                  <Download className="w-3.5 h-3.5" /> 下载 MP4
                </a>
              )}

              <div className="flex items-center gap-1 bg-slate-950/50 rounded-lg p-1 border border-slate-800">
                 <button
                  onClick={() => setExpandedDebugId(expandedDebugId === task.id ? null : task.id)}
                  className={`p-1.5 rounded-md transition-colors ${expandedDebugId === task.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                  title="查看 API 调试信息"
                >
                  <Terminal className="w-3.5 h-3.5" />
                </button>
                {task.status === TaskStatus.FAILED && (
                  <button 
                    onClick={() => onRetry(task.id)}
                    className="px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                  >
                    重试
                  </button>
                )}
                <button 
                  onClick={() => onRemove(task.id)}
                  className="px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-md transition-colors"
                >
                  移除
                </button>
              </div>
            </div>
          </div>

          {/* Debug Panel */}
          {expandedDebugId === task.id && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/50 rounded-lg border border-slate-800 font-mono text-[10px] leading-4 text-slate-400 overflow-x-auto">
                 <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-indigo-400 uppercase tracking-wider">REQUEST PAYLOAD</span>
                </div>
                 <pre className="text-indigo-300/90 whitespace-pre-wrap">
                    {task.params?.debugPayload ? JSON.stringify(task.params.debugPayload, null, 2) : "// No debug payload recorded"}
                 </pre>
              </div>

              <div className="p-4 bg-black/50 rounded-lg border border-slate-800 font-mono text-[10px] leading-4 text-slate-400 overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-green-500 uppercase tracking-wider">RESPONSE</span>
                  <span className="text-slate-600">{new Date().toLocaleTimeString()}</span>
                </div>
                {task.rawResponse ? (
                  <pre className="text-green-400/90 whitespace-pre-wrap">{JSON.stringify(task.rawResponse, null, 2)}</pre>
                ) : (
                  <span className="italic text-slate-600">Waiting for API response...</span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TaskList;