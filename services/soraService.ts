import { ApiConfig, BatchTask, TaskStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface GenerateResponse {
  code?: number;
  data?: {
    status: string;
    task_id: string; // Sometimes returned as id or task_id
    id?: string;
    message?: string;
    taskId?: string; // Kie specific
  } | Array<any>;
  error?: {
    code: number | string;
    message: string;
    type: string;
  };
}

/**
 * Helper to ensure Base URL doesn't have trailing slash
 */
const cleanUrl = (url: string) => url.replace(/\/$/, '');

/**
 * Helper to extract video URL (APIMart Logic)
 */
const extractApimartVideoUrl = (item: any): string | undefined => {
  if (!item) return undefined;

  // 1. Check 'result' object (Primary path from docs)
  if (item.result) {
    // Videos
    if (item.result.videos && Array.isArray(item.result.videos) && item.result.videos.length > 0) {
      const videoObj = item.result.videos[0];
      if (Array.isArray(videoObj.url) && videoObj.url.length > 0) return videoObj.url[0];
      if (typeof videoObj.url === 'string') return videoObj.url;
    }
    // Images
    if (item.result.images && Array.isArray(item.result.images) && item.result.images.length > 0) {
      const imgObj = item.result.images[0];
      if (Array.isArray(imgObj.url) && imgObj.url.length > 0) return imgObj.url[0];
      if (typeof imgObj.url === 'string') return imgObj.url;
    }
  }

  // 2. Fallbacks
  if (typeof item.video_url === 'string') return item.video_url;
  if (typeof item.url === 'string') return item.url;
  if (typeof item.output?.url === 'string') return item.output.url;
  if (typeof item.result_url === 'string') return item.result_url;

  return undefined;
};

/**
 * Fetch API Token Balance
 */
export const fetchBalance = async (config: ApiConfig): Promise<{ success: boolean; remain_balance?: number; used_balance?: number; unlimited_quota?: boolean; message?: string }> => {
  try {
    const baseUrl = cleanUrl(config.baseUrl);
    
    // Kie doesn't document a balance endpoint yet, so we skip or try generic
    if (config.provider === 'kie') {
       return { success: false, message: 'Balance check not supported for Kie provider' };
    }

    const response = await fetch(`${baseUrl}/v1/balance`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
    });
    return await response.json();
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
};

/**
 * Submits a prompt to the API (Video Generation)
 */
export const submitGenerationTask = async (
  prompt: string,
  config: ApiConfig
): Promise<{ success: boolean; apiTaskId?: string; error?: string; debugPayload?: any }> => {
  const baseUrl = cleanUrl(config.baseUrl);
  
  // --- PROVIDER SWITCHING ---
  
  if (config.provider === 'kie') {
    // === KIE.AI LOGIC ===
    // Mapping 16:9 -> landscape, 9:16 -> portrait
    const aspectRatioMap: Record<string, string> = {
        '16:9': 'landscape',
        '9:16': 'portrait'
    };
    
    // Ensure duration is string "10" or "15"
    let dur = config.duration.toString();
    if (dur !== "10" && dur !== "15") dur = "15"; // fallback

    const payload = {
      model: 'sora-2-text-to-video', // Fixed model ID for Kie
      input: {
        prompt: prompt,
        aspect_ratio: aspectRatioMap[config.aspectRatio] || 'landscape',
        n_frames: dur, 
        remove_watermark: !config.watermark, // If watermark is true (show), remove is false. If false (hide), remove is true.
      }
    };

    console.log('[SoraService][Kie] Submitting:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${baseUrl}/api/v1/jobs/createTask`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.status !== 200 || result.code !== 200) {
        return { success: false, error: result.msg || `Error ${response.status}`, debugPayload: payload };
      }

      const taskId = result.data?.taskId;
      if (taskId) {
        return { success: true, apiTaskId: taskId, debugPayload: payload };
      } else {
         return { success: false, error: 'No taskId in Kie response', debugPayload: payload };
      }

    } catch (err: any) {
       return { success: false, error: err.message || 'Kie Network Error', debugPayload: payload };
    }

  } else {
    // === APIMART / STANDARD LOGIC ===
    const model = config.model || 'sora-2';
    
    let duration = typeof config.duration === 'string' ? parseInt(config.duration, 10) : config.duration;
    // Strict duration check for base model
    if (model === 'sora-2' && duration > 15) {
        duration = 15;
    }
    
    // Construct Payload DEFENSIVELY
    // Do not include keys if they are null/undefined/false to prevent 'invalid_request'
    const payload: any = {
      model: model,
      prompt: prompt,
      duration: duration,
      aspect_ratio: config.aspectRatio || '16:9',
    };

    // Optional boolean flags - only add if TRUE (or explicit logic required)
    if (config.isPrivate) payload.private = true;
    if (config.watermark) payload.watermark = true;
    if (config.thumbnail) payload.thumbnail = true;
    if (config.storyboard) payload.storyboard = true;
    
    // Style - only add if not 'none' and not empty
    if (config.style && config.style !== 'none') {
        payload.style = config.style;
    }

    // Image URLs - STRICT CHECK
    if (config.imageUrls && Array.isArray(config.imageUrls)) {
      const validUrls = config.imageUrls.filter(u => u && u.trim().length > 0 && u.startsWith('http'));
      if (validUrls.length > 0) {
          payload.image_urls = validUrls;
      }
    }

    // Character Params - STRICT CHECK (Do not send empty strings)
    if (config.characterUrl && config.characterUrl.trim().length > 5) {
        payload.character_url = config.characterUrl.trim();
    }
    
    if (config.characterTimestamps && config.characterTimestamps.trim().length > 0) {
        payload.character_timestamps = config.characterTimestamps.trim();
    }

    console.log('[SoraService][Apimart] Submitting:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${baseUrl}/v1/videos/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 402) {
         return { success: false, error: 'Payment Required: Insufficient Balance', debugPayload: payload };
      }

      const result: GenerateResponse = await response.json();

      if (response.status !== 200 || (result.code && result.code !== 200)) {
        let errorMsg = 'Unknown Error';
        if (result.error && typeof result.error === 'object') {
            errorMsg = result.error.message || JSON.stringify(result.error);
        } else if (result.data && (result.data as any).message) {
            errorMsg = (result.data as any).message;
        } else if (result.error && typeof result.error === 'string') {
            errorMsg = result.error;
        } else {
            errorMsg = JSON.stringify(result);
        }
        return { success: false, error: `API Error ${response.status}: ${errorMsg}`, debugPayload: payload };
      }

      const taskData = Array.isArray(result.data) ? result.data[0] : result.data;
      const taskId = taskData?.task_id || taskData?.id;

      if (taskId) {
        return { success: true, apiTaskId: taskId, debugPayload: payload };
      } else {
        return { success: false, error: 'No task_id received in response', debugPayload: payload };
      }

    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Failed to fetch')) {
          return { success: false, error: 'Network Error: Browser blocked request (CORS) or API unreachable.', debugPayload: payload };
      }
      return { success: false, error: msg || 'Network error', debugPayload: payload };
    }
  }
};

/**
 * Submits a REMIX task (Apimart Only for now)
 */
export const remixGenerationTask = async (
  videoId: string,
  prompt: string,
  config: ApiConfig
): Promise<{ success: boolean; apiTaskId?: string; error?: string }> => {
  if (config.provider === 'kie') {
    return { success: false, error: 'Remix not supported for Kie provider yet.' };
  }

  try {
    const baseUrl = cleanUrl(config.baseUrl);
    const payload: any = {
      model: config.model,
      prompt: prompt,
      duration: config.duration,
      aspect_ratio: config.aspectRatio,
    };

    const response = await fetch(`${baseUrl}/v1/videos/${videoId}/remix`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (response.status === 402) return { success: false, error: 'Payment Required' };

    const result: any = await response.json();
    if (response.status !== 200) {
      const errorMsg = result.error?.message || JSON.stringify(result);
      return { success: false, error: `Remix Error ${response.status}: ${errorMsg}` };
    }

    const taskData = Array.isArray(result.data) ? result.data[0] : result.data;
    const taskId = taskData?.task_id || taskData?.id;

    if (taskId) {
      return { success: true, apiTaskId: taskId };
    } else {
      return { success: false, error: 'No task_id for remix' };
    }

  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
};

/**
 * Fetch Task History (Sync)
 */
export const fetchTaskHistory = async (config: ApiConfig): Promise<{ tasks: BatchTask[], error?: string }> => {
  // Kie doesn't document a "list tasks" endpoint, so we only support sync for Apimart
  if (config.provider === 'kie') {
    return { tasks: [] };
  }

  const baseUrl = cleanUrl(config.baseUrl);
  const configuredEndpoint = config.historyEndpointPattern || '/v1/tasks';
  
  const candidates = [
    configuredEndpoint,
    '/v1/tasks?limit=50',                       
    '/v1/tasks/list?limit=50',                  
    '/v1/videos/generations?page=1&limit=50',
    '/v1/history?limit=50'
  ];

  const uniqueCandidates = [...new Set(candidates)];
  let lastErrorMsg = '';

  for (const endpoint of uniqueCandidates) {
    try {
      const url = `${baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${config.apiKey}` },
      });

      if (response.status === 401) {
         return { tasks: [], error: 'Authentication Failed (401). Check API Key.' };
      }
      
      if (response.status !== 200) {
         lastErrorMsg = `HTTP ${response.status}`;
         continue;
      }

      const json = await response.json();
      
      let list: any[] = [];
      if (Array.isArray(json)) list = json;
      else if (Array.isArray(json.data)) list = json.data;
      else if (Array.isArray(json.list)) list = json.list;
      else if (json.data && typeof json.data === 'object' && Array.isArray(json.data.list)) list = json.data.list;

      const validItems = list.filter((i: any) => i.id || i.task_id);
      
      if (validItems.length > 0) {
         const tasks = validItems.map((item: any) => {
             const apiTaskId = item.task_id || item.id || item.uuid;
             let status = TaskStatus.PROCESSING;
             const s = (item.status || item.state || '').toLowerCase();
             if (['succeeded', 'success', 'completed', 'done'].includes(s)) status = TaskStatus.COMPLETED;
             else if (['failed', 'error', 'rejected'].includes(s)) status = TaskStatus.FAILED;
             else if (['queued', 'pending', 'waiting'].includes(s)) status = TaskStatus.QUEUED;

             const videoUrl = extractApimartVideoUrl(item);
             const prompt = item.prompt || item.input?.prompt || 'Synced Task';
             const createdAtRaw = item.created_at || item.created || Date.now();
             const createdAt = typeof createdAtRaw === 'number' && createdAtRaw < 10000000000 ? createdAtRaw * 1000 : new Date(createdAtRaw).getTime();

             return {
                id: uuidv4(),
                apiTaskId,
                prompt,
                status,
                videoUrl,
                createdAt: createdAt || Date.now(),
                rawResponse: item
             } as BatchTask;
         });

         return { tasks };
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('Failed to fetch') || e.message.includes('NetworkError'))) {
          // Silent fail on CORS
          return { tasks: [] }; 
      }
      lastErrorMsg = e.message;
    }
  }

  return { tasks: [] };
};

/**
 * Checks the status of a specific task
 */
export const checkTaskStatus = async (
  apiTaskId: string,
  config: ApiConfig
): Promise<{ 
  status: TaskStatus; 
  videoUrl?: string; 
  rawResponse?: any; 
  error?: string 
}> => {
  const baseUrl = cleanUrl(config.baseUrl);

  try {
    // === KIE.AI LOGIC ===
    if (config.provider === 'kie') {
        const response = await fetch(`${baseUrl}/api/v1/jobs/recordInfo?taskId=${apiTaskId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${config.apiKey}` },
        });

        if (response.status === 402) return { status: TaskStatus.FAILED, error: '402 Payment Required' };
        if (response.status !== 200) return { status: TaskStatus.PROCESSING, error: `HTTP ${response.status}`, rawResponse: { status: response.status } };

        const result = await response.json();
        const data = result.data || {};
        const state = (data.state || '').toLowerCase(); // waiting, success, fail
        
        // Status Mapping
        let status = TaskStatus.PROCESSING;
        if (state === 'success') status = TaskStatus.COMPLETED;
        else if (state === 'fail') status = TaskStatus.FAILED;
        else if (state === 'waiting') status = TaskStatus.PROCESSING; // Covers queued

        // Result Parsing
        let videoUrl = undefined;
        let error = undefined;

        if (status === TaskStatus.COMPLETED && data.resultJson) {
            try {
                // Kie returns resultJson as a nested string containing resultUrls array
                const parsed = JSON.parse(data.resultJson);
                if (parsed.resultUrls && parsed.resultUrls.length > 0) {
                    videoUrl = parsed.resultUrls[0];
                }
            } catch (e) {
                console.error('Failed to parse Kie resultJson', e);
            }
        } else if (status === TaskStatus.FAILED) {
            error = data.failMsg || 'Task failed';
        }

        return { status, videoUrl, error, rawResponse: result };

    } else {
        // === APIMART LOGIC ===
        const mainEndpoint = config.queryEndpointPattern.replace('{id}', apiTaskId);
        const suffix = mainEndpoint.includes('?') ? '&language=zh' : '?language=zh';
        const mainUrl = `${baseUrl}${mainEndpoint}${suffix}`;
        
        const response = await fetch(mainUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${config.apiKey}` },
        });

        if (response.status === 402) return { status: TaskStatus.FAILED, error: '402 Payment Required' };
        if (response.status === 401) return { status: TaskStatus.FAILED, error: '401 Unauthorized' };
        
        if (response.status !== 200) {
            return { status: TaskStatus.PROCESSING, error: `HTTP ${response.status}`, rawResponse: { status: response.status } };
        }

        const result = await response.json();
        const dataObj = result.data || result;
        const apiStatus = (dataObj.status || '').toLowerCase();

        if (['succeeded', 'completed', 'success'].includes(apiStatus)) {
            const videoUrl = extractApimartVideoUrl(dataObj);
            return { status: TaskStatus.COMPLETED, videoUrl, rawResponse: result };
        } else if (['failed', 'error', 'cancelled'].includes(apiStatus)) {
            return { status: TaskStatus.FAILED, error: dataObj.error?.message || dataObj.reason || 'Task Failed', rawResponse: result };
        } else {
            return { status: TaskStatus.PROCESSING, rawResponse: result };
        }
    }

  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('Failed to fetch')) {
        return { status: TaskStatus.PROCESSING, error: 'Network Error (CORS)', rawResponse: { error: msg } };
    }
    return { status: TaskStatus.PROCESSING, error: msg, rawResponse: { error: msg } };
  }
};

export const forceDownloadVideo = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } catch (e) {
    window.open(url, '_blank');
  }
};
