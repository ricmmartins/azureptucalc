import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Brain, DollarSign, TrendingUp, Zap, ArrowRight, ArrowLeft, 
  CheckCircle, XCircle, HelpCircle, BarChart3, Clock, Shield,
  AlertTriangle, Lightbulb
} from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Let\'s find the right pricing for you' },
  { id: 'familiarity', title: 'Your Azure OpenAI experience' },
  { id: 'spending', title: 'Your current spending' },
  { id: 'usage-pattern', title: 'Your usage pattern' },
  { id: 'priorities', title: 'What matters most?' },
  { id: 'result', title: 'Our recommendation' },
];

const QualificationWizard = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    familiarity: null,       // 'new' | 'heard' | 'using' | 'expert'
    spending: null,          // 'under1k' | '1k-5k' | '5k-20k' | 'over20k' | 'unknown'
    usagePattern: null,      // 'consistent' | 'business-hours' | 'spiky' | 'growing'
    priorities: [],          // ['cost', 'latency', 'throughput', 'simplicity']
  });

  const setAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const togglePriority = (priority) => {
    setAnswers(prev => {
      const current = prev.priorities;
      if (current.includes(priority)) {
        return { ...prev, priorities: current.filter(p => p !== priority) };
      }
      return { ...prev, priorities: [...current, priority] };
    });
  };

  // Determine recommendation based on answers
  const getRecommendation = () => {
    const { spending, usagePattern, priorities } = answers;
    
    // Low spend → PAYGO is almost always better
    if (spending === 'under1k') {
      return {
        type: 'paygo',
        confidence: 'high',
        title: 'Stay with Pay-As-You-Go (PAYGO)',
        summary: 'Your current spending level doesn\'t justify reserved capacity. PAYGO gives you flexibility without commitment.',
        reasoning: [
          'PTU requires a minimum of 50 units, which costs ~$36,000/month on-demand',
          'At your spending level, PAYGO is significantly more cost-effective',
          'You maintain full flexibility to scale up or down',
        ],
        showCalculator: false,
        savings: null,
      };
    }

    // Medium-low spend → probably PAYGO, maybe worth checking
    if (spending === '1k-5k') {
      return {
        type: 'paygo-check',
        confidence: 'medium',
        title: 'Likely stay with PAYGO, but worth checking',
        summary: 'At this spending level, PAYGO is usually more cost-effective. However, if your usage is very consistent, PTU reservations might offer some savings.',
        reasoning: [
          'PTU minimum (50 units) monthly reservation starts at ~$13,000/month',
          'You\'d need very consistent, high-utilization workloads to break even',
          'Priority Processing might be a better middle-ground for latency needs',
        ],
        showCalculator: true,
        savings: 'unlikely',
      };
    }

    // Medium-high spend → PTU likely makes sense
    if (spending === '5k-20k') {
      const isConsistent = usagePattern === 'consistent' || usagePattern === 'business-hours';
      if (isConsistent) {
        return {
          type: 'ptu-recommended',
          confidence: 'high',
          title: 'PTU reservations can save you significantly',
          summary: 'Your spending level and consistent usage pattern make PTU reservations a strong candidate for cost savings of 30-60%.',
          reasoning: [
            'Consistent usage means high PTU utilization (key to ROI)',
            'Monthly or 1-year reservations offer 64-70% off on-demand rates',
            'Let\'s calculate your exact savings with the full calculator',
          ],
          showCalculator: true,
          savings: '30-60%',
        };
      }
      return {
        type: 'spillover',
        confidence: 'medium',
        title: 'Consider a Spillover (hybrid) strategy',
        summary: 'Your spending justifies PTU, but spiky usage means you shouldn\'t reserve for peak capacity. A spillover approach (PTU for base + PAYGO for bursts) is ideal.',
        reasoning: [
          'Reserve PTUs for your average/baseline usage',
          'Let traffic spikes overflow to PAYGO automatically',
          'This avoids paying for idle PTU capacity during low periods',
        ],
        showCalculator: true,
        savings: '20-40%',
      };
    }

    // High spend → definitely should use PTU
    if (spending === 'over20k') {
      return {
        type: 'ptu-strong',
        confidence: 'high',
        title: 'PTU reservations will save you thousands per month',
        summary: 'At your spending level, PTU with yearly reservations can reduce costs by 50-70%. This calculator will help you size correctly.',
        reasoning: [
          'High volume is exactly where PTU shines — bulk pricing wins',
          '1-year reservations offer the deepest discounts (~70% off on-demand)',
          'Even with some underutilization, PTU likely beats PAYGO at this scale',
          'Consider splitting across models if you use multiple',
        ],
        showCalculator: true,
        savings: '50-70%',
      };
    }

    // Unknown spend → help them figure it out
    return {
      type: 'explore',
      confidence: 'low',
      title: 'Let\'s explore your options together',
      summary: 'No worries! The calculator can help you model different scenarios. You can input estimated usage and see what each pricing model would cost.',
      reasoning: [
        'Check your Azure portal for current Azure OpenAI charges',
        'Or estimate based on your application\'s daily API calls',
        'The calculator supports both precise data (KQL) and rough estimates',
      ],
      showCalculator: true,
      savings: null,
    };
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeStep onNext={nextStep} onSkip={onSkip} />;
      case 'familiarity':
        return <FamiliarityStep answer={answers.familiarity} setAnswer={(v) => setAnswer('familiarity', v)} onNext={nextStep} onPrev={prevStep} />;
      case 'spending':
        return <SpendingStep answer={answers.spending} setAnswer={(v) => setAnswer('spending', v)} onNext={nextStep} onPrev={prevStep} />;
      case 'usage-pattern':
        return <UsagePatternStep answer={answers.usagePattern} setAnswer={(v) => setAnswer('usagePattern', v)} onNext={nextStep} onPrev={prevStep} />;
      case 'priorities':
        return <PrioritiesStep answers={answers.priorities} togglePriority={togglePriority} onNext={nextStep} onPrev={prevStep} />;
      case 'result':
        return <ResultStep recommendation={getRecommendation()} answers={answers} onComplete={onComplete} onBack={prevStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress indicator */}
        {currentStep > 0 && currentStep < STEPS.length - 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Step {currentStep} of {STEPS.length - 2}</span>
              <span className="text-sm text-gray-500">{STEPS[currentStep].title}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep) / (STEPS.length - 2)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {renderStepContent()}
      </div>
    </div>
  );
};

// Step 1: Welcome
const WelcomeStep = ({ onNext, onSkip }) => (
  <Card className="border-0 shadow-xl">
    <CardHeader className="text-center pb-2">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-blue-100 rounded-full">
          <Brain className="h-12 w-12 text-blue-600" />
        </div>
      </div>
      <CardTitle className="text-3xl font-bold text-gray-800">
        Azure OpenAI Cost Advisor
      </CardTitle>
      <CardDescription className="text-lg mt-2 text-gray-600">
        Find out if you're paying too much — in under 60 seconds
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 space-y-4">
        <p className="text-gray-700 text-center">
          Azure OpenAI offers different pricing models. Choosing the right one 
          can save you <span className="font-bold text-blue-700">30-70% on your monthly bill</span>.
        </p>
        <p className="text-gray-600 text-center text-sm">
          We'll ask a few quick questions about your usage to recommend the best option.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 rounded-lg bg-green-50">
          <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
          <p className="text-xs text-green-700 font-medium">Cost Savings</p>
        </div>
        <div className="p-3 rounded-lg bg-purple-50">
          <Clock className="h-6 w-6 text-purple-600 mx-auto mb-1" />
          <p className="text-xs text-purple-700 font-medium">60 Seconds</p>
        </div>
        <div className="p-3 rounded-lg bg-orange-50">
          <Lightbulb className="h-6 w-6 text-orange-600 mx-auto mb-1" />
          <p className="text-xs text-orange-700 font-medium">Clear Advice</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          onClick={onNext} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
        >
          Let's Find Out
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        <Button 
          onClick={onSkip} 
          variant="ghost" 
          className="text-gray-500 hover:text-gray-700"
        >
          I already know about PTU — skip to calculator
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Step 2: Familiarity with Azure OpenAI pricing
const FamiliarityStep = ({ answer, setAnswer, onNext, onPrev }) => {
  const options = [
    { 
      value: 'new', 
      icon: HelpCircle,
      title: 'I\'m new to this',
      description: 'Just started using Azure OpenAI or haven\'t looked into pricing options',
      color: 'blue'
    },
    { 
      value: 'heard', 
      icon: Lightbulb,
      title: 'I\'ve heard of PTU',
      description: 'Know it exists but not sure if it applies to me',
      color: 'yellow'
    },
    { 
      value: 'using', 
      icon: BarChart3,
      title: 'Already using PAYGO',
      description: 'Currently paying per token and wondering if there\'s a better option',
      color: 'green'
    },
    { 
      value: 'expert', 
      icon: Zap,
      title: 'I know the options',
      description: 'Familiar with PTU/PAYGO, just need to calculate the right size',
      color: 'purple'
    },
  ];

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800">
          How familiar are you with Azure OpenAI pricing?
        </CardTitle>
        <CardDescription>
          This helps us tailor the experience and explanations to your level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {options.map(opt => {
            const Icon = opt.icon;
            const isSelected = answer === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setAnswer(opt.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                      {opt.title}
                    </p>
                    <p className="text-sm text-gray-500">{opt.description}</p>
                  </div>
                  {isSelected && <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onPrev}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button onClick={onNext} disabled={!answer} className="bg-blue-600 hover:bg-blue-700">
            Continue <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Step 3: Monthly spending
const SpendingStep = ({ answer, setAnswer, onNext, onPrev }) => {
  const options = [
    { 
      value: 'under1k', 
      title: 'Less than $1,000/month',
      description: 'Low volume or just getting started',
      emoji: '💡'
    },
    { 
      value: '1k-5k', 
      title: '$1,000 – $5,000/month',
      description: 'Growing workload with moderate usage',
      emoji: '📈'
    },
    { 
      value: '5k-20k', 
      title: '$5,000 – $20,000/month',
      description: 'Significant production workload',
      emoji: '🚀'
    },
    { 
      value: 'over20k', 
      title: 'More than $20,000/month',
      description: 'High-volume production deployment',
      emoji: '🏢'
    },
    { 
      value: 'unknown', 
      title: 'I\'m not sure',
      description: 'Haven\'t checked or planning a new workload',
      emoji: '🤔'
    },
  ];

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800">
          What's your approximate monthly Azure OpenAI spend?
        </CardTitle>
        <CardDescription>
          This is the single biggest factor in determining your best pricing model. An estimate is fine!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {options.map(opt => {
            const isSelected = answer === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setAnswer(opt.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{opt.emoji}</span>
                  <div>
                    <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                      {opt.title}
                    </p>
                    <p className="text-sm text-gray-500">{opt.description}</p>
                  </div>
                  {isSelected && <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Educational tip */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Tip:</strong> Check your Azure Cost Management portal → filter by "Cognitive Services" 
              or "Azure OpenAI" to see your actual monthly spend.
            </p>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onPrev}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button onClick={onNext} disabled={!answer} className="bg-blue-600 hover:bg-blue-700">
            Continue <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Step 4: Usage pattern
const UsagePatternStep = ({ answer, setAnswer, onNext, onPrev }) => {
  const options = [
    { 
      value: 'consistent', 
      title: 'Steady and consistent',
      description: 'Similar load 24/7 — background processing, batch jobs, always-on chatbot',
      visual: '▁▂▂▂▂▂▂▂▂▂▂▂▁',
      color: 'green'
    },
    { 
      value: 'business-hours', 
      title: 'Business hours peaks',
      description: 'Higher during work hours, quiet at night/weekends',
      visual: '▁▁▃▆█████▆▃▁',
      color: 'blue'
    },
    { 
      value: 'spiky', 
      title: 'Unpredictable spikes',
      description: 'Quiet most of the time with sudden bursts (marketing events, viral moments)',
      visual: '▁▁▁█▁▁▁▁▁█▁▁▁',
      color: 'orange'
    },
    { 
      value: 'growing', 
      title: 'Growing rapidly',
      description: 'Usage is increasing week over week — still figuring out steady state',
      visual: '▁▁▂▃▄▅▆▇██',
      color: 'purple'
    },
  ];

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800">
          What does your usage look like over a typical week?
        </CardTitle>
        <CardDescription>
          Usage patterns determine whether reserved capacity (PTU) will be well-utilized
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {options.map(opt => {
            const isSelected = answer === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setAnswer(opt.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="font-mono text-lg tracking-tight text-gray-400 w-32 text-center">
                    {opt.visual}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                      {opt.title}
                    </p>
                    <p className="text-sm text-gray-500">{opt.description}</p>
                  </div>
                  {isSelected && <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onPrev}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button onClick={onNext} disabled={!answer} className="bg-blue-600 hover:bg-blue-700">
            Continue <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Step 5: Priorities
const PrioritiesStep = ({ answers, togglePriority, onNext, onPrev }) => {
  const options = [
    { 
      value: 'cost', 
      icon: DollarSign,
      title: 'Lowest cost',
      description: 'Minimize monthly spend above all else',
      color: 'green'
    },
    { 
      value: 'latency', 
      icon: Zap,
      title: 'Low latency',
      description: 'Fast response times for user-facing applications',
      color: 'yellow'
    },
    { 
      value: 'throughput', 
      icon: TrendingUp,
      title: 'Guaranteed throughput',
      description: 'Never get rate-limited (HTTP 429), even under load',
      color: 'blue'
    },
    { 
      value: 'simplicity', 
      icon: Shield,
      title: 'Keep it simple',
      description: 'Don\'t want to manage reservations or capacity planning',
      color: 'purple'
    },
  ];

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800">
          What matters most to you? <span className="text-sm font-normal text-gray-500">(pick all that apply)</span>
        </CardTitle>
        <CardDescription>
          Different pricing models optimize for different goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {options.map(opt => {
            const Icon = opt.icon;
            const isSelected = answers.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => togglePriority(opt.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                      {opt.title}
                    </p>
                    <p className="text-sm text-gray-500">{opt.description}</p>
                  </div>
                  {isSelected ? (
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onPrev}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button onClick={onNext} disabled={answers.length === 0} className="bg-blue-600 hover:bg-blue-700">
            See Recommendation <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Step 6: Result
const ResultStep = ({ recommendation, answers, onComplete, onBack }) => {
  const typeColors = {
    'paygo': 'green',
    'paygo-check': 'green',
    'ptu-recommended': 'blue',
    'ptu-strong': 'blue',
    'spillover': 'purple',
    'explore': 'gray',
  };

  const color = typeColors[recommendation.type] || 'gray';

  const colorClasses = {
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' },
  };

  const classes = colorClasses[color];

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <div className={`p-3 rounded-full ${classes.bg}`}>
            {recommendation.type.includes('ptu') ? (
              <Zap className={`h-8 w-8 ${classes.text}`} />
            ) : recommendation.type === 'spillover' ? (
              <TrendingUp className={`h-8 w-8 ${classes.text}`} />
            ) : (
              <DollarSign className={`h-8 w-8 ${classes.text}`} />
            )}
          </div>
        </div>
        <CardTitle className="text-2xl text-gray-800">
          {recommendation.title}
        </CardTitle>
        {recommendation.savings && (
          <Badge className={`${classes.badge} mt-2 text-sm px-3 py-1`}>
            Potential savings: {recommendation.savings}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-center text-gray-600 text-lg">
          {recommendation.summary}
        </p>

        {/* Reasoning */}
        <div className={`${classes.bg} border ${classes.border} rounded-xl p-5`}>
          <p className="font-medium text-gray-800 mb-3">Why we recommend this:</p>
          <ul className="space-y-2">
            {recommendation.reasoning.map((reason, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className={`h-4 w-4 ${classes.text} mt-0.5 flex-shrink-0`} />
                <span className="text-sm text-gray-700">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick PTU Explainer for new users */}
        {answers.familiarity === 'new' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 mb-2">What is PTU?</p>
                <p className="text-sm text-amber-800">
                  <strong>PTU (Provisioned Throughput Units)</strong> is Azure's way of letting you 
                  reserve dedicated AI capacity. Think of it like buying a monthly pass vs. paying per ride.
                  You get guaranteed performance and lower per-token costs, but you pay whether you use it or not.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confidence indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Shield className="h-4 w-4" />
          <span>
            Confidence: <strong className="capitalize">{recommendation.confidence}</strong> 
            {recommendation.confidence !== 'high' && ' — use the calculator for a precise answer'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          {recommendation.showCalculator ? (
            <Button 
              onClick={() => onComplete({ recommendation, answers })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
            >
              Open the Full Calculator
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={() => onComplete({ recommendation, answers })}
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Got it — take me to the calculator anyway
            </Button>
          )}
          <Button variant="ghost" onClick={onBack} className="text-gray-500">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to questions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QualificationWizard;
