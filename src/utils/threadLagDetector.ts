const POLL_INTERVAL_MS = 100;
const LAG_THRESHOLD_MS = 50;

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastTickAt: number = Date.now();

let frameCount = 0;
let lastFpsUpdate = Date.now();
let animFrameId: number | null = null;

type LagCallback = (lagMs: number | null) => void;
type FpsCallback = (fps: number) => void;

export function startLagDetection(onLag: LagCallback): () => void {
  lastTickAt = Date.now();

  intervalId = setInterval(() => {
    const now = Date.now();
    const elapsed = now - lastTickAt;
    const lag = elapsed - POLL_INTERVAL_MS;

    if (lag > LAG_THRESHOLD_MS) {
      onLag(lag);
    } else {
      onLag(null);
    }

    lastTickAt = now;
  }, POLL_INTERVAL_MS);

  return () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

export function startFpsDetection(onFps: FpsCallback): () => void {
  frameCount = 0;
  lastFpsUpdate = Date.now();

  const loop = () => {
    frameCount++;
    const now = Date.now();
    const elapsed = now - lastFpsUpdate;

    if (elapsed >= 1000) {
      const fps: number = Math.round((frameCount * 1000) / elapsed);
      onFps(fps);
      frameCount = 0;
      lastFpsUpdate = now;
    }

    animFrameId = requestAnimationFrame(loop);
  };

  animFrameId = requestAnimationFrame(loop);

  return () => {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  };
}