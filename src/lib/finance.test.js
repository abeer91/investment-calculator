import { describe, it, expect } from 'vitest';
import { computeStrategyMetrics, generateYearlyData } from './finance.js';
import { GOLDEN_DATA } from './finance.fixtures.js';

describe('computeStrategyMetrics', () => {
  GOLDEN_DATA.forEach(({ label, strategy, inflationRate, expectations }) => {
    it(`matches golden metrics for ${label}`, () => {
      const metrics = computeStrategyMetrics(strategy, inflationRate);
      Object.entries(expectations.metrics).forEach(([key, value]) => {
        expect(metrics[key]).toBeCloseTo(value, 6);
      });
    });
  });
});

describe('generateYearlyData', () => {
  GOLDEN_DATA.forEach(({ label, strategy, inflationRate, expectations }) => {
    it(`matches endpoints for ${label}`, () => {
      const yearly = generateYearlyData(strategy, inflationRate);
      expect(yearly[0]).toMatchObject(expectations.yearlyStart);
      const last = yearly[yearly.length - 1];
      expect(last.year).toBe(expectations.yearlyEnd.year);
      expect(last.nominalValue).toBeCloseTo(expectations.yearlyEnd.nominalValue, 6);
      expect(last.realValue).toBeCloseTo(expectations.yearlyEnd.realValue, 6);
    });
  });
});
