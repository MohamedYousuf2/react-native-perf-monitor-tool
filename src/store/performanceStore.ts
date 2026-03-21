import { NetworkRequest } from '../utils/networkMonitor';

type ComponentMetrics = {
  name: string;
  renderCount: number;
  lastRenderAt: number;
  reasons: string[];
};

type StoreState = {
  components: Record<string, ComponentMetrics>;
  jsLagMs: number | null;
  isLagging: boolean;
  fps: number;
  networkRequests: NetworkRequest[];
};

type Listener = () => void;

function createPerformanceStore() {
  let state: StoreState = {
    components: {},
    jsLagMs: null,
    isLagging: false,
    fps: 60,
    networkRequests: [],
  };

  const listeners = new Set<Listener>();
  const notify = () => listeners.forEach((l) => l());
  let lagClearTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    getState: () => state,

    recordRender(name: string, reasons: string[] = []) {
      const prev = state.components[name];
      state = {
        ...state,
        components: {
          ...state.components,
          [name]: {
            name,
            renderCount: (prev?.renderCount ?? 0) + 1,
            lastRenderAt: Date.now(),
            reasons,
          },
        },
      };
      notify();
    },

    setJSLag(lagMs: number | null) {
      if (lagMs !== null && lagMs > 16) {
        if (lagClearTimer) clearTimeout(lagClearTimer);

        state = {
          ...state,
          jsLagMs: lagMs,
          isLagging: true,
        };
        notify();

        lagClearTimer = setTimeout(() => {
          state = { ...state, jsLagMs: null, isLagging: false };
          notify();
        }, 2000);
      }
    },

    setFps(fps: number) {
      state = { ...state, fps };
      notify();
    },

    setNetworkRequests(networkRequests: NetworkRequest[]) {
      state = { ...state, networkRequests };
      notify();
    },

    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    reset() {
      if (lagClearTimer) clearTimeout(lagClearTimer);
      state = {
        components: {},
        jsLagMs: null,
        isLagging: false,
        fps: 60,
        networkRequests: [],
      };
      notify();
    },
  };
}

export const performanceStore = createPerformanceStore();