import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info, TrendingDown, Zap } from 'lucide-react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatNumber = (value, digits = 0) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

const deriveUsagePattern = (burstRatio) => {
  if (burstRatio > 5) return 'Extreme spikes';
  if (burstRatio > 3) return 'Highly bursty';
  if (burstRatio > 2) return 'Bursty';
  if (burstRatio > 1.5) return 'Mild bursts';
  return 'Steady';
};

const getRiskMeta = (riskScore) => {
  if (riskScore <= 25) {
    return {
      label: 'Low Risk',
      badgeClassName: 'bg-emerald-100 text-emerald-800',
      ringColor: '#10b981',
      panelClassName: 'border-emerald-200 bg-emerald-50/70',
      textClassName: 'text-emerald-700',
    };
  }

  if (riskScore <= 50) {
    return {
      label: 'Moderate Risk',
      badgeClassName: 'bg-yellow-100 text-yellow-800',
      ringColor: '#eab308',
      panelClassName: 'border-yellow-200 bg-yellow-50/70',
      textClassName: 'text-yellow-700',
    };
  }

  if (riskScore <= 75) {
    return {
      label: 'High Risk',
      badgeClassName: 'bg-orange-100 text-orange-800',
      ringColor: '#f97316',
      panelClassName: 'border-orange-200 bg-orange-50/70',
      textClassName: 'text-orange-700',
    };
  }

  return {
    label: 'Critical Risk',
    badgeClassName: 'bg-red-100 text-red-800',
    ringColor: '#ef4444',
    panelClassName: 'border-red-200 bg-red-50/70',
    textClassName: 'text-red-700',
  };
};

const calculateRisk = ({
  ptuCount,
  tokensPerPTU,
  p99TPM,
  maxTokens,
  actualOutputTokens,
  burstRatio,
  hasRetryLogic,
  hasSpillover,
}) => {
  const effectiveCapacity = Math.max(0, ptuCount * tokensPerPTU);
  const utilizationAtPeak =
    effectiveCapacity === 0 ? (p99TPM > 0 ? Number.POSITIVE_INFINITY : 0) : p99TPM / effectiveCapacity;
  const maxTokensOversize = maxTokens > 0 ? (maxTokens - actualOutputTokens) / maxTokens : 0;

  let utilizationRisk = 0;
  if (utilizationAtPeak > 1.0) utilizationRisk = 40;
  else if (utilizationAtPeak > 0.8) utilizationRisk = 30;
  else if (utilizationAtPeak > 0.6) utilizationRisk = 15;

  let maxTokensRisk = 0;
  if (maxTokensOversize > 0.8) maxTokensRisk = 25;
  else if (maxTokensOversize > 0.5) maxTokensRisk = 15;
  else if (maxTokensOversize > 0.2) maxTokensRisk = 5;

  let burstRisk = 0;
  if (burstRatio > 5) burstRisk = 20;
  else if (burstRatio > 3) burstRisk = 15;
  else if (burstRatio > 2) burstRisk = 10;

  const retryCredit = hasRetryLogic ? 10 : 0;
  const spilloverCredit = hasSpillover ? 15 : 0;

  const riskScore = clamp(utilizationRisk + maxTokensRisk + burstRisk - retryCredit - spilloverCredit, 0, 100);

  return {
    riskScore,
    utilizationAtPeak,
    maxTokensOversize,
    utilizationRisk,
    maxTokensRisk,
    burstRisk,
    retryCredit,
    spilloverCredit,
    effectiveCapacity,
  };
};

const ThrottlingAdvisor = ({
  ptuCount = 4,
  tokensPerPTU = 30000,
  avgTPM = 60000,
  p99TPM = 120000,
  maxTokens = 4000,
  actualOutputTokens = 1800,
  promptTokens = 1200,
  burstRatio: burstRatioProp,
  hasRetryLogic = false,
  hasSpillover = false,
  usagePattern,
}) => {
  const safePTUCount = Math.max(0, toNumber(ptuCount, 4));
  const safeTokensPerPTU = Math.max(0, toNumber(tokensPerPTU, 30000));
  const safeAvgTPM = Math.max(0, toNumber(avgTPM, 60000));
  const safeP99TPM = Math.max(0, toNumber(p99TPM, 120000));
  const safeMaxTokens = Math.max(0, toNumber(maxTokens, 4000));
  const safeActualOutputTokens = Math.max(0, toNumber(actualOutputTokens, 1800));
  const safePromptTokens = Math.max(0, toNumber(promptTokens, 1200));
  const calculatedBurstRatio = safeAvgTPM > 0 ? safeP99TPM / safeAvgTPM : 1;
  const safeBurstRatio = Math.max(
    1,
    toNumber(
      burstRatioProp,
      Number.isFinite(calculatedBurstRatio) && calculatedBurstRatio > 0 ? calculatedBurstRatio : 1
    )
  );

  const recommendedMaxTokens =
    safeActualOutputTokens > 0 ? Math.max(1, Math.ceil(safeActualOutputTokens * 1.2)) : safeMaxTokens;
  const capacityFreedPct =
    safeMaxTokens > 0 ? clamp(((safeMaxTokens - recommendedMaxTokens) / safeMaxTokens) * 100, 0, 100) : 0;
  const resolvedUsagePattern = usagePattern || deriveUsagePattern(safeBurstRatio);
  const recommendedHeadroomPTUs =
    safeTokensPerPTU > 0 ? Math.max(safePTUCount, Math.ceil(safeP99TPM / (safeTokensPerPTU * 0.8 || 1))) : safePTUCount;

  const currentRisk = calculateRisk({
    ptuCount: safePTUCount,
    tokensPerPTU: safeTokensPerPTU,
    p99TPM: safeP99TPM,
    maxTokens: safeMaxTokens,
    actualOutputTokens: safeActualOutputTokens,
    burstRatio: safeBurstRatio,
    hasRetryLogic,
    hasSpillover,
  });

  const riskMeta = getRiskMeta(currentRisk.riskScore);
  const totalRequestTokens = safePromptTokens + safeActualOutputTokens;
  const headroomPct = clamp((1 - currentRisk.utilizationAtPeak) * 100, -999, 100);

  const rightSizeAddressed = currentRisk.maxTokensOversize <= 0.2 || safeMaxTokens <= recommendedMaxTokens;
  const utilizationAddressed = currentRisk.utilizationAtPeak <= 0.8;
  const burstAddressed = safeBurstRatio <= 3;

  const checklistItems = [
    {
      title: 'Right-size max_tokens',
      addressed: rightSizeAddressed,
      description: `Currently ${formatNumber(safeMaxTokens)}, actual output avg is ${formatNumber(safeActualOutputTokens)}.`,
      impact: `Reducing to ${formatNumber(recommendedMaxTokens)} would free ~${formatNumber(capacityFreedPct)}% capacity`,
    },
    {
      title: 'Implement retry with backoff',
      addressed: hasRetryLogic,
      description: hasRetryLogic ? 'Configured ✅' : 'Not detected ⚠️',
      impact: 'Absorbs transient 429s, prevents cascade failures',
    },
    {
      title: 'Enable spillover',
      addressed: hasSpillover,
      description: hasSpillover ? 'Active ✅' : 'Not configured ⚠️',
      impact: 'Burst traffic routes to PayGo/Priority Processing automatically',
    },
    {
      title: 'Utilization headroom',
      addressed: utilizationAddressed,
      description: `Currently ${formatNumber(currentRisk.utilizationAtPeak * 100, 1)}% at peak`,
      impact: 'Recommend staying below 80% for burst absorption',
    },
    {
      title: 'Burst pattern',
      addressed: burstAddressed,
      description: `${formatNumber(safeBurstRatio, 1)}x burst ratio (${resolvedUsagePattern})`,
      impact: safeBurstRatio > 3 ? 'Consider Priority Processing spillover' : 'Within normal range',
    },
  ];

  const actionCandidates = [
    {
      key: 'spillover',
      title: 'Enable spillover for overflow bursts',
      needed: !hasSpillover,
      detail: 'Route overflow TPM to PayGo or Priority Processing instead of hard-failing on the PTU deployment.',
      estimate: calculateRisk({
        ptuCount: safePTUCount,
        tokensPerPTU: safeTokensPerPTU,
        p99TPM: safeP99TPM,
        maxTokens: safeMaxTokens,
        actualOutputTokens: safeActualOutputTokens,
        burstRatio: safeBurstRatio,
        hasRetryLogic,
        hasSpillover: true,
      }).riskScore,
      icon: Zap,
    },
    {
      key: 'retry',
      title: 'Implement retry with exponential backoff',
      needed: !hasRetryLogic,
      detail: 'Retries absorb transient throttles and keep one 429 from turning into a retry storm.',
      estimate: calculateRisk({
        ptuCount: safePTUCount,
        tokensPerPTU: safeTokensPerPTU,
        p99TPM: safeP99TPM,
        maxTokens: safeMaxTokens,
        actualOutputTokens: safeActualOutputTokens,
        burstRatio: safeBurstRatio,
        hasRetryLogic: true,
        hasSpillover,
      }).riskScore,
      icon: Shield,
    },
    {
      key: 'maxTokens',
      title: `Reduce max_tokens toward ${formatNumber(recommendedMaxTokens)}`,
      needed: !rightSizeAddressed && safeActualOutputTokens > 0,
      detail: `Your average output is ${formatNumber(safeActualOutputTokens)} tokens; trimming the response budget reduces reserved throughput per call.`,
      estimate: calculateRisk({
        ptuCount: safePTUCount,
        tokensPerPTU: safeTokensPerPTU,
        p99TPM: safeP99TPM,
        maxTokens: recommendedMaxTokens,
        actualOutputTokens: safeActualOutputTokens,
        burstRatio: safeBurstRatio,
        hasRetryLogic,
        hasSpillover,
      }).riskScore,
      icon: TrendingDown,
    },
    {
      key: 'headroom',
      title: `Add PTU headroom to at least ${formatNumber(recommendedHeadroomPTUs)} PTUs`,
      needed: !utilizationAddressed && safeTokensPerPTU > 0,
      detail: 'Keep peak utilization below 80% so the deployment can absorb short bursts without saturating.',
      estimate: calculateRisk({
        ptuCount: recommendedHeadroomPTUs,
        tokensPerPTU: safeTokensPerPTU,
        p99TPM: safeP99TPM,
        maxTokens: safeMaxTokens,
        actualOutputTokens: safeActualOutputTokens,
        burstRatio: safeBurstRatio,
        hasRetryLogic,
        hasSpillover,
      }).riskScore,
      icon: AlertTriangle,
    },
    {
      key: 'burst',
      title: 'Smooth burst patterns or reserve Priority capacity',
      needed: !burstAddressed,
      detail: 'Queue, batch, or spill the sharpest spikes so peak TPM lands closer to your steady-state rate.',
      estimate: calculateRisk({
        ptuCount: safePTUCount,
        tokensPerPTU: safeTokensPerPTU,
        p99TPM: safeP99TPM,
        maxTokens: safeMaxTokens,
        actualOutputTokens: safeActualOutputTokens,
        burstRatio: Math.min(safeBurstRatio, 2.5),
        hasRetryLogic,
        hasSpillover,
      }).riskScore,
      icon: Zap,
    },
  ]
    .map((item) => ({
      ...item,
      reduction: clamp(currentRisk.riskScore - item.estimate, 0, 100),
    }))
    .filter((item) => item.needed)
    .sort((left, right) => right.reduction - left.reduction);

  const gaugeStyle = {
    background: `conic-gradient(${riskMeta.ringColor} ${currentRisk.riskScore}%, rgb(226 232 240) 0)`,
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`border-b ${riskMeta.panelClassName}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${riskMeta.textClassName}`} />
              <CardTitle className="text-xl">429 Risk Score &amp; Throttling Advisor</CardTitle>
            </div>
            <CardDescription>
              Evaluate peak PTU saturation risk and prioritize the fastest throttling mitigations.
            </CardDescription>
          </div>
          <Badge className={riskMeta.badgeClassName}>{riskMeta.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="flex flex-col items-center rounded-2xl border border-border bg-muted/30 p-6 text-center">
              <div
                className="relative flex h-48 w-48 items-center justify-center rounded-full"
                style={gaugeStyle}
                role="img"
                aria-label={`429 risk score ${currentRisk.riskScore} out of 100`}
              >
                <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-background shadow-sm">
                  <span className="text-4xl font-bold">{formatNumber(currentRisk.riskScore)}</span>
                  <span className={`text-sm font-medium ${riskMeta.textClassName}`}>{riskMeta.label}</span>
                </div>
              </div>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Peak utilization, burstiness, and oversized response budgets all contribute to 429 probability.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-xl border bg-background p-4">
                <div className="text-sm text-muted-foreground">Peak utilization</div>
                <div className="mt-1 text-2xl font-semibold">
                  {formatNumber(currentRisk.utilizationAtPeak * 100, 1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {headroomPct >= 0
                    ? `${formatNumber(headroomPct, 1)}% remaining headroom`
                    : `${formatNumber(Math.abs(headroomPct), 1)}% over reserved throughput`}
                </div>
              </div>

              <div className="rounded-xl border bg-background p-4">
                <div className="text-sm text-muted-foreground">Reserved throughput</div>
                <div className="mt-1 text-2xl font-semibold">{formatNumber(currentRisk.effectiveCapacity)}</div>
                <div className="text-xs text-muted-foreground">tokens/min across {formatNumber(safePTUCount)} PTUs</div>
              </div>

              <div className="rounded-xl border bg-background p-4">
                <div className="text-sm text-muted-foreground">Average request size</div>
                <div className="mt-1 text-2xl font-semibold">{formatNumber(totalRequestTokens)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(safePromptTokens)} prompt + {formatNumber(safeActualOutputTokens)} output tokens
                </div>
              </div>

              <div className="rounded-xl border bg-background p-4">
                <div className="text-sm text-muted-foreground">Burst ratio</div>
                <div className="mt-1 text-2xl font-semibold">{formatNumber(safeBurstRatio, 1)}x</div>
                <div className="text-xs text-muted-foreground">{resolvedUsagePattern}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-background p-4">
                <div className="text-sm text-muted-foreground">Utilization risk</div>
                <div className="mt-1 text-2xl font-semibold">{formatNumber(currentRisk.utilizationRisk)}</div>
                <div className="text-xs text-muted-foreground">of 40 possible points</div>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <div className="text-sm text-muted-foreground">max_tokens risk</div>
                <div className="mt-1 text-2xl font-semibold">{formatNumber(currentRisk.maxTokensRisk)}</div>
                <div className="text-xs text-muted-foreground">of 25 possible points</div>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <div className="text-sm text-muted-foreground">Burst risk</div>
                <div className="mt-1 text-2xl font-semibold">{formatNumber(currentRisk.burstRisk)}</div>
                <div className="text-xs text-muted-foreground">
                  Credits: -{formatNumber(currentRisk.retryCredit + currentRisk.spilloverCredit)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">How to interpret 429s</h3>
                  <p className="mt-1 text-sm leading-6 text-blue-900/80">
                    PTUs are a throughput construct, not a concurrency guarantee. Your deployment can be saturated by a
                    small number of concurrent requests if prompts are large, max_tokens is oversized, or traffic is
                    bursty. A 429 does not necessarily mean your deployment is misconfigured.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-background">
              <div className="border-b px-5 py-4">
                <h3 className="font-semibold">Mitigation checklist</h3>
                <p className="text-sm text-muted-foreground">Confirm which throttling controls are already in place.</p>
              </div>
              <div className="divide-y">
                {checklistItems.map((item) => {
                  const StatusIcon = item.addressed ? CheckCircle : XCircle;
                  return (
                    <div key={item.title} className="flex gap-4 px-5 py-4">
                      <div className="pt-0.5">
                        <StatusIcon
                          className={`h-5 w-5 ${item.addressed ? 'text-emerald-600' : 'text-amber-500'}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="font-medium">{item.title}</div>
                          <Badge className={item.addressed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                            {item.addressed ? 'Addressed ✅' : 'Needs attention ⚠️'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        <p className="mt-2 text-sm">{item.impact}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border bg-background">
              <div className="border-b px-5 py-4">
                <h3 className="font-semibold">Priority action plan</h3>
                <p className="text-sm text-muted-foreground">Ordered by estimated risk reduction impact.</p>
              </div>
              <div className="divide-y">
                {actionCandidates.length > 0 ? (
                  actionCandidates.map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={item.key} className="flex gap-4 px-5 py-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                          <ItemIcon className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="text-sm text-muted-foreground">Priority {index + 1}</div>
                              <div className="font-medium">{item.title}</div>
                            </div>
                            <Badge className="bg-slate-100 text-slate-800">
                              Estimated risk after fix: {formatNumber(item.estimate)}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-sm">
                            <Badge className="bg-red-100 text-red-800">Risk reduction: {formatNumber(item.reduction)}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex gap-3 px-5 py-5">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="font-medium">Current mitigations are in place</div>
                      <p className="text-sm text-muted-foreground">
                        No high-impact fixes are outstanding based on the current inputs. Keep monitoring peak TPM and
                        response token growth.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { ThrottlingAdvisor };
export default ThrottlingAdvisor;
