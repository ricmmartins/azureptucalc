export const OUTPUT_TOKEN_METRICS = [
  'OutputTokens',
  'GeneratedTokens',
  'GeneratedCompletionTokens',
  'ProcessedCompletionTokens'
];

export function buildPtuSizingKql({
  outputWeight,
  throughputPerPTU,
  modelComment,
  detailedComments = false
}) {
  const outputMetricList = OUTPUT_TOKEN_METRICS.map(metric => `"${metric}"`).join(', ');
  const windowDeclaration = detailedComments
    ? 'let window = 1m;              // granularity for burst detection'
    : 'let window = 1m;';
  const percentileDeclaration = detailedComments
    ? 'let p = 0.99;                 // percentile for burst sizing'
    : 'let p = 0.99;';
  const outputWeightDeclaration = detailedComments
    ? `let outputWeight = ${outputWeight};          // model-specific output token weight`
    : `let outputWeight = ${outputWeight};`;
  const throughputDeclaration = detailedComments
    ? `let throughputPerPTU = ${throughputPerPTU};  // input TPM per PTU`
    : `let throughputPerPTU = ${throughputPerPTU};`;

  return `// Output-Weighted Azure OpenAI PTU Sizing Analysis
${modelComment}
${windowDeclaration}
${percentileDeclaration}
${outputWeightDeclaration}
${throughputDeclaration}
AzureMetrics
| where ResourceProvider == "MICROSOFT.COGNITIVESERVICES"
| where TimeGenerated >= ago(7d)
| where MetricName == "ProcessedPromptTokens" or MetricName in (${outputMetricList})
// Aggregate each metric alias first, then use the largest output value per minute.
// This recognizes current and legacy aliases without double-counting duplicate exports.
| summarize MetricTokens = sum(Total) by bin(TimeGenerated, window), MetricName
| summarize
    InputTokens = coalesce(maxif(MetricTokens, MetricName == "ProcessedPromptTokens"), 0.0),
    OutputTokens = coalesce(maxif(MetricTokens, MetricName in (${outputMetricList})), 0.0)
    by TimeGenerated
| extend NormalizedTPM = InputTokens + (outputWeight * OutputTokens)
| summarize
    AvgInputTPM = avg(InputTokens),
    AvgOutputTPM = avg(OutputTokens),
    AvgTPM = avg(NormalizedTPM),
    P99TPM = percentile(NormalizedTPM, p),
    MaxTPM = max(NormalizedTPM)
| extend
    AvgPTU = ceiling(AvgTPM / toreal(throughputPerPTU)),
    P99PTU = ceiling(P99TPM / toreal(throughputPerPTU)),
    MaxPTU = ceiling(MaxTPM / toreal(throughputPerPTU))
| extend RecommendedPTU = max_of(AvgPTU, P99PTU)
| project AvgInputTPM, AvgOutputTPM, AvgTPM, P99TPM, MaxTPM, AvgPTU, P99PTU, MaxPTU, RecommendedPTU`;
}
