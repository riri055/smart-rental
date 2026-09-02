import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as api from '../api/client';
import type {
  Asset,
  LatestTelemetryLocation,
  Operator,
  Rental,
  Site,
  UsageSummary,
} from '../api/types';

export type ScreenType =
  | 'dashboard'
  | 'fleet-tracker'
  | 'assets'
  | 'asset-details'
  | 'check-in-out'
  | 'qr-scan'
  | 'usage-logs'
  | 'alerts'
  | 'ai-intelligence';

export interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  message: string;
}

export interface AssetPosition {
  latitude: number;
  longitude: number;
}

export interface FleetStats {
  totalAssets: number;
  activeCount: number;
  availableCount: number;
  idleCount: number;
  overdueCount: number;
  unknownCount: number;
  rentedCount: number;
  avgUtilization: number;
  openAlertsCount: number;
  criticalAnomaliesCount: number;
}

interface CheckoutParams {
  equipment_id: string;
  site_id: string;
  operator_id: string;
  customer_id?: string;
  expected_return: string;
}

interface FleetContextType {
  // Navigation & selection
  currentScreen: ScreenType;
  selectedAssetId: string;
  selectedSiteFilter: string;
  searchQuery: string;
  navigateTo: (screen: ScreenType, assetId?: string) => void;
  selectAsset: (id: string) => void;
  setSelectedSiteFilter: (siteId: string) => void;
  setSearchQuery: (query: string) => void;

  // Data collections (backend source of truth)
  assets: Asset[];
  sites: Record<string, Site>;
  operators: Operator[];
  usageSummary: UsageSummary | null;
  positions: Record<string, AssetPosition>;
  loading: boolean;
  error: string | null;

  // Derived
  selectedAsset: Asset | undefined;
  stats: FleetStats;

  // Mutations
  checkoutAsset: (params: CheckoutParams) => Promise<Rental>;
  checkinAsset: (rentalId: string) => Promise<Rental>;
  refresh: () => Promise<void>;

  // Toasts
  toasts: ToastNotification[];
  addToast: (message: string, type?: ToastNotification['type']) => void;
  removeToast: (id: string) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Record<string, Site>>({});
  const [operators, setOperators] = useState<Operator[]>([]);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [positions, setPositions] = useState<Record<string, AssetPosition>>({});
  const [openAlertsCount, setOpenAlertsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastNotification['type'] = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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

  // Load fleet-wide reference + summary data from the backend.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetList, siteList, operatorList, summary] = await Promise.all([
        api.getAssets(),
        api.getSites(),
        api.getOperators(),
        api.getUsageSummary(),
      ]);
      setAssets(assetList);
      const siteMap = Object.fromEntries(
        siteList.map((s) => [s.site_id, s]),
      );
      setSites(siteMap);
      setOperators(operatorList);
      setUsageSummary(summary);

      // Best-effort live open-alert count (does not block core data).
      api
        .getAlerts({ status: 'open' })
        .then((openAlerts) => setOpenAlertsCount(openAlerts.length))
        .catch(() => setOpenAlertsCount(0));

      // Resolve asset positions from their latest real telemetry reading. The
      // site coordinate is used only as a fallback when telemetry is missing
      // or the endpoint is unavailable (no jittering or invented coordinates).
      let latestLocations: LatestTelemetryLocation[] = [];
      try {
        latestLocations = await api.getLatestTelemetryLocations();
      } catch {
        latestLocations = [];
      }
      const locationByAsset = new Map(
        latestLocations.map((l) => [l.asset_id, l] as const),
      );
      const pos: Record<string, AssetPosition> = {};
      for (const asset of assetList) {
        const loc = locationByAsset.get(asset.equipment_id);
        if (loc) {
          pos[asset.equipment_id] = {
            latitude: loc.latitude,
            longitude: loc.longitude,
          };
          continue;
        }
        const site = asset.current_site_id
          ? siteMap[asset.current_site_id]
          : undefined;
        if (site) {
          pos[asset.equipment_id] = {
            latitude: site.latitude,
            longitude: site.longitude,
          };
        }
      }
      setPositions(pos);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    const list = await api.getAssets();
    setAssets(list);
  }, []);

  const checkoutAsset = useCallback(
    async (params: CheckoutParams): Promise<Rental> => {
      const rental = await api.checkoutRental(params);
      await refresh();
      return rental;
    },
    [refresh],
  );

  const checkinAsset = useCallback(
    async (rentalId: string): Promise<Rental> => {
      const rental = await api.checkinRental(rentalId);
      await refresh();
      return rental;
    },
    [refresh],
  );

  const selectedAsset = useMemo(() => {
    return assets.find((a) => a.equipment_id === selectedAssetId) ?? assets[0];
  }, [assets, selectedAssetId]);

  const stats = useMemo<FleetStats>(() => {
    const totalAssets = assets.length;
    const activeCount = assets.filter((a) => a.status === 'Active').length;
    const availableCount = assets.filter((a) => a.status === 'Available').length;
    const idleCount = assets.filter((a) => a.status === 'Idle').length;
    const overdueCount = assets.filter((a) => a.status === 'Overdue').length;
    const unknownCount = assets.filter((a) => a.status === 'Unknown').length;
    const avgUtilization =
      usageSummary && usageSummary.utilization != null
        ? Math.round(usageSummary.utilization * 1000) / 10
        : 0;

    return {
      totalAssets,
      activeCount,
      availableCount,
      idleCount,
      overdueCount,
      unknownCount,
      rentedCount: activeCount + overdueCount,
      avgUtilization,
      openAlertsCount,
      criticalAnomaliesCount: 0,
    };
  }, [assets, usageSummary, openAlertsCount]);

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
        operators,
        usageSummary,
        positions,
        loading,
        error,
        selectedAsset,
        stats,
        checkoutAsset,
        checkinAsset,
        refresh,
        toasts,
        addToast,
        removeToast,
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
