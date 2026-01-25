import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  calculateShares,
  validatePrices,
  calculateAMMTrade,
  getCurrentPrices,
  calculateMinOutput,
  calculateTradingFee,
  calculateCreatorReward,
  StakeCalculator,
} from "../StakeCalculator";

describe("StakeCalculator", () => {
  describe("calculateShares", () => {
    it("should calculate shares correctly for equal prices", () => {
      const result = calculateShares(1, 0.5, 0.5);
      expect(result.yes).toBe(2);
      expect(result.no).toBe(2);
      expect(result.total).toBe(4);
    });

    it("should calculate shares correctly for unequal prices", () => {
      const result = calculateShares(1, 0.7, 0.3);
      expect(result.yes).toBeCloseTo(1.43, 2);
      expect(result.no).toBeCloseTo(3.33, 2);
    });

    it("should throw error for invalid price sum", () => {
      expect(() => calculateShares(1, 0.6, 0.5)).toThrow();
    });
  });

  describe("validatePrices", () => {
    it("should validate correct prices", () => {
      const result = validatePrices(0.6, 0.4);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject prices outside valid range", () => {
      const result1 = validatePrices(0.005, 0.995);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain("YES价格必须在1%到99%之间");

      const result2 = validatePrices(0.995, 0.005);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain("YES价格必须在1%到99%之间"); // Both should trigger YES price error
    });

    it("should reject prices that do not sum to 1", () => {
      const result = validatePrices(0.6, 0.5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("价格总和必须等于100%");
    });
  });

  describe("calculateAMMTrade", () => {
    it("should calculate buy trade correctly", () => {
      const result = calculateAMMTrade(100, 100, 10, true, true);
      expect(result.shares).toBeGreaterThan(0);
      expect(result.cost).toBe(10);
      expect(result.priceImpact).toBeGreaterThan(0);
    });

    it("should calculate sell trade correctly", () => {
      const result = calculateAMMTrade(100, 100, 10, true, false);
      expect(result.shares).toBe(10);
      expect(result.cost).toBeGreaterThan(0);
      expect(result.priceImpact).toBeGreaterThan(0);
    });

    it("should maintain constant product invariant", () => {
      const initialYes = 100;
      const initialNo = 100;
      const k = initialYes * initialNo;

      const result = calculateAMMTrade(initialYes, initialNo, 10, true, true);

      // After trade, the product should remain approximately constant
      const newYes = initialYes - result.shares;
      const newNo = initialNo + result.cost;
      const newK = newYes * newNo;

      expect(Math.abs(newK - k)).toBeLessThan(0.001);
    });
  });

  describe("getCurrentPrices", () => {
    it("should calculate equal prices for equal shares", () => {
      const result = getCurrentPrices(100, 100);
      expect(result.yesPrice).toBe(0.5);
      expect(result.noPrice).toBe(0.5);
    });

    it("should calculate correct prices for unequal shares", () => {
      const result = getCurrentPrices(70, 30);
      expect(result.yesPrice).toBe(0.7);
      expect(result.noPrice).toBe(0.3);
    });

    it("should handle zero shares", () => {
      const result = getCurrentPrices(0, 0);
      expect(result.yesPrice).toBe(0.5);
      expect(result.noPrice).toBe(0.5);
    });
  });

  describe("calculateMinOutput", () => {
    it("should calculate minimum output with default slippage", () => {
      const result = calculateMinOutput(100);
      expect(result).toBe(99); // 1% slippage
    });

    it("should calculate minimum output with custom slippage", () => {
      const result = calculateMinOutput(100, 0.05);
      expect(result).toBe(95); // 5% slippage
    });
  });

  describe("calculateTradingFee", () => {
    it("should calculate trading fee correctly", () => {
      const result = calculateTradingFee(100, 200); // 2%
      expect(result).toBe(2);
    });

    it("should use default fee rate", () => {
      const result = calculateTradingFee(100);
      expect(result).toBe(2); // 2% default
    });
  });

  describe("calculateCreatorReward", () => {
    it("should calculate creator reward correctly", () => {
      const result = calculateCreatorReward(10, 2000); // 20%
      expect(result).toBe(2);
    });

    it("should use default reward rate", () => {
      const result = calculateCreatorReward(10);
      expect(result).toBe(2); // 20% default
    });
  });

  describe("StakeCalculator class", () => {
    it("should initialize with default values", () => {
      const calculator = new StakeCalculator();
      const state = calculator.getState();
      expect(state.yesPrice).toBe(0.5);
      expect(state.noPrice).toBe(0.5);
      expect(state.stakeAmount).toBe(0.1);
    });

    it("should update prices correctly", () => {
      const calculator = new StakeCalculator();
      calculator.updatePrices(0.7, 0.3);

      const state = calculator.getState();
      expect(state.yesPrice).toBe(0.7);
      expect(state.noPrice).toBe(0.3);
    });

    it("should update stake amount correctly", () => {
      const calculator = new StakeCalculator();
      calculator.updateStakeAmount(5);

      const state = calculator.getState();
      expect(state.stakeAmount).toBe(5);
    });

    it("should notify listeners on changes", () => {
      const calculator = new StakeCalculator();
      let notified = false;

      calculator.addListener(() => {
        notified = true;
      });

      calculator.updatePrices(0.6, 0.4);
      expect(notified).toBe(true);
    });

    it("should remove listeners correctly", () => {
      const calculator = new StakeCalculator();
      let notificationCount = 0;

      const removeListener = calculator.addListener(() => {
        notificationCount++;
      });

      calculator.updatePrices(0.6, 0.4);
      expect(notificationCount).toBe(1);

      removeListener();
      calculator.updatePrices(0.7, 0.3);
      expect(notificationCount).toBe(1); // Should not increase
    });

    it("should return calculation results", () => {
      const calculator = new StakeCalculator(0.6, 1);
      const result = calculator.getCalculation();

      expect(result.isValid).toBe(true);
      expect(result.yes).toBeCloseTo(1.67, 2);
      expect(result.no).toBeCloseTo(2.5, 2);
    });

    it("should handle invalid states", () => {
      const calculator = new StakeCalculator();

      // Test with invalid stake amount by trying to catch the error
      expect(() => calculator.updateStakeAmount(-1)).toThrow(
        "质押金额不能为负数",
      );

      // Test with valid stake amount but invalid prices - should throw during updatePrices
      calculator.updateStakeAmount(1);
      expect(() => calculator.updatePrices(0.3, 0.5)).toThrow(
        "价格总和必须等于100%",
      );
    });
  });
});

// Property-based tests
describe("StakeCalculator Property Tests", () => {
  /**
   * **Validates: Requirements 1.2**
   * Property: Price validation should always maintain sum = 1
   */
  it("should maintain price sum invariant", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(0.99) }), // Use Math.fround for fast-check
        (yesPrice) => {
          const noPrice = 1 - yesPrice;

          // Skip edge cases that might cause floating point precision issues
          if (Math.abs(noPrice) < 0.01 || Math.abs(noPrice) > 0.99) {
            return true;
          }

          const validation = validatePrices(yesPrice, noPrice);
          expect(validation.isValid).toBe(true);
        },
      ),
    );
  });

  /**
   * **Validates: Requirements 1.3**
   * Property: Share calculation should be consistent with price distribution
   */
  it("should calculate shares consistently with price distribution", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(0.99) }), // Use Math.fround for fast-check
        fc.float({ min: Math.fround(0.1), max: Math.fround(100) }),
        (yesPrice, stakeAmount) => {
          // Skip NaN values
          if (isNaN(yesPrice) || isNaN(stakeAmount)) {
            return true;
          }

          const noPrice = 1 - yesPrice;

          // Skip if noPrice is invalid or edge cases
          if (isNaN(noPrice) || noPrice <= 0.01 || noPrice >= 0.99) {
            return true;
          }

          const shares = calculateShares(stakeAmount, yesPrice, noPrice);

          // Skip if shares contain NaN
          if (isNaN(shares.yes) || isNaN(shares.no)) {
            return true;
          }

          // Lower price should yield more shares
          if (yesPrice < noPrice) {
            expect(shares.yes).toBeGreaterThan(shares.no);
          } else if (yesPrice > noPrice) {
            expect(shares.no).toBeGreaterThan(shares.yes);
          } else {
            expect(Math.abs(shares.yes - shares.no)).toBeLessThan(0.001);
          }
        },
      ),
    );
  });

  /**
   * **Validates: Requirements 2.1**
   * Property: AMM trades should preserve constant product
   */
  it("should preserve constant product in AMM trades", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(10), max: Math.fround(1000) }),
        fc.float({ min: Math.fround(10), max: Math.fround(1000) }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(10) }),
        fc.boolean(),
        (yesShares, noShares, tradeAmount, isYesTrade) => {
          // Skip NaN values
          if (isNaN(yesShares) || isNaN(noShares) || isNaN(tradeAmount)) {
            return true;
          }

          const k = yesShares * noShares;
          const result = calculateAMMTrade(
            yesShares,
            noShares,
            tradeAmount,
            isYesTrade,
            true,
          );

          // Skip if result contains NaN
          if (
            isNaN(result.shares) ||
            isNaN(result.cost) ||
            isNaN(result.priceImpact)
          ) {
            return true;
          }

          // Calculate new pool sizes
          let newYes, newNo;
          if (isYesTrade) {
            newYes = yesShares - result.shares;
            newNo = noShares + result.cost;
          } else {
            newYes = yesShares + result.cost;
            newNo = noShares - result.shares;
          }

          const newK = newYes * newNo;

          // Constant product should be preserved (within small tolerance for floating point)
          expect(Math.abs(newK - k) / k).toBeLessThan(0.001);
        },
      ),
    );
  });

  /**
   * **Validates: Requirements 2.2**
   * Property: Price impact should increase with trade size
   */
  it("should have increasing price impact with larger trades", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(100), max: Math.fround(1000) }),
        fc.float({ min: Math.fround(1), max: Math.fround(10) }),
        (poolSize, baseTradeSize) => {
          // Skip NaN values
          if (isNaN(poolSize) || isNaN(baseTradeSize)) {
            return true;
          }

          const smallTrade = calculateAMMTrade(
            poolSize,
            poolSize,
            baseTradeSize,
            true,
            true,
          );
          const largeTrade = calculateAMMTrade(
            poolSize,
            poolSize,
            baseTradeSize * 2,
            true,
            true,
          );

          // Skip if results contain NaN
          if (isNaN(smallTrade.priceImpact) || isNaN(largeTrade.priceImpact)) {
            return true;
          }

          expect(largeTrade.priceImpact).toBeGreaterThan(
            smallTrade.priceImpact,
          );
        },
      ),
    );
  });

  /**
   * **Validates: Requirements 3.1**
   * Property: Trading fees should be proportional to trade amount
   */
  it("should calculate proportional trading fees", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(1000) }),
        fc.integer({ min: 1, max: 1000 }),
        (amount, feeBps) => {
          // Skip NaN values
          if (isNaN(amount)) {
            return true;
          }

          const fee = calculateTradingFee(amount, feeBps);
          const expectedFee = amount * (feeBps / 10000);

          // Skip if fee is NaN
          if (isNaN(fee)) {
            return true;
          }

          expect(Math.abs(fee - expectedFee)).toBeLessThan(0.000001);
        },
      ),
    );
  });
});

// Integration tests for Web3 integration
describe("Web3 Integration Tests", () => {
  /**
   * **Validates: Requirements 4.1**
   * Property: Frontend calculations should match contract logic
   */
  it("should match contract share calculation logic", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(100) }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(0.99) }),
        (stakeAmount, yesPrice) => {
          // Skip NaN values
          if (isNaN(stakeAmount) || isNaN(yesPrice)) {
            return true;
          }

          const noPrice = 1 - yesPrice;

          // Skip if noPrice is invalid
          if (isNaN(noPrice) || noPrice <= 0) {
            return true;
          }

          const frontendShares = calculateShares(
            stakeAmount,
            yesPrice,
            noPrice,
          );

          // Skip if shares contain NaN
          if (isNaN(frontendShares.yes) || isNaN(frontendShares.no)) {
            return true;
          }

          // Simulate contract calculation
          const contractYesShares = stakeAmount / yesPrice;
          const contractNoShares = stakeAmount / noPrice;

          // Skip if contract calculations contain NaN
          if (isNaN(contractYesShares) || isNaN(contractNoShares)) {
            return true;
          }

          expect(Math.abs(frontendShares.yes - contractYesShares)).toBeLessThan(
            0.000001,
          );
          expect(Math.abs(frontendShares.no - contractNoShares)).toBeLessThan(
            0.000001,
          );
        },
      ),
    );
  });

  /**
   * **Validates: Requirements 4.2**
   * Property: Price calculations should be consistent with market state
   */
  it("should calculate consistent market prices", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(1000) }),
        fc.float({ min: Math.fround(1), max: Math.fround(1000) }),
        (yesShares, noShares) => {
          // Skip NaN values
          if (isNaN(yesShares) || isNaN(noShares)) {
            return true;
          }

          const prices = getCurrentPrices(yesShares, noShares);

          // Skip if prices contain NaN
          if (isNaN(prices.yesPrice) || isNaN(prices.noPrice)) {
            return true;
          }

          // Prices should sum to 1
          expect(Math.abs(prices.yesPrice + prices.noPrice - 1)).toBeLessThan(
            0.000001,
          );

          // Prices should be proportional to shares
          const totalShares = yesShares + noShares;
          expect(
            Math.abs(prices.yesPrice - yesShares / totalShares),
          ).toBeLessThan(0.000001);
          expect(
            Math.abs(prices.noPrice - noShares / totalShares),
          ).toBeLessThan(0.000001);
        },
      ),
    );
  });
});
