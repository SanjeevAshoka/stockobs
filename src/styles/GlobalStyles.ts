import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    width: 100%;
    min-height: 100vh;
    background-color: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-family: ${({ theme }) => theme.fonts.main};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  code, pre, .font-mono {
    font-family: ${({ theme }) => theme.fonts.mono};
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
    color: inherit;
    transition: all 0.2s ease-in-out;
  }

  input, select, textarea {
    font-family: inherit;
    color: inherit;
  }

  /* Custom dark scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.bg};
  }
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  @keyframes pulseGlow {
    0% {
      box-shadow: 0 0 5px rgba(16, 185, 129, 0.4);
    }
    50% {
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
    }
    100% {
      box-shadow: 0 0 5px rgba(16, 185, 129, 0.4);
    }
  }

  @keyframes tabPulse {
    0%, 100% {
      box-shadow: 0 0 0px rgba(16, 185, 129, 0);
      border-color: rgba(16, 185, 129, 0.4);
    }
    50% {
      box-shadow: 0 0 14px rgba(16, 185, 129, 0.85);
      border-color: rgba(16, 185, 129, 1);
    }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
