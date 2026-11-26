import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { Flame, Plus, Search, Tag, X, Loader2, Check, Globe } from 'lucide-react';
import { Instrument } from '@/types';
import {
  POPULAR_NSE_INSTRUMENTS,
  searchInstruments,
  createCustomInstrument,
} from '@/services/api/instruments';
import { YahooFinanceClient } from '@/services/api/yahooFinanceClient';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useStockStore } from '@/store/useStockStore';

const Container = styled.div`
  margin-bottom: 24px;
  position: relative;
`;

const SearchBarWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 8px 16px;
  gap: 12px;
  box-shadow: ${({ theme }) => theme.shadows.card};
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accentBlue};
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const Input = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinningLoader = styled(Loader2)`
  animation: ${spin} 0.9s linear infinite;
  color: ${({ theme }) => theme.colors.accentBlue};
`;

const ClearButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 2px;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: ${({ theme }) => theme.colors.accentBlue};
  color: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: filter 0.15s ease;

  &:hover {
    filter: brightness(1.15);
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65);
  max-height: 320px;
  overflow-y: auto;
  z-index: 50;
`;

const DropdownStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: background 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const SymbolName = styled.div`
  display: flex;
  flex-direction: column;

  strong {
    font-size: 14px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-family: ${({ theme }) => theme.fonts.mono};
  }

  span {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const BadgeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const KeyPill = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  padding: 3px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const AddedIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.accentGreen};
  font-weight: 600;
`;

const CustomAddOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: rgba(59, 130, 246, 0.08);
  color: ${({ theme }) => theme.colors.accentBlue};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  &:hover {
    background-color: rgba(59, 130, 246, 0.15);
  }
`;

const PresetsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  flex-wrap: wrap;
  gap: 12px;
`;

const PresetsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
`;

const PresetLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PresetChip = styled.button<{ $added: boolean }>`
  font-size: 11px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.fonts.mono};
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ $added, theme }) =>
    $added ? 'rgba(16, 185, 129, 0.1)' : theme.colors.surface};
  color: ${({ $added, theme }) =>
    $added ? theme.colors.accentGreen : theme.colors.textSecondary};
  border: 1px solid
    ${({ $added, theme }) =>
      $added ? theme.colors.accentGreenBorder : theme.colors.border};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    border-color: ${({ theme }) => theme.colors.borderLight};
  }
`;

const FilterAlertsButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: 12px;
  font-weight: 700;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;

  ${({ $active, theme }) =>
    $active
      ? `
    background-color: rgba(16, 185, 129, 0.15);
    color: ${theme.colors.accentGreen};
    border: 1px solid ${theme.colors.accentGreen};
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.35);
  `
      : `
    background-color: ${theme.colors.bgSecondary};
    color: ${theme.colors.textSecondary};
    border: 1px solid ${theme.colors.border};
    &:hover {
      color: ${theme.colors.textPrimary};
      border-color: ${theme.colors.borderLight};
      background-color: ${theme.colors.surfaceHover};
    }
  `}
`;

const AlertCountBadge = styled.span<{ $active: boolean }>`
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 800;
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.accentGreen : theme.colors.accentYellow};
  color: #0b0f19;
`;

export const WatchlistManager: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [apiResults, setApiResults] = useState<Instrument[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    watchlists,
    activeTimeframe,
    addStock,
    filterAlertsOnly,
    toggleFilterAlertsOnly,
  } = useStockStore();

  const yahooClient = useMemo(
    () => new YahooFinanceClient(() => useSettingsStore.getState().demoMode),
    []
  );

  const currentList = watchlists[activeTimeframe] || [];

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced live network search via Yahoo Finance API
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setApiResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await yahooClient.searchSymbols(trimmed);
        setApiResults(results);
      } catch (err) {
        console.warn('[WatchlistManager] Symbol search failed:', err);
        setApiResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, yahooClient]);

  // Static local results from popular 30 instruments
  const localResults = useMemo(() => {
    return query.trim() ? searchInstruments(query) : [];
  }, [query]);

  // Combined deduplicated results (Local + Live Yahoo API)
  const combinedResults = useMemo(() => {
    const seen = new Set<string>();
    const list: Instrument[] = [];

    // Prioritize exact local matches first
    for (const item of localResults) {
      const sym = item.symbol.toUpperCase();
      if (!seen.has(sym)) {
        seen.add(sym);
        list.push(item);
      }
    }

    // Append live Yahoo Finance search results
    for (const item of apiResults) {
      const sym = item.symbol.toUpperCase();
      if (!seen.has(sym)) {
        seen.add(sym);
        list.push(item);
      }
    }

    return list;
  }, [localResults, apiResults]);

  const handleSelect = (instrument: Instrument) => {
    addStock(instrument);
    setQuery('');
    setApiResults([]);
    setIsFocused(false);
  };

  const handleCustomAdd = () => {
    if (!query.trim()) return;
    const custom = createCustomInstrument(query.trim());
    addStock(custom);
    setQuery('');
    setApiResults([]);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedResults.length > 0) {
        handleSelect(combinedResults[0]);
      } else {
        handleCustomAdd();
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const handleAddButtonClick = () => {
    if (!query.trim()) return;
    if (combinedResults.length > 0) {
      handleSelect(combinedResults[0]);
    } else {
      handleCustomAdd();
    }
  };

  const topSuggestions = POPULAR_NSE_INSTRUMENTS.slice(0, 8);
  const alertCount = currentList.filter(s =>
    s.morningBreakout || (activeTimeframe === 'smacross' && s.eodBreakout)
  ).length;
  const tfDisplay =
    activeTimeframe === '1min'
      ? '1-Min'
      : activeTimeframe === '5min'
      ? '5-Min'
      : activeTimeframe === '15min'
      ? '15-Min'
      : activeTimeframe === 'daily'
      ? 'Daily'
      : activeTimeframe === 'smacross'
      ? 'Daily(1*EOD)'
      : activeTimeframe === 'weekly'
      ? 'Weekly'
      : 'Monthly';

  const showDropdown = isFocused && query.trim().length > 0;

  return (
    <Container ref={containerRef}>
      <SearchBarWrapper>
        <Search size={18} color="#64748B" />
        <Input
          type="text"
          placeholder={`Search NSE stock symbol (e.g. SUZLON, PAYTM, RELIANCE, TCS) to add to ${tfDisplay}...`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
        />
        {isSearching && <SpinningLoader size={16} />}
        {query && !isSearching && (
          <ClearButton
            onClick={() => {
              setQuery('');
              setApiResults([]);
            }}
          >
            <X size={16} />
          </ClearButton>
        )}
        <AddButton onClick={handleAddButtonClick}>
          <Plus size={16} />
          <span>Add Stock</span>
        </AddButton>
      </SearchBarWrapper>

      {/* Autocomplete Dropdown with Live Yahoo Finance Results */}
      {showDropdown && (
        <Dropdown>
          {isSearching && (
            <DropdownStatus>
              <SpinningLoader size={12} />
              <span>Searching Yahoo Finance for "{query}"...</span>
            </DropdownStatus>
          )}

          {!isSearching && combinedResults.length > 0 && (
            <DropdownStatus>
              <Globe size={12} />
              <span>
                Matching NSE Stocks ({combinedResults.length} found)
              </span>
            </DropdownStatus>
          )}

          {combinedResults.map(inst => {
            const isAlreadyAdded = currentList.some(w => w.symbol === inst.symbol);
            return (
              <DropdownItem key={inst.symbol} onClick={() => handleSelect(inst)}>
                <SymbolName>
                  <strong>{inst.symbol}</strong>
                  <span>{inst.name}</span>
                </SymbolName>
                <BadgeGroup>
                  <KeyPill>{inst.symbol}.NS</KeyPill>
                  {isAlreadyAdded ? (
                    <AddedIndicator>
                      <Check size={12} />
                      <span>In {tfDisplay}</span>
                    </AddedIndicator>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600 }}>
                      + Add
                    </span>
                  )}
                </BadgeGroup>
              </DropdownItem>
            );
          })}

          {/* Quick Option to Add Exact Query as Custom NSE Instrument */}
          <CustomAddOption onClick={handleCustomAdd}>
            <Plus size={15} />
            <span>
              Add <strong>"{query.trim().toUpperCase()}"</strong> directly as custom NSE ticker
            </span>
          </CustomAddOption>
        </Dropdown>
      )}

      {/* Quick Add Presets + Rightmost Filter Alerts Toggle */}
      <PresetsRow>
        <PresetsContainer>
          <PresetLabel>
            <Tag size={12} />
            Add to {tfDisplay}:
          </PresetLabel>
          {topSuggestions.map(inst => {
            const isAdded = currentList.some(w => w.symbol === inst.symbol);
            return (
              <PresetChip
                key={inst.symbol}
                $added={isAdded}
                onClick={() => !isAdded && addStock(inst)}
                title={inst.name}
              >
                {isAdded ? `✓ ${inst.symbol}` : `+ ${inst.symbol}`}
              </PresetChip>
            );
          })}
        </PresetsContainer>

        <FilterAlertsButton
          $active={filterAlertsOnly}
          onClick={toggleFilterAlertsOnly}
          title={
            filterAlertsOnly
              ? 'Click to show all watchlist stocks'
              : 'Click to filter only stocks with active breakout or EOD alerts'
          }
        >
          <Flame size={14} color={filterAlertsOnly ? '#10B981' : '#F59E0B'} />
          <span>{filterAlertsOnly ? 'Showing Alerts Only' : 'Filter Alerts Only'}</span>
          {alertCount > 0 && (
            <AlertCountBadge $active={filterAlertsOnly}>{alertCount}</AlertCountBadge>
          )}
        </FilterAlertsButton>
      </PresetsRow>
    </Container>
  );
};
