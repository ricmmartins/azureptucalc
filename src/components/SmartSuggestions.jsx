// Smart Suggestions and Guidance Component
import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Lightbulb, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';

export const SmartSuggestions = ({ 
  inputTokens, 
  outputTokens, 
  selectedModel, 
  selectedRegion,
  currentCosts,
  usagePattern = 'steady'
}) => {
  
  const getSuggestions = () => {
    const suggestions = [];
    const totalTokens = (inputTokens || 0) + (outputTokens || 0);
    const monthlyTokens = totalTokens * 30; // Assuming daily input

    // Model recommendations
    if (selectedModel === 'gpt-4' && monthlyTokens < 1000000) {
      suggestions.push({
        type: 'optimization',
        icon: TrendingUp,
        title: 'Consider GPT-4o for cost savings',
        description: 'GPT-4o offers 50% better price performance for most use cases',
        impact: 'High',
        savings: 'Up to 50% reduction'
      });
    }

    if (selectedModel === 'gpt-4o' && totalTokens < 10000) {
      suggestions.push({
        type: 'optimization',
        icon: TrendingUp,
        title: 'GPT-4o Mini might be sufficient',
        description: 'For simple tasks, GPT-4o Mini offers 80% cost reduction',
        impact: 'High',
        savings: 'Up to 80% reduction'
      });
    }

    // Usage pattern insights
    if (monthlyTokens > 10000000) {
      suggestions.push({
        type: 'recommendation',
        icon: Lightbulb,
        title: 'High volume detected - PTU recommended',
        description: 'Your usage pattern suggests significant savings with PTU',
        impact: 'Critical',
        savings: 'Potentially $1000s/month'
      });
    } else if (monthlyTokens < 100000) {
      suggestions.push({
        type: 'info',
        icon: Info,
        title: 'PAYGO is optimal for low volume',
        description: 'Your current usage level works best with pay-as-you-go',
        impact: 'Medium',
        savings: 'Current approach optimal'
      });
    }

    // Input validation suggestions
    if (inputTokens && outputTokens && outputTokens > inputTokens * 3) {
      suggestions.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Unusually high output ratio',
        description: 'Output tokens are 3x input - verify this is correct',
        impact: 'Medium',
        savings: 'Accuracy improvement'
      });
    }

    // Regional optimization
    if (selectedRegion && !['eastus2', 'westus3'].includes(selectedRegion)) {
      suggestions.push({
        type: 'optimization',
        icon: CheckCircle,
        title: 'Consider primary regions for cost',
        description: 'East US 2 and West US 3 often have the best pricing',
        impact: 'Low',
        savings: '5-10% potential savings'
      });
    }

    // Efficiency suggestions
    if (totalTokens > 0) {
      suggestions.push({
        type: 'tip',
        icon: Lightbulb,
        title: 'Optimize for efficiency',
        description: 'Consider prompt optimization and caching strategies',
        impact: 'Medium',
        savings: '10-30% token reduction'
      });
    }

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  };

  const getAlertVariant = (type) => {
    switch (type) {
      case 'warning': return 'destructive';
      case 'optimization': return 'default';
      case 'recommendation': return 'default';
      default: return 'default';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const suggestions = getSuggestions();

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700 flex items-center gap-2">
        <Lightbulb className="h-4 w-4" />
        Smart Suggestions
      </h4>
      
      {suggestions.map((suggestion, index) => {
        const Icon = suggestion.icon;
        return (
          <Alert key={index} variant={getAlertVariant(suggestion.type)} className="border-l-4">
            <Icon className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{suggestion.title}</div>
                  <div className="text-sm mt-1">{suggestion.description}</div>
                  <div className="text-xs mt-2 text-gray-600">
                    Potential impact: {suggestion.savings}
                  </div>
                </div>
                <Badge className={getImpactColor(suggestion.impact)}>
                  {suggestion.impact}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
};

export default SmartSuggestions;