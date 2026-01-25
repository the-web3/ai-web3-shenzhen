import { Market, Outcome } from '../types';
import { getYesPrice, getEstimatedShares } from './MarketLogic';

export const calculateProbability = (yesPool: number, noPool: number): number => {
  return getYesPrice(yesPool, noPool);
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
};

export const simulateTxDelay = async (ms: number = 800) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const calculatePotentialReturn = (
  market: Market,
  amount: number,
  direction: Outcome
): number => {
  const isBuyingYes = direction === Outcome.YES;
  const shares = getEstimatedShares(amount, isBuyingYes, market.yesPool, market.noPool);
  return shares;
};
