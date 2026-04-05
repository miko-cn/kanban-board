import axios from 'axios';

// 自动适配当前地址的后端 API
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:3001/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  try {
    const response = await apiClient.get<Column[]>('/columns');
    return response.data;
  } catch (error) {
    console.error('Error fetching columns:', error);
    throw error;
  }
};

export const createColumn = async (data: CreateColumnData): Promise<Column> => {
  try {
    const response = await apiClient.post<Column>('/columns', data);
    return response.data;
  } catch (error) {
    console.error('Error creating column:', error);
    throw error;
  }
};

export const updateColumn = async (id: string, data: UpdateColumnData): Promise<Column> => {
  try {
    const response = await apiClient.put<Column>(`/columns/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating column:', error);
    throw error;
  }
};

export const deleteColumn = async (id: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/columns/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting column:', error);
    throw error;
  }
};

// Task API
export const getTasks = async (): Promise<Task[]> => {
  try {
    const response = await apiClient.get<Task[]>('/tasks');
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const createTask = async (data: CreateTaskData): Promise<Task> => {
  try {
    const response = await apiClient.post<Task>('/tasks', data);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (id: string, data: UpdateTaskData): Promise<Task> => {
  try {
    const response = await apiClient.put<Task>(`/tasks/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const archiveCompletedTasks = async (): Promise<{ archived: number; total: number }> => {
  try {
    const response = await apiClient.post<{ archived: number; total: number }>('/tasks/archive');
    return response.data;
  } catch (error) {
    console.error('Error archiving tasks:', error);
    throw error;
  }
};

export default apiClient;