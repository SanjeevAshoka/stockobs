import React, { useEffect, useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import { Header } from './components/Header';
import { TimeframeSelector } from './components/TimeframeSelector';
import { MarketSimulator } from './components/MarketSimulator';
import { WatchlistManager } from './components/WatchlistManager';
import { StockTable } from './components/StockTable';
import { NotificationDrawer } from './components/NotificationDrawer';
import { SettingsModal } from './components/SettingsModal';
import { useStockStore } from './store/useStockStore';
import { useNotificationStore } from './store/useNotificationStore';
import { marketScheduler } from './services/engine/scheduler';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.bg};
`;

const Main = styled.main`
  flex: 1;
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 28px;
`;

export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { initWatchlist } = useStockStore();
  const { initNotifications } = useNotificationStore();

  useEffect(() => {
    // 1. Initialize persistent notifications from IndexedDB & purge prior day alerts
    initNotifications();

    // 2. Initialize stock watchlist & cache
    initWatchlist();

    // 3. Start background market surveillance ticker
    marketScheduler.start();

    return () => {
      marketScheduler.stop();
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AppContainer>
        <Header onOpenSettings={() => setIsSettingsOpen(true)} />
        <Main>
          <MarketSimulator />
          <TimeframeSelector />
          <WatchlistManager />
          <StockTable />
        </Main>
        <NotificationDrawer />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </AppContainer>
    </ThemeProvider>
  );
};

export default App;

