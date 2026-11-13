import React from 'react';
import styled from 'styled-components';
import {
  Bell,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  requestNotificationPermission,
  showPushNotification,
} from '@/services/notifications/browserPush';

const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition: all 0.2s ease-in-out;
`;

const Modal = styled.div`
  width: 560px;
  max-width: 100%;
  max-height: 90vh;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Title = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseBtn = styled.button`
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 6px;
  border-radius: ${({ theme }) => theme.borderRadius.md};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background-color: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const Body = styled.div`
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SubText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.4;
`;

const DataSourceCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background-color: ${({ theme }) => theme.colors.accentGreenBg};
  border: 1px solid ${({ theme }) => theme.colors.accentGreenBorder};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 13px;
  line-height: 1.4;

  strong {
    color: ${({ theme }) => theme.colors.accentGreen};
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const Switch = styled.input.attrs({ type: 'checkbox' })`
  width: 40px;
  height: 22px;
  appearance: none;
  background-color: #334155;
  border-radius: 11px;
  position: relative;
  cursor: pointer;
  outline: none;
  transition: background-color 0.2s;

  &:checked {
    background-color: #10b981;
  }

  &::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    background-color: #fff;
    transition: transform 0.2s;
  }

  &:checked::before {
    transform: translateX(18px);
  }
`;

const RadioGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const RadioButton = styled.button<{ $selected: boolean }>`
  padding: 10px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  border: 1px solid
    ${({ $selected, theme }) =>
      $selected ? theme.colors.accentBlue : theme.colors.border};
  background-color: ${({ $selected, theme }) =>
    $selected ? theme.colors.accentBlueBg : theme.colors.bgSecondary};
  color: ${({ $selected, theme }) =>
    $selected ? theme.colors.accentBlue : theme.colors.textSecondary};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accentBlue};
  }
`;

const SliderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const Slider = styled.input.attrs({ type: 'range' })`
  flex: 1;
  accent-color: #3b82f6;
  cursor: pointer;
`;

const SliderValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 700;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.accentBlue};
  min-width: 45px;
  text-align: right;
`;

const Footer = styled.div`
  padding: 16px 24px;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DoneButton = styled.button`
  padding: 8px 20px;
  background-color: ${({ theme }) => theme.colors.accentBlue};
  color: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 13px;
  font-weight: 700;

  &:hover {
    filter: brightness(1.15);
  }
`;

const ResetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const settings = useSettingsStore();

  const handleTestNotification = async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      showPushNotification(
        'StockObs Notification Test',
        'Desktop push notifications are successfully connected and working!'
      );
    }
  };

  return (
    <Overlay $open={isOpen} onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <Title>
            <Sliders size={18} color="#3B82F6" />
            System & Surveillance Settings
          </Title>
          <CloseBtn onClick={onClose}>
            <X size={18} />
          </CloseBtn>
        </ModalHeader>

        <Body>
          {/* Data Source Notice */}
          <DataSourceCard>
            <CheckCircle2 size={20} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Data Source: Yahoo Finance Engine</strong>
              <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '4px' }}>
                All NSE historical candles (daily, weekly, monthly 200-period baselines) and live intraday candles are retrieved automatically with zero authentication tokens or API keys required.
              </div>
            </div>
          </DataSourceCard>

          {/* Demo Mode */}
          <ToggleContainer>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#10B981" />
                Demo / Simulation Mode
              </div>
              <SubText>Run surveillance with synthetic test candles (ideal for testing outside market hours)</SubText>
            </div>
            <Switch
              checked={settings.demoMode}
              onChange={e => settings.setDemoMode(e.target.checked)}
            />
          </ToggleContainer>

          {/* Morning Trigger Timing */}
          <Section>
            <Label>Morning Surveillance Timing</Label>
            <RadioGroup>
              <RadioButton
                $selected={settings.morningTriggerTime === '9:16'}
                onClick={() => settings.setMorningTriggerTime('9:16')}
              >
                09:16 AM (1st Min)
              </RadioButton>
              <RadioButton
                $selected={settings.morningTriggerTime === '9:30'}
                onClick={() => settings.setMorningTriggerTime('9:30')}
              >
                09:30 AM (15th Min)
              </RadioButton>
              <RadioButton
                $selected={settings.morningTriggerTime === 'both'}
                onClick={() => settings.setMorningTriggerTime('both')}
              >
                Both Active
              </RadioButton>
            </RadioGroup>
          </Section>

          {/* Morning Multiplier Slider */}
          <Section>
            <Label>
              <span>Morning Volume Multiplier</span>
              <span style={{ color: '#10B981', fontFamily: 'monospace' }}>
                {settings.morningMultiplier}x Baseline
              </span>
            </Label>
            <SliderWrapper>
              <Slider
                min={2}
                max={25}
                step={1}
                value={settings.morningMultiplier}
                onChange={e => settings.setMorningMultiplier(Number(e.target.value))}
              />
              <SliderValue>{settings.morningMultiplier}x</SliderValue>
            </SliderWrapper>
            <SubText>Alert triggers when morning traded volume exceeds the 200-period baseline by this multiplier.</SubText>
          </Section>

          {/* Evening 3:30 PM Mode & Multiplier */}
          <Section>
            <Label>Evening 3:30 PM EOD Comparison Metric</Label>
            <RadioGroup style={{ gridTemplateColumns: '1fr 1fr' }}>
              <RadioButton
                $selected={settings.eveningComparisonMode === 'volume'}
                onClick={() => settings.setEveningComparisonMode('volume')}
              >
                Total Day Volume
              </RadioButton>
              <RadioButton
                $selected={settings.eveningComparisonMode === 'price'}
                onClick={() => settings.setEveningComparisonMode('price')}
              >
                Day High Price
              </RadioButton>
            </RadioGroup>
          </Section>

          {/* Audio & Notification Toggles */}
          <Section>
            <ToggleContainer>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={14} color="#A855F7" />
                  Sound Alerts (Acoustic Chimes)
                </div>
                <SubText>1x chime when app is focused, 3x chimes if app tab is backgrounded</SubText>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onChange={e => settings.setSoundEnabled(e.target.checked)}
              />
            </ToggleContainer>

            <ToggleContainer style={{ marginTop: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={14} color="#3B82F6" />
                  Browser Desktop Notifications
                </div>
                <SubText>Display native OS push notifications even when tab is backgrounded</SubText>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleTestNotification}
                  style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: '#1E293B',
                    border: '1px solid #334155',
                  }}
                >
                  Request / Test
                </button>
                <Switch
                  checked={settings.browserNotificationsEnabled}
                  onChange={e => settings.setBrowserNotificationsEnabled(e.target.checked)}
                />
              </div>
            </ToggleContainer>
          </Section>
        </Body>

        <Footer>
          <ResetButton onClick={() => settings.resetDefaults()}>
            <RotateCcw size={13} />
            Reset Defaults
          </ResetButton>
          <DoneButton onClick={onClose}>Done</DoneButton>
        </Footer>
      </Modal>
    </Overlay>
  );
};
