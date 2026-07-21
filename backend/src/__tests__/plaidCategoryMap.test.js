const { mapPlaidCategory } = require('../services/plaidCategoryMap')

describe('mapPlaidCategory', () => {
  it('splits LOAN_PAYMENTS into Credit Card Payment vs Financial/Legal', () => {
    expect(
      mapPlaidCategory({ primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT' })
    ).toBe('Credit Card Payment')
    expect(
      mapPlaidCategory({ primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_MORTGAGE_PAYMENT' })
    ).toBe('Financial/Legal')
  })

  it('splits FOOD_AND_DRINK into Groceries vs Dining', () => {
    expect(
      mapPlaidCategory({ primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' })
    ).toBe('Groceries')
    expect(
      mapPlaidCategory({ primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANT' })
    ).toBe('Dining')
  })

  it('splits TRANSFER_IN/TRANSFER_OUT by detailed account-transfer vs deposit/withdrawal', () => {
    expect(
      mapPlaidCategory({ primary: 'TRANSFER_IN', detailed: 'TRANSFER_IN_ACCOUNT_TRANSFER' })
    ).toBe('Transfer')
    expect(mapPlaidCategory({ primary: 'TRANSFER_IN', detailed: 'TRANSFER_IN_DEPOSIT' })).toBe(
      'Deposit'
    )
    expect(
      mapPlaidCategory({ primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_ACCOUNT_TRANSFER' })
    ).toBe('Transfer')
    expect(mapPlaidCategory({ primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_WITHDRAWAL' })).toBe(
      'Withdrawal'
    )
  })

  it('maps direct 1:1 primaries', () => {
    expect(mapPlaidCategory({ primary: 'INCOME' })).toBe('Income')
    expect(mapPlaidCategory({ primary: 'TRANSPORTATION' })).toBe('Transportation')
    expect(mapPlaidCategory({ primary: 'GENERAL_SERVICES' })).toBe('General Services')
  })

  it('falls back to Other for unmapped or missing primaries', () => {
    expect(mapPlaidCategory({ primary: 'GOVERNMENT_AND_NON_PROFIT' })).toBe('Other')
    expect(mapPlaidCategory(undefined)).toBe('Other')
  })
})
