import React from 'react';
import styled from 'styled-components';
import {
  Bell,
  Flame,
  Info,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { Timeframe } from '@/types';
import { useNotificationStore } from '@/store/useNotificationStore';

const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 90;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition: all 0.25s ease-in-out;
`;

const Drawer = styled.aside<{ $open: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 440px;
  max-width: 90vw;
  background-color: ${({ theme }) => theme.colors.surface};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.7);
  z-index: 100;
  display: flex;
  flex-direction: column;
  transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(100%)')};
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  h3 {
    font-size: 16px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const CountBadge = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.colors.accentGreenBg};
  color: ${({ theme }) => theme.colors.accentGreen};
  border: 1px solid ${({ theme }) => theme.colors.accentGreenBorder};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 11px;
  font-weight: 700;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ClearAllButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accentRed};
  background-color: ${({ theme }) => theme.colors.accentRedBg};
  border: 1px solid rgba(239, 68, 68, 0.25);

  &:hover {
    background-color: ${({ theme }) => theme.colors.accentRed};
    color: #fff;
  }
`;

const CloseButton = styled.button`
  padding: 6px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const InfoBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.4;
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NotifCard = styled.div<{ $isBreakout: boolean }>`
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.surfaceCard};
  border: 1px solid
    ${({ $isBreakout, theme }) =>
      $isBreakout ? theme.colors.accentGreenBorder : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  transition: all 0.15s ease-in-out;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderLight};
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TagsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TimeframeBadge = styled.span<{ $tf: Timeframe }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const TypeTag = styled.span<{ $type: 'morning' | 'eod' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $type, theme }) =>
    $type === 'morning' &&
    `
    background-color: ${theme.colors.accentGreenBg};
    color: ${theme.colors.accentGreen};
    border: 1px solid ${theme.colors.accentGreenBorder};
  `}

  ${({ $type, theme }) =>
    $type === 'eod' &&
    `
    background-color: ${theme.colors.accentBlueBg};
    color: ${theme.colors.accentBlue};
    border: 1px solid rgba(59, 130, 246, 0.4);
  `}
`;

const DeleteBtn = styled.button`
  padding: 4px;
  color: ${({ theme }) => theme.colors.textMuted};
  border-radius: ${({ theme }) => theme.borderRadius.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.accentRed};
    background-color: ${({ theme }) => theme.colors.accentRedBg};
  }
`;

const CardTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CardMessage = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const EmptyList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => theme.colors.textMuted};
  gap: 12px;
  text-align: center;
  padding: 32px;

  h4 {
    font-size: 15px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  p {
    font-size: 12px;
    line-height: 1.5;
  }
`;

export const NotificationDrawer: React.FC = () => {
  const {
    notifications,
    isDrawerOpen,
    setDrawerOpen,
    dismissNotification,
    clearAllNotifications,
  } = useNotificationStore();

  const isMorning = (type: string) => type === 'MORNING_BREAKOUT';

  return (
    <>
      <Overlay $open={isDrawerOpen} onClick={() => setDrawerOpen(false)} />
      <Drawer $open={isDrawerOpen}>
        <Header>
          <TitleGroup>
            <Bell size={18} color="#10B981" />
            <h3>Surveillance Alerts</h3>
            <CountBadge>{notifications.length}</CountBadge>
          </TitleGroup>

          <HeaderActions>
            {notifications.length > 0 && (
              <ClearAllButton onClick={clearAllNotifications} title="Clear all alerts">
                <Trash2 size={13} />
                <span>Clear All</span>
              </ClearAllButton>
            )}
            <CloseButton onClick={() => setDrawerOpen(false)}>
              <X size={18} />
            </CloseButton>
          </HeaderActions>
        </Header>

        <InfoBanner>
          <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Alerts persist in browser storage. Individual alerts can be cleared one-by-one. All
            alerts automatically purge at the start of the next trading day.
          </span>
        </InfoBanner>

        <List>
          {notifications.length === 0 ? (
            <EmptyList>
              <Bell size={36} color="#334155" />
              <h4>No Alerts Triggered Today</h4>
              <p>
                Monitoring your watchlist stocks across 1-Min, 5-Min, 15-Min, Daily, Weekly, and Monthly timeframes. Triggered alerts will appear here.
              </p>
            </EmptyList>
          ) : (
            notifications.map(notif => (
              <NotifCard key={notif.id} $isBreakout={isMorning(notif.type)}>
                <CardTop>
                  <TagsWrapper>
                    <TimeframeBadge $tf={notif.timeframe || '15min'}>
                      {notif.timeframe === '1min'
                        ? '1-MIN'
                        : notif.timeframe === '5min'
                        ? '5-MIN'
                        : notif.timeframe === '15min'
                        ? '15-MIN'
                        : notif.timeframe === 'daily'
                        ? 'DAILY'
                        : notif.timeframe === 'smacross'
                        ? 'DAILY-1X'
                        : notif.timeframe
                        ? notif.timeframe.toUpperCase()
                        : '15-MIN'}
                    </TimeframeBadge>
                    <TypeTag $type={isMorning(notif.type) ? 'morning' : 'eod'}>
                      {isMorning(notif.type) ? <Flame size={11} /> : <TrendingUp size={11} />}
                      {isMorning(notif.type) ? 'Morning Breakout' : '3:30 PM EOD Max'}
                    </TypeTag>
                  </TagsWrapper>
                  <DeleteBtn
                    onClick={() => dismissNotification(notif.id)}
                    title="Dismiss this notification"
                  >
                    <Trash2 size={14} />
                  </DeleteBtn>
                </CardTop>

                <CardTitle>{notif.title}</CardTitle>
                <CardMessage>{notif.message}</CardMessage>

                <CardFooter>
                  <span>Ratio: {notif.ratio}x</span>
                  <span>{new Date(notif.timestamp).toLocaleTimeString('en-IN')} IST</span>
                </CardFooter>
              </NotifCard>
            ))
          )}
        </List>
      </Drawer>
    </>
  );
};
