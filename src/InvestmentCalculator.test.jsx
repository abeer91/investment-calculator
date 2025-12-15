import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InvestmentCalculator from './InvestmentCalculator.jsx';

describe('InvestmentCalculator', () => {
  it('renders the hero heading', () => {
    render(<InvestmentCalculator />);
    expect(
      screen.getByRole('heading', { name: /investment strategy calculator/i }),
    ).toBeInTheDocument();
  });

  it('switches to Strategy B when clicked', () => {
    render(<InvestmentCalculator />);
    const [strategyBButton] = screen.getAllByRole('button', {
      name: /strategy b/i,
    });
    fireEvent.click(strategyBButton);
    expect(screen.getByText(/Monthly SIP Investment/i)).toBeInTheDocument();
  });
});
