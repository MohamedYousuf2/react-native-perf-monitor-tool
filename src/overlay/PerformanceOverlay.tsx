import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Vibration,
} from 'react-native';
import { performanceStore } from '../store/performanceStore';
import { startLagDetection, startFpsDetection } from '../utils/threadLagDetector';
import { startNetworkMonitor, clearNetworkRequests, NetworkRequest } from '../utils/networkMonitor';

type Props = {
  enabled?: boolean;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
};

type Tab = 'perf' | 'network';

export function PerformanceOverlay({
  enabled = __DEV__,
  position = 'bottom-right',
}: Props) {
  const [state, setState] = useState(performanceStore.getState());
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('perf');

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = performanceStore.subscribe(() => {
      setState({ ...performanceStore.getState() });
    });

    const stopLagDetection = startLagDetection((lagMs) => {
      performanceStore.setJSLag(lagMs);
    });

    const stopFpsDetection = startFpsDetection((fps) => {
      performanceStore.setFps(fps);
    });

    const stopNetworkMonitor = startNetworkMonitor((requests) => {
      performanceStore.setNetworkRequests(requests);
    });

    return () => {
      unsubscribe();
      stopLagDetection();
      stopFpsDetection();
      stopNetworkMonitor();
    };
  }, [enabled]);

  if (!enabled) return null;

  const positionStyle = getPositionStyle(position);
  const components = Object.values(state.components);
  const fpsStatus = state.fps >= 55 ? 'green' : state.fps >= 30 ? 'yellow' : 'red';
  const hasIssues = state.isLagging || components.some(c => c.renderCount > 10);
  const pendingRequests = state.networkRequests.filter(r => r.state === 'pending').length;

  return (
    <View style={[styles.wrapper, positionStyle]}>

      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed((c) => !c)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: hasIssues ? '#ef4444' : '#22c55e' }]} />
          <Text style={styles.headerTitle}>Perf Monitor</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.fpsBadge}>
            <Text style={[styles.fpsBadgeText, { color: getFpsColor(fpsStatus) }]}>
              {state.fps} FPS
            </Text>
          </View>
          {pendingRequests > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingRequests}</Text>
            </View>
          )}
          <Text style={styles.collapseIcon}>{collapsed ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <View>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'perf' && styles.tabActive]}
              onPress={() => setActiveTab('perf')}
            >
              <Text style={[styles.tabText, activeTab === 'perf' && styles.tabTextActive]}>
                Performance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'network' && styles.tabActive]}
              onPress={() => setActiveTab('network')}
            >
              <Text style={[styles.tabText, activeTab === 'network' && styles.tabTextActive]}>
                Network
              </Text>
              {state.networkRequests.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{state.networkRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {activeTab === 'perf' && (
            <View>
              <View style={styles.metricRow}>
                <View style={styles.metricLeft}>
                  <View style={[styles.dot, { backgroundColor: state.isLagging ? '#ef4444' : '#22c55e' }]} />
                  <Text style={styles.metricLabel}>JS Lag</Text>
                </View>
                <Text style={[styles.metricValue, { color: state.isLagging ? '#ef4444' : '#666' }]}>
                  {state.jsLagMs ? `${state.jsLagMs}ms` : '—'}
                </Text>
              </View>

              {components.length > 0 && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>COMPONENTS</Text>
                </View>
              )}

              <ScrollView
                style={{ maxHeight: 240 }}
                scrollEnabled={components.length > 4}
                showsVerticalScrollIndicator={false}
              >
                {components.length === 0 ? (
                  <Text style={styles.emptyText}>No components tracked yet</Text>
                ) : (
                  components
                    .sort((a, b) => b.renderCount - a.renderCount)
                    .map((c) => {
                      const status = c.renderCount > 20
                        ? 'red'
                        : c.renderCount > 10
                        ? 'yellow'
                        : 'green';

                      return (
                        <View key={c.name} style={styles.componentBlock}>
                          <View style={styles.componentRow}>
                            <View style={styles.metricLeft}>
                              <View style={[styles.dot, { backgroundColor: getStatusColor(status) }]} />
                              <Text style={styles.componentName} numberOfLines={1}>
                                {c.name}
                              </Text>
                            </View>
                            <Text style={[styles.renderCount, { color: getStatusColor(status) }]}>
                              {c.renderCount}x
                            </Text>
                          </View>

                          {c.reasons.length > 0 && (
                            <View style={styles.reasonsBox}>
                              {c.reasons.map((reason, i) => (
                                <View key={i} style={styles.reasonRow}>
                                  <Text style={styles.reasonArrow}>↳</Text>
                                  <Text style={styles.reasonText}>{reason}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })
                )}
              </ScrollView>
            </View>
          )}

          {activeTab === 'network' && (
            <ScrollView
              style={{ maxHeight: 280 }}
              showsVerticalScrollIndicator={false}
            >
              {state.networkRequests.length === 0 ? (
                <Text style={styles.emptyText}>No requests yet</Text>
              ) : (
                [...state.networkRequests]
                  .reverse()
                  .map((req) => (
                    <NetworkRow key={req.id} request={req} />
                  ))
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            onPress={() => {
              performanceStore.reset();
              clearNetworkRequests();
              Vibration.vibrate(50);
            }}
            style={styles.resetBtn}
          >
            <Text style={styles.resetText}>↺ Reset</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function NetworkRow({ request }: { request: NetworkRequest }) {
  const isError = request.state === 'error';
  const isPending = request.state === 'pending';
  const isSlow = request.duration !== null && request.duration > 500;

  const statusColor = isPending
    ? '#888'
    : isError
    ? '#ef4444'
    : isSlow
    ? '#eab308'
    : '#22c55e';

  const urlParts = request.url.split('/');
  const shortUrl = urlParts.slice(-2).join('/');

  return (
    <View style={styles.networkRow}>
      <View style={styles.networkTop}>
        <View style={styles.metricLeft}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.methodBadge, { color: getMethodColor(request.method) }]}>
            {request.method}
          </Text>
        </View>
        <Text style={[styles.networkDuration, { color: statusColor }]}>
          {isPending ? '...' : `${request.duration}ms`}
        </Text>
      </View>
      <Text style={styles.networkUrl} numberOfLines={1}>
        {shortUrl}
      </Text>
      {request.error && (
        <Text style={styles.networkError}>↳ {request.error}</Text>
      )}
    </View>
  );
}

function getMethodColor(method: string) {
  const colors: Record<string, string> = {
    GET: '#22c55e',
    POST: '#378ADD',
    PUT: '#eab308',
    DELETE: '#ef4444',
    PATCH: '#a855f7',
  };
  return colors[method] ?? '#888';
}

function getStatusColor(status: 'green' | 'yellow' | 'red') {
  return { green: '#22c55e', yellow: '#eab308', red: '#ef4444' }[status];
}

function getFpsColor(status: 'green' | 'yellow' | 'red') {
  return { green: '#22c55e', yellow: '#eab308', red: '#ef4444' }[status];
}

function getPositionStyle(position: Props['position']) {
  const base = { position: 'absolute' as const, zIndex: 9999 };
  const map = {
    'top-right':    { top: 60,    right: 12 },
    'bottom-right': { bottom: 60, right: 12 },
    'top-left':     { top: 60,    left: 12 },
    'bottom-left':  { bottom: 60, left: 12 },
  };
  return { ...base, ...map[position!] };
}

const styles = StyleSheet.create({
  wrapper: {
    width: 240,
    backgroundColor: 'rgba(12,12,12,0.93)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fpsBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fpsBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pendingBadge: {
    backgroundColor: '#378ADD',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },
  collapseIcon: {
    color: '#555',
    fontSize: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    gap: 4,
  },
  tabActive: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#378ADD',
  },
  tabText: {
    color: '#555',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tabTextActive: {
    color: '#378ADD',
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tabBadgeText: {
    color: '#888',
    fontSize: 8,
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  metricLabel: {
    color: '#888',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metricValue: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  sectionTitle: {
    color: '#444',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  componentBlock: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  componentName: {
    color: '#ccc',
    fontSize: 10,
    maxWidth: 140,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  renderCount: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  reasonsBox: {
    paddingHorizontal: 16,
    paddingBottom: 7,
    gap: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-start',
  },
  reasonArrow: {
    color: '#378ADD',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  reasonText: {
    color: '#666',
    fontSize: 9,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  networkRow: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 3,
  },
  networkTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodBadge: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  networkDuration: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  networkUrl: {
    color: '#666',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingLeft: 11,
  },
  networkError: {
    color: '#ef4444',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingLeft: 11,
  },
  emptyText: {
    color: '#444',
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  resetText: {
    color: '#555',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});