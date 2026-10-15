import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildPtuSizingKql, OUTPUT_TOKEN_METRICS } from './ptuSizingKql.js';

describe('PTU sizing KQL', () => {
  const query = buildPtuSizingKql({
    outputWeight: 6,
    throughputPerPTU: 1200,
    modelComment: '// Model: gpt-5.6-sol'
  });

  it('recognizes current and legacy output-token metric aliases', () => {
    expect(OUTPUT_TOKEN_METRICS).toEqual([
      'OutputTokens',
      'GeneratedTokens',
      'GeneratedCompletionTokens',
      'ProcessedCompletionTokens'
    ]);
    for (const metric of OUTPUT_TOKEN_METRICS) {
      expect(query).toContain(`"${metric}"`);
    }
  });

  it('collapses aliases before calculating output TPM', () => {
    expect(query).toContain('MetricTokens = sum(Total)');
    expect(query).toContain('OutputTokens = coalesce(maxif(MetricTokens');
    expect(query).not.toContain('sumif(Total, IsOutput)');
  });

  it('keeps model-specific sizing parameters', () => {
    expect(query).toContain('let outputWeight = 6;');
    expect(query).toContain('let throughputPerPTU = 1200;');
    expect(query).toContain('NormalizedTPM = InputTokens + (outputWeight * OutputTokens)');
  });

  it('is shared by the main calculator and wizard', () => {
    const app = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
    const wizard = readFileSync(new URL('./components/WizardMode.jsx', import.meta.url), 'utf8');
    expect(app).toContain("from './ptuSizingKql.js'");
    expect(wizard).toContain("from '../ptuSizingKql.js'");
    expect(app).not.toContain('GeneratedCompletionTokens');
    expect(wizard).not.toContain('GeneratedCompletionTokens');
  });
});
