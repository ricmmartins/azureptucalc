import React, { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import { AlertTriangle, Gauge, Info, Layers3, Sparkles, TrendingUp, Zap } from 'lucide-react';

const MODEL_OPTIONS = {
  'gpt-5.5': { label: 'gpt-5.5', throughputPerPTU: 1200 },
  'gpt-5.4': { label: 'gpt-5.4', throughputPerPTU: 2400 },
  'gpt-4.1': { label: 'gpt-4.1', throughputPerPTU: 3000 },
  'gpt-4o': { label: 'gpt-4o', throughputPerPTU: 2500 },
  'gpt-4o-mini': { label: 'gpt-4o-mini', throughputPerPTU: 7900 }
};

const LIMITS = {
  promptTokens: { min: 50, max: 128000 },
  maxTokens: { min: 1, max: 128000 },
  ptuCount: { min: 15, max: 1000 }
};

const DEFAULTS = {
  promptTokens: 500,
  maxTokens: 4096,
  actualOutputTokens: 200,
  ptuCount: 50,
  model: 'gpt-4o-mini'
};

const BUFFER_RATIO = 0.2;
const MIN_BUFFER = 64;

const clampValue = (value, min, max, fallback = min) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
};

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(value || 0)));

const formatCompact = (value) => new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
}).format(Math.max(0, value || 0));

const formatPercent = (value) => `${Math.max(0, value || 0).toFixed(1)}%`;

const formatMultiplier = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0x';
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)}x`;
};

const NumericSliderInput = ({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  step = 1,
  disabled = false
}) => {
  const handleInputChange = (event) => {
    if (event.target.value === '') {
      return;
    }

    onChange(Number(event.target.value));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="leading-snug">{label}</Label>
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleInputChange}
          className="w-32 text-right"
        />
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([nextValue]) => onChange(nextValue)}
      />
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{hint}</span>
        <span>{formatNumber(min)} - {formatNumber(max)}</span>
      </div>
    </div>
  );
};

const MetricCard = ({
  title,
  value,
  description,
  icon,
  tone = 'default',
  badge
}) => {
  const IconComponent = icon;
  const toneClasses = {
    default: 'border-border',
    current: 'border-amber-200 bg-amber-50/50',
    optimal: 'border-emerald-200 bg-emerald-50/60',
    accent: 'border-sky-200 bg-sky-50/60'
  };

  return (
    <Card className={cn('gap-4', toneClasses[tone] || toneClasses.default)}>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="rounded-full bg-background/80 p-2 shadow-sm">
            <IconComponent className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-4xl font-semibold tracking-tight">{formatNumber(value)}</div>
        {badge}
      </CardContent>
    </Card>
  );
};

/**
 * Props (all optional - component works standalone with defaults)
 * { ptuCount, selectedModel, throughputPerPTU }
 */
export const MaxTokensOptimizer = ({
  ptuCount,
  selectedModel,
  throughputPerPTU
}) => {
  const [promptTokens, setPromptTokens] = useState(DEFAULTS.promptTokens);
  const [maxTokens, setMaxTokens] = useState(DEFAULTS.maxTokens);
  const [actualOutputTokens, setActualOutputTokens] = useState(DEFAULTS.actualOutputTokens);
  const [localPtuCount, setLocalPtuCount] = useState(
    clampValue(ptuCount ?? DEFAULTS.ptuCount, LIMITS.ptuCount.min, LIMITS.ptuCount.max, DEFAULTS.ptuCount)
  );
  const [localModel, setLocalModel] = useState(
    MODEL_OPTIONS[selectedModel] ? selectedModel : DEFAULTS.model
  );

  useEffect(() => {
    if (typeof ptuCount === 'number') {
      setLocalPtuCount(clampValue(ptuCount, LIMITS.ptuCount.min, LIMITS.ptuCount.max, DEFAULTS.ptuCount));
    }
  }, [ptuCount]);

  useEffect(() => {
    if (selectedModel && MODEL_OPTIONS[selectedModel]) {
      setLocalModel(selectedModel);
    }
  }, [selectedModel]);

  const effectiveMaxForOutput = Math.max(LIMITS.maxTokens.min, maxTokens);

  useEffect(() => {
    setActualOutputTokens((currentValue) =>
      clampValue(currentValue, LIMITS.maxTokens.min, effectiveMaxForOutput, DEFAULTS.actualOutputTokens)
    );
  }, [effectiveMaxForOutput]);

  const effectiveThroughputPerPTU = useMemo(() => {
    if (typeof throughputPerPTU === 'number' && throughputPerPTU > 0) {
      return throughputPerPTU;
    }

    return MODEL_OPTIONS[localModel]?.throughputPerPTU || MODEL_OPTIONS[DEFAULTS.model].throughputPerPTU;
  }, [localModel, throughputPerPTU]);

  const calculations = useMemo(() => {
    const totalCapacityTPM = localPtuCount * effectiveThroughputPerPTU;
    const reservedPerRequest = promptTokens + maxTokens;
    const actualPerRequest = promptTokens + actualOutputTokens;
    const estimatedConcurrency = Math.floor(totalCapacityTPM / Math.max(1, reservedPerRequest));
    const optimalConcurrency = Math.floor(totalCapacityTPM / Math.max(1, actualPerRequest));
    const wastedCapacityPercent = maxTokens > 0
      ? Math.max(0, ((maxTokens - actualOutputTokens) / maxTokens) * 100)
      : 0;
    const concurrencyGain = Math.max(0, optimalConcurrency - estimatedConcurrency);
    const bufferTokens = Math.max(MIN_BUFFER, Math.ceil(actualOutputTokens * BUFFER_RATIO));
    const recommendedMaxTokens = Math.max(
      actualOutputTokens,
      Math.min(maxTokens, actualOutputTokens + bufferTokens)
    );
    const recommendedConcurrency = Math.floor(
      totalCapacityTPM / Math.max(1, promptTokens + recommendedMaxTokens)
    );
    const actualUtilizationPercent = (actualPerRequest / Math.max(1, reservedPerRequest)) * 100;
    const requestSharePercent = totalCapacityTPM > 0
      ? (reservedPerRequest / totalCapacityTPM) * 100
      : 0;

    return {
      totalCapacityTPM,
      reservedPerRequest,
      actualPerRequest,
      estimatedConcurrency,
      optimalConcurrency,
      wastedCapacityPercent,
      concurrencyGain,
      bufferTokens,
      recommendedMaxTokens,
      recommendedConcurrency,
      actualUtilizationPercent,
      requestSharePercent
    };
  }, [actualOutputTokens, effectiveThroughputPerPTU, localPtuCount, maxTokens, promptTokens]);

  const modelLocked = Boolean(selectedModel) || typeof throughputPerPTU === 'number';
  const currentModelLabel = MODEL_OPTIONS[localModel]?.label || localModel;
  const wasteTokens = Math.max(0, calculations.reservedPerRequest - calculations.actualPerRequest);
  const concurrencyMultiplier = calculations.estimatedConcurrency > 0
    ? calculations.recommendedConcurrency / calculations.estimatedConcurrency
    : 0;
  const showRecommendation = calculations.recommendedMaxTokens < maxTokens;
  const showHighRiskWarning = calculations.requestSharePercent > 80;

  const updatePromptTokens = (nextValue) => {
    setPromptTokens(
      clampValue(nextValue, LIMITS.promptTokens.min, LIMITS.promptTokens.max, DEFAULTS.promptTokens)
    );
  };

  const updateMaxTokens = (nextValue) => {
    const nextMaxTokens = clampValue(nextValue, LIMITS.maxTokens.min, LIMITS.maxTokens.max, DEFAULTS.maxTokens);
    setMaxTokens(nextMaxTokens);
    setActualOutputTokens((currentValue) =>
      clampValue(currentValue, LIMITS.maxTokens.min, nextMaxTokens, DEFAULTS.actualOutputTokens)
    );
  };

  const updateActualOutputTokens = (nextValue) => {
    setActualOutputTokens(
      clampValue(nextValue, LIMITS.maxTokens.min, maxTokens, DEFAULTS.actualOutputTokens)
    );
  };

  const updatePtuCount = (nextValue) => {
    setLocalPtuCount(
      clampValue(nextValue, LIMITS.ptuCount.min, LIMITS.ptuCount.max, DEFAULTS.ptuCount)
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Max Tokens &amp; Concurrency Estimator</CardTitle>
              </div>
              <CardDescription className="max-w-3xl">
                PTUs use a leaky-bucket reservation model. Every request reserves prompt tokens plus max_tokens up front, so oversized limits shrink concurrency and trigger avoidable 429s.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{currentModelLabel}</Badge>
              <Badge variant="outline">{formatCompact(calculations.totalCapacityTPM)} TPM deployed</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Estimated Concurrent Requests"
          description="What fits today with the current max_tokens reservation."
          value={calculations.estimatedConcurrency}
          icon={Layers3}
          tone="current"
          badge={
            <Badge variant="outline">
              Reserved/request: {formatNumber(calculations.reservedPerRequest)} tokens
            </Badge>
          }
        />
        <MetricCard
          title="Optimal Concurrent Requests"
          description="Best-case concurrency if max_tokens matches observed output."
          value={calculations.optimalConcurrency}
          icon={TrendingUp}
          tone="optimal"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              +{formatNumber(calculations.concurrencyGain)} concurrent requests
            </Badge>
          }
        />
        <MetricCard
          title="Wasted max_tokens Capacity"
          description="Reserved output headroom that the average request never uses."
          value={Math.round(calculations.wastedCapacityPercent)}
          icon={Zap}
          tone="accent"
          badge={
            <Badge variant="outline">
              Waste/request: {formatNumber(wasteTokens)} tokens
            </Badge>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>
              Tune the request shape that is driving your PTU deployment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <NumericSliderInput
                label="Average prompt tokens per request"
                hint="System reserves these tokens every time."
                value={promptTokens}
                min={LIMITS.promptTokens.min}
                max={LIMITS.promptTokens.max}
                onChange={updatePromptTokens}
              />
              <NumericSliderInput
                label="Current max_tokens setting"
                hint="The upper bound that gets reserved up front."
                value={maxTokens}
                min={LIMITS.maxTokens.min}
                max={LIMITS.maxTokens.max}
                onChange={updateMaxTokens}
              />
              <NumericSliderInput
                label="Actual average output tokens"
                hint="What the model usually emits in practice."
                value={actualOutputTokens}
                min={LIMITS.maxTokens.min}
                max={maxTokens}
                onChange={updateActualOutputTokens}
              />
              <NumericSliderInput
                label="Number of PTUs deployed"
                hint="More PTUs increase the total TPM bucket."
                value={localPtuCount}
                min={LIMITS.ptuCount.min}
                max={LIMITS.ptuCount.max}
                onChange={updatePtuCount}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>Model throughput</Label>
                <Badge variant="outline">{formatNumber(effectiveThroughputPerPTU)} TPM / PTU</Badge>
              </div>
              <Select value={localModel} onValueChange={setLocalModel} disabled={modelLocked}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MODEL_OPTIONS).map(([modelName, option]) => (
                    <SelectItem key={modelName} value={modelName}>
                      {option.label} · {formatNumber(option.throughputPerPTU)} TPM/PTU
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {modelLocked
                  ? 'Model throughput is being supplied by the parent component.'
                  : 'Standalone mode uses the dropdown values above for throughput_per_ptu.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Sparkles className="h-4 w-4" />
              Recommendation
            </CardTitle>
            <CardDescription className="text-emerald-800/80">
              Right-size the reservation, not just the deployment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-white/80 p-4 text-sm text-emerald-950">
              {showRecommendation ? (
                <p className="font-medium">
                  Reducing max_tokens from {formatNumber(maxTokens)} → {formatNumber(calculations.recommendedMaxTokens)} unlocks {formatMultiplier(concurrencyMultiplier)} more concurrency.
                </p>
              ) : (
                <p className="font-medium">
                  Your current max_tokens setting is already close to right-sized for this average output.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-lg border bg-background p-3">
                <p className="text-muted-foreground">Practical right-sized target</p>
                <p className="mt-1 text-2xl font-semibold">{formatNumber(calculations.recommendedMaxTokens)}</p>
                <p className="text-xs text-muted-foreground">
                  avg output {formatNumber(actualOutputTokens)} + buffer {formatNumber(calculations.bufferTokens)}
                </p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-muted-foreground">Concurrency with that target</p>
                <p className="mt-1 text-2xl font-semibold">{formatNumber(calculations.recommendedConcurrency)}</p>
                <p className="text-xs text-muted-foreground">
                  vs {formatNumber(calculations.estimatedConcurrency)} today
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border bg-background p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Total capacity</span>
                <span className="font-medium">
                  {formatNumber(localPtuCount)} × {formatNumber(effectiveThroughputPerPTU)} = {formatCompact(calculations.totalCapacityTPM)} TPM
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Current reservation</span>
                <span className="font-medium">
                  {formatNumber(promptTokens)} + {formatNumber(maxTokens)} = {formatNumber(calculations.reservedPerRequest)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Actual usage</span>
                <span className="font-medium">
                  {formatNumber(promptTokens)} + {formatNumber(actualOutputTokens)} = {formatNumber(calculations.actualPerRequest)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reservation footprint per request</CardTitle>
            <CardDescription>
              Green is useful work. Amber is max_tokens headroom that still blocks concurrency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-4 overflow-hidden rounded-full bg-muted">
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${Math.min(100, calculations.actualUtilizationPercent)}%` }}
              />
              <div
                className="bg-amber-300 transition-all"
                style={{ width: `${Math.max(0, 100 - calculations.actualUtilizationPercent)}%` }}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-sm font-medium text-emerald-900">Actual tokens used</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-950">
                  {formatNumber(calculations.actualPerRequest)}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-900">Reserved but unused</p>
                <p className="mt-1 text-2xl font-semibold text-amber-950">
                  {formatNumber(wasteTokens)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-900">Useful reservation rate</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {formatPercent(calculations.actualUtilizationPercent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak capacity risk</CardTitle>
            <CardDescription>
              How much of the deployed TPM bucket one request reserves.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Single-request bucket share</span>
                <span className="font-medium">{formatPercent(calculations.requestSharePercent)}</span>
              </div>
              <Progress value={Math.min(100, calculations.requestSharePercent)} className="h-3" />
            </div>

            {showHighRiskWarning && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-950 [&>svg]:text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>High 429 risk at peak</AlertTitle>
                <AlertDescription className="text-amber-900">
                  Each request is reserving most of the deployment bucket before generation begins.
                </AlertDescription>
              </Alert>
            )}

            {!showHighRiskWarning && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Healthy headroom</p>
                <p className="text-muted-foreground">
                  More requests can fit concurrently before the PTU bucket fills up.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Why this causes 429s
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-medium">PTUs are throughput, not concurrency.</p>
              <p className="mt-2 text-muted-foreground">
                A larger TPM bucket helps, but each request still needs enough reserved capacity to enter the bucket.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-medium">The system reserves prompt_tokens + max_tokens per request.</p>
              <p className="mt-2 text-muted-foreground">
                The reservation happens before tokens are generated, so max_tokens acts like an up-front concurrency tax.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-medium">Oversized max_tokens wastes capacity.</p>
              <p className="mt-2 text-muted-foreground">
                Right-sizing max_tokens to observed output plus a buffer often fixes unexpected 429s faster than adding PTUs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaxTokensOptimizer;
