import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Zap,
  Calendar,
  Target,
  ArrowRight
} from 'lucide-react';

const ExecutiveSummary = ({ calculations, currentPricing, onExportCSV, onExportJSON, onShowCharts }) => {
  if (!calculations || Object.keys(calculations).length === 0) {
    return null;
  }

  // Scroll to section functionality
  const scrollToSection = (sectionClass) => {
    const section = document.querySelector(`.${sectionClass}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add visual highlight
      section.style.transform = 'scale(1.02)';
      section.style.transition = 'transform 0.3s ease';
      setTimeout(() => {
        section.style.transform = 'scale(1)';
      }, 600);
    } else {
      // If specific section not found, scroll to results
      const resultsSection = document.querySelector('[class*="results"]') || document.querySelector('.card');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Handle export functionality
  const handleExport = () => {
    if (onExportCSV) {
      onExportCSV();
      // Simple feedback
      setTimeout(() => {
        alert('✅ Report export initiated! Check your downloads folder.');
      }, 500);
    } else {
      // Fallback to finding export section
      scrollToSection('export-section');
    }
  };

  // Handle chart visibility
  const handleShowCharts = () => {
    if (onShowCharts) {
      onShowCharts();
    } else {
      // Fallback to scrolling to charts
      scrollToSection('interactive-charts-section');
    }
  };

  const {
    recommendation,
    recommendationReason,
    recommendationIcon,
    monthlyPaygoCost,
    monthlyPtuReservationCost,
    monthlySavings,
    oneYearSavings,
    threeYearSavings,
    utilizationRate,
    ptuNeeded,
    usagePattern
  } = calculations;

  // Calculate key metrics
  const monthlySavingsPercent = monthlyPaygoCost > 0 ? 
    ((monthlySavings || 0) / monthlyPaygoCost) * 100 : 0;
  
  const annualSavings = (monthlySavings || 0) * 12;
  const threeYearTotalSavings = (threeYearSavings || 0) * 12 * 3;

  // Determine recommendation urgency and style
  const getRecommendationStyle = () => {
    if (recommendation === 'Full PTU Reservation') {
      return {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        badgeVariant: 'default',
        icon: <CheckCircle className="h-5 w-5 text-green-600" />
      };
    } else if (recommendation === 'Consider Hybrid Model') {
      return {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        badgeVariant: 'secondary',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />
      };
    } else {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        badgeVariant: 'destructive',
        icon: <TrendingDown className="h-5 w-5 text-red-600" />
      };
    }
  };

  const style = getRecommendationStyle();

  return (
    <Card className={`executive-summary ${style.bgColor} ${style.borderColor} mb-6 shadow-lg`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {style.icon}
            <div>
              <CardTitle className={`text-xl ${style.textColor}`}>
                Executive Summary
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Key insights and recommendations for your Azure OpenAI deployment
              </p>
            </div>
          </div>
          <Badge variant={style.badgeVariant} className="text-sm px-3 py-1">
            {recommendation}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Primary Recommendation */}
        <Alert className={`${style.bgColor} ${style.borderColor}`}>
          <AlertDescription className="flex items-start gap-3">
            <span className="text-2xl">{recommendationIcon}</span>
            <div>
              <h4 className={`font-semibold ${style.textColor} mb-2`}>
                Recommended Strategy: {recommendation}
              </h4>
              <p className="text-gray-700">
                {recommendationReason}
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Monthly Savings */}
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Monthly Savings</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${(monthlySavings || 0).toFixed(0)}
            </div>
            <div className="text-sm text-gray-500">
              {monthlySavingsPercent.toFixed(1)}% reduction
            </div>
          </div>

          {/* Annual Impact */}
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Annual Impact</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ${annualSavings.toFixed(0)}
            </div>
            <div className="text-sm text-gray-500">
              12-month projection
            </div>
          </div>

          {/* Utilization */}
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Utilization</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {((utilizationRate || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">
              {usagePattern || 'N/A'} pattern
            </div>
          </div>

          {/* PTU Recommendation */}
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Recommended PTUs</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {ptuNeeded || 0}
            </div>
            <div className="text-sm text-gray-500">
              {currentPricing?.minPTU && ptuNeeded === currentPricing.minPTU ? 'Minimum' : 'Optimized'}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <Button 
            className="flex items-center gap-2"
            onClick={() => scrollToSection('results-section')}
          >
            <ArrowRight className="h-4 w-4" />
            View Detailed Analysis
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => scrollToSection('cost-comparison')}
          >
            <DollarSign className="h-4 w-4" />
            Compare Costs
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleExport}
          >
            <TrendingUp className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutiveSummary;