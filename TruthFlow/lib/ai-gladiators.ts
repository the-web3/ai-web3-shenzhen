import { Market, Outcome, AIProfile } from '../types';

// First Principles: Markets move based on Information Asymmetry.
// AI Agents act as "Market Makers" injecting liquidity based on their private data feeds.

export class AIGladiator {
  profile: AIProfile;

  constructor(profile: AIProfile) {
    this.profile = profile;
  }

  /**
   * Simulates the AI analyzing a market and making a trade decision.
   * In a real app, this would query OCR, Satellite APIs, or Customs databases.
   */
  decide(market: Market): { action: 'BUY' | 'HOLD'; direction: Outcome; amount: number } {
    const totalLiquidity = market.yesPool + market.noPool;
    const currentProbYes = totalLiquidity > 0 ? market.yesPool / totalLiquidity : 0.5;

    // Simulate "Private Truth" generation (The AI knows something humans might not)
    // We mock this by hashing the ID + time to get a deterministic "truth signal" for simulation
    const truthSignal = (Math.sin(market.id * 999) + 1) / 2; // Returns 0.0 to 1.0

    let confidence = 0;
    let direction = Outcome.YES;

    // Different personalities analyze data differently
    switch (this.profile.type) {
      case 'Citadel':
        // Only bets if probability is way off from truth signal
        if (Math.abs(truthSignal - currentProbYes) > 0.3) {
            confidence = 0.2; // Low risk
            direction = truthSignal > 0.5 ? Outcome.YES : Outcome.NO;
        }
        break;

      case 'Whale':
        // Trusts its satellite data implicitly. High volume.
        confidence = Math.abs(truthSignal - 0.5) * 2; // Higher confidence if signal is strong
        direction = truthSignal > 0.5 ? Outcome.YES : Outcome.NO;
        break;
      
      case 'Hunter':
        // Bets on momentum.
        direction = Math.random() > 0.5 ? Outcome.YES : Outcome.NO;
        confidence = Math.random();
        break;
    }

    if (confidence > 0.1) {
      // Amount is based on confidence and market size (Liquidity Injection)
      const baseBet = 1000;
      const betAmount = Math.floor(baseBet * confidence * (this.profile.type === 'Whale' ? 5 : 1));
      return { action: 'BUY', direction, amount: betAmount };
    }

    return { action: 'HOLD', direction: Outcome.YES, amount: 0 };
  }
}