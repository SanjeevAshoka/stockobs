import React from 'react';
import styled from 'styled-components';
import {
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  RotateCw,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useStockStore } from '@/store/useStockStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { isMarketOpen } from '@/services/engine/marketTime';

const Container = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.card};
  margin-bottom: 30px;
`;

const FilterStatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background-color: rgba(16, 185, 129, 0.08);
  border-bottom: 1px solid ${({ theme }) => theme.colors.accentGreenBorder};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.accentGreen};

  .left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  button {
    font-size: 11px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textSecondary};
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.06);

    &:hover {
      color: ${({ theme }) => theme.colors.textPrimary};
      background: rgba(255, 255, 255, 0.12);
    }
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`;

const Th = styled.th`
  padding: 14px 18px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: ${({ theme }) => theme.colors.textMuted};
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  white-space: nowrap;
`;

const Tr = styled.tr<{ $isBreakout?: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: background-color 0.15s ease;

  ${({ $isBreakout, theme }) =>
    $isBreakout
      ? `
    background-color: rgba(16, 185, 129, 0.05);
    &:hover {
      background-color: rgba(16, 185, 129, 0.09);
    }
  `
      : `
    &:hover {
      background-color: ${theme.colors.surfaceHover};
    }
  `}

  &:last-child {
    border-bottom: none;
  }
`;

const Td = styled.td`
  padding: 16px 18px;
  font-size: 13px;
  vertical-align: middle;
  white-space: nowrap;
`;

const SymbolInfo = styled.div`
  display: flex;
  flex-direction: column;

  strong {
    font-size: 15px;
    font-weight: 700;
    font-family: ${({ theme }) => theme.fonts.mono};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  span {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const MetricValue = styled.div`
  display: flex;
  flex-direction: column;

  .primary {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-weight: 700;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  .sub {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-top: 2px;
  }
`;

const RatioBadge = styled.span<{ $variant?: 'extreme' | 'sma' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;

  ${({ $variant, theme }) =>
    $variant === 'extreme'
      ? `
    background-color: ${theme.colors.accentGreenBg};
    color: ${theme.colors.accentGreen};
    border: 1px solid ${theme.colors.accentGreenBorder};
    box-shadow: ${theme.colors.accentGreenGlow};
    animation: pulseGlow 2s infinite;
  `
      : $variant === 'sma'
      ? `
    background-color: rgba(6, 182, 212, 0.15);
    color: #22d3ee;
    border: 1px solid rgba(6, 182, 212, 0.4);
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.25);
  `
      : `
    background-color: ${theme.colors.bgSecondary};
    color: ${theme.colors.textSecondary};
    border: 1px solid ${theme.colors.border};
  `}
`;

const NeutralBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const StatusPill = styled.span<{ $type: 'breakout' | 'sma' | 'eod' | 'normal' }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;

  ${({ $type, theme }) =>
    $type === 'breakout' &&
    `
    background-color: ${theme.colors.accentGreenBg};
    color: ${theme.colors.accentGreen};
    border: 1px solid ${theme.colors.accentGreenBorder};
  `}

  ${({ $type, theme }) =>
    $type === 'sma' &&
    `
    background-color: rgba(6, 182, 212, 0.15);
    color: #22d3ee;
    border: 1px solid rgba(6, 182, 212, 0.4);
  `}

  ${({ $type, theme }) =>
    $type === 'eod' &&
    `
    background-color: ${theme.colors.accentBlueBg};
    color: ${theme.colors.accentBlue};
    border: 1px solid rgba(59, 130, 246, 0.4);
  `}

  ${({ $type, theme }) =>
    $type === 'normal' &&
    `
    background-color: rgba(148, 163, 184, 0.1);
    color: ${theme.colors.textMuted};
  `}
`;

const ActionBtn = styled.button`
  padding: 6px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    color: ${({ theme }) => theme.colors.accentRed};
    background-color: ${({ theme }) => theme.colors.accentRedBg};
  }
`;

const EmptyState = styled.div`
  padding: 48px 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};

  h4 {
    font-size: 16px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 6px;
  }

  p {
    font-size: 13px;
    line-height: 1.5;
    max-width: 500px;
    margin: 0 auto;
  }
`;

const ResetFilterBtn = styled.button`
  margin-top: 14px;
  padding: 8px 18px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.accentBlue};
  color: #fff;
  font-size: 12px;
  font-weight: 700;

  &:hover {
    filter: brightness(1.15);
  }
`;

export const StockTable: React.FC = () => {
  const {
    watchlists,
    activeTimeframe,
    filterAlertsOnly,
    toggleFilterAlertsOnly,
    removeStock,
    syncStock,
  } = useStockStore();
  const { eveningComparisonMode } = useSettingsStore();

  const fullWatchlist = watchlists[activeTimeframe] || [];
  const displayedWatchlist = filterAlertsOnly
    ? fullWatchlist.filter(s => s.morningBreakout)
    : fullWatchlist;

  if (fullWatchlist.length === 0) {
    return (
      <Container>
        <EmptyState>
          <h4>No Stocks in {activeTimeframe.toUpperCase()} Watchlist</h4>
          <p>Search and add stocks above to begin automated {activeTimeframe} volume surveillance.</p>
        </EmptyState>
      </Container>
    );
  }

  if (filterAlertsOnly && displayedWatchlist.length === 0) {
    return (
      <Container>
        <EmptyState>
          <Flame size={32} color="#F59E0B" style={{ marginBottom: '8px' }} />
          <h4>No Active Alerts in {activeTimeframe.toUpperCase()}</h4>
          <p>
            None of the {fullWatchlist.length} monitored stocks currently have a triggered morning 10x breakout or 3:30 PM EOD max-value anomaly.
          </p>
          <ResetFilterBtn onClick={toggleFilterAlertsOnly}>
            Show All {fullWatchlist.length} Stocks
          </ResetFilterBtn>
        </EmptyState>
      </Container>
    );
  }

  const baselineLabel =
    activeTimeframe === '1min'
      ? 'Volume 200 SMA (1-Min)'
      : activeTimeframe === '5min'
      ? 'Volume 200 SMA (5-Min)'
      : activeTimeframe === '15min'
      ? 'Volume 200 SMA (15-Min)'
      : activeTimeframe === 'daily'
      ? 'Volume 200 SMA (Daily)'
      : activeTimeframe === 'weekly'
      ? 'Volume 200 SMA (Weekly)'
      : 'Volume 200 SMA (Monthly)';

  const morningColHeader =
    activeTimeframe === '1min'
      ? '1-Min Volume (09:15 AM)'
      : activeTimeframe === '5min'
      ? '5-Min Volume (09:15–09:20)'
      : activeTimeframe === '15min'
      ? '15-Min Duration (09:15–09:30)'
      : activeTimeframe === 'daily'
      ? "Today's Traded Volume"
      : activeTimeframe === 'weekly'
      ? 'Weekly Traded Volume'
      : 'Monthly Traded Volume';

  return (
    <Container>
      {filterAlertsOnly && (
        <FilterStatusBar>
          <div className="left">
            <Filter size={13} />
            <span>
              Showing {displayedWatchlist.length} of {fullWatchlist.length} stocks with active alerts
            </span>
          </div>
          <button onClick={toggleFilterAlertsOnly} title="Turn off filter and show all stocks">
            <X size={12} />
            <span>Show All</span>
          </button>
        </FilterStatusBar>
      )}

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Instrument</Th>
              <Th>{morningColHeader}</Th>
              <Th>Whole-Day Maximum (3:30 PM)</Th>
              <Th>{baselineLabel}</Th>
              <Th>Surveillance Status</Th>
              <Th style={{ textAlign: 'right' }}>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {displayedWatchlist.map(stock => {
              const isExtremeTrigger = stock.morningRatio >= 10;
              const isSmaTrigger = stock.morningRatio >= 1.0;
              const isMorningTrigger = isExtremeTrigger || isSmaTrigger;
              const marketOpen = isMarketOpen();

              return (
                <Tr key={stock.symbol} $isBreakout={isMorningTrigger}>
                  <Td>
                    <SymbolInfo>
                      <strong>{stock.symbol}</strong>
                      <span>{stock.companyName}</span>
                    </SymbolInfo>
                  </Td>

                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MetricValue>
                        <span className="primary">
                          {stock.morningVolume > 0
                            ? stock.morningVolume.toLocaleString('en-IN')
                            : '—'}
                        </span>
                        <span className="sub">
                          {activeTimeframe === '1min'
                            ? '09:15 AM (1st Min)'
                            : activeTimeframe === '5min'
                            ? '09:15–09:20 Window'
                            : activeTimeframe === '15min'
                            ? '09:15–09:30 Window'
                            : activeTimeframe === 'daily'
                            ? 'Today Cumulative'
                            : 'Opening Session'}
                        </span>
                      </MetricValue>
                      <RatioBadge
                        $variant={isExtremeTrigger ? 'extreme' : isSmaTrigger ? 'sma' : 'neutral'}
                      >
                        {isExtremeTrigger && <Flame size={12} />}
                        {isSmaTrigger && !isExtremeTrigger && <Zap size={11} />}
                        {stock.morningRatio > 0 ? `${stock.morningRatio}x` : '—'}
                      </RatioBadge>
                    </div>
                  </Td>

                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MetricValue>
                        <span className="primary">
                          {eveningComparisonMode === 'volume'
                            ? stock.wholeDayVolume > 0
                              ? `${stock.wholeDayVolume.toLocaleString('en-IN')}`
                              : '—'
                            : stock.wholeDayHigh > 0
                            ? `₹${stock.wholeDayHigh.toLocaleString('en-IN')}`
                            : '—'}
                        </span>
                        <span className="sub">
                          {eveningComparisonMode === 'volume' ? 'Total Day Vol' : "Day's High"}
                        </span>
                      </MetricValue>
                      <NeutralBadge>
                        {stock.eodRatio > 0 ? `${stock.eodRatio}x` : '—'}
                      </NeutralBadge>
                    </div>
                  </Td>

                  <Td>
                    <MetricValue>
                      <span className="primary">
                        {stock.baseline200Volume > 0
                          ? `${stock.baseline200Volume.toLocaleString('en-IN')} shares`
                          : 'Computing...'}
                      </span>
                      {stock.currentPrice > 0 ? (
                        <span
                          className="sub"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            marginTop: '3px',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ color: '#F8FAFC' }}>
                            ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {stock.changePercent !== 0 && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: stock.changePercent >= 0 ? '#10B981' : '#EF4444',
                              }}
                            >
                              ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#64748B',
                              textTransform: 'uppercase',
                              letterSpacing: '0.4px',
                            }}
                          >
                            • {marketOpen ? 'LTP' : 'Close'}
                          </span>
                        </span>
                      ) : (
                        <span className="sub">—</span>
                      )}
                    </MetricValue>
                  </Td>

                  <Td>
                    {isExtremeTrigger ? (
                      <StatusPill $type="breakout">
                        <Flame size={12} />
                        <span>10x Breakout</span>
                      </StatusPill>
                    ) : isSmaTrigger ? (
                      <StatusPill $type="sma">
                        <Zap size={12} />
                        <span>Above 200 SMA</span>
                      </StatusPill>
                    ) : (
                      <StatusPill $type="normal">
                        <Clock size={12} />
                        <span>Monitoring</span>
                      </StatusPill>
                    )}
                  </Td>

                  <Td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                      <ActionBtn onClick={() => syncStock(stock.symbol, activeTimeframe)} title="Sync this stock">
                        <RotateCw size={15} />
                      </ActionBtn>
                      <ActionBtn onClick={() => removeStock(stock.symbol)} title="Remove from watchlist">
                        <Trash2 size={15} />
                      </ActionBtn>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrapper>
    </Container>
  );
};
