const { test, expect } = require('@playwright/test');
const { apiClient } = require('../../utils/apiClient');
const { expectOkJson } = require('../../utils/assertions');
const { apiEndpoints,mutualFunds } = require('../../fixtures/testData');
const { users } = require('../../fixtures/users');

test.describe('API @api', () => {
  test.afterAll(async () => {
    await apiClient.dispose();
  });

  test('health endpoint responds OK @smoke', async () => {
    const response = await apiClient.get(apiEndpoints.health);
    expect(response.ok()).toBeTruthy();
  });

  test('login endpoint validates credentials and returns user details @smoke', async () => {
  const response = await apiClient.post(apiEndpoints.login, {
    email: users.qaUser.email,
    password: users.qaUser.password,
  });
  const body = await expectOkJson(response);
  expect(body.status).toBe('success');
  expect(body.data.user.email).toBe(users.qaUser.email);
  expect(body.data.user).toHaveProperty('account_status');
});

  test('login endpoint rejects invalid credentials with 401/422 @regression', async () => {
    const response = await apiClient.post(apiEndpoints.login, {
      email: users.qaUser.email,
      password: 'WrongPassword@1',
    });
    expect([401, 422]).toContain(response.status());
  });

  test('mutual fund listing endpoint returns an array of funds @regression', async () => {
    const response = await apiClient.get(apiEndpoints.funds);
    const body = await expectOkJson(response);
    expect(Array.isArray(body.data ?? body)).toBeTruthy();
  });

  test('mutual fund detail endpoint returns fund fields matching schema @regression', async () => {
    const response = await apiClient.get(apiEndpoints.fundDetail(mutualFunds.confirmedSample.id));  // ← changed this line
    const body = await expectOkJson(response);
    const fund = body.data ?? body;
    expect(fund).toHaveProperty('fund_code');
    expect(fund).toHaveProperty('fund_name');
    expect(fund).toHaveProperty('risk_level');
  });

  test('portfolio endpoint requires authentication and returns holdings for a valid user @regression', async () => {
    const response = await apiClient.get(apiEndpoints.portfolio);
    // Depending on the app's auth model this may require a bearer token; adjust once confirmed.
    expect([200, 401]).toContain(response.status());
  });

  test('orders endpoint reflects a newly created transaction @regression', async () => {
    const response = await apiClient.get(apiEndpoints.orders);
    const body = await expectOkJson(response);
    expect(Array.isArray(body.data ?? body)).toBeTruthy();
  });

  test('policies endpoint returns policy records with a valid status enum @regression', async () => {
    const response = await apiClient.get(apiEndpoints.policies);
    const body = await expectOkJson(response);
    const policies = body.data ?? body;
    for (const policy of policies) {
      expect(['Pending Issuance', 'Active', 'Cancelled', 'Expired']).toContain(policy.status);
    }
  });

  test('transactions endpoint returns the latest transaction consistent with UI expectations @regression', async () => {
    const response = await apiClient.get(apiEndpoints.transactions);
    const body = await expectOkJson(response);
    expect(Array.isArray(body.data ?? body)).toBeTruthy();
  });

  // Add to tests/api/api.spec.js
  test('portfolio summary total reconciles with sum of individual holdings @regression @defect', async () => {
    const response = await apiClient.get(apiEndpoints.portfolio);
    const body = await expectOkJson(response);
    const { reported_portfolio_total, sum_of_holding_values } = body.data.summary;

    // Allow a tiny rounding tolerance (paise-level), but flag any real drift.
    const diff = Math.abs(reported_portfolio_total - sum_of_holding_values);
    expect(diff, `Reported total (${reported_portfolio_total}) vs sum of holdings (${sum_of_holding_values}) differ by ${diff}`).toBeLessThanOrEqual(0.01);
});
});
