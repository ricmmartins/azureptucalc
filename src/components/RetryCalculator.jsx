import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Timer,
  RefreshCw,
  Code,
  Copy,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

const JITTER_OPTIONS = [
  { value: 'full', label: 'Full Jitter (Recommended)' },
  { value: 'equal', label: 'Equal Jitter' },
  { value: 'decorrelated', label: 'Decorrelated Jitter' },
];

const CODE_SNIPPETS = {
  python: `import time
import random
from openai import AzureOpenAI

def call_with_retry(client, messages, max_retries=3, base_delay=1.0):
    for attempt in range(max_retries + 1):
        try:
            return client.chat.completions.create(
                model="your-deployment",
                messages=messages,
                max_tokens=512  # Right-size this!
            )
        except Exception as e:
            if hasattr(e, 'status_code') and e.status_code == 429:
                if attempt == max_retries:
                    raise
                # Exponential backoff with full jitter
                delay = min(base_delay * (2 ** attempt), 30)
                jitter = random.uniform(0, delay)
                retry_after = getattr(e, 'retry_after', 0) or 0
                time.sleep(max(retry_after, jitter))
            else:
                raise`,
  javascript: `async function callWithRetry(client, messages, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.chat.completions.create({
        model: "your-deployment",
        messages,
        max_tokens: 512  // Right-size this!
      });
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
        const jitter = Math.random() * delay;
        const retryAfterMs = Number(error.headers?.["retry-after"] ?? 0) * 1000;
        await new Promise(r => setTimeout(r, Math.max(retryAfterMs, jitter)));
      } else {
        throw error;
      }
    }
  }
}`,
  csharp: `async Task<ChatCompletion> CallWithRetryAsync(
    ChatClient client, string message,
    int maxRetries = 3, double baseDelay = 1.0)
{
    for (int attempt = 0; attempt <= maxRetries; attempt++)
    {
        try
        {
            return await client.CompleteChatAsync(message,
                new ChatCompletionOptions { MaxOutputTokenCount = 512 });
        }
        catch (ClientResultException ex) when (ex.Status == 429)
        {
            if (attempt == maxRetries) throw;
            var delay = Math.Min(baseDelay * Math.Pow(2, attempt), 30);
            var jitter = Random.Shared.NextDouble() * delay;
            var retryAfter = ex.GetRawResponse().Headers.TryGetValue("Retry-After", out var header)
                && double.TryParse(header, out var seconds)
                ? seconds
                : 0;
            await Task.Delay(TimeSpan.FromSeconds(Math.Max(retryAfter, jitter)));
        }
    }
    throw new InvalidOperationException("Unreachable");
}`,
};

const seededRandom = (seed) => {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
};

const formatDelay = (milliseconds) => {
  if (milliseconds >= 1000) {
    const seconds = milliseconds / 1000;
    const digits = seconds >= 10 ? 1 : 2;
    return `${Number(seconds.toFixed(digits))}s`;
  }

  return `${Math.round(milliseconds)}ms`;
};

const SliderField = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  helper,
  formatter = (current) => current,
}) => (
  <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </div>
      <Badge variant="outline" className="text-slate-700">
        {formatter(value)}
      </Badge>
    </div>
    <Slider
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={([nextValue]) => onChange(nextValue)}
    />
  </div>
);

const TimelineDot = ({ colorClass, label, icon: Icon }) => (
  <div className="flex shrink-0 flex-col items-center gap-2">
    <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${colorClass}`}>
      {Icon ? <Icon className="h-4 w-4" /> : null}
    </div>
    <span className="text-center text-xs font-medium text-slate-600">{label}</span>
  </div>
);

export function RetryCalculator() {
  const [maxRetries, setMaxRetries] = useState(3);
  const [baseDelay, setBaseDelay] = useState(1000);
  const [maxDelayCap, setMaxDelayCap] = useState(30000);
  const [jitterType, setJitterType] = useState('full');
  const [peakRps, setPeakRps] = useState(10);
  const [expected429Rate, setExpected429Rate] = useState(5);
  const [copiedKey, setCopiedKey] = useState('');

  const retryTimeline = useMemo(() => {
    let previousDelay = baseDelay;

    return Array.from({ length: maxRetries }, (_, index) => {
      const attemptNumber = index + 1;
      const backoffCap = Math.min(baseDelay * (2 ** index), maxDelayCap);
      const randomFactor = seededRandom(
        attemptNumber * 113 + baseDelay * 0.17 + maxDelayCap * 0.07 + peakRps * 1.9 + expected429Rate * 2.7
      );

      let delayMs = backoffCap;

      if (jitterType === 'equal') {
        delayMs = backoffCap / 2 + randomFactor * (backoffCap / 2);
      } else if (jitterType === 'decorrelated') {
        const maxWindow = Math.max(baseDelay, previousDelay * 3);
        delayMs = Math.min(maxDelayCap, baseDelay + randomFactor * (maxWindow - baseDelay));
      } else {
        delayMs = randomFactor * backoffCap;
      }

      previousDelay = Math.max(baseDelay, delayMs);

      return {
        attemptNumber,
        delayMs,
        backoffCap,
        barWidth: Math.max(48, Math.min(172, 48 + (delayMs / maxDelayCap) * 124 * (0.8 + randomFactor * 0.5))),
      };
    });
  }, [baseDelay, expected429Rate, jitterType, maxDelayCap, maxRetries, peakRps]);

  const averageRetryDelaySeconds = useMemo(() => {
    if (!retryTimeline.length) {
      return 0;
    }

    const totalDelaySeconds = retryTimeline.reduce((sum, step) => sum + step.delayMs / 1000, 0);
    return totalDelaySeconds / maxRetries;
  }, [maxRetries, retryTimeline]);

  const effectiveThroughput = useMemo(() => {
    const retryRate = expected429Rate / 100;
    const successfulFirstPass = peakRps * (1 - retryRate);
    const recoveredRetries = peakRps * retryRate * (1 / (1 + averageRetryDelaySeconds));
    return successfulFirstPass + recoveredRetries;
  }, [averageRetryDelaySeconds, expected429Rate, peakRps]);

  const timelineSummary = useMemo(() => {
    const parts = ['Request'];

    retryTimeline.forEach((step) => {
      parts.push('429', `wait ${formatDelay(step.delayMs)}`, `Retry ${step.attemptNumber}`);
    });

    parts.push('✅ Success');
    return parts.join(' → ');
  }, [retryTimeline]);

  const copySnippet = async (key) => {
    try {
      await navigator.clipboard.writeText(CODE_SNIPPETS[key]);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? '' : current)), 1800);
    } catch {
      setCopiedKey('');
    }
  };

  const selectedJitterLabel =
    JITTER_OPTIONS.find((option) => option.value === jitterType)?.label ?? JITTER_OPTIONS[0].label;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-emerald-50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-2xl text-slate-900">Retry Logic Calculator</CardTitle>
              </div>
              <CardDescription className="max-w-3xl text-sm text-slate-600">
                Model how exponential backoff + jitter protects Azure OpenAI PTU deployments from retry
                storms when 429s appear during bursts.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                Full jitter limits stampedes
              </Badge>
              <Badge variant="outline" className="border-slate-300 text-slate-700">
                Retry-After overrides local delay
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 pt-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <SliderField
              label="Max retries"
              value={maxRetries}
              min={1}
              max={10}
              onChange={setMaxRetries}
              helper="Total retry attempts after the first 429"
              formatter={(value) => value}
            />
            <SliderField
              label="Base delay"
              value={baseDelay}
              min={100}
              max={5000}
              step={100}
              onChange={setBaseDelay}
              helper="Initial backoff delay before jitter is applied"
              formatter={formatDelay}
            />
            <SliderField
              label="Max delay cap"
              value={maxDelayCap}
              min={1000}
              max={60000}
              step={1000}
              onChange={setMaxDelayCap}
              helper="Upper bound for any single wait"
              formatter={formatDelay}
            />
            <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Jitter type</p>
                  <p className="text-xs text-slate-500">Full jitter is the safest default for shared capacity.</p>
                </div>
                <Badge variant="outline" className="text-slate-700">
                  {selectedJitterLabel.split(' ')[0]}
                </Badge>
              </div>
              <Select value={jitterType} onValueChange={setJitterType}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select a jitter pattern" />
                </SelectTrigger>
                <SelectContent>
                  {JITTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SliderField
              label="Requests per second at peak"
              value={peakRps}
              min={1}
              max={100}
              onChange={setPeakRps}
              helper="Observed or expected burst rate"
              formatter={(value) => `${value} RPS`}
            />
            <SliderField
              label="Expected 429 rate %"
              value={expected429Rate}
              min={0}
              max={50}
              onChange={setExpected429Rate}
              helper="Portion of burst traffic likely to hit throttling"
              formatter={(value) => `${value}%`}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-950 p-5 text-slate-50">
              <div className="mb-4 flex items-center gap-2">
                <Timer className="h-5 w-5 text-emerald-400" />
                <p className="font-semibold">Burst impact summary</p>
              </div>
              <p className="text-sm text-slate-300">
                With retry logic, effective throughput drops from{' '}
                <span className="font-semibold text-white">{peakRps.toFixed(1)}</span> to{' '}
                <span className="font-semibold text-emerald-400">{effectiveThroughput.toFixed(1)}</span> RPS during
                burst
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Avg retry delay</p>
                  <p className="mt-1 text-lg font-semibold">{averageRetryDelaySeconds.toFixed(2)}s</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Recovery throughput</p>
                  <p className="mt-1 text-lg font-semibold">{effectiveThroughput.toFixed(1)} RPS</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Jitter mode</p>
                  <p className="mt-1 text-lg font-semibold">{selectedJitterLabel.split(' ')[0]}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-700" />
                <p className="text-sm font-semibold text-emerald-900">Doc-aligned target windows</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white text-emerald-800 hover:bg-white">2nd retry: 1.5–2.5 seconds</Badge>
                <Badge className="bg-white text-emerald-800 hover:bg-white">3rd retry: 3.5–4.5 seconds</Badge>
              </div>
            </div>

            {expected429Rate > 20 ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
                  <div>
                    <p className="font-medium text-amber-900">
                      Consider adding more PTUs or enabling spillover
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      Sustained throttling above 20% usually means retries are masking a capacity problem.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-slate-700" />
            <CardTitle>Retry timeline visualization</CardTitle>
          </div>
          <CardDescription>{timelineSummary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-3">
              <TimelineDot
                colorClass="border-slate-300 bg-white text-slate-700"
                label="Request"
                icon={RefreshCw}
              />

              {retryTimeline.map((step) => (
                <React.Fragment key={step.attemptNumber}>
                  <TimelineDot
                    colorClass="border-red-200 bg-red-50 text-red-700"
                    label="429"
                    icon={AlertTriangle}
                  />
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <div
                      className="h-3 rounded-full bg-slate-300"
                      style={{ width: `${step.barWidth}px` }}
                    />
                    <span className="text-xs font-medium text-slate-500">{formatDelay(step.delayMs)}</span>
                  </div>
                  <TimelineDot
                    colorClass="border-sky-200 bg-sky-50 text-sky-700"
                    label={`Retry ${step.attemptNumber}`}
                    icon={RefreshCw}
                  />
                </React.Fragment>
              ))}

              <TimelineDot
                colorClass="border-emerald-200 bg-emerald-50 text-emerald-700"
                label="Success"
                icon={CheckCircle}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {retryTimeline.map((step) => (
              <div key={step.attemptNumber} className="rounded-xl border bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-slate-900">Retry {step.attemptNumber}</p>
                  <Badge variant="outline">{formatDelay(step.delayMs)}</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  Jittered from a {formatDelay(step.backoffCap)} exponential backoff window.
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-slate-700" />
            <CardTitle>Code snippets</CardTitle>
          </div>
          <CardDescription>
            These examples use the recommended full-jitter pattern. Always let Retry-After win when the service
            sends it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="python" className="gap-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="csharp">C#</TabsTrigger>
            </TabsList>

            {Object.entries(CODE_SNIPPETS).map(([key, snippet]) => (
              <TabsContent key={key} value={key} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className="border-slate-300 text-slate-700">
                    {key === 'javascript' ? 'JavaScript / TypeScript' : key === 'csharp' ? 'C#' : 'Python'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => copySnippet(key)}>
                    {copiedKey === key ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-green-400">
                  <code>{snippet}</code>
                </pre>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle>Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 rounded-xl border bg-slate-50 p-4">
              <Badge className="mt-0.5 bg-sky-100 text-sky-800 hover:bg-sky-100">Retry-After</Badge>
              <span className="text-sm text-slate-700">
                Always honor the Retry-After header — it tells you exactly when capacity frees up
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border bg-slate-50 p-4">
              <Badge className="mt-0.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Jitter</Badge>
              <span className="text-sm text-slate-700">
                Full jitter prevents retry storms when multiple clients retry simultaneously
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border bg-slate-50 p-4">
              <Badge className="mt-0.5 bg-violet-100 text-violet-800 hover:bg-violet-100">max_tokens</Badge>
              <span className="text-sm text-slate-700">
                Right-size max_tokens before adding retries — retries are a safety net, not the solution
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default RetryCalculator;
