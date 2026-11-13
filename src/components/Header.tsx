import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  Bell,
  Clock,
  RotateCw,
  Settings,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { getNowIST, isMarketOpen, isPreMarket, ISTTimeInfo } from '@/services/engine/marketTime';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useStockStore } from '@/store/useStockStore';

const Container = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(12px);
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoBadge = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.35);
  color: #fff;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    color: ${({ theme }) => theme.colors.accentGreen};
  }
`;

const Subtitle = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const CenterSection = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const ISTClockCard = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const MarketStatusPill = styled.div<{ $status: 'open' | 'pre' | 'closed' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $status, theme }) =>
    $status === 'open' &&
    `
    background-color: ${theme.colors.accentGreenBg};
    color: ${theme.colors.accentGreen};
    border: 1px solid ${theme.colors.accentGreenBorder};
  `}

  ${({ $status, theme }) =>
    $status === 'pre' &&
    `
    background-color: ${theme.colors.accentYellowBg};
    color: ${theme.colors.accentYellow};
    border: 1px solid rgba(245, 158, 11, 0.3);
  `}

  ${({ $status, theme }) =>
    $status === 'closed' &&
    `
    background-color: rgba(148, 163, 184, 0.1);
    color: ${theme.colors.textSecondary};
    border: 1px solid ${theme.colors.border};
  `}
`;

const PulsingDot = styled.span<{ $color: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  animation: pulseGlow 1.8s infinite;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DataStatusBadge = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 12px;
  font-weight: 600;
  background-color: ${({ theme }) => theme.colors.accentGreenBg};
  color: ${({ theme }) => theme.colors.accentGreen};
  border: 1px solid ${({ theme }) => theme.colors.accentGreenBorder};

  &:hover {
    filter: brightness(1.15);
  }
`;

const ActionIconButton = styled.button`
  width: 38px;
  height: 38px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    border-color: ${({ theme }) => theme.colors.borderLight};
    background-color: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const NotifBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background-color: ${({ theme }) => theme.colors.accentGreen};
  color: #000;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
`;

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const [ist, setIst] = useState<ISTTimeInfo>(getNowIST());
  const { notifications, toggleDrawer } = useNotificationStore();
  const { demoMode } = useSettingsStore();
  const { isRefreshing, syncAllTimeframes } = useStockStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setIst(getNowIST());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const marketIsOpen = isMarketOpen(ist);
  const marketIsPre = isPreMarket(ist);
  const status: 'open' | 'pre' | 'closed' = marketIsOpen ? 'open' : marketIsPre ? 'pre' : 'closed';
  const statusText = marketIsOpen
    ? 'Market Open'
    : marketIsPre
    ? 'Pre-Market (NSE)'
    : 'Market Closed';

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Container>
      <LeftSection>
        <LogoContainer>
          <LogoBadge>
            <TrendingUp size={22} />
          </LogoBadge>
          <div>
            <Title>
              Stock<span>Obs</span>
            </Title>
            <Subtitle>Yahoo Finance Volume Anomaly Radar</Subtitle>
          </div>
        </LogoContainer>
      </LeftSection>

      <CenterSection>
        <ISTClockCard>
          <Clock size={15} color="#94A3B8" />
          <span>{ist.timeStr} IST</span>
        </ISTClockCard>

        <MarketStatusPill $status={status}>
          <PulsingDot
            $color={
              status === 'open' ? '#10B981' : status === 'pre' ? '#F59E0B' : '#94A3B8'
            }
          />
          <span>{statusText}</span>
        </MarketStatusPill>
      </CenterSection>

      <RightSection>
        <DataStatusBadge onClick={onOpenSettings} title="Live data feed via Yahoo Finance">
          <ShieldCheck size={14} />
          <span>{demoMode ? 'Demo Mode' : 'Yahoo Finance ✓'}</span>
        </DataStatusBadge>

        <ActionIconButton
          onClick={() => syncAllTimeframes()}
          title="Refresh All Timeframes (Quotes & Baselines)"
          disabled={isRefreshing}
        >
          <RotateCw size={17} className={isRefreshing ? 'animate-spin' : ''} />
        </ActionIconButton>

        <ActionIconButton onClick={toggleDrawer} title="Notifications">
          <Bell size={17} />
          {unreadCount > 0 && <NotifBadge>{unreadCount > 99 ? '99+' : unreadCount}</NotifBadge>}
        </ActionIconButton>

        <ActionIconButton onClick={onOpenSettings} title="Settings">
          <Settings size={17} />
        </ActionIconButton>
      </RightSection>
    </Container>
  );
};
