export class LMSR {
  outcomes: string[];
  b: number;
  q: Record<string, number>;

  constructor(outcomes: string[], b: number) {
    this.outcomes = outcomes;
    this.b = b;
    this.q = {}; // share balances per outcome
    for (const o of outcomes) this.q[o] = 0;
  }

  // LMSR cost function
  cost(q: Record<string, number> = this.q): number {
    const sumExp = this.outcomes.reduce(
      (sum, o) => sum + Math.exp(q[o] / this.b),
      0
    );
    return this.b * Math.log(sumExp);
  }

  prices(): Record<string, number> {
    // Note: This function returns marginal prices to buy 1 share of all outcomes
    const result: Record<string, number> = {};
    for (const o of this.outcomes) {
      result[o] = this.tradeCost(o, 1);
    }
    return result;
  }

  // Buy deltaQ shares of a given outcome
  buy(outcome: string, deltaQ: number): number {
    const oldCost = this.cost();
    this.q[outcome] += deltaQ;
    const newCost = this.cost();
    return newCost - oldCost;
  }

  tradeCost(outcome: string, deltaQ: number): number {
    const tempQ = { ...this.q };
    tempQ[outcome] += deltaQ;
    return this.cost(tempQ) - this.cost(this.q);
  }

  // Get share balances
  getBalances() {
    return { ...this.q };
  }

  pricesAfterTrade(outcome: string, deltaQ: number): Record<string, number> {
    // Clone current state
    const tempQ = { ...this.q };
    tempQ[outcome] += deltaQ;

    // Use tradeCost on updated q
    const result: Record<string, number> = {};
    for (const o of this.outcomes) {
      const qWith1More = { ...tempQ };
      qWith1More[o] += 1;
      result[o] = this.cost(qWith1More) - this.cost(tempQ);
    }

    return result;
  }

  maxSharesFromCost(outcome: string, budget: number, precision = 1e-9): number {
  let low = 0;
  let high = 1;

  // Expand high until cost exceeds budget
  while (this.tradeCost(outcome, high) < budget) {
    high *= 2;
  }

  // Binary search
  while (high - low > precision) {
    const mid = (low + high) / 2;
    const cost = this.tradeCost(outcome, mid);
    if (cost > budget) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return low;
  }

  maxSharesFromPrice(outcome: string, targetPrice: number, precision = 1e-9): number {
    let low = 0;
    let high = 1;

    // Expand high until marginal price exceeds targetPrice
    while (true) {
      const price = this.pricesAfterTrade(outcome, high)[outcome];
      if (price >= targetPrice) break;
      high *= 2;
    }

    // Binary search to find number of shares for desired marginal price
    while (high - low > precision) {
      const mid = (low + high) / 2;
      const price = this.pricesAfterTrade(outcome, mid)[outcome];
      if (price > targetPrice) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return low;
  }

  // Returns the maximum loss the market maker can incur
  maxLoss(): number {
    return this.b * Math.log(this.outcomes.length);
  }
}

export class LSLMSR {
  outcomes: string[];
  alpha: number;
  q: Record<string, number>;
  initialShares: number;
  initialCost: number;

  constructor(outcomes: string[], alpha: number, initialShares = 0) {
    this.outcomes = outcomes;
    this.alpha = alpha;
    this.q = {};
    this.initialShares = initialShares;
    for (const o of outcomes) this.q[o] = this.initialShares;
    this.initialCost = this.cost();
  }

  static from_state(outcomesBalances: Record<string, number>, alpha: number) {
    // Note: Using this function to create the market makes `maxLoss` function not accurate
    const outcomes = Object.keys(outcomesBalances);
    const market = new LSLMSR(outcomes, alpha, 0);
    market.q = outcomesBalances;
    return market
  }

  b(q: Record<string, number> = this.q): number {
    return this.alpha * this.outcomes.reduce((sum, o) => sum + q[o], 0);
  }

  cost(q: Record<string, number> = this.q): number {
    const bq = this.b(q);
    if (bq === 0) return 0;
    const sumExp = this.outcomes.reduce((sum, o) => sum + Math.exp(q[o] / bq), 0);
    return bq * Math.log(sumExp);
  }

  prices(): Record<string, number> {
    // Note: This function returns marginal prices to buy 1 share of all outcomes
    const result: Record<string, number> = {};
    for (const o of this.outcomes) {
      result[o] = this.tradeCost(o, 1);
    }
    return result;
  }

  trade(outcome: string, deltaQ: number): number {
    const oldCost = this.cost();
    this.q[outcome] += deltaQ;
    const newCost = this.cost();
    return newCost - oldCost;
  }

  buy(outcome: string, shares: number): number {
    return this.trade(outcome, Math.abs(shares));
  }

  sell(outcome: string, shares: number): number {
    return this.trade(outcome, -Math.abs(shares));
  }

  tradeCost(outcome: string, deltaQ: number): number {
    const tempQ = { ...this.q };
    tempQ[outcome] += deltaQ;
    return this.cost(tempQ) - this.cost(this.q);
  }

  getBalances(): Record<string, number> {
    return { ...this.q };
  }

  getOutcome(outcome_index: number): string {
    // The received index is expected to be starting from 1
    return this.outcomes[outcome_index - 1];
  }

  pricesAfterTrade(outcome: string, deltaQ: number): Record<string, number> {
    const tempQ = { ...this.q };
    tempQ[outcome] += deltaQ;

    const result: Record<string, number> = {};
    for (const o of this.outcomes) {
      const qWith1More = { ...tempQ };
      qWith1More[o] += 1;
      result[o] = this.cost(qWith1More) - this.cost(tempQ);
    }

    return result;
  }

  maxSharesFromCost(outcome: string, budget: number, precision = 1e-9): number {
    let low = 0;
    let high = 1;

    while (this.tradeCost(outcome, high) < budget) {
      high *= 2;
    }

    while (high - low > precision) {
      const mid = (low + high) / 2;
      const cost = this.tradeCost(outcome, mid);
      if (cost > budget) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return low;
  }

  maxSharesFromPrice(outcome: string, targetPrice: number, precision = 1e-9): number {
    let low = 0;
    let high = 1;

    // Quickly search for a high bound amount
    while (true) {
      const price = this.pricesAfterTrade(outcome, high)[outcome];
      if (price >= targetPrice) break;
      high *= 2;
    }

    // Execute a binary search to find the number of shares that satisfy the price target
    while (high - low > precision) {
      const mid = (low + high) / 2;
      const price = this.pricesAfterTrade(outcome, mid)[outcome];
      if (price > targetPrice) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return low;
  }

  maxLoss(): number {
    // Get the outcome with the current higher share balance
    const sortedOutcomes = Object.entries(this.q).sort(([, a], [, b]) => b - a);
    const maxOutcome = sortedOutcomes[0][0];  // [first outcome][key value]

    // Calculate max extra shares to be bought and extra collected collateral
    const extraShares = Math.floor(this.maxSharesFromPrice(maxOutcome, 0.999));
    const extraCollectedCollateral = this.tradeCost(maxOutcome, extraShares);

    // Calculate max outcome balance and max redeemable payout
    const maxOutcomeBalance = this.q[maxOutcome] + extraShares;
    const maxPayout = maxOutcomeBalance - this.initialShares;

    // Calculate collected collateral and max collateral to be collected
    const collectedCollateral = this.cost() - this.initialCost;
    const maxCollectedCollateral = collectedCollateral + extraCollectedCollateral;

    // Calculate max loss
    const maxLoss = Math.min(maxCollectedCollateral - maxPayout, 0);
    return Math.abs(maxLoss);
  }
}


// *******************************************************
// * Quick script example to test market implementations *
// *******************************************************

// // Market initialization parameters
// const initialShares = 2000;
// const outcomes = ["A", "B", "C", "D"];
// const alpha = 0.01;
// const beta = 80;
//
// // Liquidity Sensitive LMSR Market example
// const m1 = new LSLMSR(outcomes, alpha, initialShares);
// console.log('Market LS-LMSR');
// console.log(`Outcomes: ${m1.outcomes} | b: ${m1.b()} | alpha: ${m1.alpha}`);
// console.log('Balances:', m1.getBalances());
// console.log('Max Loss:', m1.maxLoss());
// console.log('Prices:', m1.prices());
//
// // Traditional LMSR Market example
// const m2 = new LMSR(outcomes, beta);
// console.log('Market LMSR');
// console.log(`Outcomes: ${m2.outcomes} | b: ${m2.b}`);
// console.log('Balances:', m2.getBalances());
// console.log('Max Loss:', m2.maxLoss());
// console.log('Prices:', m2.prices());
//
// // Execute some random N trades
// const N = 10;
// const minAmount = 1
// const maxAmount = initialShares / 2
// console.log(`> Executing ${N} random trades (outcomes: ${outcomes})...`);
// for (let i = 0; i < N; i++) {
//   const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
//   const randomAmount = Math.floor(Math.random() * maxAmount) + minAmount;
//   if (N < 100) {
//     console.log(`> Executing trade... [BUY ${randomAmount} shares of ${randomOutcome}]`);
//   }
//   m1.buy(randomOutcome, randomAmount);
//   m2.buy(randomOutcome, randomAmount);
// }
//
// // Execute evenly distributed trades
// const tradeAmount = 100
// console.log(`> Executing evenly distributed trades (amount: ${tradeAmount})...`);
// outcomes.forEach(outcome => m1.buy(outcome, tradeAmount));
//
// // Show final state of LS-LMSR market
// console.log('Market LS-LMSR');
// console.log(`Outcomes: ${m1.outcomes} | b: ${m1.b()} | alpha: ${m1.alpha}`);
// console.log('Balances:', m1.getBalances());
// console.log('Max Loss:', m1.maxLoss());
// console.log('Prices:', m1.prices());
//
// // Show final state of a LMSR market
// console.log('Market LMSR');
// console.log(`Outcomes: ${m2.outcomes} | b: ${m2.b}`);
// console.log('Balances:', m2.getBalances());
// console.log('Max Loss:', m2.maxLoss());
// console.log('Prices:', m2.prices());
