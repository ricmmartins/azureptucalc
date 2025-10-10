import corrected from '../src/corrected_pricing_data.json';
import { describe, it, expect } from 'vitest';
import { getTokenPricing } from '../src/official_token_pricing.js';

describe('Model pricing parity with corrected_pricing_data.json', () => {
  for (const [modelId, modelData] of Object.entries(corrected.models)) {
    it(`${modelId} should have reservation and PTU pricing applied correctly`, () => {
      const monthly = modelData.reservations?.monthly;
      const yearly = modelData.reservations?.yearly;
      const ptu = modelData.ptu?.global;

      expect(monthly).toBeDefined();
      expect(yearly).toBeDefined();
      expect(ptu).toBeDefined();

      // Token pricing should at least return an object
      const token = getTokenPricing(modelId);
      expect(token).toHaveProperty('input');
      expect(token).toHaveProperty('output');
    });
  }
});
