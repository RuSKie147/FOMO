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
    
  getPendingInvitations: (email: string) =>
    fetchWrapper<any>(`/api/invitations/pending?email=${encodeURIComponent(email)}`),
    
  getInvitation: (inviteId: string) =>
    fetchWrapper<any>(`/api/invitations/${inviteId}`),
    
  acceptInvitation: (inviteId: string, data: { userId: string; name?: string; major?: string; vibeSummary?: string }) =>
    fetchWrapper<any>(`/api/invitations/${inviteId}/accept`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  declineInvitation: (inviteId: string) =>
    fetchWrapper<any>(`/api/invitations/${inviteId}/decline`, {
      method: 'POST',
    }),
    
  sendInvitations: (data: { eventId: string; hostId: string; hostName: string; inviteEmails: string[]; title?: string; category?: string }) =>
    fetchWrapper<any>('/api/invitations/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRecentSentEmails: () =>
    fetchWrapper<{ sentEmails: any[] }>('/api/invitations/sent/recent'),

  leaveEvent: (eventId: string, userId: string) =>
    fetchWrapper<any>(`/api/events/${eventId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  cancelEvent: (eventId: string, hostId: string) =>
    fetchWrapper<any>(`/api/events/${eventId}?hostId=${encodeURIComponent(hostId)}`, {
      method: 'DELETE',
    }),

  getEventMessages: (eventId: string) =>
    fetchWrapper<{ messages: any[] }>(`/api/events/${eventId}/messages`),

  sendEventMessage: (eventId: string, data: { userId: string; userName: string; text: string }) =>
    fetchWrapper<any>(`/api/events/${eventId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadImageToS3: async (uploadUrl: string, file: File) => {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.statusText}`);
    }
    return res;
  },
};
