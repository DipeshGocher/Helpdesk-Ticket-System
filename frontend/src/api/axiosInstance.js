import axios from 'axios';

const TOKEN_KEY = 'appzeto_token';
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((requestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

// A bare interceptor can't call useNavigate() itself, so AuthProvider (rendered inside
// BrowserRouter) registers a handler here once it mounts. Default is a no-op so calls
// made before the app finishes mounting never throw.
let unauthorizedHandler = () => {};
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

// Guards against firing twice when two requests in the same 5s poll tick (loadTickets +
// loadStats) both 401 at once - only the first one should trigger a redirect/toast.
let isHandlingUnauthorized = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path));

    // A failed login/register attempt is an expected 401, not a session expiry -
    // must not bounce the user off the login page they're already on.
    if (status === 401 && !isAuthEndpoint && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;
      unauthorizedHandler();
      setTimeout(() => {
        isHandlingUnauthorized = false;
      }, 1000);
    }

    return Promise.reject(error);
  }
);

export default api;
export { TOKEN_KEY };
