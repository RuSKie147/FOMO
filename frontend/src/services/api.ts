const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

async function fetchWrapper<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    
    return await res.json() as T;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  login: (email: string, name: string) => 
    fetchWrapper<any>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    }),
    
  submitVibeCheck: (userId: string, answers: string[]) =>
    fetchWrapper<any>('/api/vibe-check', {
      method: 'POST',
      body: JSON.stringify({ userId, answers }),
    }),
    
  getUploadUrl: (fileType: string, fileName: string) =>
    fetchWrapper<any>(`/api/upload-url?fileType=${encodeURIComponent(fileType)}&fileName=${encodeURIComponent(fileName)}`),
    
  createEvent: (data: any) =>
    fetchWrapper<any>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  getFeed: (userId: string, lat: number, lng: number) =>
    fetchWrapper<any>(`/api/events/feed?userId=${userId}&lat=${lat}&lng=${lng}`),
    
  joinEvent: (eventId: string, data: any) =>
    fetchWrapper<any>(`/api/events/${eventId}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
