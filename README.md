# react-native-perf-monitor

A lightweight, in-app performance debugger for React Native.  
No Flipper. No cables. No complex setup. Just add two lines and start debugging.

---

## Why?

Most React Native performance tools require a desktop connection, complex setup, or don't work with Expo Go.  
**react-native-perf-monitor** runs entirely inside your app — works on real devices, in any environment.

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
npm install react-native-perf-monitor
```

---

## Usage

### 1. Add the overlay once in your root component
```tsx
import { PerformanceOverlay } from 'react-native-perf-monitor';

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
import { useRenderMonitor } from 'react-native-perf-monitor';

function HomeScreen() {
  useRenderMonitor('HomeScreen');
  return <View>...</View>;
}
```

### 3. Track props changes
```tsx
function UserCard({ user, theme }) {
  useRenderMonitor('UserCard', { user, theme });
  return <View>...</View>;
}
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
|------|------|---------|-------------|
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

## Requirements

- React Native >= 0.68
- React >= 17
- Works with Expo Go ✅
- Works on iOS and Android ✅
- No native modules required ✅

---

## Roadmap

- [ ] Render Timeline
- [ ] Shake to toggle overlay
- [ ] Export performance report
- [ ] Redux / Zustand state monitor
- [ ] Flipper plugin integration

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

---

## License

MIT © 2026 Mohamed Yousuf