import { STRATEGY_TYPES } from './finance.js';

export const GOLDEN_DATA = [
  {
    label: 'Loan10YrBalanced',
    inflationRate: 6.76,
    strategy: {
      type: STRATEGY_TYPES.LOAN,
      loanAmount: 1000000,
      loanRate: 8,
      loanTerm: 10,
      goldAPR: 8.1,
      stockAPR: 12.8,
      goldRatio: 40,
      analysisPeriod: 10,
    },
    expectations: {
      metrics: {
        nominalPortfolioValue: 2872577.1083162427,
        realPortfolioValue: 1493434.0333383656,
        netReturn: 1416645.97605195,
        realNetReturn: 37502.90107407281,
        nominalROI: 141.66459760519498,
        realROI: 3.750290107407281,
        nominalCAGR: 11.128939401589655,
        realCAGR: 4.0922999265545545,
        inflationLoss: 1379143.074977877,
        totalLoanPayment: 1455931.1322642928,
        emi: 12132.759435535774,
      },
      yearlyStart: { year: 0, nominalValue: 1000000, realValue: 1000000 },
      yearlyEnd: { year: 10, nominalValue: 1416645.97605195, realValue: 736504.9689015745 },
    },
  },
  {
    label: 'SIP15YrGrowth',
    inflationRate: 6.76,
    strategy: {
      type: STRATEGY_TYPES.SIP,
      monthlyInvestment: 25000,
      goldAPR: 8.1,
      stockAPR: 12.8,
      goldRatio: 40,
      analysisPeriod: 15,
    },
    expectations: {
      metrics: {
        nominalPortfolioValue: 11689738.541316217,
        realPortfolioValue: 4382039.831793296,
        netReturn: 7189738.541316217,
        realNetReturn: -117960.16820670385,
        nominalROI: 159.7719675848048,
        realROI: -2.621337071260086,
        nominalCAGR: 6.571109106572104,
        realCAGR: -0.17693039848999392,
        inflationLoss: 7307698.709522921,
        totalInvested: 4500000,
      },
      yearlyStart: { year: 0, nominalValue: 0, realValue: 0 },
      yearlyEnd: { year: 15, nominalValue: 7189738.541316217, realValue: 2695160.4226966463 },
    },
  },
];
