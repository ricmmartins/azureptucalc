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
      breakEvenAnalysis = {},
      customPricing,
      validationWarnings,
      outputWeighting,
      processingScenario,
      scenarioAnalysis
    } = calculationData;

    const reportTimestamp = new Date().toISOString();
    const breakEven = scenarioAnalysis?.breakEvenAnalysis ?? breakEvenAnalysis;
    const recommendationDetails = scenarioAnalysis?.recommendationDetails;
    const comparisonPtuCost = scenarioAnalysis
      ? scenarioAnalysis.yearlyReservationMonthly ?? null
      : ptuCostCalculation.monthly;
    const selectedPaygoCost = paygCostCalculation.total ?? null;
    const comparisonDifference = comparisonPtuCost == null || selectedPaygoCost == null
      ? null
      : comparisonPtuCost - selectedPaygoCost;

    this.reportData = {
      metadata: {
        reportType: "Azure PTU Cost Analysis",
        generatedAt: reportTimestamp,
        version: "2025.09.30",
        calculator: "Microsoft Foundry PTU Calculator"
      },
      configuration: {
        model: model,
        region: region,
        deploymentType: deployment,
        ptuCount: ptuCount,
        usageScenario: usageScenario,
        requiredThroughput: throughputNeeded,
        customPricing: customPricing?.enabled || false,
        paygoPricing: paygCostCalculation.pricing,
        processingScenario,
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
          total: selectedPaygoCost
        },
        baselines: scenarioAnalysis ? {
          monthlyStandardCost: scenarioAnalysis.monthlyStandardCost ?? null,
          monthlyPriorityCost: scenarioAnalysis.monthlyPriorityCost ?? null,
          yearlyReservationMonthly: scenarioAnalysis.yearlyReservationMonthly ?? null,
          monthlyPtuReservationCost: scenarioAnalysis.monthlyPtuReservationCost ?? null
        } : undefined,
        spillover: scenarioAnalysis ? {
          priorityShare: processingScenario?.spilloverPriorityShare ?? null,
          basePTU: scenarioAnalysis.hybridBasePTU ?? null,
          baseCost: scenarioAnalysis.hybridBaseCost ?? null,
          yearlyBaseCost: scenarioAnalysis.hybridYearlyBaseCost ?? null,
          overflowCost: scenarioAnalysis.hybridOverflowCost ?? null,
          total: scenarioAnalysis.hybridTotalCost ?? null,
          yearlyTotalCost: scenarioAnalysis.hybridYearlyTotalCost ?? null,
          unavailableReason: scenarioAnalysis.spilloverUnavailableReason ?? null,
          assumption: 'P99-based extrapolation is a planning approximation, not measured monthly traffic or validation of routing.'
        } : undefined,
        breakEven: {
          ...breakEven,
          utilizationAtBreakEven: breakEven.utilizationAtBreakEven ?? breakEven.breakEvenUtilization ?? null
        }
      },
      analysis: {
        recommendationDetails,
        costComparison: {
          ptuVsPayg: {
            ptuBasis: scenarioAnalysis ? '1-year reservation monthly equivalent' : 'Monthly PTU cost',
            monthly: {
              ptu: comparisonPtuCost,
              payg: selectedPaygoCost,
              difference: comparisonDifference,
              percentageDifference: comparisonDifference != null && selectedPaygoCost
                ? (comparisonDifference / selectedPaygoCost * 100).toFixed(1) : "N/A"
            }
          },
          selected: recommendationDetails ? {
            strategy: recommendationDetails.strategy,
            label: recommendationDetails.label,
            monthlyCost: recommendationDetails.monthlyCost ?? null,
            monthlySavings: scenarioAnalysis.monthlySavings ?? null,
            costLeader: recommendationDetails.costLeader,
            requiresReview: recommendationDetails.requiresReview
          } : undefined
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
    const csvCell = value => {
      const text = String(value ?? 'N/A');
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const addRow = (...values) => csvRows.push(values.map(csvCell).join(','));

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
    const pricing = this.reportData.configuration.paygoPricing;
    if (pricing) {
      addRow('PAYGO Price Source', pricing.source);
      addRow('PAYGO Context', pricing.context ?? 'User-provided or model default');
      if (pricing.sourceUrl) addRow('PAYGO Reference', pricing.sourceUrl);
    }
    csvRows.push('');

    const scenario = this.reportData.configuration.processingScenario;
    if (scenario) {
      csvRows.push('PROCESSING SCENARIO');
      csvRows.push('Field,Value');
      addRow('Priority Token Share (%)', scenario.priorityShare);
      addRow('Spillover Priority Token Share (%)', scenario.spilloverPriorityShare);
      addRow('Latency Critical', scenario.isLatencyCritical);
      addRow('Processing Assumption', scenario.assumption);
      for (const [tier, quote] of [['Standard', scenario.standardPricing], ['Priority', scenario.priorityPricing]]) {
        addRow(`${tier} Available`, quote?.available ?? false);
        addRow(`${tier} Price Source`, quote?.source);
        addRow(`${tier} Context`, quote?.context);
        addRow(`${tier} Price Date`, quote?.verifiedAt ?? quote?.asOf);
        addRow(`${tier} Reference`, quote?.sourceUrl);
        addRow(`${tier} Input Price per 1M`, quote?.input);
        addRow(`${tier} Output Price per 1M`, quote?.output);
        addRow(`${tier} Unavailable Reason`, quote?.reason);
      }
      addRow('Weighted Input Price per 1M', this.reportData.costBreakdown.payg.inputTokens.pricePer1M);
      addRow('Weighted Output Price per 1M', this.reportData.costBreakdown.payg.outputTokens.pricePer1M);
      csvRows.push('');
    }

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
    addRow('Input', this.reportData.costBreakdown.payg.inputTokens.usage, this.reportData.costBreakdown.payg.inputTokens.pricePer1M, this.reportData.costBreakdown.payg.inputTokens.cost);
    addRow('Output', this.reportData.costBreakdown.payg.outputTokens.usage, this.reportData.costBreakdown.payg.outputTokens.pricePer1M, this.reportData.costBreakdown.payg.outputTokens.cost);
    addRow('Total', '', '', this.reportData.costBreakdown.payg.total != null ? `$${this.reportData.costBreakdown.payg.total}` : null);
    csvRows.push('');

    const baselines = this.reportData.costBreakdown.baselines;
    if (baselines) {
      csvRows.push('SCENARIO MONTHLY COSTS');
      csvRows.push('Field,Value');
      addRow('Standard Baseline Cost', baselines.monthlyStandardCost);
      addRow('100% Priority Baseline Cost', baselines.monthlyPriorityCost);
      addRow('Selected PAYGO Cost', this.reportData.costBreakdown.payg.total);
      addRow('PTU 1-Year Reservation Monthly Equivalent', baselines.yearlyReservationMonthly);
      addRow('PTU Monthly Reservation Cost', baselines.monthlyPtuReservationCost);
      const spillover = this.reportData.costBreakdown.spillover;
      addRow('Spillover Base PTUs', spillover.basePTU);
      addRow('Spillover Base Cost', spillover.baseCost);
      addRow('Spillover 1-Year Base Monthly Equivalent', spillover.yearlyBaseCost);
      addRow('Spillover Overflow Cost', spillover.overflowCost);
      addRow('Spillover Total Cost', spillover.total);
      addRow('Spillover 1-Year Total Monthly Equivalent', spillover.yearlyTotalCost);
      addRow('Spillover Unavailable Reason', spillover.unavailableReason);
      addRow('Spillover Assumption', spillover.assumption);
      csvRows.push('');
    }

    // Break-even Analysis
    csvRows.push('BREAK-EVEN ANALYSIS');
    csvRows.push('Metric,Value');
    addRow('Break-Even PTUs', this.reportData.costBreakdown.breakEven.breakEvenPTUs);
    addRow('Break-Even TPM', this.reportData.costBreakdown.breakEven.breakEvenTPM);
    const utilization = this.reportData.costBreakdown.breakEven.utilizationAtBreakEven;
    addRow('Utilization at Break-Even', utilization != null ? (utilization * 100).toFixed(1) + '%' : 'N/A');
    csvRows.push('');

    // Analysis
    csvRows.push('COST COMPARISON');
    csvRows.push('Model,PTU Monthly,PAYG Monthly,Difference,Percentage');
    const comparison = this.reportData.analysis.costComparison.ptuVsPayg.monthly;
    addRow(this.reportData.configuration.model, comparison.ptu, comparison.payg, comparison.difference,
      comparison.percentageDifference === 'N/A' ? 'N/A' : `${comparison.percentageDifference}%`);
    addRow('PTU Comparison Basis', this.reportData.analysis.costComparison.ptuVsPayg.ptuBasis);
    const recommendation = this.reportData.analysis.recommendationDetails;
    if (recommendation) {
      addRow('Recommended Strategy', recommendation.strategy);
      addRow('Recommendation Label', recommendation.label);
      addRow('Recommendation Reason', recommendation.reason);
      addRow('Recommendation Monthly Cost', recommendation.monthlyCost);
      addRow('Recommendation Requires Review', recommendation.requiresReview);
      addRow('Cost Leader', recommendation.costLeader);
      addRow('Monthly Savings', this.reportData.analysis.costComparison.selected.monthlySavings);
      recommendation.nextSteps?.forEach(step => addRow('Next Step', step));
      recommendation.considerations?.forEach(consideration => addRow('Consideration', consideration));
    }
    csvRows.push('');

    // Warnings
    if (this.reportData.analysis.warnings.length > 0) {
      csvRows.push('WARNINGS');
      csvRows.push('Warning');
      this.reportData.analysis.warnings.forEach(warning => {
        addRow(warning);
      });
      csvRows.push('');
    }

    // Recommendations
    csvRows.push('RECOMMENDATIONS');
    csvRows.push('Recommendation');
    this.reportData.analysis.recommendations.forEach(rec => {
      addRow(rec);
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
      paygCost: this.reportData.costBreakdown.payg.total != null ? `$${this.reportData.costBreakdown.payg.total}/month` : 'Unavailable',
      recommendation: this.reportData.analysis.recommendationDetails?.label ?? this.reportData.costBreakdown.breakEven.recommendation,
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
    const sharedRecommendation = calculationData.scenarioAnalysis?.recommendationDetails;
    if (sharedRecommendation) {
      return [
        sharedRecommendation.label,
        sharedRecommendation.reason,
        ...(sharedRecommendation.nextSteps ?? []),
        ...(sharedRecommendation.considerations ?? [])
      ].filter(value => value != null && value !== '');
    }
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
