import { Instrument } from '@/types';

/**
 * Converts an NSE stock symbol to Yahoo Finance format.
 * e.g. 'RELIANCE' → 'RELIANCE.NS'
 */
export function toYahooSymbol(symbol: string): string {
  let s = symbol.trim().toUpperCase();
  // Map retired/demerged NSE ticker TATAMOTORS -> TMCV (Tata Motors Commercial)
  if (s === 'TATAMOTORS') s = 'TMCV';
  return s.includes('.') ? s : `${s}.NS`;
}

export const POPULAR_NSE_INSTRUMENTS: Instrument[] = [
  { symbol: 'RELIANCE', instrumentKey: 'NSE_EQ|INE002A01018', name: 'Reliance Industries Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'TCS', instrumentKey: 'NSE_EQ|INE467B01029', name: 'Tata Consultancy Services Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'HDFCBANK', instrumentKey: 'NSE_EQ|INE040A01034', name: 'HDFC Bank Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'INFY', instrumentKey: 'NSE_EQ|INE009A01021', name: 'Infosys Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'ICICIBANK', instrumentKey: 'NSE_EQ|INE090A01021', name: 'ICICI Bank Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'SBIN', instrumentKey: 'NSE_EQ|INE062A01020', name: 'State Bank of India', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'TMCV', instrumentKey: 'NSE_EQ|INE155A01022', name: 'Tata Motors Commercial Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'ITC', instrumentKey: 'NSE_EQ|INE154A01025', name: 'ITC Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'BHARTIARTL', instrumentKey: 'NSE_EQ|INE397D01024', name: 'Bharti Airtel Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'LT', instrumentKey: 'NSE_EQ|INE018A01030', name: 'Larsen & Toubro Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'KOTAKBANK', instrumentKey: 'NSE_EQ|INE237A01028', name: 'Kotak Mahindra Bank Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'AXISBANK', instrumentKey: 'NSE_EQ|INE238A01034', name: 'Axis Bank Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'BAJFINANCE', instrumentKey: 'NSE_EQ|INE296A01024', name: 'Bajaj Finance Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'MARUTI', instrumentKey: 'NSE_EQ|INE585B01010', name: 'Maruti Suzuki India Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'ASIANPAINT', instrumentKey: 'NSE_EQ|INE021A01026', name: 'Asian Paints Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'HCLTECH', instrumentKey: 'NSE_EQ|INE860A01027', name: 'HCL Technologies Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'SUNPHARMA', instrumentKey: 'NSE_EQ|INE044A01036', name: 'Sun Pharmaceutical Industries Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'TITAN', instrumentKey: 'NSE_EQ|INE280A01028', name: 'Titan Company Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'WIPRO', instrumentKey: 'NSE_EQ|INE075A01022', name: 'Wipro Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'NTPC', instrumentKey: 'NSE_EQ|INE733E01010', name: 'NTPC Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'TATASTEEL', instrumentKey: 'NSE_EQ|INE081A01020', name: 'Tata Steel Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'POWERGRID', instrumentKey: 'NSE_EQ|INE752E01010', name: 'Power Grid Corporation of India Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'M&M', instrumentKey: 'NSE_EQ|INE101A01026', name: 'Mahindra & Mahindra Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'ULTRACEMCO', instrumentKey: 'NSE_EQ|INE481G01011', name: 'UltraTech Cement Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'ADANIENT', instrumentKey: 'NSE_EQ|INE423A01024', name: 'Adani Enterprises Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'ADANIPORTS', instrumentKey: 'NSE_EQ|INE742F01042', name: 'Adani Ports & SEZ Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'ONGC', instrumentKey: 'NSE_EQ|INE213A01029', name: 'Oil & Natural Gas Corporation Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'JSWSTEEL', instrumentKey: 'NSE_EQ|INE019A01038', name: 'JSW Steel Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'COALINDIA', instrumentKey: 'NSE_EQ|INE522F01014', name: 'Coal India Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
  { symbol: 'BAJAJFINSV', instrumentKey: 'NSE_EQ|INE918I01026', name: 'Bajaj Finserv Ltd', segment: 'NSE_EQ', exchange: 'NSE' },
];

export function searchInstruments(query: string): Instrument[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  return POPULAR_NSE_INSTRUMENTS.filter(
    inst =>
      inst.symbol.includes(q) ||
      inst.name.toUpperCase().includes(q) ||
      inst.instrumentKey.toUpperCase().includes(q)
  );
}

export function findInstrumentBySymbol(symbol: string): Instrument | undefined {
  const s = symbol.trim().toUpperCase();
  return POPULAR_NSE_INSTRUMENTS.find(inst => inst.symbol === s);
}

export function createCustomInstrument(symbolOrKey: string): Instrument {
  const clean = symbolOrKey.trim().toUpperCase();
  if (clean.includes('|')) {
    const parts = clean.split('|');
    return {
      symbol: parts[1] || clean,
      instrumentKey: clean,
      name: `${parts[1] || clean} (Custom)`,
      segment: parts[0] || 'NSE_EQ',
      exchange: parts[0]?.split('_')[0] || 'NSE',
    };
  }
  return {
    symbol: clean,
    instrumentKey: `NSE_EQ|${clean}`,
    name: `${clean} (NSE)`,
    segment: 'NSE_EQ',
    exchange: 'NSE',
  };
}

