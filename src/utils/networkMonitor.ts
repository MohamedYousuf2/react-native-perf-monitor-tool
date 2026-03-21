export type NetworkRequest = {
  id: string;
  method: string;
  url: string;
  status: number | null;
  duration: number | null;
  startTime: number;
  error: string | null;
  state: 'pending' | 'success' | 'error';
};

type NetworkCallback = (requests: NetworkRequest[]) => void;

const requests: Map<string, NetworkRequest> = new Map();
let listeners: NetworkCallback[] = [];
let isIntercepting = false;

function notify() {
  const all = Array.from(requests.values());
  listeners.forEach(l => l(all));
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function startNetworkMonitor(onUpdate: NetworkCallback): () => void {
  listeners.push(onUpdate);

  if (!isIntercepting) {
    interceptFetch();
    isIntercepting = true;
  }

  return () => {
    listeners = listeners.filter(l => l !== onUpdate);
    if (listeners.length === 0) {
      isIntercepting = false;
    }
  };
}

export function clearNetworkRequests() {
  requests.clear();
  notify();
}

function interceptFetch() {
  const originalFetch = global.fetch;

  global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const id = generateId();
    const method = init?.method ?? 'GET';
    const url = typeof input === 'string' ? input : input.toString();
    const startTime = Date.now();

    const request: NetworkRequest = {
      id,
      method: method.toUpperCase(),
      url: url.length > 50 ? url.substring(0, 50) + '...' : url,
      status: null,
      duration: null,
      startTime,
      error: null,
      state: 'pending',
    };

    requests.set(id, request);
    notify();

    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - startTime;

      requests.set(id, {
        ...request,
        status: response.status,
        duration,
        state: response.ok ? 'success' : 'error',
        error: response.ok ? null : `HTTP ${response.status}`,
      });

      notify();
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      requests.set(id, {
        ...request,
        duration,
        state: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      notify();
      throw error;
    }
  };
}