// Corrected Azure OpenAI Pricing Service
// Based on official Azure pricing as of August 15, 2025

import correctedPricingData from './corrected_pricing_data.json';

class CorrectedPricingService {
  constructor() {
    this.pricingData = correctedPricingData;
    this.lastUpdated = new Date(this.pricingData.timestamp);
    this.cacheExpiry = 3 * 60 * 60 * 1000; // 3 hours
  }

  /**
   * Get pricing for a specific model and deployment type
   * @param {string} modelId - Model identifier (e.g., 'gpt-4o')
   * @param {string} deploymentType - Deployment type ('global', 'dataZone', 'regional')
   * @returns {Object} Pricing information
   */
  getModelPricing(modelId, deploymentType = 'global') {
    const model = this.pricingData.models[modelId];
    if (!model) {
      console.warn(`Model ${modelId} not found in pricing data`);
      return this.getDefaultPricing();
    }

    // Handle deployment type mapping
    const deploymentKey = deploymentType === 'dataZone' ? 'dataZone' : 
                         deploymentType === 'regional' ? 'regional' : 'global';

    return {
      model: modelId,
      displayName: model.displayName,
      deploymentType,
      minPTU: model.minPTU[deploymentKey] || model.minPTU.global || 15,
      paygo: {
        input: model.paygo[deploymentKey]?.input || model.paygo.global?.input || 0.15,
        output: model.paygo[deploymentKey]?.output || model.paygo.global?.output || 0.60
      },
      ptu: {
        hourly: model.ptu[deploymentKey] || model.ptu.global || 1.00,
        monthly: model.reservations?.monthly || 260,
        yearly: model.reservations?.yearly || 2652
      },
      tokensPerPTUPerMinute: this.pricingData.ptuCapacity?.tokensPerPTUPerMinute || 50000
    };
  }

  /**
   * Get all available models with their pricing
   * @returns {Array} Array of model pricing information
   */
  getAllModelPricing() {
    return Object.keys(this.pricingData.models).map(modelId => ({
      id: modelId,
      displayName: this.pricingData.models[modelId].displayName,
      minPTU: this.pricingData.models[modelId].minPTU,
      pricing: {
        global: this.getModelPricing(modelId, 'global'),
        dataZone: this.getModelPricing(modelId, 'dataZone'),
        regional: this.getModelPricing(modelId, 'regional')
      }
    }));
  }

  /**
   * Calculate PTU requirements based on tokens per minute
   * @param {number} tokensPerMinute - Required tokens per minute
   * @returns {number} Required PTUs (rounded up)
   */
  calculateRequiredPTUs(tokensPerMinute) {
    const tokensPerPTUPerMinute = this.pricingData.ptuCapacity.tokensPerPTUPerMinute;
    return Math.ceil(tokensPerMinute / tokensPerPTUPerMinute);
  }

  /**
   * Calculate PAYGO costs
   * @param {Object} params - Calculation parameters
   * @returns {Object} Cost breakdown
   */
  calculatePaygoCosts(params) {
    const { modelId, deploymentType, inputTokens, outputTokens, timeframe = 'monthly' } = params;
    const pricing = this.getModelPricing(modelId, deploymentType);
    
    const inputCost = (inputTokens / 1000000) * pricing.paygo.input;
    const outputCost = (outputTokens / 1000000) * pricing.paygo.output;
    const totalCost = inputCost + outputCost;

    // Convert to timeframe
    const multiplier = this.getTimeframeMultiplier(timeframe);
    
    return {
      inputCost: inputCost * multiplier,
      outputCost: outputCost * multiplier,
      totalCost: totalCost * multiplier,
      costPerToken: totalCost / (inputTokens + outputTokens),
      timeframe
    };
  }

  /**
   * Calculate PTU costs
   * @param {Object} params - Calculation parameters
   * @returns {Object} Cost breakdown
   */
  calculatePTUCosts(params) {
    const { modelId, deploymentType, requiredPTUs, reservationType = 'hourly', timeframe = 'monthly' } = params;
    const pricing = this.getModelPricing(modelId, deploymentType);
    
    // Ensure minimum PTU requirement
    const actualPTUs = Math.max(requiredPTUs, pricing.minPTU);
    
    let costPerPTU;
    switch (reservationType) {
      case 'yearly':
        costPerPTU = pricing.ptu.yearly / 12; // Convert yearly to monthly
        break;
      case 'monthly':
        costPerPTU = pricing.ptu.monthly;
        break;
      case 'hourly':
      default:
        costPerPTU = pricing.ptu.hourly * 24 * 30; // Convert hourly to monthly
        break;
    }

    const monthlyCost = actualPTUs * costPerPTU;
    const multiplier = this.getTimeframeMultiplier(timeframe);

    return {
      requiredPTUs,
      actualPTUs,
      minPTU: pricing.minPTU,
      costPerPTU,
      monthlyCost,
      totalCost: monthlyCost * multiplier,
      reservationType,
      timeframe,
      savings: reservationType !== 'hourly' ? this.calculateReservationSavings(pricing, actualPTUs, reservationType) : 0
    };
  }

  /**
   * Calculate hybrid model costs (PTU base + PAYGO overflow)
   * @param {Object} params - Calculation parameters
   * @returns {Object} Cost breakdown
   */
  calculateHybridCosts(params) {
    const { 
      modelId, 
      deploymentType, 
      basePTUs, 
      avgTokensPerMinute, 
      peakTokensPerMinute,
      inputOutputRatio = 0.5,
      timeframe = 'monthly' 
    } = params;

    const pricing = this.getModelPricing(modelId, deploymentType);
    
    // Calculate base PTU costs
    const ptuCosts = this.calculatePTUCosts({
      modelId,
      deploymentType,
      requiredPTUs: basePTUs,
      reservationType: 'monthly',
      timeframe
    });

    // Calculate overflow capacity
    const basePTUCapacity = basePTUs * pricing.tokensPerPTUPerMinute;
    const overflowTokensPerMinute = Math.max(0, peakTokensPerMinute - basePTUCapacity);
    
    // Calculate overflow costs (PAYGO)
    const monthlyMinutes = 30 * 24 * 60;
    const overflowTokensMonthly = overflowTokensPerMinute * monthlyMinutes;
    const overflowInputTokens = overflowTokensMonthly * inputOutputRatio;
    const overflowOutputTokens = overflowTokensMonthly * (1 - inputOutputRatio);

    const overflowCosts = this.calculatePaygoCosts({
      modelId,
      deploymentType,
      inputTokens: overflowInputTokens,
      outputTokens: overflowOutputTokens,
      timeframe
    });

    return {
      basePTUs,
      basePTUCapacity,
      ptuCosts: ptuCosts.totalCost,
      overflowTokensPerMinute,
      overflowCosts: overflowCosts.totalCost,
      totalCost: ptuCosts.totalCost + overflowCosts.totalCost,
      utilizationRate: Math.min(avgTokensPerMinute / basePTUCapacity, 1.0),
      overflowRate: overflowTokensPerMinute / peakTokensPerMinute,
      timeframe
    };
  }

  /**
   * Get deployment type information
   * @returns {Object} Deployment types with descriptions
   */
  getDeploymentTypes() {
    return this.pricingData.deploymentTypes;
  }

  /**
   * Validate pricing data freshness
   * @returns {boolean} True if data is fresh
   */
  isPricingDataFresh() {
    const now = new Date();
    return (now - this.lastUpdated) < this.cacheExpiry;
  }

  /**
   * Get pricing data source information
   * @returns {Object} Source information
   */
  getPricingSource() {
    return {
      url: this.pricingData.url,
      timestamp: this.pricingData.timestamp,
      lastUpdated: this.lastUpdated,
      isFresh: this.isPricingDataFresh()
    };
  }

  // Private helper methods

  getDefaultPricing() {
    return {
      model: 'unknown',
      displayName: 'Unknown Model',
      deploymentType: 'global',
      minPTU: 15,
      paygo: { input: 1.0, output: 4.0 },
      ptu: { hourly: 1.0, monthly: 260, yearly: 2652 },
      tokensPerPTUPerMinute: 50000
    };
  }

  getTimeframeMultiplier(timeframe) {
    switch (timeframe) {
      case 'hourly': return 1 / (24 * 30);
      case 'daily': return 1 / 30;
      case 'monthly': return 1;
      case 'yearly': return 12;
      default: return 1;
    }
  }

  calculateReservationSavings(pricing, ptus, reservationType) {
    const hourlyCost = ptus * pricing.ptu.hourly * 24 * 30; // Monthly hourly cost
    const reservationCost = ptus * (reservationType === 'yearly' ? pricing.ptu.yearly / 12 : pricing.ptu.monthly);
    return Math.max(0, hourlyCost - reservationCost);
  }
}

// Export singleton instance
export const correctedPricingService = new CorrectedPricingService();
export default correctedPricingService;

