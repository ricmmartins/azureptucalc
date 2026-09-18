import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
import { preview } from 'vite';

test('Priority processing browser regression', { timeout: 180000 }, async (t) => {
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
  const baseURL = `http://127.0.0.1:${server.httpServer.address().port}`;
  const channel = process.env.PLAYWRIGHT_CHANNEL || (
    process.platform === 'win32' && !existsSync(chromium.executablePath()) ? 'msedge' : undefined
  );
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel });
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('azurePTUCalculatorVisited', 'true');
      localStorage.setItem('azurePTUOnboardingCompleted', 'true');
      localStorage.setItem('azurePTUQualificationCompleted', 'true');
    });
    await page.route('**/api/azure-pricing*', route => route.fulfill({
      status: 503, json: { error: 'Use published prices for deterministic regression checks.' }
    }));
    await page.goto(baseURL);
    await page.getByText('Get Your Token Data', { exact: false }).first().click();
    const chooseModel = async name => {
      await page.locator('#kql-model').click();
      await page.getByRole('option', { name, exact: true }).click();
    };
    const chooseDeployment = async name => {
      await page.locator('#deployment').click();
      await page.getByRole('option', { name, exact: true }).click();
    };
    const downloadText = async name => {
      const pending = page.waitForEvent('download');
      await page.getByRole('button', { name, exact: true }).click();
      const stream = await (await pending).createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      return Buffer.concat(chunks).toString('utf8');
    };
    await chooseModel('GPT-5.6 Sol');
    await page.locator('#inputTokensMonthly').fill('1000000');
    await page.locator('#outputTokensMonthly').fill('1000000');

    await t.test('Standard baseline, latency qualification and a 25% mix', async () => {
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$35.00');
      await expect(page.getByTestId('recommendation')).toContainText('PAYGO Standard');
      await page.locator('#latencyCritical').check();
      await expect(page.getByTestId('recommendation')).toContainText('Evaluate PAYGO with Priority Processing');
      await expect(page.getByText('Pending latency review')).toBeVisible();
      await page.locator('#priorityShare').fill('25');
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$43.75');
      await expect(page.getByTestId('recommendation')).toContainText('PAYGO with Priority Processing (25%)');
      await page.locator('#priorityShare').fill('100');
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$70.00');
      await page.locator('#outputTokensMonthly').fill('2000000');
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$130.00');
      await page.locator('#outputTokensMonthly').fill('1000000');
    });

    await t.test('exports use the selected mix and qualified recommendation', async () => {
      await page.locator('#priorityShare').fill('25');
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$43.75');
      const report = JSON.parse(await downloadText('Export as JSON'));
      assert.equal(report.costBreakdown.payg.total, 43.75);
      assert.equal(report.configuration.processingScenario.priorityShare, 25);
      assert.equal(report.configuration.processingScenario.isLatencyCritical, true);
      assert.equal(report.costBreakdown.payg.inputTokens.pricePer1M, 6.25);
      assert.equal(report.costBreakdown.payg.outputTokens.pricePer1M, 37.5);
      const csv = await downloadText('Export as CSV');
      assert.match(csv, /43\.75/);
      assert.match(csv, /PAYGO with Priority Processing \(25%\)/);
    });

    await t.test('spillover uses its own selected share without changing PAYGO', async () => {
      await page.locator('.usage-inputs-section input').nth(1).fill('100000');
      await page.locator('#basePTUs').fill('15');
      await expect(page.getByTestId('spillover-cost')).toBeVisible();
      const before = JSON.parse(await downloadText('Export as JSON'));
      await page.locator('#spilloverPriorityShare').fill('100');
      await expect(page.getByTestId('spillover-cost')).not.toHaveText(
        `Total: $${before.costBreakdown.spillover.total.toFixed(2)}/month.`
      );
      const after = JSON.parse(await downloadText('Export as JSON'));
      assert.equal(after.costBreakdown.payg.total, 43.75);
      assert.equal(after.configuration.processingScenario.spilloverPriorityShare, 100);
      assert.equal(after.costBreakdown.spillover.overflowCost, 2 * before.costBreakdown.spillover.overflowCost);
    });

    await t.test('custom Standard rates mix with published Priority, including zero and missing rates', async () => {
      await page.locator('#customPricing').check();
      await page.locator('#customStandardInput').fill('7');
      await page.locator('#customStandardOutput').fill('40');
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$52.75');
      await page.locator('#customStandardInput').fill('');
      await expect(page.getByText('Cost comparison unavailable', { exact: true })).toBeVisible();
      await page.locator('#priorityShare').fill('100');
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$70.00');
      const priorityOnly = JSON.parse(await downloadText('Export as JSON'));
      assert.equal(priorityOnly.costBreakdown.payg.total, 70);
      await page.locator('#customStandardInput').fill('0');
      await page.locator('#customStandardOutput').fill('0');
      await page.locator('#priorityShare').fill('0');
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$0.00');
      await page.locator('#customPricing').uncheck();
      await page.locator('#priorityShare').fill('25');
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$43.75');
    });

    await t.test('Luna and unverified Data Zone configurations cannot inherit Priority', async () => {
      await chooseModel('GPT-5.6 Luna');
      await expect(page.getByText('Cost comparison unavailable', { exact: true })).toBeVisible();
      await expect(page.getByTestId('selected-paygo-cost')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Export as JSON', exact: true })).toHaveCount(0);
      await page.locator('#priorityShare').fill('0');
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$1.40');
      await expect(page.getByTestId('recommendation')).toContainText('Review latency requirements');
      await expect(page.getByText(/Spillover cost unavailable:/)).toBeVisible();
      await page.locator('#spilloverPriorityShare').fill('0');
      await chooseModel('GPT-5.6 Terra');
      await page.locator('#priorityShare').fill('100');
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$28.00');
      await chooseDeployment('Data Zone Deployment');
      await expect(page.getByText('Cost comparison unavailable', { exact: true })).toBeVisible();
      await chooseDeployment('Global Deployment');
      await expect(page.getByTestId('selected-paygo-cost')).toHaveText('$28.00');
      await chooseDeployment('Regional Deployment');
      await expect(page.getByText('Cost comparison unavailable', { exact: true })).toBeVisible();
    });
    assert.deepEqual(errors, [], 'No uncaught browser errors');
  } finally {
    await browser?.close();
    await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
  }
});
