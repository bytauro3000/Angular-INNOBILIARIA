import { CurrencyFormatter } from './currency-formatter';

describe('CurrencyFormatter', () => {
  it('should create an instance', () => {
    const directive = new CurrencyFormatter();
    expect(directive).toBeTruthy();
  });
});
