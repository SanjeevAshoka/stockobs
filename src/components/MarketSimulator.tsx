import React, { useState } from 'react';
import styled from 'styled-components';
import { Play, Sparkles, Volume2, Zap } from 'lucide-react';
import { Timeframe } from '@/types';
import { useStockStore } from '@/store/useStockStore';
import { soundService } from '@/services/notifications/sound';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px dashed ${({ theme }) => theme.colors.borderHighlight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 14px;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const IconPill = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.accentBlueBg};
  color: ${({ theme }) => theme.colors.accentBlue};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TextBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

const SimTitle = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SimDesc = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const TimeframeSelect = styled.select`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.accentBlue};
  }
`;

const SimButton = styled.button<{ $variant?: 'morning' | 'evening' | 'sound' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 12px;
  font-weight: 700;
  transition: all 0.2s ease-in-out;

  ${({ $variant, theme }) =>
    $variant === 'morning' &&
    `
    background-color: ${theme.colors.accentGreenBg};
    color: ${theme.colors.accentGreen};
    border: 1px solid ${theme.colors.accentGreenBorder};
    &:hover {
      background-color: ${theme.colors.accentGreen};
      color: #000;
      box-shadow: ${theme.colors.accentGreenGlow};
    }
  `}

  ${({ $variant, theme }) =>
    $variant === 'evening' &&
    `
    background-color: ${theme.colors.accentBlueBg};
    color: ${theme.colors.accentBlue};
    border: 1px solid rgba(59, 130, 246, 0.4);
    &:hover {
      background-color: ${theme.colors.accentBlue};
      color: #fff;
      box-shadow: ${theme.colors.accentBlueGlow};
    }
  `}

  ${({ $variant, theme }) =>
    $variant === 'sound' &&
    `
    background-color: rgba(168, 85, 247, 0.12);
    color: ${theme.colors.accentPurple};
    border: 1px solid rgba(168, 85, 247, 0.3);
    &:hover {
      background-color: ${theme.colors.accentPurple};
      color: #fff;
    }
  `}
`;

export const MarketSimulator: React.FC = () => {
  const { activeTimeframe, runMorningSurveillance, runEveningSurveillance } = useStockStore();
  const [selectedTf, setSelectedTf] = useState<Timeframe>(activeTimeframe);
  const [isRunning, setIsRunning] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleSimulateMorning = async () => {
    setIsRunning(true);
    setLastAction(`Simulating ${selectedTf.toUpperCase()} Morning Breakout...`);
    await runMorningSurveillance(selectedTf, true);
    setIsRunning(false);
    setLastAction(`${selectedTf.toUpperCase()} 10x Breakout Triggered!`);
    setTimeout(() => setLastAction(null), 4000);
  };

  const handleSimulateEvening = async () => {
    setIsRunning(true);
    setLastAction(`Simulating ${selectedTf.toUpperCase()} 3:30 PM EOD Scan...`);
    await runEveningSurveillance(selectedTf, true);
    setIsRunning(false);
    setLastAction(`${selectedTf.toUpperCase()} 3:30 PM EOD Max-Value Triggered!`);
    setTimeout(() => setLastAction(null), 4000);
  };

  const handleTestAudio1x = () => {
    soundService.playBreakoutChimes(1);
    setLastAction('Chime Played (1x Focused)');
    setTimeout(() => setLastAction(null), 2500);
  };

  const handleTestAudio3x = () => {
    soundService.playBreakoutChimes(3);
    setLastAction('Chime Played (3x Backgrounded)');
    setTimeout(() => setLastAction(null), 3500);
  };

  return (
    <Container>
      <Left>
        <IconPill>
          <Sparkles size={16} />
        </IconPill>
        <TextBlock>
          <SimTitle>
            Multi-Timeframe Surveillance Hub
            {lastAction && (
              <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 600 }}>
                • {lastAction}
              </span>
            )}
          </SimTitle>
          <SimDesc>Test background tab alerts, tab blinking, and audio chimes instantly</SimDesc>
        </TextBlock>
      </Left>

      <ButtonGroup>
        <label style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>Target:</label>
        <TimeframeSelect
          value={selectedTf}
          onChange={e => setSelectedTf(e.target.value as Timeframe)}
          title="Select timeframe to trigger"
        >
          <option value="1min">1-Min Tab (09:15 Opening)</option>
          <option value="5min">5-Min Tab (09:15–09:20)</option>
          <option value="15min">15-Min Tab (09:15–09:30)</option>
          <option value="daily">Daily Tab (Full Day / EOD)</option>
          <option value="weekly">Weekly Tab</option>
          <option value="monthly">Monthly Tab</option>
        </TimeframeSelect>

        <SimButton $variant="sound" onClick={handleTestAudio1x} title="Test 1x Acoustic Chime (app focused)">
          <Volume2 size={13} />
          <span>Test 1x Sound</span>
        </SimButton>

        <SimButton $variant="sound" onClick={handleTestAudio3x} title="Test 3x Acoustic Chimes (backgrounded tab)">
          <Volume2 size={13} />
          <span>Test 3x Chimes</span>
        </SimButton>

        <SimButton
          $variant="morning"
          disabled={isRunning}
          onClick={handleSimulateMorning}
          title="Trigger morning 10x breakout on selected timeframe"
        >
          <Zap size={13} />
          <span>Simulate Morning Breakout</span>
        </SimButton>

        <SimButton
          $variant="evening"
          disabled={isRunning}
          onClick={handleSimulateEvening}
          title="Trigger 3:30 PM EOD whole day max condition on selected timeframe"
        >
          <Play size={13} />
          <span>Simulate 3:30 PM EOD</span>
        </SimButton>
      </ButtonGroup>
    </Container>
  );
};
