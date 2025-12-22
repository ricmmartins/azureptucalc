/**
 * Azure PTU Calculator - Pricing Validation Service
 * 
 * This service provides comprehensive pricing validation by comparing static pricing data
 * with live Azure API pricing to ensure accuracy and detect discrepancies.
 * 
 * Key Features:
 * - Live API validation against prices.azure.com
 * - Accuracy scoring and status reporting
 * - Data freshness monitoring
 * - Pricing source verification
 * - Warning generation for discrepancies
 * 
 * Usage:
 * - Validates pricing data periodically (every 30 minutes)
 * - Integrates with main App to show validation status
 * - Provides detailed comparison reports
 * - Alerts users to pricing inconsistencies
 * 
 * Implementation Date: December 2024
 * Purpose: Ensure pricing data accuracy and user trust
 */

import AzureOpenAIPricingService from './enhanced_pricing_service.js';
import { getTokenPricing, OFFICIAL_TOKEN_PRICING } from './official_token_pricing.js';
import { calculateOfficialPTUPricing } from './officialPTUPricing.js';

class PricingValidationService {
  constructor() {
    this.azurePricingService = new AzureOpenAIPricingService();
    this.validationCache = new Map();
    this.cacheTimeout = 1000 * 60 * 30; // 30 minutes
    this.lastValidation = null;
  }

  // Validate pricing accuracy against live Azure API
  async validatePricingAccuracy(model, region = 'eastus2', deploymentType = 'regional') {
    const cacheKey = `${model}-${region}-${deploymentType}`;
    
    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.result;
      }
    }

    const validation = {
      model,
      region,
      deploymentType,
      timestamp: new Date().toISOString(),
      static: {},
      live: {},
      status: 'unknown',
      accuracy: 0,
      warnings: [],
      dataSource: 'unknown'
    };

    try {
      // Get static pricing data
      validation.static.token = getTokenPricing(model);
      validation.static.ptu = calculateOfficialPTUPricing(region, deploymentType);

      // Attempt to get live pricing from Azure API
      const livePricing = await this.azurePricingService.getPricing(model, region, deploymentType);
      
      if (livePricing && livePricing.source === 'live') {
        validation.live = livePricing;
        validation.dataSource = 'live';
        validation.status = 'success';
        
        // Compare pricing accuracy
        const accuracy = this.calculateAccuracy(validation.static, validation.live);
        validation.accuracy = accuracy.score;
        validation.warnings = accuracy.warnings;
        
        if (validation.accuracy >= 95) {
          validation.status = 'accurate';
        } else if (validation.accuracy >= 85) {
          validation.status = 'minor_differences';
        } else {
          validation.status = 'significant_differences';
        }
      } else {
        validation.dataSource = 'fallback';
        validation.status = 'api_unavailable';
        validation.warnings.push('Azure pricing API unavailable - using static data');
      }

    } catch (error) {
      validation.status = 'error';
      validation.warnings.push(`Validation failed: ${error.message}`);
    }

    // Cache result
    this.validationCache.set(cacheKey, {
      result: validation,
      timestamp: Date.now()
    });

    this.lastValidation = Date.now();
    return validation;
  }

  // Calculate accuracy between static and live pricing
  calculateAccuracy(staticPricing, livePricing) {
    const accuracy = { score: 100, warnings: [] };

    if (!livePricing.paygo || !staticPricing.token) {
      accuracy.score = 0;
      accuracy.warnings.push('Missing pricing data for comparison');
      return accuracy;
    }

    // Compare token pricing
    const staticInput = staticPricing.token.input || 0;
    const liveInput = livePricing.paygo.input || 0;
    const staticOutput = staticPricing.token.output || 0;
    const liveOutput = livePricing.paygo.output || 0;

    if (staticInput > 0 && liveInput > 0) {
      const inputDiff = Math.abs(staticInput - liveInput) / staticInput * 100;
      if (inputDiff > 10) {
        accuracy.score -= 25;
        accuracy.warnings.push(`Input token pricing differs by ${inputDiff.toFixed(1)}%`);
      } else if (inputDiff > 5) {
        accuracy.score -= 10;
        accuracy.warnings.push(`Input token pricing differs by ${inputDiff.toFixed(1)}%`);
      }
    }

    if (staticOutput > 0 && liveOutput > 0) {
      const outputDiff = Math.abs(staticOutput - liveOutput) / staticOutput * 100;
      if (outputDiff > 10) {
        accuracy.score -= 25;
        accuracy.warnings.push(`Output token pricing differs by ${outputDiff.toFixed(1)}%`);
      } else if (outputDiff > 5) {
        accuracy.score -= 10;
        accuracy.warnings.push(`Output token pricing differs by ${outputDiff.toFixed(1)}%`);
      }
    }

    // Compare PTU pricing if available
    if (livePricing.ptu && staticPricing.ptu) {
      const liveHourly = livePricing.ptu.regional || livePricing.ptu.global || 0;
      const staticHourly = staticPricing.ptu.hourly || 0;
      
      if (liveHourly > 0 && staticHourly > 0) {
        const ptuDiff = Math.abs(staticHourly - liveHourly) / staticHourly * 100;
        if (ptuDiff > 15) {
          accuracy.score -= 30;
          accuracy.warnings.push(`PTU pricing differs by ${ptuDiff.toFixed(1)}%`);
        } else if (ptuDiff > 5) {
          accuracy.score -= 15;
          accuracy.warnings.push(`PTU pricing differs by ${ptuDiff.toFixed(1)}%`);
        }
      }
    }

    return accuracy;
  }

  // Check if pricing data is outdated
  checkDataFreshness() {
    const now = new Date();
    const expiryDate = new Date('2025-12-31T23:59:59Z'); // From external_pricing_config.json
    const daysUntilExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);
    
    return {
      isExpired: daysUntilExpiry <= 0,
      daysUntilExpiry: Math.ceil(daysUntilExpiry),
      expiryDate: expiryDate.toISOString(),
      status: daysUntilExpiry <= 0 ? 'expired' : 
              daysUntilExpiry <= 7 ? 'expiring_soon' : 'current'
    };
  }

  // Validate multiple models quickly
  async validateMultipleModels(models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4'], region = 'eastus2') {
    const validations = [];
    
    for (const model of models) {
      try {
        const validation = await this.validatePricingAccuracy(model, region, 'regional');
        validations.push(validation);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        validations.push({
          model,
          region,
          status: 'error',
          warnings: [error.message]
        });
      }
    }

    return {
      validations,
      summary: this.generateValidationSummary(validations),
      timestamp: new Date().toISOString()
    };
  }

  // Generate summary of validation results
  generateValidationSummary(validations) {
    const summary = {
      total: validations.length,
      accurate: 0,
      minor_differences: 0,
      significant_differences: 0,
      api_unavailable: 0,
      errors: 0,
      averageAccuracy: 0,
      dataSource: 'mixed'
    };

    let totalAccuracy = 0;
    let liveDataCount = 0;

    validations.forEach(v => {
      summary[v.status] = (summary[v.status] || 0) + 1;
      if (v.accuracy !== undefined) {
        totalAccuracy += v.accuracy;
      }
      if (v.dataSource === 'live') {
        liveDataCount++;
      }
    });

    summary.averageAccuracy = validations.length > 0 ? totalAccuracy / validations.length : 0;
    summary.dataSource = liveDataCount === validations.length ? 'live' : 
                         liveDataCount === 0 ? 'static' : 'mixed';

    return summary;
  }

  // Get validation status for UI
  getValidationStatus() {
    const freshness = this.checkDataFreshness();
    
    return {
      lastValidation: this.lastValidation ? new Date(this.lastValidation).toLocaleString() : null,
      hasRecentValidation: this.lastValidation && (Date.now() - this.lastValidation < this.cacheTimeout),
      dataFreshness: freshness,
      cacheSize: this.validationCache.size
    };
  }

  // Clear validation cache
  clearCache() {
    this.validationCache.clear();
    this.lastValidation = null;
  }
}

// Export singleton instance
export const pricingValidationService = new PricingValidationService();
export default pricingValidationService;