// Task 10: Export Functionality Service
// Provides comprehensive cost breakdown export in CSV and JSON formats

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
      validationWarnings
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
        customPricing: customPricing?.enabled || false
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
            pricePerK: paygCostCalculation.inputPricePerK,
            usage: paygCostCalculation.inputTokens
          },
          outputTokens: {
            cost: paygCostCalculation.outputCost,
            pricePerK: paygCostCalculation.outputPricePerK,
            usage: paygCostCalculation.outputTokens
          },
          total: paygCostCalculation.total
        },
        breakEven: {
          monthlyTokensNeeded: breakEvenAnalysis.monthlyTokensNeeded,
          dailyTokensNeeded: breakEvenAnalysis.dailyTokensNeeded,
          hourlyTokensNeeded: breakEvenAnalysis.hourlyTokensNeeded,
          recommendation: breakEvenAnalysis.recommendation,
          savingsWithPTU: breakEvenAnalysis.savingsWithPTU
        }
      },
      analysis: {
        costComparison: {
          ptuVsPayg: {
            monthly: {
              ptu: ptuCostCalculation.monthly,
              payg: paygCostCalculation.total,
              difference: ptuCostCalculation.monthly - paygCostCalculation.total,
              percentageDifference: ((ptuCostCalculation.monthly - paygCostCalculation.total) / paygCostCalculation.total * 100).toFixed(1)
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
          ptuHourly: "Base Rate × Regional Multiplier × Deployment Multiplier × PTU Count",
          ptuMonthly: "Hourly Rate × 730 hours",
          ptuYearly: "Monthly Rate × 12 × (1 - Yearly Discount)",
          payg: "Input Tokens × Input Rate + Output Tokens × Output Rate",
          breakEven: "PTU Monthly Cost ÷ (Input Rate + Output Rate)"
        },
        parameters: {
          baseRate: 1.00,
          regionalMultiplier: this.getRegionalMultiplier(region),
          deploymentMultiplier: this.getDeploymentMultiplier(deployment),
          yearlyDiscount: 0.30
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
    
    // Cost Breakdown
    csvRows.push('PTU COSTS');
    csvRows.push('Period,Cost (USD)');
    csvRows.push(`Hourly,${this.reportData.costBreakdown.ptu.hourly}`);
    csvRows.push(`Monthly,${this.reportData.costBreakdown.ptu.monthly}`);
    csvRows.push(`Yearly,${this.reportData.costBreakdown.ptu.yearly}`);
    csvRows.push('');
    
    csvRows.push('PAY-AS-YOU-GO COSTS');
    csvRows.push('Token Type,Usage,Price per 1K,Total Cost (USD)');
    csvRows.push(`Input,${this.reportData.costBreakdown.payg.inputTokens.usage},${this.reportData.costBreakdown.payg.inputTokens.pricePerK},${this.reportData.costBreakdown.payg.inputTokens.cost}`);
    csvRows.push(`Output,${this.reportData.costBreakdown.payg.outputTokens.usage},${this.reportData.costBreakdown.payg.outputTokens.pricePerK},${this.reportData.costBreakdown.payg.outputTokens.cost}`);
    csvRows.push(`Total,,,$${this.reportData.costBreakdown.payg.total}`);
    csvRows.push('');
    
    // Break-even Analysis
    csvRows.push('BREAK-EVEN ANALYSIS');
    csvRows.push('Metric,Value');
    csvRows.push(`Monthly Tokens Needed,${this.reportData.costBreakdown.breakEven.monthlyTokensNeeded}`);
    csvRows.push(`Daily Tokens Needed,${this.reportData.costBreakdown.breakEven.dailyTokensNeeded}`);
    csvRows.push(`Hourly Tokens Needed,${this.reportData.costBreakdown.breakEven.hourlyTokensNeeded}`);
    csvRows.push(`Recommendation,${this.reportData.costBreakdown.breakEven.recommendation}`);
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
    const throughputPerPTU = {
      'gpt-4o': 2500,
      'gpt-4o-mini': 37000,
      'gpt-4': 2500,
      'gpt-35-turbo': 37000
    };
    
    return (throughputPerPTU[model] || 2500) * ptuCount;
  }

  getRegionalMultiplier(region) {
    const multipliers = {
      'eastus': 1.0,
      'westus': 1.05,
      'northeurope': 1.05,
      'westeurope': 1.05,
      'southeastasia': 1.1,
      'japaneast': 1.1
    };
    
    return multipliers[region] || 1.0;
  }

  getDeploymentMultiplier(deployment) {
    const multipliers = {
      'regional': 1.0,
      'dataZone': 1.2,
      'global': 1.4
    };
    
    return multipliers[deployment] || 1.0;
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
    const throughputPerPTU = model === 'gpt-4o-mini' ? 37000 : 2500;
    const totalThroughput = throughputPerPTU * ptuCount;
    
    if (totalThroughput > 100000) {
      recommendations.push('Consider distributing workload across multiple deployments for better resilience');
    }
    
    // PTU optimization
    if (ptuCount > 100) {
      recommendations.push('Large PTU deployments benefit significantly from yearly commitment pricing');
    }
    
    // Model-specific recommendations
    if (model === 'gpt-4o-mini' && ptuCount < 25) {
      recommendations.push('GPT-4o-mini has high throughput per PTU - consider if lower PTU count meets your needs');
    }
    
    return recommendations;
  }
}

export default ExportService;