
export enum TaskStatus {
  PENDING = 'PENDING',
  SUBMITTING = 'SUBMITTING',
  QUEUED = 'QUEUED', // Submitted to API, waiting for start
  PROCESSING = 'PROCESSING', // API is working
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type Language = 'zh' | 'en';

export interface BatchTask {
  id: string; // Local UUID
  apiTaskId?: string; // ID from APIMart/Kie
  prompt: string;
  status: TaskStatus;
  videoUrl?: string;
  progress?: number; // Estimated progress (0-100)
  error?: string;
  createdAt: number;
  completedAt?: number;
  rawResponse?: any; // For debugging the unknown JSON structure
  params?: any; // Store the config used for this specific task
}

export interface SoraCharacter {
  id: string;
  name: string;
  username: string; // The @tag, e.g., @meimaojian2
  avatarColor?: string; // CSS color class for UI
}

export interface SoraPrompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  usageCount: number;
  createdAt: number;
}

export type SoraModel = 'sora-2' | 'sora-2-pro';

export type SoraStyle = 'none' | 'thanksgiving' | 'comic' | 'news' | 'selfie' | 'nostalgic' | 'anime';

export type ApiProvider = 'apimart' | 'kie';

export interface ApiConfig {
  provider: ApiProvider; // New: Select API Provider
  apiKey: string;
  baseUrl: string;
  queryEndpointPattern: string; // e.g., /v1/tasks/{id}
  historyEndpointPattern: string; // e.g., /v1/tasks
  concurrency: number; // 1 for safe mode
  autoDownload: boolean; // Auto download video when completed
  
  // Sora Specifics (Generation Params)
  model: SoraModel; 
  aspectRatio: string;
  duration: number;
  style: SoraStyle;
  isPrivate: boolean;

  // Advanced / New Features
  imageUrls: string[]; // For image-to-video
  watermark: boolean;
  thumbnail: boolean;
  storyboard: boolean;
  characterUrl: string; // Reference character video URL
  characterTimestamps: string; // "start,end"
  
  // Character Selection
  selectedCharacterIds: string[]; // List of IDs to append to prompt
}

export const DEFAULT_CONFIG: ApiConfig = {
  provider: 'apimart',
  apiKey: '', // Default is empty, user must input.
  baseUrl: 'https://api.apimart.ai',
  queryEndpointPattern: '/v1/tasks/{id}',
  historyEndpointPattern: '/v1/tasks', 
  concurrency: 1,
  autoDownload: true, 
  
  // Sora Defaults
  model: 'sora-2',
  aspectRatio: '9:16', // Vertical default
  duration: 10, // 10s default
  style: 'none',
  isPrivate: false,

  // Advanced Defaults
  imageUrls: [],
  watermark: false,
  thumbnail: false,
  storyboard: false,
  characterUrl: '',
  characterTimestamps: '',
  
  selectedCharacterIds: [],
};

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
