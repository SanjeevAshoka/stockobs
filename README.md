# StockObs - Indian Stock Market Volume Anomaly & EOD Surveillance System

StockObs is an automated, zero-backend surveillance dashboard for the Indian Stock Exchanges (NSE/BSE), integrating directly with the **Upstox API v2**.

It monitors user-selected stocks for massive volume breakouts (specifically checking the 15th-minute 60-second traded volume against historical 200-day baselines, as well as 200-week and 200-month flows), detects end-of-day whole day maximum breakouts at 3:30 PM, stores historical data locally using **IndexedDB**, and alerts users via **Browser Push Notifications** and an **In-App Notification Center**.

---

## Key Features

1. **Morning Opening Surveillance (09:16 AM / 09:30 AM IST)**:
   - Evaluates the opening candles after market open.
   - For the 15th-minute (09:29:00–09:29:59 IST), captures the exact 60-second traded volume from Upstox's `1minute` intraday feed.
   - If $\text{Traded Volume}_{15\text{th min}} \ge 10 \times \text{200-Day Baseline}$, triggers audio chimes, native desktop push notifications, and logs into the notification drawer.
   - Supports 200-week (Monday 9:30 AM) and 200-month (1st trading day 9:30 AM) evaluations.

2. **Evening Market Close (03:30 PM IST) Surveillance & Baseline Sync**:
   - Triggers at 3:30 PM IST when the market closes.
   - Scans for stocks whose whole-day maximum (total volume or day's high price) surpasses the 200-day average.
   - Automatically records today's closed daily candle into IndexedDB to maintain the rolling 200-day baseline fresh for tomorrow.

3. **Notification Persistence & Lifecycle Management**:
   - **Persistent across sessions**: All alerts remain in IndexedDB/localStorage.
   - **Clear One-by-One**: Dismiss individual alert cards with a single click.
   - **Clear All**: Purge all alerts instantly.
   - **Automatic Next-Day Purge**: When a new trading day begins in IST, notifications from previous days are automatically wiped clean.

4. **Zero Backend Required**:
   - Webpack DevServer proxies `/api/upstox` to `https://api.upstox.com` to prevent any CORS errors in local development.
   - IndexedDB (`idb`) caches historical 200-period OHLCV candles to stay well within API rate limits.
   - Upstox Access Token is entered via the Settings panel and stored only in browser storage.

5. **Integrated Market Simulator**:
   - Allows instant testing and verification of the 9:30 AM 10x breakout logic, 3:30 PM EOD scan, audio chimes, and browser notifications without waiting for live market hours.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
```
The optimized bundle will be created in `/dist`.

---

## Configuration & Upstox Token
1. Open the **Settings Modal** (gear icon in the top right).
2. Paste your daily **Upstox Access Token** (generated from the Upstox Developer Portal).
3. If you do not have an active token yet or want to test outside market hours, toggle **Demo / Simulation Mode** to use realistic simulated market candles and test the simulator buttons!

