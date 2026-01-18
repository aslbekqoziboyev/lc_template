import { API_BASE_URL } from '../config';
import { User, Student, Course } from '../types';

// Helper for HTTP requests
const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Server bilan aloqa xatosi');
  }

  return data;
};

export const api = {
  // Auth
  login: (credentials: any) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Users
  getUsers: () => request('/api/users'),
  createUser: (user: Partial<User>) =>
    request('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  updateUser: (id: string, updates: Partial<User>) =>
    request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteUser: (id: string) =>
    request(`/api/users/${id}`, {
      method: 'DELETE',
    }),

  // Courses
  getCourses: () => request('/api/courses'),
  createCourse: (course: Partial<Course>) =>
    request('/api/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    }),
  updateCourse: (id: string, updates: Partial<Course>) =>
    request(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteCourse: (id: string) =>
    request(`/api/courses/${id}`, {
      method: 'DELETE',
    }),

  // Students
  getStudents: () => request('/api/students'),
  createStudent: (student: Partial<Student>) =>
    request('/api/students', {
      method: 'POST',
      body: JSON.stringify(student),
    }),
  updateStudent: (id: string, updates: Partial<Student>) =>
    request(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteStudent: (id: string) =>
    request(`/api/students/${id}`, {
      method: 'DELETE',
    }),

  // Devices
  logoutDevice: (userId: string, deviceId: string) =>
    request(`/api/users/${userId}/devices/${deviceId}`, {
      method: 'DELETE',
    }),
};
