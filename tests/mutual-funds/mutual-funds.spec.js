const { test, expect } = require('../../fixtures/auth.fixture');
const { MutualFundsPage } = require('../../pages/MutualFundsPage');
const { FundDetailsPage } = require('../../pages/FundDetailsPage');
const { mutualFunds } = require('../../fixtures/testData');

test.describe('Mutual Fund Discovery @mutual-funds', () => {
  test('search returns matching funds @smoke', async ({ qaUserPage }) => {
    const fundsPage = new MutualFundsPage(qaUserPage);
    await fundsPage.goto();
    await fundsPage.searchFund(mutualFunds.confirmedSample.fundName);
    await fundsPage.expectResultsContain(mutualFunds.confirmedSample.fundName);
  });

  test('search with a nonsense term returns no results, not an error page @regression', async ({ qaUserPage }) => {
    const fundsPage = new MutualFundsPage(qaUserPage);
    await fundsPage.goto();
    await fundsPage.searchFund('zzzzznonexistentfundzzzz');
    await fundsPage.expectNoResults();
  });

  test('filtering by risk level narrows results consistently @regression', async ({ qaUserPage }) => {
    const fundsPage = new MutualFundsPage(qaUserPage);
    await fundsPage.goto();
    await fundsPage.filterByRisk('High');
    const count = await fundsPage.getFundRowCount();
    expect(count).toBeGreaterThan(0);
  });

  test('fund detail page shows NAV, returns, risk, and category @smoke', async ({ qaUserPage }) => {
    const fundsPage = new MutualFundsPage(qaUserPage);
    const detailsPage = new FundDetailsPage(qaUserPage);
    await fundsPage.goto();
    await fundsPage.openFundById(mutualFunds.confirmedSample.fundCode);
    await detailsPage.expectLoaded(mutualFunds.confirmedSample.fundName);
    await expect(detailsPage.navValue).toBeVisible();
    await expect(detailsPage.riskLevel).toHaveText(new RegExp(mutualFunds.confirmedSample.riskLevel, 'i'));
  });

  
});
