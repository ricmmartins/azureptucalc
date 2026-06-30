import React from 'react';
import { Shield, Zap, Server, ArrowRight, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const boxStyles = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700'
};

const nodeStyles = {
  client: boxStyles.blue,
  primary: boxStyles.slate,
  success: boxStyles.emerald,
  warning: boxStyles.amber
};

const links = [
  {
    title: 'Priority Processing',
    href: 'https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/priority-processing'
  },
  {
    title: 'Native Spillover',
    href: 'https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/spillover-traffic-management'
  },
  {
    title: 'APIM AI Gateway',
    href: 'https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities'
  },
  {
    title: 'Sample APIM + ACA LB',
    href: 'https://github.com/Azure-Samples/openai-aca-lb/'
  }
];

const ArchitectureNode = ({ tone, children }) => (
  <div className={`min-w-[118px] rounded-lg border px-3 py-2 text-center text-sm font-medium shadow-sm ${tone}`}>
    {children}
  </div>
);

const InlineArrow = () => <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />;

const FeatureValue = ({ value, supported, tone = 'slate' }) => {
  const toneClasses = {
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    blue: 'text-blue-700',
    slate: 'text-slate-700'
  };

  const Icon = supported === true ? CheckCircle : supported === false ? XCircle : null;
  const iconClassName = supported === true ? 'text-emerald-600' : supported === false ? 'text-amber-600' : '';

  return (
    <span className={`flex items-center gap-2 text-right text-sm font-medium ${toneClasses[tone] || toneClasses.slate}`}>
      {Icon && <Icon className={`h-4 w-4 shrink-0 ${iconClassName}`} />}
      <span>{value}</span>
    </span>
  );
};

const PatternOneDiagram = () => (
  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
    <div className="flex flex-wrap items-center justify-center gap-2">
      <ArchitectureNode tone={nodeStyles.client}>Client</ArchitectureNode>
      <InlineArrow />
      <ArchitectureNode tone={nodeStyles.primary}>PTU Deployment</ArchitectureNode>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3">
      <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-700">
        overflow
      </Badge>
      <InlineArrow />
      <ArchitectureNode tone={nodeStyles.warning}>PayGo Deployment</ArchitectureNode>
    </div>
  </div>
);

const PatternTwoDiagram = () => (
  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
    <div className="flex flex-wrap items-center justify-center gap-2">
      <ArchitectureNode tone={nodeStyles.client}>Client</ArchitectureNode>
      <InlineArrow />
      <ArchitectureNode tone={nodeStyles.primary}>PTU Deployment</ArchitectureNode>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 p-3">
      <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-700">
        overflow
      </Badge>
      <InlineArrow />
      <ArchitectureNode tone={nodeStyles.success}>Priority Processing</ArchitectureNode>
    </div>
  </div>
);

const PatternThreeDiagram = () => (
  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
    <div className="flex flex-wrap items-center justify-center gap-2">
      <ArchitectureNode tone={nodeStyles.client}>Client</ArchitectureNode>
      <InlineArrow />
      <ArchitectureNode tone={nodeStyles.primary}>APIM Gateway</ArchitectureNode>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 p-3">
        <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-700">
          priority
        </Badge>
        <InlineArrow />
        <ArchitectureNode tone={nodeStyles.success}>PTU</ArchitectureNode>
      </div>
      <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3">
        <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-700">
          fallback
        </Badge>
        <InlineArrow />
        <ArchitectureNode tone={nodeStyles.warning}>PayGo</ArchitectureNode>
      </div>
    </div>
  </div>
);

export const SpilloverComparison = ({
  burstRatio = 1,
  isStreamingWorkload = false,
  hasAPIM = false,
  isLatencyCritical = false,
  isMultiTenant = false
}) => {
  const normalizedBurstRatio = Number.isFinite(Number(burstRatio)) ? Number(burstRatio) : 1;

  const recommendationId = (() => {
    if (isStreamingWorkload && isLatencyCritical) {
      return 'priority';
    }

    if (isMultiTenant) {
      return 'apim';
    }

    return 'paygo';
  })();

  const comparisonOptions = [
    {
      id: 'paygo',
      title: 'PTU → PayGo',
      icon: Zap,
      description: 'Native overflow path with the fewest moving parts.',
      bestFor: 'Simple overflow',
      link: links[1].href,
      diagram: <PatternOneDiagram />,
      features: [
        { label: 'Latency SLA', value: 'None', supported: false, tone: 'amber' },
        { label: 'Mid-stream preservation', value: 'No', supported: false, tone: 'amber' },
        { label: 'Setup complexity', value: '⭐ Simple', tone: 'blue' },
        { label: 'Cost model', value: 'Pay-per-token', tone: 'slate' },
        { label: 'Requires APIM', value: 'No', supported: false, tone: 'slate' },
        { label: 'Circuit breaker', value: 'Native', tone: 'blue' },
        { label: 'Multi-backend routing', value: 'No', supported: false, tone: 'amber' },
        { label: 'Best for', value: 'Simple overflow', tone: 'blue' }
      ]
    },
    {
      id: 'priority',
      title: 'PTU → Priority Processing',
      icon: Shield,
      description: 'Native spillover with latency SLA coverage and streaming continuity.',
      bestFor: 'Latency-critical, streaming',
      link: links[0].href,
      diagram: <PatternTwoDiagram />,
      features: [
        { label: 'Latency SLA', value: 'Yes (e.g., GPT-5.5: 99% >100 TPS)', supported: true, tone: 'emerald' },
        { label: 'Mid-stream preservation', value: 'Yes (SSE continues)', supported: true, tone: 'emerald' },
        { label: 'Setup complexity', value: '⭐ Simple', tone: 'blue' },
        { label: 'Cost model', value: 'Pay-per-token (same cost)', tone: 'slate' },
        { label: 'Requires APIM', value: 'No', supported: false, tone: 'slate' },
        { label: 'Circuit breaker', value: 'Native', tone: 'blue' },
        { label: 'Multi-backend routing', value: 'No', supported: false, tone: 'amber' },
        { label: 'Best for', value: 'Latency-critical, streaming', tone: 'blue' }
      ]
    },
    {
      id: 'apim',
      title: 'APIM AI Gateway',
      icon: Server,
      description: 'Gateway-managed routing for advanced policy control and tenant-aware flows.',
      bestFor: 'Multi-tenant, complex routing',
      link: links[2].href,
      diagram: <PatternThreeDiagram />,
      features: [
        { label: 'Latency SLA', value: 'Depends on backend', supported: false, tone: 'amber' },
        { label: 'Mid-stream preservation', value: 'No (retry restarts)', supported: false, tone: 'amber' },
        { label: 'Setup complexity', value: '⭐⭐⭐ Complex', tone: 'amber' },
        { label: 'Cost model', value: 'Pay-per-token + APIM costs', tone: 'slate' },
        { label: 'Requires APIM', value: 'Yes', supported: true, tone: 'blue' },
        { label: 'Circuit breaker', value: 'Manual (policy config)', tone: 'amber' },
        { label: 'Multi-backend routing', value: 'Yes (WRR, header-based)', supported: true, tone: 'emerald' },
        { label: 'Best for', value: 'Multi-tenant, complex routing', tone: 'blue' }
      ]
    }
  ];

  const recommendationDetails = {
    paygo: 'Native PTU to PayGo spillover is the easiest default when you mostly need overflow protection with minimal operational overhead.',
    priority: 'Priority Processing is the best fit for streaming workloads that still need latency guarantees and uninterrupted SSE responses.',
    apim: hasAPIM
      ? 'APIM AI Gateway is a strong fit when you already have gateway infrastructure and need multi-backend routing or tenant-aware policies.'
      : 'APIM AI Gateway is best for multi-tenant or advanced routing patterns, but it requires APIM deployment and policy management first.'
  };

  const recommendationTitle = comparisonOptions.find((option) => option.id === recommendationId)?.title || 'PTU → PayGo';

  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl text-slate-900">Spillover Architecture Comparison</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              Compare the three main Azure OpenAI spillover patterns for PTU capacity bursts and choose the one
              that best matches your workload, latency expectations, and routing complexity.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-800">Recommended: {recommendationTitle}</Badge>
            {recommendationId === 'apim' && !hasAPIM && (
              <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-700">
                APIM setup required
              </Badge>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-green-800">Recommendation</p>
              <p className="mt-1 text-sm text-green-700">{recommendationDetails[recommendationId]}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                Burst ratio: {normalizedBurstRatio.toFixed(1)}x
              </Badge>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                {isStreamingWorkload ? 'Streaming workload' : 'Non-streaming workload'}
              </Badge>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                {isLatencyCritical ? 'Latency critical' : 'Latency flexible'}
              </Badge>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                {hasAPIM ? 'APIM available' : 'No APIM in place'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {comparisonOptions.map((option) => {
            const Icon = option.icon;
            const isRecommended = option.id === recommendationId;

            return (
              <Card
                key={option.id}
                className={`h-full border transition-all ${
                  isRecommended
                    ? 'border-green-500 shadow-lg shadow-green-100'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`rounded-lg p-2 ${
                            isRecommended ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">{option.title}</CardTitle>
                      </div>
                      <CardDescription className="text-sm leading-6">{option.description}</CardDescription>
                    </div>
                    {isRecommended && <Badge className="bg-green-100 text-green-800">Recommended</Badge>}
                  </div>

                  {option.id === 'apim' && (
                    <Badge
                      variant="outline"
                      className={
                        hasAPIM
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-amber-300 bg-amber-100 text-amber-700'
                      }
                    >
                      {hasAPIM ? 'Existing APIM available' : 'Requires APIM setup'}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-5">
                  {option.diagram}

                  <div className="space-y-2">
                    {option.features.map((feature) => (
                      <div
                        key={`${option.id}-${feature.label}`}
                        className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                          {feature.label}
                        </span>
                        <FeatureValue value={feature.value} supported={feature.supported} tone={feature.tone} />
                      </div>
                    ))}
                  </div>

                  <a
                    href={option.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition-colors hover:text-blue-800"
                  >
                    Learn more
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Reference links</h3>
              <p className="text-sm text-slate-600">Product guidance and implementation examples for each pattern.</p>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              Docs
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700"
              >
                <span>{link.title}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpilloverComparison;
