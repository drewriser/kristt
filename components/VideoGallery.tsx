import React, { useState } from 'react';
import { BatchTask } from '../types';
import { Check, Trash2, Download, ExternalLink, Film, CheckSquare, Square } from 'lucide-react';
import { forceDownloadVideo } from '../services/soraService';

interface Props {
  videos: BatchTask[]; 
  onDelete: (ids: string[]) => void;
}

const VideoGallery: React.FC<Props> = ({ videos, onDelete }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === videos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(videos.map(v => v.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} videos?`)) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkExport = () => {
    const content = videos
      .filter(v => selectedIds.includes(v.id))
      .map(v => `${v.prompt}\n${v.videoUrl}`)
      .join('\n\n-------------------\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sora_videos_export_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (videos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/20">
        <div className="p-6 rounded-full bg-white/5 mb-4">
           <Film className="w-10 h-10 opacity-50" />
        </div>
        <p className="font-light tracking-wide">Gallery Empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toolbar */}
      <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-4 pl-2">
          <button 
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg text-xs font-medium text-white/60 transition-colors"
          >
            {selectedIds.length === videos.length && videos.length > 0 ? <CheckSquare className="w-4 h-4 text-violet-400" /> : <Square className="w-4 h-4" />}
            Select All
          </button>
          <span className="text-xs text-white/30 font-mono">
             {selectedIds.length} / {videos.length} SELECTED
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <button 
                onClick={handleBulkExport}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors border border-white/5"
              >
                <Download className="w-3.5 h-3.5" /> Export URLs
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-colors border border-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modern Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {videos.map(video => {
          const isSelected = selectedIds.includes(video.id);
          return (
            <div 
              key={video.id} 
              className={`relative group rounded-2xl overflow-hidden aspect-[9/16] bg-black transition-all duration-300 ${isSelected ? 'ring-2 ring-violet-500 scale-[0.98]' : 'hover:scale-[1.02]'}`}
            >
              {/* Select Overlay */}
              <div 
                className="absolute top-3 left-3 z-20 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); toggleSelect(video.id); }}
              >
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors backdrop-blur-md ${isSelected ? 'bg-violet-600 border-violet-500' : 'bg-black/30 border-white/30 hover:bg-black/50'}`}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>

              {/* Video Player */}
              <video 
                src={video.videoUrl} 
                controls 
                playsInline
                className="w-full h-full object-cover"
                preload="metadata"
              />

              {/* Info Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                <p className="text-[10px] text-white/90 line-clamp-2 mb-2 font-medium leading-relaxed">{video.prompt}</p>
                <div className="flex items-center justify-between pointer-events-auto">
                  <div className="flex gap-2">
                     <button
                       onClick={() => forceDownloadVideo(video.videoUrl!, `sora_${video.apiTaskId}.mp4`)}
                       className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-md transition-colors"
                       title="Download"
                     >
                        <Download className="w-3.5 h-3.5" />
                     </button>
                     <a 
                       href={video.videoUrl} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-md transition-colors"
                       title="Open New Tab"
                     >
                       <ExternalLink className="w-3.5 h-3.5" />
                     </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoGallery;