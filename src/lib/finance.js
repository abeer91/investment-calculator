export const STRATEGY_TYPES = {
  LOAN: 'A',
  SIP: 'B',
};

/**
 * Equal Monthly Installment formula.
 * Converts annual interest into a monthly rate and solves the amortization formula:
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 */
export function calculateEMI(principal, annualRate, years) {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  if (months === 0) return 0;
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Projects a lump-sum portfolio split between gold and stocks using compound growth for each leg.
 */
export function calculatePortfolioGrowth(principal, goldAPR, stockAPR, goldRatio, years) {
  const goldGrowth = (principal * goldRatio) / 100 * Math.pow(1 + goldAPR / 100, years);
  const stockGrowth = (principal * (100 - goldRatio)) / 100 * Math.pow(1 + stockAPR / 100, years);
  return goldGrowth + stockGrowth;
}

/**
 * Standard SIP (systematic investment plan) future-value formula for two assets.
 * FV = contribution * ((1+r)^n - 1)/r * (1+r), calculated separately for gold and stocks.
 */
export function calculateSIPFutureValue(monthlyAmount, goldAPR, stockAPR, goldRatio, years) {
  const months = years * 12;
  const goldMonthly = (monthlyAmount * goldRatio) / 100;
  const stockMonthly = (monthlyAmount * (100 - goldRatio)) / 100;
  const goldRate = goldAPR / 100 / 12;
  const stockRate = stockAPR / 100 / 12;
  const goldFV = goldRate > 0
    ? goldMonthly * ((Math.pow(1 + goldRate, months) - 1) / goldRate) * (1 + goldRate)
    : goldMonthly * months;
  const stockFV = stockRate > 0
    ? stockMonthly * ((Math.pow(1 + stockRate, months) - 1) / stockRate) * (1 + stockRate)
    : stockMonthly * months;
  return goldFV + stockFV;
}

/**
 * Compound Annual Growth Rate, solving for r in final = initial * (1+r)^years.
 */
export function calculateCAGR(initialValue, finalValue, years) {
  if (initialValue <= 0 || years === 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

/**
 * Deflates a nominal amount into today's rupees using the provided inflation rate.
 */
export function calculateRealValue(nominalValue, inflationRate, years) {
  if (years === 0 || inflationRate === 0) return nominalValue;
  const inflationFactor = Math.pow(1 + inflationRate / 100, years);
  return nominalValue / inflationFactor;
}

/**
 * CAGR computed on real (inflation-adjusted) returns.
 */
export function calculateRealCAGR(initialValue, finalNominalValue, inflationRate, years) {
  if (initialValue <= 0 || years === 0) return 0;
  const finalRealValue = calculateRealValue(finalNominalValue, inflationRate, years);
  return (Math.pow(finalRealValue / initialValue, 1 / years) - 1) * 100;
}

/**
 * High-level helper that routes to the correct math engine based on strategy type.
 */
export function computeStrategyMetrics(strategy, inflationRate) {
  if (strategy.type === STRATEGY_TYPES.LOAN) {
    return computeLoanMetrics(strategy, inflationRate);
  }
  return computeSipMetrics(strategy, inflationRate);
}

/**
 * Loan-based strategy math: invest the borrowed amount and subtract repayments (EMI * months).
 */
function computeLoanMetrics(strategy, inflationRate) {
  const {
    loanAmount,
    loanRate,
    loanTerm,
    goldAPR,
    stockAPR,
    goldRatio,
    analysisPeriod = loanTerm,
  } = strategy;

  const emi = calculateEMI(loanAmount, loanRate, loanTerm);
  const totalLoanPayment = emi * loanTerm * 12;
  const nominalPortfolioValue = calculatePortfolioGrowth(loanAmount, goldAPR, stockAPR, goldRatio, analysisPeriod);
  const netReturn = nominalPortfolioValue - totalLoanPayment;
  const realPortfolioValue = calculateRealValue(nominalPortfolioValue, inflationRate, analysisPeriod);
  const realNetReturn = realPortfolioValue - totalLoanPayment;

  return {
    type: STRATEGY_TYPES.LOAN,
    analysisPeriod,
    emi,
    totalLoanPayment,
    nominalPortfolioValue,
    realPortfolioValue,
    netReturn,
    realNetReturn,
    nominalROI: (netReturn / loanAmount) * 100,
    realROI: (realNetReturn / loanAmount) * 100,
    nominalCAGR: calculateCAGR(loanAmount, nominalPortfolioValue, analysisPeriod),
    realCAGR: calculateRealCAGR(loanAmount, nominalPortfolioValue, inflationRate, analysisPeriod),
    inflationLoss: nominalPortfolioValue - realPortfolioValue,
  };
}

/**
 * SIP strategy math: monthly contributions compounded into a future value, minus total invested.
 */
function computeSipMetrics(strategy, inflationRate) {
  const {
    monthlyInvestment,
    goldAPR,
    stockAPR,
    goldRatio,
    analysisPeriod,
  } = strategy;

  const totalInvested = monthlyInvestment * 12 * analysisPeriod;
  const nominalPortfolioValue = calculateSIPFutureValue(monthlyInvestment, goldAPR, stockAPR, goldRatio, analysisPeriod);
  const netReturn = nominalPortfolioValue - totalInvested;
  const realPortfolioValue = calculateRealValue(nominalPortfolioValue, inflationRate, analysisPeriod);
  const realNetReturn = realPortfolioValue - totalInvested;

  return {
    type: STRATEGY_TYPES.SIP,
    analysisPeriod,
    totalInvested,
    nominalPortfolioValue,
    realPortfolioValue,
    netReturn,
    realNetReturn,
    nominalROI: (netReturn / totalInvested) * 100,
    realROI: (realNetReturn / totalInvested) * 100,
    nominalCAGR: calculateCAGR(totalInvested, nominalPortfolioValue, analysisPeriod),
    realCAGR: calculateRealCAGR(totalInvested, nominalPortfolioValue, inflationRate, analysisPeriod),
    inflationLoss: nominalPortfolioValue - realPortfolioValue,
  };
}

/**
 * Produces year-by-year nominal and real values so charts/table can show trajectory.
 */
export function generateYearlyData(strategy, inflationRate) {
  const data = [];
  for (let year = 0; year <= strategy.analysisPeriod; year++) {
    let portfolioValue = 0;
    let netValue = 0;
    if (strategy.type === STRATEGY_TYPES.LOAN) {
      const emi = calculateEMI(strategy.loanAmount, strategy.loanRate, strategy.loanTerm);
      const totalPaid = Math.min(emi * year * 12, emi * strategy.loanTerm * 12);
      portfolioValue = year === 0
        ? strategy.loanAmount
        : calculatePortfolioGrowth(strategy.loanAmount, strategy.goldAPR, strategy.stockAPR, strategy.goldRatio, year);
      netValue = portfolioValue - totalPaid;
    } else {
      const totalInvested = strategy.monthlyInvestment * 12 * year;
      portfolioValue = year === 0
        ? 0
        : calculateSIPFutureValue(strategy.monthlyInvestment, strategy.goldAPR, strategy.stockAPR, strategy.goldRatio, year);
      netValue = portfolioValue - totalInvested;
    }
    const realValue = calculateRealValue(portfolioValue, inflationRate, year);
    data.push({ year, portfolioValue, netValue, realValue });
  }
  return data;
}

/**
 * Converts multiple strategy time series into the shape Recharts expects for multi-line charts.
 */
export function buildChartSeries(strategies, inflationRate) {
  if (strategies.length === 0) return [];
  const seriesData = strategies.map(strategy => ({
    analysisPeriod: strategy.analysisPeriod,
    points: generateYearlyData(strategy, inflationRate),
  }));
  const maxYears = Math.max(...strategies.map(s => s.analysisPeriod));
  const rows = [];
  for (let year = 0; year <= maxYears; year++) {
    const row = { year };
    seriesData.forEach((series, idx) => {
      if (year <= series.analysisPeriod) {
        const point = series.points[year];
        if (point) {
          row[`strategy${idx}_nominal`] = point.portfolioValue;
          row[`strategy${idx}_real`] = point.realValue;
        }
      }
    });
    rows.push(row);
  }
  return rows;
}
