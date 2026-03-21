# react-native-perf-monitor-tool

![npm version](https://img.shields.io/npm/v/react-native-perf-monitor-tool)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![Expo Go](https://img.shields.io/badge/Expo%20Go-compatible-brightgreen)

A lightweight, in-app performance debugger for React Native.  
No Flipper. No cables. No complex setup. Just add two lines and start debugging.

---

## What This Library Does

When your React Native app feels slow, finding the cause is hard.  
Most tools require a desktop connection, complex setup, or don't work on real devices.

**react-native-perf-monitor-tool** runs entirely inside your app — a floating overlay that shows you exactly what's happening in real time:

- Which components are re-rendering too much and why
- When the JavaScript thread is blocked
- How fast your app is running (FPS)
- Which API calls are slow or failing

No setup. No cables. Works on real devices. Works with Expo Go.

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

- 🔁 **Re-render Counter** — tracks how many times each component re-renders
- 🔍 **Re-render Reason** — shows why a component re-rendered (mount / state changed / props changed)
- 📊 **FPS Monitor** — displays frames per second in real time
- ⚡ **JS Lag Detector** — detects when the JavaScript thread is blocked
- 🌐 **Network Monitor** — intercepts all fetch requests with method, duration, and status
- 🎨 **Color Indicators** — green / yellow / red for instant visual feedback
- 🙈 **Auto-hide in Production** — only shows in `__DEV__` mode by default

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

### Components

| Color | Meaning |
|-------|---------|
| 🟢 Green | Less than 10 re-renders |
| 🟡 Yellow | Between 10 and 20 re-renders |
| 🔴 Red | More than 20 re-renders |

### Network

| Color | Meaning |
|-------|---------|
| 🟢 Green | Success, under 500ms |
| 🟡 Yellow | Success but slow (over 500ms) |
| 🔴 Red | Failed or HTTP error |
| ⚪ Gray | Pending request |

### FPS

| Color | Meaning |
|-------|---------|
| 🟢 Green | 55 FPS and above |
| 🟡 Yellow | Between 30 and 55 FPS |
| 🔴 Red | Below 30 FPS |

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