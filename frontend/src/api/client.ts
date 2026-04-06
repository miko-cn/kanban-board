import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 登录
export const login = async (password: string): Promise<{ token: string }> => {
  const response = await apiClient.post<{ token: string }>('/login', { password });
  return response.data;
};

// Token 管理
const TOKEN_KEY = 'kanban_token';

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// 请求拦截器：自动带上 token
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：token 过期时跳转登录
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Column types
export interface Column {
  id: string;
  title: string;
  order: number;
}

export interface CreateColumnData {
  title: string;
}

export interface UpdateColumnData {
  title?: string;
  order?: number;
}

// Task types
export interface Task {
  id: string;
  columnId: string;
  title: string;
  description: string;
  order: number;
}

export interface CreateTaskData {
  columnId: string;
  title: string;
  description?: string;
}

export interface UpdateTaskData {
  columnId?: string;
  title?: string;
  description?: string;
  order?: number;
}

// Column API
export const getColumns = async (): Promise<Column[]> => {
  const response = await apiClient.get<Column[]>('/columns');
  return response.data;
};

export const createColumn = async (data: CreateColumnData): Promise<Column> => {
  const response = await apiClient.post<Column>('/columns', data);
  return response.data;
};

export const updateColumn = async (id: string, data: UpdateColumnData): Promise<Column> => {
  const response = await apiClient.put<Column>(`/columns/${id}`, data);
  return response.data;
};

export const deleteColumn = async (id: string): Promise<{ success: boolean }> => {
  const response = await apiClient.delete<{ success: boolean }>(`/columns/${id}`);
  return response.data;
};

// Task API
export const getTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get<Task[]>('/tasks');
  return response.data;
};

export const createTask = async (data: CreateTaskData): Promise<Task> => {
  const response = await apiClient.post<Task>('/tasks', data);
  return response.data;
};

export const updateTask = async (id: string, data: UpdateTaskData): Promise<Task> => {
  const response = await apiClient.put<Task>(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: string): Promise<{ success: boolean }> => {
  const response = await apiClient.delete<{ success: boolean }>(`/tasks/${id}`);
  return response.data;
};

export const archiveCompletedTasks = async (): Promise<{ archived: number; total: number }> => {
  const response = await apiClient.post<{ archived: number; total: number }>('/tasks/archive');
  return response.data;
};

export default apiClient;