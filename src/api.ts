const API_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// API helper with auth header
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string) => {
    const data = await fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    localStorage.setItem('token', data.token);
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getMe: async () => {
    return fetchWithAuth('/auth/me');
  },
};

// Study Sets API
export const setsAPI = {
  getAll: async () => {
    return fetchWithAuth('/sets');
  },

  getOne: async (id: string) => {
    return fetchWithAuth(`/sets/${id}`);
  },

  create: async (title: string, questions: { questionText: string; correctAnswer: string }[]) => {
    return fetchWithAuth('/sets', {
      method: 'POST',
      body: JSON.stringify({ title, questions }),
    });
  },

  update: async (id: string, title: string, questions: { questionText: string; correctAnswer: string }[]) => {
    return fetchWithAuth(`/sets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, questions }),
    });
  },

  delete: async (id: string) => {
    return fetchWithAuth(`/sets/${id}`, {
      method: 'DELETE',
    });
  },
};
