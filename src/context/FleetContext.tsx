import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Asset,
  SiteInfo,
  AlertItem,
  AIRecommendation,
  DemandForecast,
  UsageLogItem,
  LifecycleEvent
} from '../data/initialFleetData';
import {
  INITIAL_ASSETS,
  INITIAL_SITES,
  INITIAL_ALERTS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_DEMAND_FORECASTS,
  INITIAL_USAGE_LOGS,
  INITIAL_LIFECYCLE_EVENTS
} from '../data/initialFleetData';

export type ScreenType =
  | 'dashboard'
  | 'fleet-tracker'
  | 'assets'
  | 'asset-details'
  | 'check-in-out'
  | 'usage-logs'
  | 'alerts'
  | 'ai-intelligence';

export interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  message: string;
}

interface FleetContextType {
  // Navigation & Selection
  currentScreen: ScreenType;
  selectedAssetId: string;
  selectedSiteFilter: string;
  searchQuery: string;
  navigateTo: (screen: ScreenType, assetId?: string) => void;
  selectAsset: (id: string) => void;
  setSelectedSiteFilter: (siteId: string) => void;
  setSearchQuery: (query: string) => void;

  // Data Collections
  assets: Asset[];
  sites: Record<string, SiteInfo>;
  alerts: AlertItem[];
  recommendations: AIRecommendation[];
  demandForecasts: DemandForecast[];
  usageLogs: UsageLogItem[];
  lifecycleEvents: LifecycleEvent[];

  // Selected Item Computed
  selectedAsset: Asset | undefined;
  assetAlerts: AlertItem[];
  assetLifecycle: LifecycleEvent[];

  // Fleet Statistics
  stats: {
    totalAssets: number;
    rentedCount: number;
    availableCount: number;
    maintenanceCount: number;
    overdueCount: number;
    avgUtilization: number;
    openAlertsCount: number;
    criticalAnomaliesCount: number;
  };

  // State Mutation Actions
  checkOutAsset: (params: {
    assetId: string;
    siteId: string;
    operatorId: string;
    operatorName: string;
    checkinDate: string;
    conditionScore: 'A' | 'B' | 'C' | 'D';
    notes?: string;
  }) => boolean;

  checkInAsset: (params: {
    assetId: string;
    conditionScore: 'A' | 'B' | 'C' | 'D';
    engineHoursAdded?: number;
    notes?: string;
  }) => boolean;

  acceptRecommendation: (recommendationId: string) => void;
  dismissRecommendation: (recommendationId: string) => void;
  resolveAlert: (alertId: string) => void;
  reassignAssetSite: (assetId: string, targetSiteId: string) => void;
  assignOperator: (assetId: string, operatorId: string, operatorName: string) => void;

  // Live Simulation
  isLiveSimulationActive: boolean;
  toggleLiveSimulation: () => void;

  // Toasts
  toasts: ToastNotification[];
  addToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('EQX1007'); // Default to key demo case
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Primary Data State
  const [assets, setAssets] = useState<Asset[]>(() => INITIAL_ASSETS);
  const [sites] = useState<Record<string, SiteInfo>>(() => INITIAL_SITES);
  const [alerts, setAlerts] = useState<AlertItem[]>(() => INITIAL_ALERTS);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(() => INITIAL_RECOMMENDATIONS);
  const [demandForecasts] = useState<DemandForecast[]>(() => INITIAL_DEMAND_FORECASTS);
  const [usageLogs, setUsageLogs] = useState<UsageLogItem[]>(() => INITIAL_USAGE_LOGS);
  const [lifecycleEvents, setLifecycleEvents] = useState<LifecycleEvent[]>(() => INITIAL_LIFECYCLE_EVENTS);

  // Live Telemetry Simulation
  const [isLiveSimulationActive, setIsLiveSimulationActive] = useState<boolean>(true);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Navigation Helper
  const navigateTo = useCallback((screen: ScreenType, assetId?: string) => {
    if (assetId) {
      setSelectedAssetId(assetId);
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectAsset = useCallback((id: string) => {
    setSelectedAssetId(id);
  }, []);

  const toggleLiveSimulation = useCallback(() => {
    setIsLiveSimulationActive((prev) => {
      const next = !prev;
      addToast(next ? 'Live telemetry pulse enabled (simulating 10s sensor pings)' : 'Live telemetry simulation paused', 'info');
      return next;
    });
  }, [addToast]);

  // Selected Asset lookup
  const selectedAsset = useMemo(() => {
    return assets.find((a) => a.id === selectedAssetId) || assets[0];
  }, [assets, selectedAssetId]);

  const assetAlerts = useMemo(() => {
    return alerts.filter((al) => al.assetId === selectedAssetId);
  }, [alerts, selectedAssetId]);

  const assetLifecycle = useMemo(() => {
    return lifecycleEvents
      .filter((ev) => ev.assetId === selectedAssetId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [lifecycleEvents, selectedAssetId]);

  // Fleet Statistics
  const stats = useMemo(() => {
    const totalAssets = assets.length;
    const rentedCount = assets.filter((a) => a.status === 'Rented').length;
    const availableCount = assets.filter((a) => a.status === 'Available').length;
    const maintenanceCount = assets.filter((a) => a.status === 'Maintenance').length;
    const overdueCount = assets.filter((a) => a.status === 'Overdue').length;

    const totalUtil = assets.reduce((acc, curr) => acc + curr.utilization, 0);
    const avgUtilization = totalAssets > 0 ? Math.round((totalUtil / totalAssets) * 10) / 10 : 0;

    const openAlertsCount = alerts.filter((al) => al.status === 'Open').length;
    const criticalAnomaliesCount = assets.filter((a) => a.riskLevel === 'Critical').length;

    return {
      totalAssets,
      rentedCount,
      availableCount,
      maintenanceCount,
      overdueCount,
      avgUtilization,
      openAlertsCount,
      criticalAnomaliesCount
    };
  }, [assets, alerts]);

  // Check-Out Action
  const checkOutAsset = useCallback(
    (params: {
      assetId: string;
      siteId: string;
      operatorId: string;
      operatorName: string;
      checkinDate: string;
      conditionScore: 'A' | 'B' | 'C' | 'D';
      notes?: string;
    }) => {
      const targetAsset = assets.find((a) => a.id === params.assetId);
      if (!targetAsset) {
        addToast(`Asset ${params.assetId} not found.`, 'error');
        return false;
      }

      const siteObj = sites[params.siteId] || { name: 'Assigned Site', project: 'Active Project', lat: targetAsset.latitude, lng: targetAsset.longitude };
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const todayDate = nowStr.substring(0, 10);

      // Update asset
      setAssets((prev) =>
        prev.map((a) => {
          if (a.id === params.assetId) {
            return {
              ...a,
              status: 'Rented',
              siteId: params.siteId,
              siteName: siteObj.name,
              projectName: siteObj.project,
              checkoutDate: todayDate,
              checkinDate: params.checkinDate,
              operatorId: params.operatorId || 'OP-TEMP',
              operatorName: params.operatorName || 'Assigned Operator',
              conditionScore: params.conditionScore,
              latitude: siteObj.lat + (Math.random() - 0.5) * 0.006,
              longitude: siteObj.lng + (Math.random() - 0.5) * 0.006,
              lastTelemetry: nowStr
            };
          }
          return a;
        })
      );

      // Add lifecycle event
      const newEvent: LifecycleEvent = {
        id: `EVT-${Date.now()}`,
        assetId: params.assetId,
        timestamp: nowStr,
        type: 'CHECK_OUT',
        title: `Checked Out to ${siteObj.name}`,
        description: `Dispatched to operator ${params.operatorName} (${params.operatorId || 'OP'}). Return expected: ${params.checkinDate}. Condition: Grade ${params.conditionScore}.${params.notes ? ` Notes: ${params.notes}` : ''}`,
        actor: 'Fleet Dispatcher',
        siteId: params.siteId
      };
      setLifecycleEvents((prev) => [newEvent, ...prev]);

      addToast(`Asset ${params.assetId} successfully checked out to ${siteObj.name}`, 'success');
      return true;
    },
    [assets, sites, addToast]
  );

  // Check-In Action
  const checkInAsset = useCallback(
    (params: {
      assetId: string;
      conditionScore: 'A' | 'B' | 'C' | 'D';
      engineHoursAdded?: number;
      notes?: string;
    }) => {
      const targetAsset = assets.find((a) => a.id === params.assetId);
      if (!targetAsset) {
        addToast(`Asset ${params.assetId} not found.`, 'error');
        return false;
      }

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const addedHours = params.engineHoursAdded || 8.0;

      setAssets((prev) =>
        prev.map((a) => {
          if (a.id === params.assetId) {
            return {
              ...a,
              status: params.conditionScore === 'D' ? 'Maintenance' : 'Available',
              operatorId: null,
              operatorName: 'Unassigned',
              conditionScore: params.conditionScore,
              totalEngineHours: Math.round((a.totalEngineHours + addedHours) * 10) / 10,
              riskLevel: params.conditionScore === 'D' ? 'High' : (params.conditionScore === 'C' ? 'Medium' : 'Low'),
              lastTelemetry: nowStr
            };
          }
          return a;
        })
      );

      // Mark related open alerts as resolved if returning
      setAlerts((prev) =>
        prev.map((al) => {
          if (al.assetId === params.assetId && (al.alertType === 'Overdue Return' || al.alertType === 'Unassigned Rented Asset')) {
            return { ...al, status: 'Resolved' };
          }
          return al;
        })
      );

      const newEvent: LifecycleEvent = {
        id: `EVT-${Date.now()}`,
        assetId: params.assetId,
        timestamp: nowStr,
        type: 'CHECK_IN',
        title: `Returned & Checked In (${params.conditionScore === 'D' ? 'Sent to Maintenance' : 'Available'})`,
        description: `Machine returned to inventory. Inspected condition: Grade ${params.conditionScore}. +${addedHours} hrs logged.${params.notes ? ` Notes: ${params.notes}` : ''}`,
        actor: 'Return Inspector',
        siteId: targetAsset.siteId
      };
      setLifecycleEvents((prev) => [newEvent, ...prev]);

      addToast(`Asset ${params.assetId} successfully checked in (${params.conditionScore === 'D' ? 'Queued for Maintenance' : 'Ready in Pool'})`, 'success');
      return true;
    },
    [assets, addToast]
  );

  // Accept Recommendation Action
  const acceptRecommendation = useCallback(
    (recId: string) => {
      const rec = recommendations.find((r) => r.id === recId);
      if (!rec) return;

      const targetSiteObj = sites[rec.targetSite] || { name: 'Target Site', project: 'Target Project', lat: 12.9716, lng: 77.5946 };
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Execute specific logic based on demo cases:
      // Case 1: EQX1004 (S004 -> S003)
      if (rec.assetId === 'EQX1004') {
        setAssets((prev) =>
          prev.map((a) => {
            if (a.id === 'EQX1004') {
              return {
                ...a,
                siteId: 'S003',
                siteName: sites['S003'].name,
                projectName: sites['S003'].project,
                latitude: sites['S003'].lat + 0.0015,
                longitude: sites['S003'].lng - 0.0012,
                utilization: 76.5, // Lifted utilization
                engineHoursPerDay: 7.2,
                idleHoursPerDay: 2.1,
                riskLevel: 'Low',
                status: 'Rented',
                operatorId: 'OP106',
                operatorName: 'Sarah Jenkins',
                lastTelemetry: nowStr
              };
            }
            return a;
          })
        );

        // Resolve underutilization alert
        setAlerts((prev) =>
          prev.map((al) => (al.assetId === 'EQX1004' ? { ...al, status: 'Resolved' } : al))
        );

        // Add log
        const logItem: UsageLogItem = {
          assetId: 'EQX1004',
          assetName: 'Hitachi ZX350LC-6',
          equipmentType: 'Excavator',
          date: nowStr.substring(0, 10),
          siteId: 'S003',
          siteName: sites['S003'].name,
          engineHours: 7.2,
          idleHours: 2.1,
          operatingHours: 6.8,
          utilization: 76.5,
          fuelBurnLiters: 142.5
        };
        setUsageLogs((prev) => [logItem, ...prev]);
      }
      // Case 2: EQX1007 Anomaly Resolution / Operator Assignment
      else if (rec.assetId === 'EQX1007') {
        setAssets((prev) =>
          prev.map((a) => {
            if (a.id === 'EQX1007') {
              return {
                ...a,
                operatorId: 'OP104',
                operatorName: 'Priya Nair (Master Excavator Operator)',
                riskLevel: 'Low',
                utilization: 82.0,
                engineHoursPerDay: 7.8,
                idleHoursPerDay: 1.4,
                lastTelemetry: nowStr
              };
            }
            return a;
          })
        );

        setAlerts((prev) =>
          prev.map((al) => (al.assetId === 'EQX1007' ? { ...al, status: 'Resolved' } : al))
        );
      } else {
        // Generic asset transfer
        setAssets((prev) =>
          prev.map((a) => {
            if (a.id === rec.assetId) {
              return {
                ...a,
                siteId: rec.targetSite,
                siteName: targetSiteObj.name,
                projectName: targetSiteObj.project,
                latitude: targetSiteObj.lat,
                longitude: targetSiteObj.lng,
                lastTelemetry: nowStr
              };
            }
            return a;
          })
        );
      }

      // Mark recommendation applied
      setRecommendations((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, status: 'Applied' } : r))
      );

      // Add lifecycle record
      const newEvent: LifecycleEvent = {
        id: `EVT-${Date.now()}`,
        assetId: rec.assetId,
        timestamp: nowStr,
        type: 'AI_OPTIMIZATION',
        title: `AI Recommendation Executed: ${rec.type}`,
        description: `Successfully applied recommendation. ${rec.impact}. Transferred asset to ${targetSiteObj.name}.`,
        actor: 'Smart Rental AI Optimizer',
        siteId: rec.targetSite
      };
      setLifecycleEvents((prev) => [newEvent, ...prev]);

      addToast(`AI Recommendation applied: ${rec.assetName} reallocated to ${targetSiteObj.name}`, 'success');
    },
    [recommendations, sites, addToast]
  );

  const dismissRecommendation = useCallback((recId: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: 'Dismissed' } : r))
    );
    addToast('Recommendation dismissed', 'info');
  }, [addToast]);

  const resolveAlert = useCallback(
    (alertId: string) => {
      setAlerts((prev) =>
        prev.map((al) => {
          if (al.id === alertId) {
            return { ...al, status: 'Resolved' };
          }
          return al;
        })
      );
      addToast(`Alert ${alertId} resolved.`, 'success');
    },
    [addToast]
  );

  const reassignAssetSite = useCallback(
    (assetId: string, targetSiteId: string) => {
      const siteObj = sites[targetSiteId];
      if (!siteObj) return;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      setAssets((prev) =>
        prev.map((a) => {
          if (a.id === assetId) {
            return {
              ...a,
              siteId: targetSiteId,
              siteName: siteObj.name,
              projectName: siteObj.project,
              latitude: siteObj.lat + (Math.random() - 0.5) * 0.004,
              longitude: siteObj.lng + (Math.random() - 0.5) * 0.004,
              lastTelemetry: nowStr
            };
          }
          return a;
        })
      );

      const newEvent: LifecycleEvent = {
        id: `EVT-${Date.now()}`,
        assetId,
        timestamp: nowStr,
        type: 'SITE_TRANSFER',
        title: `Transferred to ${siteObj.name}`,
        description: `Asset location reallocated to ${siteObj.name} (${siteObj.project}).`,
        actor: 'Fleet Operations Lead',
        siteId: targetSiteId
      };
      setLifecycleEvents((prev) => [newEvent, ...prev]);

      addToast(`Asset ${assetId} transferred to ${siteObj.name}`, 'success');
    },
    [sites, addToast]
  );

  const assignOperator = useCallback(
    (assetId: string, operatorId: string, operatorName: string) => {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setAssets((prev) =>
        prev.map((a) => {
          if (a.id === assetId) {
            return {
              ...a,
              operatorId,
              operatorName,
              lastTelemetry: nowStr
            };
          }
          return a;
        })
      );

      // Resolve unassigned alert if applicable
      setAlerts((prev) =>
        prev.map((al) => (al.assetId === assetId && al.alertType === 'Unassigned Rented Asset' ? { ...al, status: 'Resolved' } : al))
      );

      const newEvent: LifecycleEvent = {
        id: `EVT-${Date.now()}`,
        assetId,
        timestamp: nowStr,
        type: 'CHECK_OUT',
        title: `Operator Assigned: ${operatorName}`,
        description: `Operator credentials ${operatorId} bound to telemetry module.`,
        actor: 'Field Operations',
      };
      setLifecycleEvents((prev) => [newEvent, ...prev]);

      addToast(`Assigned operator ${operatorName} to asset ${assetId}`, 'success');
    },
    [addToast]
  );

  // Periodic subtle live telemetry update (10s interval when active)
  useEffect(() => {
    if (!isLiveSimulationActive) return;

    const interval = setInterval(() => {
      setAssets((prev) =>
        prev.map((a) => {
          if (a.status === 'Rented') {
            // Subtle fuel decrement and minute telemetry jitter
            const newFuel = Math.max(12, Math.round((a.fuelLevelPct - 0.05) * 10) / 10);
            return {
              ...a,
              fuelLevelPct: newFuel,
              latitude: a.latitude + (Math.random() - 0.5) * 0.00004,
              longitude: a.longitude + (Math.random() - 0.5) * 0.00004
            };
          }
          return a;
        })
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [isLiveSimulationActive]);

  return (
    <FleetContext.Provider
      value={{
        currentScreen,
        selectedAssetId,
        selectedSiteFilter,
        searchQuery,
        navigateTo,
        selectAsset,
        setSelectedSiteFilter,
        setSearchQuery,
        assets,
        sites,
        alerts,
        recommendations,
        demandForecasts,
        usageLogs,
        lifecycleEvents,
        selectedAsset,
        assetAlerts,
        assetLifecycle,
        stats,
        checkOutAsset,
        checkInAsset,
        acceptRecommendation,
        dismissRecommendation,
        resolveAlert,
        reassignAssetSite,
        assignOperator,
        isLiveSimulationActive,
        toggleLiveSimulation,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
