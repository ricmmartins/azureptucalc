import { test, expect } from '@playwright/test';

// Basic E2E: open app, select model & deployment, assert pricing display matches corrected JSON
import corrected from '../src/corrected_pricing_data.json' assert { type: 'json' };

const PORT = process.env.PORT || 5173;
const BASE = `http://localhost:${PORT}`;

for (const [modelId, modelData] of Object.entries(corrected.models)) {
  test.describe.model = modelId;
  test(`${modelId} UI displays reservation pricing for global deployment`, async ({ page }) => {
    await page.goto(BASE);
    // Wait for UI to render
    await page.waitForSelector('text=Azure OpenAI PTU Calculator');

    // Select model via UI - this assumes SelectTrigger/SelectValue are accessible via labels
    await page.click('label:has-text("OpenAI Model (PTU Supported Only)")');
    await page.click(`text=${modelData.displayName}`);

    // Select deployment global
    await page.click('label:has-text("Deployment Type")');
    await page.click('text=Global Deployment');

    // Read displayed PTU monthly and yearly if present
    const monthlyText = await page.locator('text=Monthly:').first().textContent();
    const yearlyText = await page.locator('text=Yearly:').first().textContent();

    expect(monthlyText).toContain(String(modelData.reservations.monthly));
    expect(yearlyText).toContain(String(modelData.reservations.yearly));
  });
}
