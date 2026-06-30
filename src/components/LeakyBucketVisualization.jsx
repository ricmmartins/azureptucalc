import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { Activity, AlertTriangle, Zap, Timer } from 'lucide-react';

import enhancedModelConfig from '../enhanced_model_config.json';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';

const WINDOW_SECONDS = 60;
const DEFAULT_PTU_COUNT = 50;
const DEFAULT_TOKENS_PER_PTU = 2500;
const DEFAULT_REQUEST_SIZE = 2000;
const DEFAULT_BURST_SIZE = 5;
const MAX_CHART_PERCENT = 120;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const buildPoint = (second, utilizationTokens, totalCapacity, extra = {}) => {
  const rawPercent = totalCapacity > 0 ? (utilizationTokens / totalCapacity) * 100 : 0;
  const cappedPercent = Math.min(rawPercent, MAX_CHART_PERCENT);

  return {
    second,
    utilizationTokens,
    rawPercent,
    healthyPercent: Math.min(cappedPercent, 100),
    overflowPercent: cappedPercent > 100 ? cappedPercent - 100 : 0,
    ...extra
  };
};

const makeHistory = (totalCapacity) =>
  Array.from({ length: WINDOW_SECONDS + 1 }, (_, second) => buildPoint(second, 0, totalCapacity));

const reindexHistory = (points, totalCapacity) =>
  points.map((point, second) =>
    buildPoint(second, point.utilizationTokens ?? 0, totalCapacity, {
      incomingRequests: point.incomingRequests ?? 0,
      rejected: point.rejected ?? 0,
      eventLabel: point.eventLabel ?? 'Drain'
    })
  );

export function LeakyBucketVisualization({
  ptuCount = DEFAULT_PTU_COUNT,
  tokensPerPTU,
  selectedModel
}) {
  const modelConfig = selectedModel ? enhancedModelConfig.models?.[selectedModel] : null;
  const modelName = modelConfig?.name || selectedModel || 'Custom model';
  const suggestedTokensPerPTU =
    tokensPerPTU ?? modelConfig?.throughput_per_ptu ?? DEFAULT_TOKENS_PER_PTU;

  const [localPtuCount, setLocalPtuCount] = useState(ptuCount);
  const [useModelTokens, setUseModelTokens] = useState(true);
  const [manualTokensPerPTU, setManualTokensPerPTU] = useState(suggestedTokensPerPTU);
  const [requestSize, setRequestSize] = useState(DEFAULT_REQUEST_SIZE);
  const [burstSize, setBurstSize] = useState(DEFAULT_BURST_SIZE);
  const [autoPlay, setAutoPlay] = useState(false);
  const [rejectedRequests, setRejectedRequests] = useState(0);

  const effectiveTokensPerPTU = useModelTokens ? suggestedTokensPerPTU : manualTokensPerPTU;
  const totalCapacity = useMemo(
    () => localPtuCount * effectiveTokensPerPTU,
    [effectiveTokensPerPTU, localPtuCount]
  );
  const capacityPerSecond = totalCapacity / WINDOW_SECONDS;

  const [currentUtilization, setCurrentUtilization] = useState(0);
  const [history, setHistory] = useState(() => makeHistory(ptuCount * suggestedTokensPerPTU));

  const utilizationRef = useRef(0);

  useEffect(() => {
    setLocalPtuCount(ptuCount);
  }, [ptuCount]);

  useEffect(() => {
    if (useModelTokens) {
      setManualTokensPerPTU(suggestedTokensPerPTU);
    }
  }, [suggestedTokensPerPTU, useModelTokens]);

  useEffect(() => {
    utilizationRef.current = currentUtilization;
  }, [currentUtilization]);

  useEffect(() => {
    setHistory((previous) => {
      if (!previous?.length) {
        return makeHistory(totalCapacity);
      }

      return reindexHistory(previous, totalCapacity);
    });
  }, [totalCapacity]);

  const replaceLatestPoint = useCallback(
    (utilizationTokens, extra = {}) => {
      setHistory((previous) => {
        const next = previous.length ? [...previous] : makeHistory(totalCapacity);
        next[next.length - 1] = buildPoint(WINDOW_SECONDS, utilizationTokens, totalCapacity, extra);
        return next;
      });
    },
    [totalCapacity]
  );

  const appendPoint = useCallback(
    (utilizationTokens, extra = {}) => {
      setHistory((previous) => {
        const base = previous.length ? previous.slice(1) : makeHistory(totalCapacity).slice(1);
        return reindexHistory(
          [...base, buildPoint(WINDOW_SECONDS, utilizationTokens, totalCapacity, extra)],
          totalCapacity
        );
      });
    },
    [totalCapacity]
  );

  const applyBurst = useCallback(
    (requestCount, eventLabel = 'Burst') => {
      const current = utilizationRef.current;
      const safeRequests =
        requestSize > 0 ? Math.max(0, Math.floor((totalCapacity - current) / requestSize)) : 0;
      const accepted = Math.min(requestCount, safeRequests);
      const rejected = Math.max(0, requestCount - safeRequests);
      const nextUtilization = current + accepted * requestSize;

      utilizationRef.current = nextUtilization;
      setCurrentUtilization(nextUtilization);
      setRejectedRequests((previous) => previous + rejected);
      replaceLatestPoint(nextUtilization, {
        incomingRequests: requestCount,
        rejected,
        eventLabel
      });
    },
    [replaceLatestPoint, requestSize, totalCapacity]
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const drainedUtilization = Math.max(0, utilizationRef.current - capacityPerSecond);

      let incomingRequests = 0;
      let rejected = 0;
      let nextUtilization = drainedUtilization;
      let eventLabel = 'Drain';

      if (autoPlay && Math.random() > 0.45) {
        incomingRequests = clamp(Math.ceil(Math.random() * burstSize), 1, burstSize);
        const safeRequests =
          requestSize > 0
            ? Math.max(0, Math.floor((totalCapacity - drainedUtilization) / requestSize))
            : 0;

        const accepted = Math.min(incomingRequests, safeRequests);
        rejected = Math.max(0, incomingRequests - safeRequests);
        nextUtilization += accepted * requestSize;
        eventLabel = 'Auto traffic';

        if (rejected > 0) {
          setRejectedRequests((previous) => previous + rejected);
        }
      }

      utilizationRef.current = nextUtilization;
      setCurrentUtilization(nextUtilization);
      appendPoint(nextUtilization, { incomingRequests, rejected, eventLabel });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [appendPoint, autoPlay, burstSize, capacityPerSecond, requestSize, totalCapacity]);

  const currentUtilizationPercent = totalCapacity > 0 ? (currentUtilization / totalCapacity) * 100 : 0;
  const overflowTokens = Math.max(0, currentUtilization - totalCapacity);
  const timeUntilClear = overflowTokens > 0 ? Math.ceil(overflowTokens / capacityPerSecond) : 0;
  const maxSafeConcurrentRequests =
    requestSize > 0 ? Math.max(0, Math.floor((totalCapacity - currentUtilization) / requestSize)) : 0;

  const currentStateVariant =
    currentUtilizationPercent > 100
      ? 'destructive'
      : currentUtilizationPercent > 80
        ? 'secondary'
        : 'default';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <CardTitle>Leaky Bucket Utilization</CardTitle>
            </div>
            <CardDescription>
              Requests reserve prompt + max tokens immediately, then drain back down across the rolling
              60-second PTU window.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{modelName}</Badge>
            <Badge variant="outline">{localPtuCount} PTUs</Badge>
            <Badge variant="outline">
              {effectiveTokensPerPTU.toLocaleString()} tokens / PTU / min
            </Badge>
            <Badge variant={currentStateVariant}>
              {currentUtilizationPercent > 100 ? '429 active' : 'Capacity available'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 rounded-xl border bg-muted/20 p-4">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Number of PTUs</Label>
                  <span className="text-sm font-medium">{localPtuCount}</span>
                </div>
                <Slider
                  min={15}
                  max={500}
                  step={5}
                  value={[localPtuCount]}
                  onValueChange={([value]) => setLocalPtuCount(value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="tokens-per-ptu">Tokens per PTU</Label>
                  {useModelTokens && <Badge variant="secondary">Auto from model</Badge>}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="tokens-per-ptu"
                    type="number"
                    min={100}
                    step={100}
                    value={effectiveTokensPerPTU}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      if (!Number.isFinite(nextValue)) {
                        return;
                      }

                      setUseModelTokens(false);
                      setManualTokensPerPTU(Math.max(100, Math.round(nextValue)));
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUseModelTokens(true);
                      setManualTokensPerPTU(suggestedTokensPerPTU);
                    }}
                  >
                    Sync
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Request size</Label>
                  <span className="text-sm font-medium">{requestSize.toLocaleString()} tokens</span>
                </div>
                <Slider
                  min={250}
                  max={10000}
                  step={250}
                  value={[requestSize]}
                  onValueChange={([value]) => setRequestSize(value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Burst size</Label>
                  <span className="text-sm font-medium">{burstSize} requests</span>
                </div>
                <Slider
                  min={1}
                  max={50}
                  step={1}
                  value={[burstSize]}
                  onValueChange={([value]) => setBurstSize(value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="auto-play">Auto-play random traffic</Label>
                  <Switch id="auto-play" checked={autoPlay} onCheckedChange={setAutoPlay} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Adds random requests every second while the bucket keeps draining continuously.
                </p>
              </div>

              <Button type="button" className="gap-2" onClick={() => applyBurst(burstSize)}>
                <Zap className="h-4 w-4" />
                Fire {burstSize} request burst
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-xl border bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-800">Minute capacity</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-900">
                {totalCapacity.toLocaleString()}
              </p>
              <p className="text-sm text-emerald-700">tokens reserved across the 60s window</p>
            </div>

            <div className="rounded-xl border bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800">Drain rate</p>
              <p className="mt-1 text-2xl font-semibold text-blue-900">
                {Math.round(capacityPerSecond).toLocaleString()}
              </p>
              <p className="text-sm text-blue-700">tokens released back each second</p>
            </div>

            <div className="rounded-xl border bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">Burst impact</p>
              <p className="mt-1 text-2xl font-semibold text-amber-900">
                {(burstSize * requestSize).toLocaleString()}
              </p>
              <p className="text-sm text-amber-700">tokens added when the burst button fires</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative h-[360px] rounded-xl border bg-background p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 24, right: 24, left: 0, bottom: 12 }}>
                <defs>
                  <linearGradient id="healthyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient id="overflowFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.12} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="second"
                  type="number"
                  domain={[0, WINDOW_SECONDS]}
                  tickCount={7}
                  tickFormatter={(value) => `${value}s`}
                />
                <YAxis
                  domain={[0, MAX_CHART_PERCENT]}
                  tickCount={7}
                  tickFormatter={(value) => `${value}%`}
                />
                <ReferenceLine
                  y={100}
                  stroke="#dc2626"
                  strokeDasharray="6 6"
                  ifOverflow="extendDomain"
                  label={{
                    value: '429 signal until capacity is available',
                    position: 'insideTopLeft',
                    fill: '#b91c1c',
                    fontSize: 12
                  }}
                />
                <Area
                  type="linear"
                  dataKey="healthyPercent"
                  stackId="utilization"
                  stroke="#16a34a"
                  fill="url(#healthyFill)"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={350}
                />
                <Area
                  type="linear"
                  dataKey="overflowPercent"
                  stackId="utilization"
                  stroke="#dc2626"
                  fill="url(#overflowFill)"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={350}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <defs>
                  <marker
                    id="requestArrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 z" fill="#2563eb" />
                  </marker>
                </defs>

                <path
                  d="M58 20 C68 16, 79 16, 88 26"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1.2"
                  markerEnd="url(#requestArrow)"
                />
                <text x="40" y="18" fill="#1d4ed8" fontSize="3.4" fontWeight="600">
                  Each request increases utilization
                </text>

                <path d="M77 58 L87 71" fill="none" stroke="#16a34a" strokeWidth="1.4" />
                <polygon points="77,58 80,63 74,63" fill="#16a34a" />
                <polygon points="82,64 85,69 79,69" fill="#16a34a" />
                <polygon points="87,70 90,75 84,75" fill="#16a34a" />
                <text x="56" y="82" fill="#15803d" fontSize="3.4" fontWeight="600">
                  Continuous drain / refill
                </text>
              </svg>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="h-4 w-4 text-emerald-600" />
                Current utilization
              </div>
              <div className="mt-2 text-2xl font-semibold">{currentUtilizationPercent.toFixed(1)}%</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentUtilization.toLocaleString()} / {totalCapacity.toLocaleString()} tokens reserved
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Timer className="h-4 w-4 text-blue-600" />
                Time until 429 clears
              </div>
              <div className="mt-2 text-2xl font-semibold">~{timeUntilClear}s</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {timeUntilClear > 0 ? 'Requests stay throttled until the bucket drops below 100%' : 'No active 429 window'}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Zap className="h-4 w-4 text-amber-600" />
                Max safe concurrent requests
              </div>
              <div className="mt-2 text-2xl font-semibold">{maxSafeConcurrentRequests}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                At {requestSize.toLocaleString()} tokens per request right now
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Requests rejected (429s)
              </div>
              <div className="mt-2 text-2xl font-semibold">{rejectedRequests}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Count increments when bursts cross the available capacity line
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LeakyBucketVisualization;
