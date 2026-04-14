// Task 10: Export Functionality Service
// Provides comprehensive cost breakdown export in CSV and JSON formats

import enhancedModelConfig from './enhanced_model_config.json';
import { OFFICIAL_PTU_PRICING } from './officialPTUPricing.js';

export class ExportService {
  constructor() {
    this.reportData = null;
  }

  // Generate comprehensive cost breakdown report
  generateReport(calculationData) {
    const {
      model,
      region,
      deployment,
      ptuCount,
      usageScenario,
      throughputNeeded,
      ptuCostCalculation,
      paygCostCalculation,
      breakEvenAnalysis,
      customPricing,
      validationWarnings,
      outputWeighting
    } = calculationData;

    const reportTimestamp = new Date().toISOString();
    
    this.reportData = {
      metadata: {
        reportType: "Azure PTU Cost Analysis",
        generatedAt: reportTimestamp,
        version: "2025.09.30",
        calculator: "Azure PTU Calculator Enhanced"
      },
      configuration: {
        model: model,
        region: region,
        deploymentType: deployment,
        ptuCount: ptuCount,
        usageScenario: usageScenario,
        requiredThroughput: throughputNeeded,
        customPricing: customPricing?.enabled || false,
        outputWeighting: outputWeighting ? {
          outputWeight: outputWeighting.outputWeight,
          rawAvgTPM: outputWeighting.rawAvgTPM,
          normalizedAvgTPM: outputWeighting.normalizedAvgTPM,
          tpmSource: outputWeighting.tpmSource,
          resolvedInputTPM: outputWeighting.resolvedInputTPM,
          resolvedOutputTPM: outputWeighting.resolvedOutputTPM
        } : undefined
      },
      costBreakdown: {
        ptu: {
          hourly: ptuCostCalculation.hourly,
          monthly: ptuCostCalculation.monthly,
          yearly: ptuCostCalculation.yearly,
          discountApplied: ptuCostCalculation.yearlyDiscount || 0
        },
        payg: {
          inputTokens: {
            cost: paygCostCalculation.inputCost,
            pricePer1M: paygCostCalculation.inputPricePerK,
            usage: paygCostCalculation.inputTokens
          },
          outputTokens: {
            cost: paygCostCalculation.outputCost,
            pricePer1M: paygCostCalculation.outputPricePerK,
            usage: paygCostCalculation.outputTokens
          },
          total: paygCostCalculation.total
        },
        breakEven: {
          breakEvenPTUs: breakEvenAnalysis.breakEvenPTUs,
          breakEvenTPM: breakEvenAnalysis.breakEvenTPM,
          utilizationAtBreakEven: breakEvenAnalysis.utilizationAtBreakEven
        }
      },
      analysis: {
        costComparison: {
          ptuVsPayg: {
            monthly: {
              ptu: ptuCostCalculation.monthly,
              payg: paygCostCalculation.total,
              difference: ptuCostCalculation.monthly - paygCostCalculation.total,
              percentageDifference: paygCostCalculation.total ? ((ptuCostCalculation.monthly - paygCostCalculation.total) / paygCostCalculation.total * 100).toFixed(1) : "N/A"
            }
          }
        },
        throughputAnalysis: {
          ptuThroughput: this.calculatePTUThroughput(model, ptuCount),
          requiredThroughput: throughputNeeded,
          utilizationRate: throughputNeeded ? ((throughputNeeded / this.calculatePTUThroughput(model, ptuCount)) * 100).toFixed(1) : "N/A"
        },
        warnings: validationWarnings || [],
        recommendations: this.generateRecommendations(calculationData)
      },
      calculations: {
        formulas: {
          ptuHourly: "Base Rate × Deployment Multiplier × PTU Count",
          ptuMonthly: "Hourly Rate × 730 hours (or reservation override)",
          ptuYearly: "Yearly reservation override per PTU × PTU Count",
          payg: "Input Tokens × Input Rate + Output Tokens × Output Rate",
          breakEven: "PTU Monthly Cost ÷ (Input Rate + Output Rate)"
        },
        parameters: {
          baseRate: OFFICIAL_PTU_PRICING.BASE_HOURLY_RATE,
          deploymentMultiplier: this.getDeploymentMultiplier(deployment),
          reservationOverride: OFFICIAL_PTU_PRICING.RESERVATION_OVERRIDES[deployment] || null
        }
      }
    };

    return this.reportData;
  }

  // Export as CSV format
  exportAsCSV() {
    if (!this.reportData) {
      throw new Error('No report data available. Generate report first.');
    }

    const csvRows = [];
    
    // Header
    csvRows.push('Azure PTU Cost Analysis Report');
    csvRows.push(`Generated: ${this.reportData.metadata.generatedAt}`);
    csvRows.push('');
    
    // Configuration
    csvRows.push('CONFIGURATION');
    csvRows.push('Field,Value');
    csvRows.push(`Model,${this.reportData.configuration.model}`);
    csvRows.push(`Region,${this.reportData.configuration.region}`);
    csvRows.push(`Deployment Type,${this.reportData.configuration.deploymentType}`);
    csvRows.push(`PTU Count,${this.reportData.configuration.ptuCount}`);
    csvRows.push(`Usage Scenario,${this.reportData.configuration.usageScenario}`);
    csvRows.push('');
    
    // Output Token Weighting
    if (this.reportData.configuration.outputWeighting) {
      const ow = this.reportData.configuration.outputWeighting;
      csvRows.push('OUTPUT TOKEN WEIGHTING');
      csvRows.push('Field,Value');
      csvRows.push(`Output Weight,${ow.outputWeight}x`);
      csvRows.push(`TPM Source,${ow.tpmSource || 'N/A'}`);
      csvRows.push(`Raw Avg TPM,${ow.rawAvgTPM || 'N/A'}`);
      csvRows.push(`Normalized Avg TPM,${ow.normalizedAvgTPM || 'N/A'}`);
      csvRows.push(`Input TPM,${ow.resolvedInputTPM || 'N/A'}`);
      csvRows.push(`Output TPM,${ow.resolvedOutputTPM || 'N/A'}`);
      csvRows.push('');
    }
    
    // Cost Breakdown
    csvRows.push('PTU COSTS');
    csvRows.push('Period,Cost (USD)');
    csvRows.push(`Hourly,${this.reportData.costBreakdown.ptu.hourly}`);
    csvRows.push(`Monthly,${this.reportData.costBreakdown.ptu.monthly}`);
    csvRows.push(`Yearly,${this.reportData.costBreakdown.ptu.yearly}`);
    csvRows.push('');
    
    csvRows.push('PAY-AS-YOU-GO COSTS');
    csvRows.push('Token Type,Usage,Price per 1M,Total Cost (USD)');
    csvRows.push(`Input,${this.reportData.costBreakdown.payg.inputTokens.usage},${this.reportData.costBreakdown.payg.inputTokens.pricePer1M},${this.reportData.costBreakdown.payg.inputTokens.cost}`);
    csvRows.push(`Output,${this.reportData.costBreakdown.payg.outputTokens.usage},${this.reportData.costBreakdown.payg.outputTokens.pricePer1M},${this.reportData.costBreakdown.payg.outputTokens.cost}`);
    csvRows.push(`Total,,,$${this.reportData.costBreakdown.payg.total}`);
    csvRows.push('');
    
    // Break-even Analysis
    csvRows.push('BREAK-EVEN ANALYSIS');
    csvRows.push('Metric,Value');
    csvRows.push(`Break-Even PTUs,${this.reportData.costBreakdown.breakEven.breakEvenPTUs || 'N/A'}`);
    csvRows.push(`Break-Even TPM,${this.reportData.costBreakdown.breakEven.breakEvenTPM || 'N/A'}`);
    csvRows.push(`Utilization at Break-Even,${this.reportData.costBreakdown.breakEven.utilizationAtBreakEven ? (this.reportData.costBreakdown.breakEven.utilizationAtBreakEven * 100).toFixed(1) + '%' : 'N/A'}`);
    csvRows.push('');
    
    // Analysis
    csvRows.push('COST COMPARISON');
    csvRows.push('Model,PTU Monthly,PAYG Monthly,Difference,Percentage');
    const comparison = this.reportData.analysis.costComparison.ptuVsPayg.monthly;
    csvRows.push(`${this.reportData.configuration.model},${comparison.ptu},${comparison.payg},${comparison.difference},${comparison.percentageDifference}%`);
    csvRows.push('');
    
    // Warnings
    if (this.reportData.analysis.warnings.length > 0) {
      csvRows.push('WARNINGS');
      csvRows.push('Warning');
      this.reportData.analysis.warnings.forEach(warning => {
        csvRows.push(`"${warning}"`);
      });
      csvRows.push('');
    }
    
    // Recommendations
    csvRows.push('RECOMMENDATIONS');
    csvRows.push('Recommendation');
    this.reportData.analysis.recommendations.forEach(rec => {
      csvRows.push(`"${rec}"`);
    });

    return csvRows.join('\n');
  }

  // Export as JSON format
  exportAsJSON() {
    if (!this.reportData) {
      throw new Error('No report data available. Generate report first.');
    }

    return JSON.stringify(this.reportData, null, 2);
  }

  // Download CSV file
  downloadCSV(filename = null) {
    const csv = this.exportAsCSV();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const defaultFilename = `azure-ptu-analysis-${timestamp}.csv`;
    
    this.downloadFile(csv, filename || defaultFilename, 'text/csv');
  }

  // Download JSON file
  downloadJSON(filename = null) {
    const json = this.exportAsJSON();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const defaultFilename = `azure-ptu-analysis-${timestamp}.json`;
    
    this.downloadFile(json, filename || defaultFilename, 'application/json');
  }

  // Generate summary report
  generateSummaryReport() {
    if (!this.reportData) {
      throw new Error('No report data available. Generate report first.');
    }

    const summary = {
      configuration: `${this.reportData.configuration.model} (${this.reportData.configuration.ptuCount} PTU) in ${this.reportData.configuration.region}`,
      ptuCost: `$${this.reportData.costBreakdown.ptu.monthly}/month`,
      paygCost: `$${this.reportData.costBreakdown.payg.total}/month`,
      recommendation: this.reportData.costBreakdown.breakEven.recommendation,
      breakEvenTokens: this.reportData.costBreakdown.breakEven.monthlyTokensNeeded,
      warnings: this.reportData.analysis.warnings.length,
      generatedAt: new Date(this.reportData.metadata.generatedAt).toLocaleString()
    };

    return summary;
  }

  // Private helper methods
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  calculatePTUThroughput(model, ptuCount) {
    const modelConfig = enhancedModelConfig.models[model];
    const throughputPerPTU = modelConfig?.throughput_per_ptu || 2500;
    return throughputPerPTU * ptuCount;
  }

  getModelThroughputPerPTU(model) {
    const modelConfig = enhancedModelConfig.models[model];
    return modelConfig?.throughput_per_ptu || 2500;
  }

  getDeploymentMultiplier(deployment) {
    return OFFICIAL_PTU_PRICING.DEPLOYMENT_MULTIPLIERS[deployment] || 1.0;
  }

  generateRecommendations(calculationData) {
    const recommendations = [];
    const { ptuCostCalculation, paygCostCalculation, ptuCount, model } = calculationData;
    
    // Cost-based recommendations
    if (ptuCostCalculation.monthly < paygCostCalculation.total) {
      recommendations.push(`PTU is ${((paygCostCalculation.total - ptuCostCalculation.monthly) / paygCostCalculation.total * 100).toFixed(1)}% cheaper than PAYG for your usage pattern`);
    } else if (paygCostCalculation.total < ptuCostCalculation.monthly) {
      recommendations.push(`PAYG is ${((ptuCostCalculation.monthly - paygCostCalculation.total) / ptuCostCalculation.monthly * 100).toFixed(1)}% cheaper than PTU for your usage pattern`);
    }
    
    // Throughput recommendations
    const throughputPerPTU = this.getModelThroughputPerPTU(model);
    const totalThroughput = throughputPerPTU * ptuCount;
    
    if (totalThroughput > 100000) {
      recommendations.push('Consider distributing workload across multiple deployments for better resilience');
    }
    
    // PTU optimization
    if (ptuCount > 100) {
      recommendations.push('Large PTU deployments benefit significantly from yearly commitment pricing');
    }
    
    // Model-specific recommendations
    if (throughputPerPTU > 10000 && ptuCount < 25) {
      recommendations.push(`${model} has high throughput per PTU (${throughputPerPTU.toLocaleString()} TPM) - consider if lower PTU count meets your needs`);
    }
    
    return recommendations;
  }
}

export default ExportService;