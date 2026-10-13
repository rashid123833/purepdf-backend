import { User, HistoryItem, Transaction, PlatformSettings, AdminStats } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('pdf_genius_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('pdf_genius_token', token);
  } else {
    localStorage.removeItem('pdf_genius_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Only set application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = 'An error occurred';
    try {
      const errJson = await res.json();
      errMessage = errJson.error || errJson.message || errMessage;
    } catch (e) {
      errMessage = res.statusText || errMessage;
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string): Promise<{ user: User; token: string; message: string }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async login(email: string, password: string): Promise<{ user: User; token: string; message: string }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<{ user: User; settings: PlatformSettings }> {
    return request('/auth/me');
  },

  async updateProfile(data: { name?: string; currentPassword?: string; newPassword?: string }): Promise<{ user: User; message: string }> {
    return request('/auth/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PDF tools
  async mergePdfs(files: File[]): Promise<Blob> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/pdf/merge`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to merge PDFs' }));
      throw new Error(err.error || 'Failed to merge PDFs');
    }
    return res.blob();
  },

  async splitPdf(file: File, pages: string): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pages', pages);

    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/pdf/split`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to split PDF' }));
      throw new Error(err.error || 'Failed to split PDF');
    }
    return res.blob();
  },

  async compressPdf(file: File, level: 'screen' | 'ebook' = 'ebook'): Promise<{ blob: Blob; percentSaved: number; originalSize: number; compressedSize: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('level', level);

    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/pdf/compress`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to compress PDF' }));
      throw new Error(err.error || 'Failed to compress PDF');
    }

    const percentSaved = parseInt(res.headers.get('X-Percent-Saved') || '0', 10);
    const originalSize = parseInt(res.headers.get('X-Original-Size') || file.size.toString(), 10);
    const compressedSize = parseInt(res.headers.get('X-Compressed-Size') || '0', 10);
    const blob = await res.blob();

    return { blob, percentSaved, originalSize, compressedSize };
  },

  async protectPdf(file: File, password: string): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/pdf/protect`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to encrypt PDF' }));
      throw new Error(err.error || 'Failed to encrypt PDF');
    }
    return res.blob();
  },

  async watermarkPdf(
    file: File,
    options: { text: string; fontSize: number; opacity: number; rotation: number; color: string }
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('text', options.text);
    formData.append('fontSize', options.fontSize.toString());
    formData.append('opacity', options.opacity.toString());
    formData.append('rotation', options.rotation.toString());
    formData.append('color', options.color);

    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/pdf/watermark`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to watermark PDF' }));
      throw new Error(err.error || 'Failed to watermark PDF');
    }
    return res.blob();
  },

  async imagesToPdf(files: File[]): Promise<Blob> {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));

    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/pdf/image-to-pdf`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to convert images to PDF' }));
      throw new Error(err.error || 'Failed to convert images to PDF');
    }
    return res.blob();
  },

  async extractText(file: File): Promise<{ text: string; numPages: number; fileName: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/pdf/extract-text`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to extract text from PDF' }));
      throw new Error(err.error || 'Failed to extract text');
    }
    return res.json();
  },

  // AI tools
  async summarize(text: string, fileName: string): Promise<{ summary: string }> {
    return request('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ text, fileName }),
    });
  },

  async chat(
    text: string,
    fileName: string,
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<{ reply: string }> {
    return request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ text, fileName, message, history }),
    });
  },

  async extractKeyPoints(text: string, fileName: string): Promise<{ keyPoints: string }> {
    return request('/ai/key-points', {
      method: 'POST',
      body: JSON.stringify({ text, fileName }),
    });
  },

  async generateQA(text: string, fileName: string, question?: string): Promise<{ qa: string }> {
    return request('/ai/qa', {
      method: 'POST',
      body: JSON.stringify({ text, fileName, question }),
    });
  },

  // History & Upgrade
  async getHistory(): Promise<{ history: HistoryItem[] }> {
    return request('/user/history');
  },

  async upgradePlan(paymentMethod: string, transactionRef?: string): Promise<{ success: boolean; user: User; transaction: Transaction; message: string }> {
    return request('/user/upgrade', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, transactionRef }),
    });
  },

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    return request('/admin/stats');
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    return request('/admin/users');
  },

  async toggleUserPlan(userId: string, plan: 'free' | 'pro'): Promise<{ user: User; message: string }> {
    return request('/admin/toggle-pro', {
      method: 'POST',
      body: JSON.stringify({ userId, plan }),
    });
  },

  async resetUserQuota(userId: string): Promise<{ user: User; message: string }> {
    return request('/admin/reset-quota', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    return request(`/admin/user/${userId}`, {
      method: 'DELETE',
    });
  },

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'pending'): Promise<{ user: User; message: string }> {
    return request('/admin/user-status', {
      method: 'POST',
      body: JSON.stringify({ userId, status }),
    });
  },

  async approveUser(userId: string, plan?: 'free' | 'pro'): Promise<{ user: User; message: string }> {
    return request('/admin/approve-user', {
      method: 'POST',
      body: JSON.stringify({ userId, plan }),
    });
  },

  async rejectUser(userId: string): Promise<{ user: User; message: string }> {
    return request('/admin/reject-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async getAdminTransactions(): Promise<{ transactions: Transaction[] }> {
    return request('/admin/transactions');
  },

  async getSettings(): Promise<{ settings: PlatformSettings }> {
    return request('/admin/settings');
  },

  async updateSettings(settings: Partial<PlatformSettings>): Promise<{ settings: PlatformSettings; message: string }> {
    return request('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  async getDatabaseInfo(): Promise<{
    database: {
      engine: string;
      host: string;
      dbName: string;
      dbUser: string;
      website: string;
      connected: boolean;
      statusMessage: string;
    };
    sqlScript: string;
  }> {
    return request('/admin/database-info');
  },

  async testMySQL(): Promise<{
    connected: boolean;
    statusMessage: string;
    dbName: string;
    dbUser: string;
  }> {
    return request('/admin/test-mysql', { method: 'POST' });
  },

  async getPublicFilesList(): Promise<{
    files: Array<{ name: string; path: string; size: number; isDir: boolean }>;
    zipSize: number;
    fullstackSize: number;
  }> {
    return request('/download/public-files-list');
  },

  async getFileContent(fileKey: string): Promise<{ content: string }> {
    return request(`/download/content/${fileKey}`);
  },
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 200);
}

export async function downloadFileViaBlob(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed with status ${res.status}`);
  }
  const blob = await res.blob();
  downloadBlob(blob, filename);
}

