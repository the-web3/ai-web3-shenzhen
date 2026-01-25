import { Market } from '../types';

/**
 * Calculates the price of YES (Safe) tokens based on CPMM reserves.
 * In a CPMM prediction market, Price(YES) = NoReserve / (YesReserve + NoReserve).
 * This is because as you buy YES, you deplete the YesReserve, making it scarcer (Wait, math check).
 * 
 * Logic:
 * If Pool has 10 YES and 90 NO.
 * To buy YES, you must put in NO.
 * Since YES is scarce (10), it is expensive.
 * Price ~= 90 / 100 = 0.9.
 * 
 * So Low Yes Reserve = High Yes Price = High Probability of Yes.
 */
export const getYesPrice = (yesPool: number, noPool: number): number => {
    if (yesPool + noPool === 0) return 0;
    return noPool / (yesPool + noPool);
};

/**
 * Calculates the price of NO (Fraud) tokens.
 * Price(NO) = YesReserve / (YesReserve + NoReserve).
 */
export const getNoPrice = (yesPool: number, noPool: number): number => {
    if (yesPool + noPool === 0) return 0;
    return yesPool / (yesPool + noPool);
};

/**
 * Estimates the shares received for a trade.
 * @param amountIn HSK input
 * @param isBuyingYes Direction
 * @param yesPool Current Yes Reserve
 * @param noPool Current No Reserve
 */
export const getEstimatedShares = (amountIn: number, isBuyingYes: boolean, yesPool: number, noPool: number) => {
    // Basic CPMM: k = x * y
    // We assume 1 HSK = 1 YES + 1 NO
    // We keep the one we want, and swap the other.
    
    // Fee ignored for estimation
    const investAmount = amountIn;
    const k = yesPool * noPool;
    
    if (isBuyingYes) {
        // Inputting NO to pool.
        const newNoPool = noPool + investAmount;
        const newYesPool = k / newNoPool;
        const yesBought = yesPool - newYesPool;
        return investAmount + yesBought; // Total YES obtained
    } else {
        // Inputting YES to pool.
        const newYesPool = yesPool + investAmount;
        const newNoPool = k / newYesPool;
        const noBought = noPool - newNoPool;
        return investAmount + noBought; // Total NO obtained
    }
};
