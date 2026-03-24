# react-native-perf-monitor-tool

[![npm version](https://img.shields.io/npm/v/react-native-perf-monitor-tool)](https://www.npmjs.com/package/react-native-perf-monitor-tool)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![Expo Go](https://img.shields.io/badge/Expo%20Go-compatible-brightgreen)

A lightweight in-app performance debugging library for React Native.  
No Flipper. No cables. No complex setup. Just add two lines and start debugging.

---

## 🚀 Why this library?

When your React Native app feels slow, finding the cause is hard. Traditional debugging tools often require a desktop connection, complex setups, or simply don't work on real devices.

**react-native-perf-monitor-tool** runs entirely inside your app as a floating overlay, giving you:

- **Real-time Metrics:** Monitor FPS and UI jank directly on your screen.
- **Deep Insights:** See exactly which component re-rendered and the specific props/state that caused it.
- **Network Clarity:** Inspect Fetch and Axios requests without the need for a proxy or cables.
- **Hardware-First:** Built specifically for **Expo Go** and real-world testing environments.

---

## 🎯 Built for developers who need to:

- **Debug on the go:** Monitor performance on real devices, not just simulators.
- **Master Expo Go:** Get deep insights even when native debuggers are unavailable.
- **Collaborate instantly:** Show teammates exactly where the lag is—no laptop required.
- **Eliminate UI Jank:** Catch blocked JS threads and slow API calls during actual interaction.

---

## Why Not Flipper or React DevTools?

| | react-native-perf-monitor-tool | React DevTools | Flipper |
|---|:---:|:---:|:---:|
| Works inside the app | ✅ | ❌ | ❌ |
| Works on real devices | ✅ | ⚠️ limited | ✅ |
| Works with Expo Go | ✅ | ❌ | ❌ |
| No setup required | ✅ | ❌ | ❌ |
| Network monitor | ✅ | ❌ | ✅ |
| Re-render reasons | ✅ | ✅ | ❌ |
| Zero dependencies | ✅ | ❌ | ❌ |

---

## Features

- **Re-render Counter & Tracking** — Monitor exactly how many times each component updates to identify unnecessary performance overhead.
- **Deep Re-render Insights** — Get instant visibility into the specific cause of a re-render (mount, state change, or specific prop changes).
- **Real-time FPS Monitor** — Track UI fluidness by displaying frames per second directly in the overlay.
- **JS Lag Detector** — Automatically detects when the JavaScript thread is blocked (>50ms) to catch UI jank before users do.
- **Network & Axios Monitor** — Intercept and inspect fetch and axios requests, including methods, status codes, and response duration.
- **Visual Performance Indicators** — Color-coded signals (green / yellow / red) providing an instant health check of your app's state.
- **Production Safe** — Zero manual config needed; the library automatically disables itself in production builds using the `__DEV__` flag.

---

## Compatibility

- **Expo:** Works with Expo Go (SDK 50+) and Expo Dev Build
- **React Native CLI:** Full support for bare React Native projects
- **Architecture:** Works with both New Architecture and Old Architecture — no native modules used
- **Platforms:** Tested on iOS and Android (real devices and simulators)
- **Networking:** Supports both Fetch API and Axios

---

## Install
```bash
# npm
npm install react-native-perf-monitor-tool

# yarn
yarn add react-native-perf-monitor-tool
```

---

## Usage

### 1. Add the overlay once in your root component
```tsx
import { PerformanceOverlay } from 'react-native-perf-monitor-tool';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <YourApp />
      {/* Only renders in __DEV__ mode by default */}
      <PerformanceOverlay position="bottom-right" />
    </View>
  );
}
```

### 2. Track any component
```tsx
import { useRenderMonitor } from 'react-native-perf-monitor-tool';

function HomeScreen() {
  useRenderMonitor('HomeScreen');
  return <View>...</View>;
}
```

### 3. Track props changes
```tsx
import { useRenderMonitor } from 'react-native-perf-monitor-tool';

function UserCard({ user, theme }) {
  useRenderMonitor('UserCard', { user, theme });
  return <View>...</View>;
}
```

The overlay will show exactly which prop changed and caused the re-render.

---

## Network Monitor Setup

The network monitor works automatically for `fetch` requests.  
If your project uses **axios**, follow the setup below based on your case.

> **Why is this needed?**  
> axios creates its own internal HTTP instance that is separate from the global `fetch`.  
> To monitor axios requests, you need to tell the library which instance to watch.  
> This is a one-time setup — add it once in `App.tsx` and forget about it.

---

### Case 1 — You use `fetch` (default)

No setup needed. Works automatically out of the box. ✅
```tsx
const response = await fetch('https://api.example.com/users');
```

---

### Case 2 — You use the default `axios` instance

Add this once in your `App.tsx` before rendering anything:
```tsx
import axios from 'axios';
import { setupAxiosInterceptor } from 'react-native-perf-monitor-tool';

// Add this before your App component
if (__DEV__) {
  setupAxiosInterceptor(axios);
}

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <YourApp />
      {/* Only renders in __DEV__ mode by default */}
      <PerformanceOverlay position="bottom-right" />
    </View>
  );
}
```

---

### Case 3 — You use a custom axios instance

This is the most common case in production apps.  
Find your axios instance file (usually named `apiClient.ts` or `httpClient.ts`) and add this inside your constructor or setup function:
```tsx
import { setupAxiosInterceptor } from 'react-native-perf-monitor-tool';

class ApiClient {
  constructor() {
    this.axiosInstance = axios.create({ baseURL: '...' });
    this.setupInterceptors();

    // Add perf monitor — safe in dev only, no effect in production
    if (__DEV__) {
      try {
        setupAxiosInterceptor(this.axiosInstance);
      } catch {
        // library not installed — skip
      }
    }
  }
}
```

---

### What gets monitored in the Network tab?

Once set up, every request will appear in the **Network tab** of the overlay:
```
● GET    120ms   /api/users        🟢
● POST   890ms   /api/orders       🟡  slow
● GET    —       /api/products     ⚪  pending
● DELETE 230ms   /api/item/5       🔴  HTTP 404
```

---

## Color Reference

| Category | 🟢 Green | 🟡 Yellow | 🔴 Red |
| :--- | :--- | :--- | :--- |
| **Components** | < 10 re-renders | 10 - 20 re-renders | > 20 re-renders |
| **Network** | Success (< 500ms) | Slow (> 500ms) | Failed / Error |
| **FPS** | 55+ FPS | 30 - 55 FPS | < 30 FPS |

*Note: ⚪ Gray represents a pending network request.*

---

## Props

| Prop | Type | Default | Description |
|:---|:---:|:---:|:---|
| `enabled` | boolean | `__DEV__` | Show only in development |
| `position` | string | `'bottom-right'` | Overlay position on screen |

### Position options
```tsx
<PerformanceOverlay position="bottom-right" />
<PerformanceOverlay position="bottom-left" />
<PerformanceOverlay position="top-right" />
<PerformanceOverlay position="top-left" />
```

---


## Roadmap

- [ ] Render Timeline
- [ ] Shake to toggle overlay
- [ ] Export performance report
- [ ] Redux / Zustand state monitor
- [ ] Flipper plugin integration
- [ ] Memory usage

---

## Contributing

Contributions are very welcome. Here are some great ways to help:

- **Improve the overlay UI** — better design, animations, or UX
- **Add a feature** — pick anything from the Roadmap and implement it
- **Add examples** — screenshots or demo videos showing the library in action
- **Fix a bug** — open an issue describing the bug, then submit a PR
- **Improve docs** — clearer explanations or better code examples
- **Report issues** — if something doesn't work on your device or setup, open an issue

### Submitting changes

1. Fork the repo
2. Create your branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

---

## License

MIT © 2026 Mohamed Yousuf — see [LICENSE](./LICENSE) for details.

---

## Author

Made by [@MohamedYousuf2](https://github.com/MohamedYousuf2)