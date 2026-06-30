import { createElement, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Target,
  Zap,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const HOURS_PER_MONTH = 730;

const STEP_CONFIG = [
  { title: 'Request Shape', shortTitle: 'Shape' },
  { title: 'Traffic Pattern', shortTitle: 'Traffic' },
  { title: 'Model & Deployment', shortTitle: 'Model' },
  { title: 'Results & Recommendation', shortTitle: 'Results' },
];

const MODEL_OPTIONS = [
  { value: 'gpt-5.5', label: 'GPT-5.5', throughputPerPTU: 1200 },
  { value: 'gpt-5.4', label: 'GPT-5.4', throughputPerPTU: 2400 },
  { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini', throughputPerPTU: 7900 },
  { value: 'gpt-4.1', label: 'GPT-4.1', throughputPerPTU: 3000 },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', throughputPerPTU: 6000 },
  { value: 'gpt-4o', label: 'GPT-4o', throughputPerPTU: 2500 },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', throughputPerPTU: 7900 },
];

const DEPLOYMENT_OPTIONS = [
  { value: 'global', label: 'Global', minPTU: 15 },
  { value: 'dataZone', label: 'Data Zone', minPTU: 15 },
  { value: 'regional', label: 'Regional', minPTU: 50 },
];

const TRAFFIC_PATTERNS = [
  { value: 'steady', label: 'Steady' },
  { value: 'bursty', label: 'Bursty' },
  { value: 'spiky', label: 'Spiky' },
];

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value || 0);

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatMultiplier = (value) => (value >= 10 ? value.toFixed(0) : value.toFixed(1));

const normalizeModel = (model) => {
  if (!model) {
    return '';
  }

  const matched = MODEL_OPTIONS.find(
    (option) => option.value.toLowerCase() === String(model).toLowerCase(),
  );

  return matched?.value ?? '';
};

const normalizeDeployment = (deployment) => {
  if (!deployment) {
    return '';
  }

  const cleaned = String(deployment).trim().toLowerCase();
  const matched = DEPLOYMENT_OPTIONS.find(
    (option) =>
      option.value.toLowerCase() === cleaned ||
      option.label.toLowerCase() === cleaned ||
      option.label.toLowerCase().replace(/\s+/g, '-') === cleaned,
  );

  return matched?.value ?? '';
};

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  description,
  unit = 'tokens',
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
        </div>
        <Badge variant="outline" className="w-fit text-sm">
          {formatNumber(value)} {unit}
        </Badge>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([nextValue]) => onChange(nextValue)}
      />
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{formatNumber(min)}</span>
        <span>{formatNumber(max)}</span>
      </div>
    </div>
  );
}

function RecommendationCard({
  title,
  subtitle,
  ptus,
  monthlyCost,
  note,
  icon: Icon,
  tone,
  isRecommended,
}) {
  const tones = {
    gray: {
      card: 'border-slate-200 bg-slate-50/80',
      badge: 'bg-slate-100 text-slate-700',
      icon: 'text-slate-600',
    },
    blue: {
      card: 'border-blue-200 bg-blue-50/80',
      badge: 'bg-blue-100 text-blue-700',
      icon: 'text-blue-600',
    },
    green: {
      card: 'border-green-200 bg-green-50/80',
      badge: 'bg-green-100 text-green-700',
      icon: 'text-green-600',
    },
  };

  const style = tones[tone];

  return (
    <Card
      className={cn(
        style.card,
        isRecommended && 'ring-primary/25 border-primary ring-2',
      )}
    >
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {createElement(Icon, { className: cn('h-5 w-5', style.icon) })}
              {title}
            </CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={style.badge}>{ptus} PTUs</Badge>
            {isRecommended ? <Badge>Recommended</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-white/80 p-3">
          <span className="text-sm font-medium">Monthly estimate</span>
          <span className="text-lg font-semibold">{formatCurrency(monthlyCost)}</span>
        </div>
        <p className="text-muted-foreground text-sm">{note}</p>
      </CardContent>
    </Card>
  );
}

export function RightSizeWizard({
  onApply,
  selectedModel,
  selectedDeployment,
  ptuHourlyRate = 2.0,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState(() => ({
    promptTokens: 500,
    maxTokens: 4096,
    actualOutput: 200,
    avgRPM: 10,
    peakRPM: 50,
    trafficPattern: 'bursty',
    model: normalizeModel(selectedModel),
    deployment: normalizeDeployment(selectedDeployment),
    needsLatencySla: 'no',
  }));

  useEffect(() => {
    const nextModel = normalizeModel(selectedModel);
    if (nextModel && nextModel !== wizardData.model) {
      setWizardData((prev) => ({ ...prev, model: nextModel }));
    }
  }, [selectedModel, wizardData.model]);

  useEffect(() => {
    const nextDeployment = normalizeDeployment(selectedDeployment);
    if (nextDeployment && nextDeployment !== wizardData.deployment) {
      setWizardData((prev) => ({ ...prev, deployment: nextDeployment }));
    }
  }, [selectedDeployment, wizardData.deployment]);

  const selectedModelOption = useMemo(
    () => MODEL_OPTIONS.find((option) => option.value === wizardData.model) ?? MODEL_OPTIONS[1],
    [wizardData.model],
  );

  const selectedDeploymentOption = useMemo(
    () =>
      DEPLOYMENT_OPTIONS.find((option) => option.value === wizardData.deployment) ??
      DEPLOYMENT_OPTIONS[0],
    [wizardData.deployment],
  );

  const burstRatio = useMemo(
    () => wizardData.peakRPM / Math.max(wizardData.avgRPM, 1),
    [wizardData.avgRPM, wizardData.peakRPM],
  );

  const maxTokensRatio = useMemo(
    () => wizardData.maxTokens / Math.max(wizardData.actualOutput, 1),
    [wizardData.maxTokens, wizardData.actualOutput],
  );

  const suggestedMaxTokens = useMemo(
    () =>
      Math.min(
        128000,
        Math.max(wizardData.actualOutput, Math.ceil(wizardData.actualOutput * 1.5)),
      ),
    [wizardData.actualOutput],
  );

  const calculations = useMemo(() => {
    const throughputPerPTU = selectedModelOption?.throughputPerPTU ?? 2400;
    const minPTUs = selectedDeploymentOption?.minPTU ?? 15;
    const tokensPerRequest = wizardData.promptTokens + wizardData.maxTokens;
    const actualTokensPerRequest = wizardData.promptTokens + wizardData.actualOutput;
    const peakTPM = wizardData.peakRPM * tokensPerRequest;
    const avgTPM = wizardData.avgRPM * tokensPerRequest;
    const optimizedTPM = wizardData.peakRPM * actualTokensPerRequest;
    const conservativePTUs = Math.max(minPTUs, Math.ceil(peakTPM / throughputPerPTU));
    const basePTUsSpillover = Math.max(minPTUs, Math.ceil(avgTPM / throughputPerPTU));
    const optimizedPTUs = Math.max(minPTUs, Math.ceil(optimizedTPM / throughputPerPTU));

    return {
      throughputPerPTU,
      minPTUs,
      tokensPerRequest,
      actualTokensPerRequest,
      peakTPM,
      avgTPM,
      optimizedTPM,
      conservativePTUs,
      basePTUsSpillover,
      optimizedPTUs,
      conservativeMonthlyCost: conservativePTUs * ptuHourlyRate * HOURS_PER_MONTH,
      spilloverMonthlyCost: basePTUsSpillover * ptuHourlyRate * HOURS_PER_MONTH,
      optimizedMonthlyCost: optimizedPTUs * ptuHourlyRate * HOURS_PER_MONTH,
    };
  }, [ptuHourlyRate, selectedDeploymentOption, selectedModelOption, wizardData]);

  const recommendation = useMemo(() => {
    const guidance = {
      steady: {
        key: 'conservative',
        title: 'Full PTU deployment',
        detail: 'Steady workloads are easiest to reserve outright, so sizing for peak minimizes 429 risk.',
      },
      bursty: {
        key: 'spillover',
        title: 'PTU base with spillover',
        detail: 'Bursty traffic benefits from a right-sized base while PayGo handles occasional surges.',
      },
      spiky: {
        key: 'optimized',
        title: 'Spillover + Priority Processing',
        detail:
          'Spiky demand should trim reserved output, keep a lean PTU base, and use Priority Processing for overflow.',
      },
    };

    return guidance[wizardData.trafficPattern] ?? guidance.bursty;
  }, [wizardData.trafficPattern]);

  const recommendationCards = useMemo(
    () => [
      {
        key: 'conservative',
        title: 'Conservative (no spillover)',
        subtitle: 'Handles peak without 429s',
        ptus: calculations.conservativePTUs,
        monthlyCost: calculations.conservativeMonthlyCost,
        note: 'Best for steady traffic and strict latency control.',
        icon: Target,
        tone: 'gray',
      },
      {
        key: 'spillover',
        title: 'With Spillover',
        subtitle: 'Handles average load, bursts spill to PayGo',
        ptus: calculations.basePTUsSpillover,
        monthlyCost: calculations.spilloverMonthlyCost,
        note: 'Base PTU cost shown; PayGo overflow adds variable spend during bursts.',
        icon: BarChart3,
        tone: 'blue',
      },
      {
        key: 'optimized',
        title: 'Optimized (right-sized max_tokens + spillover)',
        subtitle: 'Best cost/perf when reserved output matches reality',
        ptus: calculations.optimizedPTUs,
        monthlyCost: calculations.optimizedMonthlyCost,
        note: 'Often the lowest PTU floor once max_tokens is aligned to actual output.',
        icon: Zap,
        tone: 'green',
      },
    ],
    [calculations],
  );

  const recommendedCard =
    recommendationCards.find((option) => option.key === recommendation.key) ??
    recommendationCards[1];
  const hasSizingInputs = Boolean(wizardData.model && wizardData.deployment);

  const maxMonthlyCost = Math.max(
    calculations.conservativeMonthlyCost,
    calculations.spilloverMonthlyCost,
    calculations.optimizedMonthlyCost,
  );

  const stepIsValid = useMemo(() => {
    if (currentStep === 0) {
      return (
        wizardData.promptTokens >= 50 &&
        wizardData.maxTokens >= 1 &&
        wizardData.actualOutput >= 1 &&
        wizardData.actualOutput <= wizardData.maxTokens
      );
    }

    if (currentStep === 1) {
      return (
        wizardData.avgRPM >= 1 &&
        wizardData.peakRPM >= wizardData.avgRPM &&
        Boolean(wizardData.trafficPattern)
      );
    }

    if (currentStep === 2) {
      return Boolean(wizardData.model && wizardData.deployment && wizardData.needsLatencySla);
    }

    return true;
  }, [currentStep, wizardData]);

  const progressValue = ((currentStep + 1) / STEP_CONFIG.length) * 100;

  const updateField = (field, value) => {
    setWizardData((prev) => {
      if (field === 'maxTokens') {
        return {
          ...prev,
          maxTokens: value,
          actualOutput: Math.min(prev.actualOutput, value),
        };
      }

      if (field === 'avgRPM') {
        return {
          ...prev,
          avgRPM: value,
          peakRPM: Math.max(prev.peakRPM, value),
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleApply = () => {
    onApply?.({
      ptuCount: recommendedCard.ptus,
      basePTUs: calculations.basePTUsSpillover,
      model: selectedModelOption.value,
      deployment: selectedDeploymentOption.value,
    });
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <SliderField
            label="What's your average prompt size?"
            description="Average prompt tokens reserved for each request."
            value={wizardData.promptTokens}
            min={50}
            max={128000}
            onChange={(value) => updateField('promptTokens', value)}
          />

          <SliderField
            label="What's your max_tokens setting?"
            description="Reserved completion tokens drive PTU capacity, even if they are not always used."
            value={wizardData.maxTokens}
            min={1}
            max={128000}
            onChange={(value) => updateField('maxTokens', value)}
          />

          <SliderField
            label="What's your actual average output?"
            description="Use your real average completion length."
            value={wizardData.actualOutput}
            min={1}
            max={wizardData.maxTokens}
            onChange={(value) => updateField('actualOutput', value)}
          />

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">
              ⚠️ Your max_tokens ({formatNumber(wizardData.maxTokens)}) is{' '}
              {formatMultiplier(maxTokensRatio)}x your actual output (
              {formatNumber(wizardData.actualOutput)}). Consider reducing to{' '}
              {formatNumber(suggestedMaxTokens)} for better capacity utilization.
            </p>
          </div>
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <SliderField
            label="Average requests per minute?"
            value={wizardData.avgRPM}
            min={1}
            max={1000}
            unit="RPM"
            onChange={(value) => updateField('avgRPM', value)}
          />

          <SliderField
            label="Peak requests per minute?"
            value={wizardData.peakRPM}
            min={wizardData.avgRPM}
            max={5000}
            unit="RPM"
            onChange={(value) => updateField('peakRPM', value)}
          />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Traffic pattern?</Label>
            <RadioGroup
              value={wizardData.trafficPattern}
              onValueChange={(value) => updateField('trafficPattern', value)}
              className="grid gap-3 md:grid-cols-3"
            >
              {TRAFFIC_PATTERNS.map((pattern) => (
                <label
                  key={pattern.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors',
                    wizardData.trafficPattern === pattern.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/60',
                  )}
                >
                  <RadioGroupItem value={pattern.value} id={pattern.value} />
                  <div>
                    <p className="font-medium">{pattern.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {pattern.value === 'steady'
                        ? 'Predictable request rate'
                        : pattern.value === 'bursty'
                          ? 'Repeated surges above average'
                          : 'Sharp peaks with idle periods'}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-sm font-medium">
              Your burst ratio is {formatMultiplier(burstRatio)}x — this means peak traffic is{' '}
              {formatMultiplier(burstRatio)} times your average.
            </p>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Model</Label>
            <Select
              value={wizardData.model}
              onValueChange={(value) => updateField('model', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label} · {formatNumber(model.throughputPerPTU)} TPM/PTU
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Deployment type</Label>
            <RadioGroup
              value={wizardData.deployment}
              onValueChange={(value) => updateField('deployment', value)}
              className="grid gap-3 md:grid-cols-3"
            >
              {DEPLOYMENT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-colors',
                    wizardData.deployment === option.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/60',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <div className="space-y-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-muted-foreground text-xs">
                        Minimum {option.minPTU} PTUs
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Do you need latency SLA?</Label>
            <RadioGroup
              value={wizardData.needsLatencySla}
              onValueChange={(value) => updateField('needsLatencySla', value)}
              className="grid gap-3 sm:grid-cols-2"
            >
              {['yes', 'no'].map((value) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-4 capitalize transition-colors',
                    wizardData.needsLatencySla === value
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/60',
                  )}
                >
                  <RadioGroupItem value={value} id={`sla-${value}`} />
                  <div>
                    <p className="font-medium">{value}</p>
                    <p className="text-muted-foreground text-xs">
                      {value === 'yes'
                        ? 'Bias toward larger PTU reservations'
                        : 'Optimize harder for blended cost'}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {wizardData.model ? (
            <div className="rounded-xl border bg-muted/40 p-4 text-sm">
              <p className="font-medium">
                {selectedModelOption.label} delivers {formatNumber(calculations.throughputPerPTU)} TPM per
                PTU.
              </p>
              {wizardData.deployment ? (
                <p className="text-muted-foreground mt-1">
                  {selectedDeploymentOption.label} deployments start at{' '}
                  {selectedDeploymentOption.minPTU} PTUs.
                </p>
              ) : (
                <p className="text-muted-foreground mt-1">Select a deployment type to apply the PTU floor.</p>
              )}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-dashed">
            <CardContent className="space-y-2 pt-6">
              <p className="text-muted-foreground text-sm">Reserved tokens / request</p>
              <p className="text-2xl font-semibold">{formatNumber(calculations.tokensPerRequest)}</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="space-y-2 pt-6">
              <p className="text-muted-foreground text-sm">Actual tokens / request</p>
              <p className="text-2xl font-semibold">
                {formatNumber(calculations.actualTokensPerRequest)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="space-y-2 pt-6">
              <p className="text-muted-foreground text-sm">Peak throughput target</p>
              <p className="text-2xl font-semibold">{formatNumber(calculations.peakTPM)} TPM</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {recommendationCards.map((option) => (
            <RecommendationCard
              key={option.key}
              {...option}
              isRecommended={option.key === recommendation.key}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Cost comparison
            </CardTitle>
            <CardDescription>Using {formatCurrency(ptuHourlyRate)} per PTU-hour on-demand.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendationCards.map((option) => (
              <div key={option.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{option.title}</span>
                  <span>{formatCurrency(option.monthlyCost)}</span>
                </div>
                <div className="bg-muted h-3 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      option.tone === 'green'
                        ? 'bg-green-500'
                        : option.tone === 'blue'
                          ? 'bg-blue-500'
                          : 'bg-slate-500',
                    )}
                    style={{
                      width: `${Math.max(12, (option.monthlyCost / Math.max(maxMonthlyCost, 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="text-primary h-5 w-5" />
              Final recommendation
            </CardTitle>
            <CardDescription>{recommendation.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{recommendation.detail}</p>
            {wizardData.needsLatencySla === 'yes' ? (
              <p className="text-muted-foreground text-sm">
                Because you need a latency SLA, keep enough PTU headroom to avoid running hot during
                peaks.
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Badge>{recommendedCard.ptus} PTUs</Badge>
                <Badge variant="outline">{selectedModelOption.label}</Badge>
                <Badge variant="outline">{selectedDeploymentOption.label}</Badge>
              </div>
              <Button onClick={handleApply}>
                Apply to Calculator
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-2xl">Right-Size My Deployment</CardTitle>
              <CardDescription>
                Step {currentStep + 1} of {STEP_CONFIG.length} — {STEP_CONFIG[currentStep].title}
              </CardDescription>
            </div>
            <Badge variant="outline">
              {formatCurrency(ptuHourlyRate)}/PTU-hour
            </Badge>
          </div>

          <div className="space-y-3">
            <Progress value={progressValue} />
            <div className="grid gap-2 sm:grid-cols-4">
              {STEP_CONFIG.map((step, index) => {
                const completed = index < currentStep;
                const active = index === currentStep;

                return (
                  <button
                    key={step.title}
                    type="button"
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors',
                      active ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                    )}
                    onClick={() => {
                      if (index <= currentStep) {
                        setCurrentStep(index);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold',
                        completed || active ? 'border-primary text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{step.shortTitle}</p>
                      <p className="text-muted-foreground hidden text-xs sm:block">
                        {completed ? 'Completed' : active ? 'In progress' : 'Upcoming'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{STEP_CONFIG[currentStep].title}</CardTitle>
            <CardDescription>
              {currentStep === 0
                ? 'Capture reserved vs actual token shape for each request.'
                : currentStep === 1
                  ? 'Understand how much peak traffic exceeds your baseline.'
                  : currentStep === 2
                    ? 'Match throughput and minimum PTU floor to your deployment choice.'
                    : 'Compare sizing approaches and pick the right operating model.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div key={currentStep} className="animate-in fade-in-0 duration-300">
              {renderStep()}
            </div>
          </CardContent>
          <div className="flex items-center justify-between border-t px-6 pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep < STEP_CONFIG.length - 1 ? (
              <Button
                onClick={() =>
                  setCurrentStep((step) => Math.min(STEP_CONFIG.length - 1, step + 1))
                }
                disabled={!stepIsValid}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleApply}>
                Apply to Calculator
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
              <CardDescription>Your selections update live as you move through the wizard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="font-medium">Request shape</p>
                <div className="text-muted-foreground space-y-1">
                  <p>Prompt: {formatNumber(wizardData.promptTokens)} tokens</p>
                  <p>max_tokens: {formatNumber(wizardData.maxTokens)}</p>
                  <p>Actual output: {formatNumber(wizardData.actualOutput)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Traffic</p>
                <div className="text-muted-foreground space-y-1">
                  <p>Average: {formatNumber(wizardData.avgRPM)} RPM</p>
                  <p>Peak: {formatNumber(wizardData.peakRPM)} RPM</p>
                  <p>Pattern: {wizardData.trafficPattern}</p>
                  <p>Burst ratio: {formatMultiplier(burstRatio)}x</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Model & deployment</p>
                <div className="text-muted-foreground space-y-1">
                  <p>Model: {selectedModelOption?.label || 'Not selected'}</p>
                  <p>
                    Deployment:{' '}
                    {wizardData.deployment
                      ? selectedDeploymentOption.label
                      : 'Not selected'}
                  </p>
                  <p>Latency SLA: {wizardData.needsLatencySla === 'yes' ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommendation snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {hasSizingInputs ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Peak-ready PTUs</span>
                    <span className="font-semibold">{calculations.conservativePTUs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Spillover base PTUs</span>
                    <span className="font-semibold">{calculations.basePTUsSpillover}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Optimized PTUs</span>
                    <span className="font-semibold">{calculations.optimizedPTUs}</span>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="font-medium">{recommendedCard.title}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{recommendation.detail}</p>
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="font-medium">Select a model and deployment</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Step 3 unlocks the final PTU and cost recommendations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default RightSizeWizard;
