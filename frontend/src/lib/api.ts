const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const DEFAULT_TOKEN = 'bearer-static-token-three-way-match-2026';

function getToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || DEFAULT_TOKEN;
  }
  return DEFAULT_TOKEN;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    ...(options.headers as Record<string, string> || {})
  };

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errMsg = `API error ${res.status}`;
    try {
      const errBody = await res.json();
      errMsg = errBody.error || errBody.message || errMsg;
    } catch (e) {
      // ignore json parse error
    }
    throw new Error(errMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  async login(username?: string, password?: string) {
    const data = await request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  async fetchMatch(poNumber: string) {
    return request<any>(`/match/${encodeURIComponent(poNumber)}`);
  },

  async fetchSummary(poNumber: string) {
    return request<any>(`/summary/${encodeURIComponent(poNumber)}`);
  },

  async fetchDocuments(poNumber?: string, type?: string) {
    const params = new URLSearchParams();
    if (poNumber) params.set('poNumber', poNumber);
    if (type) params.set('type', type);
    return request<{ count: number; documents: any[] }>(`/documents?${params.toString()}`);
  },

  async uploadDocument(formData: FormData) {
    return request<any>('/documents/upload', {
      method: 'POST',
      body: formData
    });
  },

  async fetchSkus(search?: string, page = 1) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    return request<{ total: number; skus: any[] }>(`/masters/sku?${params.toString()}`);
  },

  async createSku(skuData: any) {
    return request<any>('/masters/sku', {
      method: 'POST',
      body: JSON.stringify(skuData)
    });
  },

  async updateSku(id: string, skuData: any) {
    return request<any>(`/masters/sku/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(skuData)
    });
  },

  async deleteSku(id: string) {
    return request<any>(`/masters/sku/${id}`, {
      method: 'DELETE'
    });
  },

  async seedSampleData() {
    return request<any>('/seed/sample-data', {
      method: 'POST'
    });
  },

  getFileUrl(docId: string) {
    return `${API_BASE_URL}/documents/${docId}/file`;
  }
};
