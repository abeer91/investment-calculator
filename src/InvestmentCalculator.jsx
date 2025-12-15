import React, { useState, useMemo } from 'react';
import { TrendingUp, Plus, Trash2, Calculator, PiggyBank, Wallet, BarChart3, Info, HelpCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const formatINR = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '₹0';
  const absNum = Math.abs(num);
  let formatted;
  if (absNum >= 10000000) formatted = (absNum / 10000000).toFixed(2) + ' Cr';
  else if (absNum >= 100000) formatted = (absNum / 100000).toFixed(2) + ' L';
  else if (absNum >= 1000) formatted = (absNum / 1000).toFixed(2) + ' K';
  else formatted = absNum.toFixed(0);
  return (num < 0 ? '-₹' : '₹') + formatted;
};

const formatINRFull = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

const calculateEMI = (principal, annualRate, years) => {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
};

const calculatePortfolioGrowth = (principal, goldAPR, stockAPR, goldRatio, years) => {
  const goldGrowth = (principal * goldRatio / 100) * Math.pow(1 + goldAPR / 100, years);
  const stockGrowth = (principal * (100 - goldRatio) / 100) * Math.pow(1 + stockAPR / 100, years);
  return goldGrowth + stockGrowth;
};

const calculateSIPFutureValue = (monthlyAmount, goldAPR, stockAPR, goldRatio, years) => {
  const months = years * 12;
  const goldMonthly = monthlyAmount * goldRatio / 100;
  const stockMonthly = monthlyAmount * (100 - goldRatio) / 100;
  const goldRate = goldAPR / 100 / 12;
  const stockRate = stockAPR / 100 / 12;
  const goldFV = goldRate > 0 ? goldMonthly * ((Math.pow(1 + goldRate, months) - 1) / goldRate) * (1 + goldRate) : goldMonthly * months;
  const stockFV = stockRate > 0 ? stockMonthly * ((Math.pow(1 + stockRate, months) - 1) / stockRate) * (1 + stockRate) : stockMonthly * months;
  return goldFV + stockFV;
};

const calculateCAGR = (initialValue, finalValue, years) => {
  if (initialValue <= 0 || years === 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
};

// ============================================================================
// INFLATION ADJUSTMENT FUNCTIONS
// ============================================================================

const INFLATION_PRESETS = {
  HISTORICAL_15YR: { label: '15-Yr Historical Avg', rate: 6.76, color: '#0891b2' },
  RBI_TARGET: { label: 'RBI Target', rate: 4.0, color: '#10b981' },
  OPTIMISTIC: { label: 'Optimistic', rate: 4.5, color: '#84cc16' },
  BASE_CASE: { label: 'Base Case', rate: 6.0, color: '#f59e0b' },
  BEARISH: { label: 'Bearish', rate: 7.5, color: '#ef4444' },
};

const calculateRealValue = (nominalValue, inflationRate, years) => {
  if (years === 0 || inflationRate === 0) return nominalValue;
  const inflationFactor = Math.pow(1 + inflationRate / 100, years);
  return nominalValue / inflationFactor;
};

const calculateRealCAGR = (initialValue, finalNominalValue, inflationRate, years) => {
  if (initialValue <= 0 || years === 0) return 0;
  const finalRealValue = calculateRealValue(finalNominalValue, inflationRate, years);
  return (Math.pow(finalRealValue / initialValue, 1 / years) - 1) * 100;
};

const strategyColors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5'];
const METRIC_DETAILS = {
  nominal: {
    icon: '📊',
    label: 'Nominal Value',
    color: '#2563eb',
    description: 'Account value shown on statements (before inflation adjustment)',
  },
  real: {
    icon: '💰',
    label: 'Real Value',
    color: '#059669',
    description: "What the money can actually buy in today's rupees (after inflation)",
  },
  roi: {
    icon: '📈',
    label: 'ROI',
    color: '#dc2626',
    description: 'Return on Investment percentage (gain ÷ initial × 100)',
  },
  cagr: {
    icon: '📐',
    label: 'CAGR',
    color: '#0891b2',
    description: 'Compound Annual Growth Rate (yearly growth average)',
  },
};
const METRIC_TIP = 'Compare Nominal vs Real values to understand inflation impact. The bigger the gap, the more inflation is eroding your purchasing power!';
const sliderBaseStyle = {
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  background: '#e5e5e5',
  outline: 'none',
  cursor: 'pointer',
  WebkitAppearance: 'none',
  appearance: 'none',
};
const RETURN_MODELING = {
  gold: {
    title: 'Gold APR Modeling',
    description: 'MCX 10-yr CAGR ~8%. Use CPI-linked presets below to model safe vs aggressive outlooks.',
    presets: [
      { label: 'Bearish · 6%', value: 6.0, note: 'Stronger rupee + low inflation' },
      { label: 'Historical Avg · 8.1%', value: 8.1, note: 'MCX (2013-2023)' },
      { label: 'Bull Run · 11%', value: 11.0, note: 'Commodities rally' },
    ],
  },
  stock: {
    title: 'Equity APR Modeling',
    description: 'Sensex/Nifty rolling CAGR ranges from 11-15% depending on horizon.',
    presets: [
      { label: 'Defensive · 10%', value: 10.0, note: 'Short 5-yr horizon' },
      { label: 'Nifty50 10-yr · 12.8%', value: 12.8, note: 'Large-cap baseline' },
      { label: 'Aggressive · 15.5%', value: 15.5, note: 'Mid/small-cap tilt' },
    ],
  },
};

export default function InvestmentCalculator() {
  const [strategyType, setStrategyType] = useState('A');
  const [showInstructions, setShowInstructions] = useState(true);
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [loanRate, setLoanRate] = useState(8);
  const [loanTerm, setLoanTerm] = useState(10);
  const [goldAPRA, setGoldAPRA] = useState(8.1);
  const [stockAPRA, setStockAPRA] = useState(12.8);
  const [goldRatioA, setGoldRatioA] = useState(40);
  const [monthlyInvestment, setMonthlyInvestment] = useState(25000);
  const [goldAPRB, setGoldAPRB] = useState(8.1);
  const [stockAPRB, setStockAPRB] = useState(12.8);
  const [goldRatioB, setGoldRatioB] = useState(40);
  const [analysisPeriod, setAnalysisPeriod] = useState(15);
  const [savedStrategies, setSavedStrategies] = useState([]);
  const [strategyCounter, setStrategyCounter] = useState(1);
  const [inflationRate, setInflationRate] = useState(6.76);
  const [inflationPreset, setInflationPreset] = useState('HISTORICAL_15YR');

  const currentStrategy = useMemo(() => {
    if (strategyType === 'A') {
      return {
        id: 'current-preview',
        name: 'Strategy A (Current)',
        type: 'A',
        analysisPeriod,
        color: '#2563eb',
        loanAmount,
        loanRate,
        loanTerm,
        goldAPR: goldAPRA,
        stockAPR: stockAPRA,
        goldRatio: goldRatioA,
      };
    }
    return {
      id: 'current-preview',
      name: 'Strategy B (Current)',
      type: 'B',
      analysisPeriod,
      color: '#059669',
      monthlyInvestment,
      goldAPR: goldAPRB,
      stockAPR: stockAPRB,
      goldRatio: goldRatioB,
    };
  }, [
    strategyType,
    analysisPeriod,
    loanAmount,
    loanRate,
    loanTerm,
    goldAPRA,
    stockAPRA,
    goldRatioA,
    monthlyInvestment,
    goldAPRB,
    stockAPRB,
    goldRatioB,
  ]);

  const chartStrategies = useMemo(() => {
    return savedStrategies.length > 0 ? savedStrategies : [currentStrategy];
  }, [savedStrategies, currentStrategy]);

  const generateStrategyName = () => {
    return `Strategy ${strategyCounter}`;
  };

  const currentMetrics = useMemo(() => {
    if (strategyType === 'A') {
      const emi = calculateEMI(loanAmount, loanRate, loanTerm);
      const totalLoanPayment = emi * loanTerm * 12;
      const nominalPortfolioValue = calculatePortfolioGrowth(loanAmount, goldAPRA, stockAPRA, goldRatioA, analysisPeriod);
      const netReturn = nominalPortfolioValue - totalLoanPayment;
      
      // NEW: Inflation-adjusted values
      const realPortfolioValue = calculateRealValue(nominalPortfolioValue, inflationRate, analysisPeriod);
      const realNetReturn = realPortfolioValue - totalLoanPayment;
      
      return { 
        emi, 
        totalLoanPayment, 
        nominalPortfolioValue, 
        netReturn, 
        nominalROI: (netReturn / loanAmount) * 100, 
        nominalCAGR: calculateCAGR(loanAmount, nominalPortfolioValue, analysisPeriod),
        // NEW inflation-adjusted metrics
        inflationRate,
        realPortfolioValue,
        realNetReturn,
        realROI: (realNetReturn / loanAmount) * 100,
        realCAGR: calculateRealCAGR(loanAmount, nominalPortfolioValue, inflationRate, analysisPeriod),
        inflationLoss: nominalPortfolioValue - realPortfolioValue,
      };
    }
    const totalInvested = monthlyInvestment * 12 * analysisPeriod;
    const nominalPortfolioValue = calculateSIPFutureValue(monthlyInvestment, goldAPRB, stockAPRB, goldRatioB, analysisPeriod);
    const netReturn = nominalPortfolioValue - totalInvested;
    
    // NEW: Inflation-adjusted values
    const realPortfolioValue = calculateRealValue(nominalPortfolioValue, inflationRate, analysisPeriod);
    const realNetReturn = realPortfolioValue - totalInvested;
    
    return { 
      totalInvested, 
      nominalPortfolioValue, 
      netReturn, 
      nominalROI: (netReturn / totalInvested) * 100, 
      nominalCAGR: calculateCAGR(totalInvested, nominalPortfolioValue, analysisPeriod),
      // NEW inflation-adjusted metrics
      inflationRate,
      realPortfolioValue,
      realNetReturn,
      realROI: (realNetReturn / totalInvested) * 100,
      realCAGR: calculateRealCAGR(totalInvested, nominalPortfolioValue, inflationRate, analysisPeriod),
      inflationLoss: nominalPortfolioValue - realPortfolioValue,
    };
  }, [strategyType, loanAmount, loanRate, loanTerm, goldAPRA, stockAPRA, goldRatioA, monthlyInvestment, goldAPRB, stockAPRB, goldRatioB, analysisPeriod, inflationRate]);

  const generateYearlyData = (strategy, inflation = 6.0) => {
    const data = [];
    for (let year = 0; year <= strategy.analysisPeriod; year++) {
      let nominalValue = 0;
      if (strategy.type === 'A') {
        const emi = calculateEMI(strategy.loanAmount, strategy.loanRate, strategy.loanTerm);
        const totalPaid = Math.min(emi * year * 12, emi * strategy.loanTerm * 12);
        const portfolioValue = year === 0 ? strategy.loanAmount : calculatePortfolioGrowth(strategy.loanAmount, strategy.goldAPR, strategy.stockAPR, strategy.goldRatio, year);
        nominalValue = portfolioValue - totalPaid;
      } else {
        const totalInvested = strategy.monthlyInvestment * 12 * year;
        const portfolioValue = year === 0 ? 0 : calculateSIPFutureValue(strategy.monthlyInvestment, strategy.goldAPR, strategy.stockAPR, strategy.goldRatio, year);
        nominalValue = portfolioValue - totalInvested;
      }
      // NEW: Calculate real value
      const realValue = calculateRealValue(nominalValue, inflation, year);
      data.push({ year, nominalValue, realValue });
    }
    return data;
  };

  const chartData = useMemo(() => {
    if (chartStrategies.length === 0) return [];
    const seriesData = chartStrategies.map(strategy => ({
      analysisPeriod: strategy.analysisPeriod,
      points: generateYearlyData(strategy, inflationRate),
    }));
    const maxYears = Math.max(...chartStrategies.map(s => s.analysisPeriod));
    const data = [];
    for (let year = 0; year <= maxYears; year++) {
      const point = { year };
      seriesData.forEach((series, idx) => {
        if (year <= series.analysisPeriod) {
          const yearPoint = series.points[year];
          if (yearPoint) {
            point[`strategy${idx}_nominal`] = yearPoint.nominalValue;
            point[`strategy${idx}_real`] = yearPoint.realValue;
          }
        }
      });
      data.push(point);
    }
    return data;
  }, [chartStrategies, inflationRate]);

  const addStrategy = () => {
    const newStrategy = {
      id: Date.now(), name: generateStrategyName(), type: strategyType, analysisPeriod,
      color: strategyColors[savedStrategies.length % strategyColors.length],
      ...(strategyType === 'A' ? { loanAmount, loanRate, loanTerm, goldAPR: goldAPRA, stockAPR: stockAPRA, goldRatio: goldRatioA }
        : { monthlyInvestment, goldAPR: goldAPRB, stockAPR: stockAPRB, goldRatio: goldRatioB })
    };
    setSavedStrategies([...savedStrategies, newStrategy]);
    setStrategyCounter(strategyCounter + 1);
  };

  const removeStrategy = (id) => {
    setSavedStrategies(prev => {
      const next = prev.filter(s => s.id !== id);
      setStrategyCounter(next.length + 1);
      return next;
    });
  };

  const isPreviewMode = savedStrategies.length === 0;

  const ChartTooltip = ({ active, payload, label, variant }) => {
    if (!(active && payload && payload.length)) return null;
    const yearData = chartData.find(d => d.year === label);
    if (!yearData) return null;

    return (
      <div style={{ backgroundColor: '#fff', border: '1px solid #d4d4d4', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ color: '#525252', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>Year {label}</p>
        {payload.map(entry => {
          const match = entry.dataKey.match(/strategy(\d+)_(nominal|real)/);
          if (!match) return null;
          const strategyIdx = parseInt(match[1]);
          const strategy = chartStrategies[strategyIdx];
          if (!strategy) return null;

          const nominalValue = yearData[`strategy${strategyIdx}_nominal`];
          const realValue = yearData[`strategy${strategyIdx}_real`];

          return (
            <div key={strategyIdx} style={{ marginBottom: '8px' }}>
              <p style={{ color: strategy.color, fontSize: '13px', fontWeight: '600', margin: '4px 0' }}>
                {strategy.name}
                {isPreviewMode && (
                  <span style={{ marginLeft: '6px', fontSize: '10px', color: '#a3a3a3', fontWeight: '500' }}>(Preview)</span>
                )}
              </p>
              <div style={{ fontSize: '12px', color: '#525252', marginLeft: '8px' }}>
                {variant !== 'real' && (
                  <div>Nominal: {formatINRFull(nominalValue)}</div>
                )}
                {variant !== 'nominal' && (
                  <>
                    <div style={{ color: '#059669', fontSize: '11px', marginTop: '2px' }}>
                      Real @ {inflationRate.toFixed(2)}%: {formatINRFull(realValue)}
                    </div>
                    <div style={{ color: '#dc2626', fontSize: '11px', marginTop: '2px' }}>
                      Loss: {formatINRFull(nominalValue - realValue)}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const cardStyle = { background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f4 100%)', color: '#1c1917', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '12px', background: 'linear-gradient(135deg, #2563eb, #059669)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
              <Calculator size={28} color="white" />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1c1917' }}>Investment Strategy Calculator</h1>
          </div>
          <p style={{ color: '#737373', fontSize: '16px' }}>Compare loan-based and SIP investment strategies</p>
        </div>

        {/* Instructions */}
        {showInstructions && (
          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Info size={20} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1c1917', margin: 0 }}>How to Use This Calculator</h3>
              </div>
              <button onClick={() => setShowInstructions(false)} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>Hide</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#f5f5f4', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb', marginBottom: '8px' }}>1. Choose Strategy Type</h4>
                <p style={{ fontSize: '13px', color: '#525252', lineHeight: '1.5', margin: 0 }}><strong>Strategy A:</strong> Take a lump sum loan and invest in gold/stocks.<br /><strong>Strategy B:</strong> Invest monthly via SIP in gold/stocks.</p>
              </div>
              <div style={{ background: '#f5f5f4', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#059669', marginBottom: '8px' }}>2. Configure Parameters</h4>
                <p style={{ fontSize: '13px', color: '#525252', lineHeight: '1.5', margin: 0 }}>Adjust amounts, interest rates (0.1% precision), expected APR for gold/stocks, and allocation ratio.</p>
              </div>
              <div style={{ background: '#f5f5f4', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#d97706', marginBottom: '8px' }}>3. Save & Compare</h4>
                <p style={{ fontSize: '13px', color: '#525252', lineHeight: '1.5', margin: 0 }}>Click "Add Strategy" to save. Add multiple variations to compare them on the chart.</p>
              </div>
            </div>
          </div>
        )}
        {!showInstructions && (
          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <button onClick={() => setShowInstructions(true)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={16} /> Show Instructions
            </button>
          </div>
        )}

        <InflationImpactCard cardStyle={cardStyle} inflationRate={inflationRate} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {/* Left Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Strategy Selector */}
            <div style={cardStyle}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#525252', marginBottom: '12px' }}>Strategy Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['A', 'B'].map(type => (
                  <button key={type} onClick={() => setStrategyType(type)} style={{
                    padding: '16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s',
                    border: strategyType === type ? `2px solid ${type === 'A' ? '#2563eb' : '#059669'}` : '2px solid #e5e5e5',
                    background: strategyType === type ? (type === 'A' ? '#eff6ff' : '#ecfdf5') : '#fff'
                  }}>
                    {type === 'A' ? <Wallet size={20} color={strategyType === 'A' ? '#2563eb' : '#737373'} /> : <PiggyBank size={20} color={strategyType === 'B' ? '#059669' : '#737373'} />}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: '600', color: strategyType === type ? (type === 'A' ? '#2563eb' : '#059669') : '#525252' }}>Strategy {type}</div>
                      <div style={{ fontSize: '12px', color: '#737373' }}>{type === 'A' ? 'Loan Based' : 'Monthly SIP'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameters */}
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: '#1c1917', justifyContent: 'space-between' }}>
                <BarChart3 size={18} color={strategyType === 'A' ? '#2563eb' : '#059669'} />
                {strategyType === 'A' ? 'Loan Based Investment' : 'Monthly SIP Investment'}
                <span style={{ fontSize: '12px', color: '#a3a3a3', fontWeight: '500' }}>{generateStrategyName()}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {strategyType === 'A' ? (
                  <>
                    <SliderInput label="Loan Amount" value={loanAmount} setValue={setLoanAmount} min={100000} max={5000000} step={100000} format={formatINR} color="#2563eb" minLabel="₹1L" maxLabel="₹50L" />
                    <SliderInput label="Loan Interest Rate (p.a.)" value={loanRate} setValue={setLoanRate} min={4} max={12} step={0.1} format={v => v.toFixed(1) + '%'} color="#2563eb" minLabel="4%" maxLabel="12%" />
                    <SliderInput label="Loan Term (Analysis Period)" value={loanTerm} setValue={(val) => { setLoanTerm(val); setAnalysisPeriod(val); }} min={1} max={30} step={1} format={v => v + ' years'} color="#2563eb" minLabel="1 yr" maxLabel="30 yrs" />
                    <SliderInput label="Gold APR" value={goldAPRA} setValue={setGoldAPRA} min={0} max={15} step={0.1} format={v => v.toFixed(1) + '%'} color="#d97706" minLabel="0%" maxLabel="15%" returnType="gold" />
                    <SliderInput label="Stock APR" value={stockAPRA} setValue={setStockAPRA} min={0} max={20} step={0.1} format={v => v.toFixed(1) + '%'} color="#059669" minLabel="0%" maxLabel="20%" returnType="stock" />
                    <AllocationSlider value={goldRatioA} setValue={setGoldRatioA} />
                  </>
                ) : (
                  <>
                    <SliderInput label="Monthly Investment" value={monthlyInvestment} setValue={setMonthlyInvestment} min={5000} max={260000} step={2000} format={formatINR} color="#059669" minLabel="₹5K" maxLabel="₹2.6L" />
                    <SliderInput label="Investment Period" value={analysisPeriod} setValue={setAnalysisPeriod} min={1} max={50} step={1} format={v => v + ' years'} color="#7c3aed" minLabel="1 yr" maxLabel="50 yrs" />
                    <SliderInput label="Gold APR" value={goldAPRB} setValue={setGoldAPRB} min={0} max={15} step={0.1} format={v => v.toFixed(1) + '%'} color="#d97706" minLabel="0%" maxLabel="15%" returnType="gold" />
                    <SliderInput label="Stock APR" value={stockAPRB} setValue={setStockAPRB} min={0} max={20} step={0.1} format={v => v.toFixed(1) + '%'} color="#059669" minLabel="0%" maxLabel="20%" returnType="stock" />
                    <AllocationSlider value={goldRatioB} setValue={setGoldRatioB} />
                  </>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a3a3a3', marginBottom: '4px' }}>Next Strategy Name</label>
                  <input type="text" value={generateStrategyName()} readOnly style={{ width: '100%', background: '#f5f5f4', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#525252', fontFamily: 'monospace' }} />
                </div>
                <button onClick={addStrategy} style={{
                  padding: '12px 20px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  background: strategyType === 'A' ? '#2563eb' : '#059669', boxShadow: `0 2px 8px ${strategyType === 'A' ? 'rgba(37,99,235,0.3)' : 'rgba(5,150,105,0.3)'}`
                }}>
                  <Plus size={18} /> Add Strategy
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Inflation Adjustment Panel */}
            <InflationAdjustmentPanel
              inflationRate={inflationRate}
              setInflationRate={setInflationRate}
              inflationPreset={inflationPreset}
              setInflationPreset={setInflationPreset}
            />

            {/* Results */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1c1917' }}>
                <TrendingUp size={18} color={strategyType === 'A' ? '#2563eb' : '#059669'} /> Current Strategy Results
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {strategyType === 'A' ? (
                  <>
                    <MetricCard label="Monthly EMI" value={formatINR(currentMetrics.emi)} bg="#f5f5f4" color="#2563eb" />
                    <MetricCard label="Total Loan Payment" value={formatINR(currentMetrics.totalLoanPayment)} bg="#fef2f2" color="#dc2626" />
                  </>
                ) : (
                  <MetricCard label="Total Invested" value={formatINR(currentMetrics.totalInvested)} bg="#ecfdf5" color="#059669" span={2} />
                )}
                {/* Portfolio Value - Nominal & Real */}
                <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', borderRadius: '10px', padding: '16px', gridColumn: 'span 2', border: '1px solid #e5e5e5' }}>
                  <div style={{ fontSize: '11px', color: '#737373', marginBottom: '8px', fontWeight: '500' }}>Portfolio Value</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#a3a3a3', marginBottom: '4px' }}>Nominal</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>
                        {formatINR(currentMetrics.nominalPortfolioValue)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#a3a3a3', marginBottom: '4px' }}>Real @ {currentMetrics.inflationRate.toFixed(2)}%</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
                        {formatINR(currentMetrics.realPortfolioValue)}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Net Return */}
                <MetricCard label="Net Return (Nom)" value={formatINR(currentMetrics.netReturn)} bg={currentMetrics.netReturn >= 0 ? '#f0fdf4' : '#fef2f2'} color={currentMetrics.netReturn >= 0 ? '#16a34a' : '#dc2626'} />
                <MetricCard label="Net Return (Real)" value={formatINR(currentMetrics.realNetReturn)} bg={currentMetrics.realNetReturn >= 0 ? '#f0fdf4' : '#fef2f2'} color={currentMetrics.realNetReturn >= 0 ? '#16a34a' : '#dc2626'} />
                {/* ROI - Nominal & Real */}
                <MetricCard label="ROI (Nominal)" value={currentMetrics.nominalROI.toFixed(1) + '%'} bg={currentMetrics.nominalROI >= 0 ? '#f0fdf4' : '#fef2f2'} color={currentMetrics.nominalROI >= 0 ? '#16a34a' : '#dc2626'} />
                <MetricCard label="ROI (Real)" value={currentMetrics.realROI.toFixed(1) + '%'} bg={currentMetrics.realROI >= 0 ? '#f0fdf4' : '#fef2f2'} color={currentMetrics.realROI >= 0 ? '#16a34a' : '#dc2626'} />
                {/* CAGR - Nominal & Real */}
                <MetricCard label="CAGR (Nominal)" value={currentMetrics.nominalCAGR.toFixed(2) + '%'} bg="#ecfeff" color={currentMetrics.nominalCAGR >= 0 ? '#0891b2' : '#dc2626'} />
                <MetricCard label="CAGR (Real)" value={currentMetrics.realCAGR.toFixed(2) + '%'} bg="#fef3c7" color={currentMetrics.realCAGR >= 0 ? '#d97706' : '#dc2626'} />
                {/* Inflation Loss */}
                <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '16px', gridColumn: 'span 2', borderLeft: '3px solid #dc2626', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '11px', color: '#737373', marginBottom: '4px', fontWeight: '500' }}>⚠️ Purchasing Power Lost to Inflation</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
                    {formatINR(currentMetrics.inflationLoss)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#a3a3a3', marginTop: '8px' }}>
                    Your {formatINR(currentMetrics.nominalPortfolioValue)} will buy as much as {formatINR(currentMetrics.realPortfolioValue)} in today's money
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
          {savedStrategies.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1c1917' }}>Saved Strategies ({savedStrategies.length})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e5e5' }}>
                      <th style={{ padding: '10px 8px', textAlign: 'left', color: '#525252', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', color: '#525252', fontWeight: '600' }}>Type</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#525252', fontWeight: '600' }}>Amount</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#525252', fontWeight: '600' }}>Interest</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#525252', fontWeight: '600' }}>Term</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#d97706', fontWeight: '600' }}>Gold APR</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#059669', fontWeight: '600' }}>Stock APR</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#525252', fontWeight: '600' }}>Allocation</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', color: '#7c3aed', fontWeight: '600' }}>Period</th>
                      {['nominal', 'real', 'roi', 'cagr'].map(key => {
                        const detail = METRIC_DETAILS[key];
                        return (
                          <th
                            key={key}
                            style={{
                              padding: '10px 8px',
                              textAlign: 'right',
                              color: detail.color,
                              fontWeight: '600',
                              cursor: 'help',
                              borderBottom: `2px dotted ${detail.color}`,
                            }}
                            title={detail.description}
                          >
                            <span role="img" aria-label={detail.label}>{detail.icon}</span> {detail.label}
                          </th>
                        );
                      })}
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#525252', fontWeight: '600' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedStrategies.map(strategy => {
                      const yearlyData = generateYearlyData(strategy, inflationRate);
                      const finalData = yearlyData[yearlyData.length - 1];
                      const nominalValue = finalData?.nominalValue || 0;
                      const realValue = finalData?.realValue || 0;
                      
                      let initialInvestment = 0;
                      let roi = 0;
                      let cagrValue = 0;
                      let portfolioValue = 0;
                      
                      if (strategy.type === 'A') {
                        initialInvestment = strategy.loanAmount;
                        portfolioValue = calculatePortfolioGrowth(strategy.loanAmount, strategy.goldAPR, strategy.stockAPR, strategy.goldRatio, strategy.analysisPeriod);
                        roi = (nominalValue / initialInvestment) * 100;
                        cagrValue = calculateCAGR(initialInvestment, portfolioValue, strategy.analysisPeriod);
                      } else {
                        initialInvestment = strategy.monthlyInvestment * 12 * strategy.analysisPeriod;
                        portfolioValue = calculateSIPFutureValue(strategy.monthlyInvestment, strategy.goldAPR, strategy.stockAPR, strategy.goldRatio, strategy.analysisPeriod);
                        roi = (nominalValue / initialInvestment) * 100;
                        cagrValue = calculateCAGR(initialInvestment, portfolioValue, strategy.analysisPeriod);
                      }
                      
                      return (
                        <tr key={strategy.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '10px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: strategy.color, flexShrink: 0 }} />
                              <span style={{ fontWeight: '600', color: '#1c1917' }}>{strategy.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{
                              fontSize: '10px', padding: '3px 8px', borderRadius: '9999px', fontWeight: '500',
                              background: strategy.type === 'A' ? '#eff6ff' : '#ecfdf5',
                              color: strategy.type === 'A' ? '#2563eb' : '#059669'
                            }}>
                              {strategy.type === 'A' ? 'Loan' : 'SIP'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1c1917' }}>
                            {strategy.type === 'A' ? formatINR(strategy.loanAmount) : formatINR(strategy.monthlyInvestment) + '/mo'}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1c1917' }}>
                            {strategy.type === 'A' ? strategy.loanRate.toFixed(1) + '%' : '—'}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1c1917' }}>
                            {strategy.type === 'A' ? strategy.loanTerm + ' yr' : '—'}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#d97706', fontWeight: '500' }}>
                            {strategy.goldAPR.toFixed(1)}%
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#059669', fontWeight: '500' }}>
                            {strategy.stockAPR.toFixed(1)}%
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <span style={{ color: '#d97706' }}>{strategy.goldRatio}%</span>
                            <span style={{ color: '#a3a3a3' }}> / </span>
                            <span style={{ color: '#059669' }}>{100 - strategy.goldRatio}%</span>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#7c3aed', fontWeight: '500' }}>
                            {strategy.analysisPeriod} yr
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: METRIC_DETAILS.nominal.color, fontWeight: '500' }}>
                            {formatINR(nominalValue)}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: METRIC_DETAILS.real.color, fontWeight: '500' }}>
                            {formatINR(realValue)}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: roi >= 0 ? '#16a34a' : '#dc2626', fontWeight: '500' }}>
                            {roi.toFixed(1)}%
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#0891b2', fontWeight: '500' }}>
                            {cagrValue.toFixed(2)}%
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <button onClick={() => removeStrategy(strategy.id)} style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#a3a3a3', borderRadius: '6px' }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

            <MetricLegendCard cardStyle={cardStyle} tip={METRIC_TIP} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1c1917', margin: 0 }}>Nominal Performance</h3>
                {isPreviewMode && (
                  <div style={{ fontSize: '11px', color: '#a3a3a3', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={14} color="#a3a3a3" /> Previewing current inputs — click "Add Strategy" to save.
                  </div>
                )}
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#737373' }}>
                Solid lines show the nominal account value without adjusting for inflation.
              </p>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="year" stroke="#a3a3a3" tick={{ fill: '#525252', fontSize: 11 }} />
                    <YAxis stroke="#a3a3a3" tick={{ fill: '#525252', fontSize: 11 }} tickFormatter={formatINR} width={70} />
                    <Tooltip content={(props) => <ChartTooltip {...props} variant="nominal" />} />
                    <Legend 
                      formatter={(value) => {
                        const match = value.match(/strategy(\d+)_(nominal|real)/);
                        if (!match) return value;
                        const idx = parseInt(match[1]);
                        const strategyName = chartStrategies[idx]?.name || `Strategy ${idx + 1}`;
                        return strategyName;
                      }}
                      wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} 
                    />
                    {chartStrategies.map((strategy, idx) => (
                      <Line 
                        key={`${strategy.id}-nominal`}
                        type="monotone" 
                        dataKey={`strategy${idx}_nominal`} 
                        name={`strategy${idx}_nominal`}
                        stroke={strategy.color} 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 5, strokeWidth: 2 }} 
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1c1917', margin: 0 }}>Inflation Impact</h3>
                <span style={{ fontSize: '11px', color: '#a3a3a3' }}>Inflation @ {inflationRate.toFixed(2)}%</span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#737373' }}>
                Dotted lines show real purchasing power after removing inflation. The gap vs solid chart reveals erosion.
              </p>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="year" stroke="#a3a3a3" tick={{ fill: '#525252', fontSize: 11 }} />
                    <YAxis stroke="#a3a3a3" tick={{ fill: '#525252', fontSize: 11 }} tickFormatter={formatINR} width={70} />
                    <Tooltip content={(props) => <ChartTooltip {...props} variant="real" />} />
                    <Legend 
                      formatter={(value) => {
                        const match = value.match(/strategy(\d+)_(nominal|real)/);
                        if (!match) return value;
                        const idx = parseInt(match[1]);
                        const strategyName = chartStrategies[idx]?.name || `Strategy ${idx + 1}`;
                        return `${strategyName} (Real)`;
                      }}
                      wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} 
                    />
                    {chartStrategies.map((strategy, idx) => (
                      <Line 
                        key={`${strategy.id}-real`}
                        type="monotone" 
                        dataKey={`strategy${idx}_real`} 
                        name={`strategy${idx}_real`}
                        stroke={strategy.color} 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false} 
                        activeDot={{ r: 5, strokeWidth: 2 }} 
                        opacity={0.9}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px', color: '#a3a3a3', fontSize: '13px' }}>All calculations are estimates. Actual returns may vary based on market conditions.</div>
      </div>
    </div>
  );
}

function InflationPresetButton({ preset, isSelected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      title={`Set inflation to ${preset.rate.toFixed(2)}%`}
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        border: isSelected ? '2px solid ' + preset.color : '1px solid #e5e5e5',
        backgroundColor: isSelected ? preset.color + '15' : '#fff',
        color: isSelected ? preset.color : '#525252',
        fontWeight: isSelected ? '600' : '400',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'all 0.2s ease',
        textAlign: 'center',
      }}
    >
      <div style={{ fontWeight: '600', marginBottom: '2px' }}>{preset.label}</div>
      <div style={{ fontSize: '11px', opacity: 0.8 }}>{preset.rate.toFixed(2)}%</div>
    </button>
  );
}

function InflationAdjustmentPanel({
  inflationRate,
  setInflationRate,
  inflationPreset,
  setInflationPreset,
}) {
  const inflationPercent = (inflationRate / 15) * 100;
  const inflationSliderBackground = `linear-gradient(90deg, #d97706 ${inflationPercent}%, #e5e5e5 ${inflationPercent}%)`;
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '10px',
      padding: '16px',
      marginBottom: '16px',
      border: '1px solid #e5e5e5',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1c1917', margin: 0 }}>
          📊 Inflation Adjustment
        </h3>
        <span style={{ fontSize: '11px', color: '#a3a3a3', marginLeft: '8px' }}>
          (Real Value = Today's Purchasing Power)
        </span>
      </div>

      {/* Preset Buttons Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '8px',
        marginBottom: '12px',
      }}>
        {Object.entries(INFLATION_PRESETS).map(([key, preset]) => (
          <InflationPresetButton
            key={key}
            preset={preset}
            isSelected={inflationPreset === key}
            onSelect={() => {
              setInflationPreset(key);
              setInflationRate(preset.rate);
            }}
          />
        ))}
        <InflationPresetButton
          preset={{ label: 'Custom', rate: inflationRate, color: '#8b5cf6' }}
          isSelected={inflationPreset === 'CUSTOM'}
          onSelect={() => setInflationPreset('CUSTOM')}
        />
      </div>

      {/* Custom Rate Slider */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: '#525252', fontWeight: '500' }}>
            Annual Inflation Rate
          </label>
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#d97706',
            backgroundColor: '#fef3c7',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            {inflationRate.toFixed(2)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={15}
          step={0.1}
          value={inflationRate}
          onChange={(e) => {
            const newRate = Number(e.target.value);
            setInflationRate(newRate);
            const isPreset = Object.values(INFLATION_PRESETS).some(p => Math.abs(p.rate - newRate) < 0.01);
            if (!isPreset) setInflationPreset('CUSTOM');
          }}
          style={{
            ...sliderBaseStyle,
            background: inflationSliderBackground,
            accentColor: '#d97706',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#a3a3a3',
          marginTop: '4px',
        }}>
          <span>0% (No inflation)</span>
          <span>15% (High inflation)</span>
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        fontSize: '12px',
        color: '#525252',
        backgroundColor: '#f0fdf4',
        padding: '10px',
        borderRadius: '6px',
        borderLeft: '3px solid #10b981',
      }}>
        <strong>💡 Real Value Tip:</strong> Shows what your money will buy in today's rupees. Example: ₹1 lakh in 10 years at 6% inflation = ₹55,839 in today's purchasing power.
      </div>
    </div>
  );
}

function SliderInput({ label, value, setValue, min, max, step, format, color, minLabel, maxLabel, returnType }) {
  const percentage = ((value - min) / (max - min)) * 100;
  const sliderBackground = `linear-gradient(90deg, ${color} ${percentage}%, #e5e5e5 ${percentage}%)`;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ fontSize: '13px', color: '#525252' }}>{label}</label>
        <span style={{ fontSize: '13px', fontWeight: '600', color }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        style={{
          ...sliderBaseStyle,
          background: sliderBackground,
          accentColor: color,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a3a3a3', marginTop: '4px' }}>
        <span>{minLabel}</span><span>{maxLabel}</span>
      </div>
      {returnType && (
        <ReturnModeler type={returnType} setValue={setValue} currentValue={value} />
      )}
    </div>
  );
}

function AllocationSlider({ value, setValue }) {
  // value represents gold ratio: 0 = all stocks, 100 = all gold
  // slider left = 100% gold, slider right = 100% stocks
  // so we invert: slider position = 100 - goldRatio
  const sliderPos = 100 - value;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ fontSize: '13px', color: '#525252' }}>Gold / Stock Allocation</label>
        <span style={{ fontSize: '13px', fontWeight: '600' }}>
          <span style={{ color: '#d97706' }}>{value}%</span>
          <span style={{ color: '#a3a3a3' }}> / </span>
          <span style={{ color: '#059669' }}>{100 - value}%</span>
        </span>
      </div>
      <input type="range" min={0} max={100} step={5} value={sliderPos} onChange={e => setValue(100 - Number(e.target.value))}
        style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'linear-gradient(90deg, #d97706, #059669)', outline: 'none', cursor: 'pointer' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a3a3a3', marginTop: '4px' }}>
        <span>100% Gold</span><span>100% Stocks</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, bg, color, span }) {
  return (
    <div style={{ background: bg, borderRadius: '10px', padding: '16px', gridColumn: span === 2 ? 'span 2' : undefined }}>
      <div style={{ fontSize: '11px', color: '#737373', marginBottom: '4px', fontWeight: '500' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color }}>{value}</div>
    </div>
  );
}

function ReturnModeler({ type, setValue, currentValue }) {
  const modeling = RETURN_MODELING[type];
  if (!modeling) return null;
  return (
    <div style={{ background: '#f9fafb', border: '1px dashed #e5e5e5', borderRadius: '8px', padding: '10px', marginTop: '10px' }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>{modeling.title}</div>
      <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.4, marginBottom: '8px' }}>{modeling.description}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {modeling.presets.map(preset => (
          <button
            key={`${type}-${preset.label}`}
            onClick={() => setValue(preset.value)}
            style={{
              borderRadius: '9999px',
              border: '1px solid #d4d4d8',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              background: Math.abs(currentValue - preset.value) < 0.05 ? '#eef2ff' : '#fff',
              color: '#1c1917',
              fontWeight: '500',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: '6px', fontSize: '10px', color: '#a0aec0' }}>
        {modeling.presets.find(p => Math.abs(currentValue - p.value) < 0.05)?.note || 'Adjust slider for custom expectation.'}
      </div>
    </div>
  );
}

function MetricLegendCard({ cardStyle, tip }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1c1917', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📊 Chart Metrics Explained
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {Object.entries(METRIC_DETAILS).map(([key, detail]) => (
          <div
            key={key}
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: `${detail.color}15`,
              borderLeft: `3px solid ${detail.color}`,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '600', color: detail.color, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span role="img" aria-label={detail.label}>{detail.icon}</span> {detail.label}
            </div>
            <div style={{ fontSize: '11px', color: '#525252', lineHeight: 1.4 }}>{detail.description}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#eef2ff', borderRadius: '8px', color: '#2563eb', fontSize: '11px', borderLeft: '3px solid #2563eb' }}>
        <strong>💡 Tip:</strong> {tip}
      </div>
    </div>
  );
}

function InflationImpactCard({ cardStyle, inflationRate }) {
  const tenYearReal = calculateRealValue(100000, inflationRate, 10);
  return (
    <div style={{ ...cardStyle, background: '#fffaf0', border: '1px solid #fde68a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>🧠</span>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: '#92400e' }}>Why Inflation Matters</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#a16207' }}>Nominal ₹ ≠ Real ₹ — calibrate expectations before comparing strategies.</p>
        </div>
      </div>
      <div style={{ fontSize: '13px', color: '#525252', lineHeight: 1.5 }}>
        At {inflationRate.toFixed(2)}% inflation, ₹1,00,000 today is worth only {formatINR(Math.round(tenYearReal))} in 10 years.
        Slide the inflation presets to see how real purchasing power shifts.
      </div>
      <ul style={{ margin: '10px 0 0 16px', color: '#6b7280', fontSize: '12px', lineHeight: 1.6 }}>
        <li>Nominal Value shows the statement balance.</li>
        <li>Real Value shows what that balance buys in today's money.</li>
        <li>The gap between them is the hidden inflation loss.</li>
      </ul>
    </div>
  );
}
