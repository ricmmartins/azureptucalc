import { describe, expect, it } from 'vitest';
import enhancedConfig from './enhanced_model_config.json';
import externalConfig from './external_pricing_config.json';
import supportedConfig from './ptu_supported_models.json';
import { ExportService } from './ExportService.js';

// Microsoft Learn provisioned-throughput-sizing, reviewed 2026-09-14.
const models = [
  ['gpt-5.6-luna', 30000],
  ['gpt-5.6-terra', 3000],
  ['gpt-5.6-sol', 1200],
];

describe.each(models)('%s provisioned throughput', (model, throughput) => {
  it('uses the official input TPM/PTU in every catalog', () => {
    expect(enhancedConfig.models[model].throughput_per_ptu).toBe(throughput);
    expect(externalConfig.modelConfigurations[model].throughput_per_ptu).toBe(throughput);
    expect(supportedConfig.ptu_supported_models[model].throughput_per_ptu).toBe(throughput);
  });

  it('preserves the output weight and deployment sizing constraints', () => {
    expect(enhancedConfig.models[model].output_weight).toBe(6);
    expect(supportedConfig.ptu_supported_models[model].min_ptu).toBe(15);
    for (const [deployment, minPTU, increment] of [
      ['global', 15, 5],
      ['dataZone', 15, 5],
      ['regional', 50, 50],
    ]) {
      const constraints = { min_ptu: minPTU, increment };
      expect(enhancedConfig.models[model].deployments[deployment]).toMatchObject(constraints);
      expect(externalConfig.modelConfigurations[model].deployments[deployment]).toMatchObject(constraints);
    }
  });

  it('uses the corrected throughput in exported analysis', () => {
    const service = new ExportService();
    const capacity = throughput * 50;
    const report = service.generateReport({
      model,
      deployment: 'global',
      ptuCount: 50,
      throughputNeeded: capacity / 2,
      ptuCostCalculation: { hourly: 50, monthly: 13000, yearly: 132000 },
      paygCostCalculation: { total: 0 },
      breakEvenAnalysis: {},
    });

    expect(service.getModelThroughputPerPTU(model)).toBe(throughput);
    expect(report.analysis.throughputAnalysis.ptuThroughput).toBe(capacity);
    expect(report.analysis.throughputAnalysis.utilizationRate).toBe('50.0');
    expect(JSON.parse(service.exportAsJSON()).analysis.throughputAnalysis.ptuThroughput).toBe(capacity);
  });
});

it('keeps throughput consistent for all supported models', () => {
  for (const [model, config] of Object.entries(supportedConfig.ptu_supported_models)) {
    expect(enhancedConfig.models[model].throughput_per_ptu).toBe(config.throughput_per_ptu);
    expect(externalConfig.modelConfigurations[model].throughput_per_ptu).toBe(config.throughput_per_ptu);
  }
});
