import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor to add auth token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('token');
			window.location.href = '/login';
		} else if (error.response?.status === 429) {
			// Handle rate limiting errors
			const retryAfter = error.response?.data?.retryAfter || '15 minutes';
			const errorMessage = error.response?.data?.error || 'Too many requests. Please try again later.';
			console.warn(`Rate limited: ${errorMessage}. Retry after: ${retryAfter}`);
			
			// Show user-friendly error message
			if (window.toast) {
				window.toast.error(`${errorMessage} Please wait ${retryAfter} before trying again.`);
			}
		}
		return Promise.reject(error);
	}
);

export default api;
