import React from 'react';
import styled from 'styled-components';
import { Calendar, CalendarDays, CalendarRange, Clock, Layers, Zap } from 'lucide-react';
import { Timeframe } from '@/types';
import { useStockStore } from '@/store/useStockStore';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
`;

const TabGroup = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 4px;
  gap: 4px;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ $active: boolean; $hasAlert: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 13px;
  font-weight: 600;
  border: 1px solid transparent;
  transition: all 0.2s ease-in-out;

  ${({ $active, $hasAlert, theme }) => {
    if ($active) {
      return `
        background-color: ${theme.colors.accentBlue};
        color: #fff;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
      `;
    }
    if ($hasAlert) {
      return `
        color: ${theme.colors.accentGreen};
        background-color: rgba(16, 185, 129, 0.12);
        border: 1px solid ${theme.colors.accentGreen};
        animation: tabPulse 1.2s infinite ease-in-out;
        &:hover {
          background-color: rgba(16, 185, 129, 0.2);
        }
      `;
    }
    return `
      color: ${theme.colors.textSecondary};
      &:hover {
        color: ${theme.colors.textPrimary};
        background-color: ${theme.colors.surfaceHover};
      }
    `;
  }}
`;

const AlertBadge = styled.span`
  background-color: ${({ theme }) => theme.colors.accentGreen};
  color: #0b0f19;
  font-size: 10px;
  font-weight: 700;
  border-radius: 10px;
  padding: 1px 6px;
  min-width: 16px;
  text-align: center;
`;

const InfoBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 6px 14px;

  strong {
    color: ${({ theme }) => theme.colors.accentGreen};
  }
`;

export const TimeframeSelector: React.FC = () => {
  const { activeTimeframe, setTimeframe, unreadByTimeframe, clearTabUnread } = useStockStore();

  const handleTabClick = (tf: Timeframe) => {
    setTimeframe(tf);
    clearTabUnread(tf);
  };

  const tabs: { tf: Timeframe; label: string; icon: React.ReactNode }[] = [
    { tf: '1min', label: '1-Min (09:15 Opening)', icon: <Zap size={14} /> },
    { tf: '5min', label: '5-Min (09:15–09:20)', icon: <Clock size={14} /> },
    { tf: '15min', label: '15-Min (09:15–09:30)', icon: <Layers size={14} /> },
    { tf: 'daily', label: 'Daily (Full Day / EOD)', icon: <Calendar size={14} /> },
    { tf: 'weekly', label: 'Weekly (200-Week Flow)', icon: <CalendarDays size={14} /> },
    { tf: 'monthly', label: 'Monthly (200-Month Flow)', icon: <CalendarRange size={14} /> },
  ];

  const baselineDescription =
    activeTimeframe === '1min'
      ? 'Volume 200 SMA (1-Min Bars)'
      : activeTimeframe === '5min'
      ? 'Volume 200 SMA (5-Min Bars)'
      : activeTimeframe === '15min'
      ? 'Volume 200 SMA (15-Min Bars)'
      : activeTimeframe === 'daily'
      ? 'Volume 200 SMA (Daily Trading Days)'
      : activeTimeframe === 'weekly'
      ? 'Volume 200 SMA (Weekly Bars)'
      : 'Volume 200 SMA (Monthly Bars)';

  return (
    <Container>
      <TabGroup>
        {tabs.map(({ tf, label, icon }) => {
          const isActive = activeTimeframe === tf;
          const unreadCount = unreadByTimeframe[tf] || 0;
          const hasAlert = !isActive && unreadCount > 0;

          return (
            <Tab
              key={tf}
              $active={isActive}
              $hasAlert={hasAlert}
              onClick={() => handleTabClick(tf)}
              title={hasAlert ? `${unreadCount} new background notification(s)` : undefined}
            >
              {icon}
              <span>{label}</span>
              {hasAlert && <AlertBadge>{unreadCount}</AlertBadge>}
            </Tab>
          );
        })}
      </TabGroup>

      <InfoBadge>
        Active Baseline:
        <strong>{baselineDescription}</strong>
      </InfoBadge>
    </Container>
  );
};
