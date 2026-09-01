import React from 'react';
import { FleetProvider, useFleet } from './context/FleetContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardScreen } from './screens/DashboardScreen';
import { FleetTrackerScreen } from './screens/FleetTrackerScreen';
import { AssetsScreen } from './screens/AssetsScreen';
import { AssetDetailsScreen } from './screens/AssetDetailsScreen';
import { CheckInOutScreen } from './screens/CheckInOutScreen';
import { UsageLogsScreen } from './screens/UsageLogsScreen';
import { AlertsScreen } from './screens/AlertsScreen';
import { AiIntelligenceScreen } from './screens/AiIntelligenceScreen';

const MainScreenRouter: React.FC = () => {
  const { currentScreen } = useFleet();

  switch (currentScreen) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'fleet-tracker':
      return <FleetTrackerScreen />;
    case 'assets':
      return <AssetsScreen />;
    case 'asset-details':
      return <AssetDetailsScreen />;
    case 'check-in-out':
      return <CheckInOutScreen />;
    case 'usage-logs':
      return <UsageLogsScreen />;
    case 'alerts':
      return <AlertsScreen />;
    case 'ai-intelligence':
      return <AiIntelligenceScreen />;
    default:
      return <DashboardScreen />;
  }
};

export const App: React.FC = () => {
  return (
    <FleetProvider>
      <AppLayout>
        <MainScreenRouter />
      </AppLayout>
    </FleetProvider>
  );
};

export default App;
