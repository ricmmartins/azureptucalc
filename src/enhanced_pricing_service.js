// Enhanced Azure OpenAI Pricing Service
// Fetches live pricing from Azure Retail Prices API via Vercel serverless proxy
// Falls back to hardcoded official pricing when the API is unavailable

class AzureOpenAIPricingService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 3 * 60 * 60 * 1000; // 3 hours
    this.fallbackPricing = this.loadFallbackPricing();
    this.apiAvailable = null;
  }

  // Load fallback pricing data
  loadFallbackPricing() {
    return {
      // GPT-5 series
      'gpt-5.4': {
        paygo: { input: 2.50, output: 10.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5.3-codex': {
        paygo: { input: 2.50, output: 10.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5.2': {
        paygo: { input: 1.75, output: 14.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5.2-codex': {
        paygo: { input: 2.50, output: 10.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5.1': {
        paygo: { input: 1.25, output: 10.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5.1-codex': {
        paygo: { input: 2.50, output: 10.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5': {
        paygo: { input: 1.25, output: 10.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-5-mini': {
        paygo: { input: 0.25, output: 2.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      // GPT-4.1 series
      'gpt-4.1': {
        paygo: { input: 2.00, output: 8.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-4.1-mini': {
        paygo: { input: 0.40, output: 1.60 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-4.1-nano': {
        paygo: { input: 0.10, output: 0.40 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      // GPT-4o series
      'gpt-4o': {
        paygo: { input: 2.50, output: 10.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'gpt-4o-mini': {
        paygo: { input: 0.15, output: 0.60 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      // Reasoning models
      'o3': {
        paygo: { input: 2.00, output: 8.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'o4-mini': {
        paygo: { input: 1.10, output: 4.40 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'o3-mini': {
        paygo: { input: 1.10, output: 4.40 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'o1': {
        paygo: { input: 15.00, output: 60.00 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      // Embedding models
      'text-embedding-ada-002': {
        paygo: { input: 0.10, output: 0 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'text-embedding-3-large': {
        paygo: { input: 0.13, output: 0 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      },
      'text-embedding-3-small': {
        paygo: { input: 0.02, output: 0 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 }
      }
    };
  }

  // Main entry point: get pricing for a model/region/deployment
  async getPricing(model, region = 'eastus2', deploymentType = 'global') {
    const cacheKey = `${model}-${region}-${deploymentType}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Try live API via Vercel serverless proxy
    let livePricing = null;
    if (this.apiAvailable !== false) {
      try {
        livePricing = await this.fetchFromProxy(model, region, deploymentType);
      } catch (error) {
      }
    }

    if (livePricing) {
      this.cache.set(cacheKey, { data: livePricing, timestamp: Date.now() });
      return livePricing;
    }

    // Fallback to hardcoded pricing
    const fallback = this.getFallbackPricing(model, deploymentType);
    this.cache.set(cacheKey, { data: fallback, timestamp: Date.now() });
    return fallback;
  }

  // Fetch pricing from the Vercel serverless proxy (/api/azure-pricing)
  async fetchFromProxy(model, region, deploymentType) {
    const apiUrl = `/api/azure-pricing?model=${encodeURIComponent(model)}&region=${encodeURIComponent(region)}&deployment=${encodeURIComponent(deploymentType)}`;

    const controller= new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);

      // If we get HTML back (SPA fallback), the API route isn't available
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        this.apiAvailable = false;
        return null;
      }

      if (!response.ok) {
        if (response.status === 404) {
          this.apiAvailable = false;
        }
        return null;
      }

      const data = await response.json();

      if (!data.success) {
        return null;
      }

      this.apiAvailable = true;

      // Validate that we got meaningful pricing data
      const paygoInput = data.paygo?.input || 0;
      const paygoOutput = data.paygo?.output || 0;
      const ptuGlobal = data.ptu?.global || 0;

      // If the API returned zeros for everything, treat it as a miss
      if (paygoInput === 0 && paygoOutput === 0 && ptuGlobal === 0) {
        return null;
      }

      // Merge API data with fallback for any missing fields
      const fallback = this.fallbackPricing[model] || {};

      return {
        paygo: {
          input: paygoInput || fallback.paygo?.input || 0,
          output: paygoOutput || fallback.paygo?.output || 0,
          byDeployment: data.paygo?.byDeployment || null
        },
        ptu: {
          global: data.ptu?.global || fallback.ptu?.global || 1.00,
          dataZone: data.ptu?.dataZone || fallback.ptu?.dataZone || 1.10,
          regional: data.ptu?.regional || fallback.ptu?.regional || 2.00,
          reservations: data.ptu?.reservations || null
        },
        source: 'live',
        timestamp: data.timestamp || new Date().toISOString(),
        strategy_used: data.strategy_used,
        total_items: data.total_items,
        raw_sample: data.raw_sample
      };
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        // proxy request timed out
      } else {
        // proxy fetch error
      }
      return null;
    }
  }

  // Get fallback pricing when API is unavailable
  getFallbackPricing(model, deploymentType = 'global') {
    const fallback = this.fallbackPricing[model];
    
    if (!fallback) {
      return {
        paygo: { input: 0, output: 0 },
        ptu: { global: 1.00, dataZone: 1.10, regional: 2.00 },
        source: 'fallback',
        timestamp: new Date().toISOString()
      };
    }

    return {
      paygo: { ...fallback.paygo },
      ptu: { ...fallback.ptu },
      source: 'fallback',
      timestamp: new Date().toISOString()
    };
  }

  // Force refresh pricing (clears cache and resets API availability)
  async refreshPricing(model, region, deploymentType) {
    const cacheKey = `${model}-${region}-${deploymentType}`;
    this.cache.delete(cacheKey);
    this.apiAvailable = null;
    return this.getPricing(model, region, deploymentType);
  }

  // Refresh all cached pricing
  async refreshAllPricing() {
    this.cache.clear();
    this.apiAvailable = null;
    return { cleared: true, timestamp: new Date().toISOString() };
  }

  // Get pricing status
  getPricingStatus() {
    return {
      cacheSize: this.cache.size,
      apiAvailable: this.apiAvailable,
      cacheExpiry: this.cacheExpiry / (60 * 60 * 1000) + ' hours'
    };
  }
}

// Export for use in React app
export default AzureOpenAIPricingService;

