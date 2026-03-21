import { performanceStore } from '../store/performanceStore';
import { NetworkRequest } from './networkMonitor';

let requestId = 0;

function generateId() {
  return `axios-${++requestId}-${Date.now()}`;
}

export function setupAxiosInterceptor(axiosInstance: any) {
  axiosInstance.interceptors.request.use(
    (config: any) => {
      const id = generateId();
      const method = (config.method ?? 'GET').toUpperCase();
      const url = config.url ?? '';
      const baseURL = config.baseURL ?? '';
      const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
      const shortUrl = fullUrl.length > 50
        ? fullUrl.substring(0, 50) + '...'
        : fullUrl;

      const request: NetworkRequest = {
        id,
        method,
        url: shortUrl,
        status: null,
        duration: null,
        startTime: Date.now(),
        error: null,
        state: 'pending',
      };

      config.__perfMonitorId = id;
      config.__perfMonitorStart = Date.now();

      const current = performanceStore.getState().networkRequests;
      performanceStore.setNetworkRequests([...current, request]);

      return config;
    },
    (error: any) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response: any) => {
      const id = response.config.__perfMonitorId;
      const startTime = response.config.__perfMonitorStart;
      const duration = Date.now() - startTime;

      const current = performanceStore.getState().networkRequests;
      const updated = current.map(req =>
        req.id === id
          ? {
              ...req,
              status: response.status,
              duration,
              state: response.status >= 200 && response.status < 300
                ? 'success'
                : 'error',
              error: response.status >= 400
                ? `HTTP ${response.status}`
                : null,
            } as NetworkRequest
          : req
      );

      performanceStore.setNetworkRequests(updated);
      return response;
    },
    (error: any) => {
      const id = error.config?.__perfMonitorId;
      const startTime = error.config?.__perfMonitorStart;
      const duration = startTime ? Date.now() - startTime : 0;

      if (id) {
        const current = performanceStore.getState().networkRequests;
        const updated = current.map(req =>
          req.id === id
            ? {
                ...req,
                duration,
                state: 'error',
                error: error.message ?? 'Request failed',
              } as NetworkRequest
            : req
        );
        performanceStore.setNetworkRequests(updated);
      }

      return Promise.reject(error);
    }
  );
}