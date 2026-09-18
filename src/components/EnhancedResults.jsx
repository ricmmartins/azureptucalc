// Enhanced Results Component with better presentation
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { TrendingDown, TrendingUp, DollarSign, Download, Copy, ChevronDown, ChevronRight } from 'lucide-react';

export const EnhancedResults = ({ results, onExport }) => {
  const [expandedSections, setExpandedSections] = useState({
    executive: true,
    breakdown: false,
    details: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (!results || Object.keys(results).length === 0) {
    return null;
  }

  const monthlySavings = results.monthlySavings || 0;
  const recommendation = results.recommendation || 'PAYGO';

  const getSavingsBadge = () => {
    if (results.recommendationDetails?.requiresReview) {
      return <Badge className="bg-yellow-100 text-yellow-800">Latency review required</Badge>;
    }
    if (results.recommendationDetails?.strategy === 'paygo') {
      const paygoAdvantage = Math.abs(monthlySavings);
      if (paygoAdvantage > 1000) return <Badge className="bg-blue-100 text-blue-800">PAYGO Best Value</Badge>;
      if (paygoAdvantage > 100) return <Badge className="bg-blue-100 text-blue-800">PAYGO Recommended</Badge>;
      return <Badge className="bg-yellow-100 text-yellow-800">Near Break-Even</Badge>;
    }
    if (results.recommendationDetails?.strategy === 'ptu') {
      if (monthlySavings > 1000) return <Badge className="bg-green-100 text-green-800">Significant PTU Savings</Badge>;
      if (monthlySavings > 100) return <Badge className="bg-green-100 text-green-800">PTU Cost-Effective</Badge>;
      return <Badge className="bg-yellow-100 text-yellow-800">Moderate Savings</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Spillover Recommended</Badge>;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Executive Summary */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('executive')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-green-700">Executive Summary</CardTitle>
            {expandedSections.executive ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.executive && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${monthlySavings >= 0 ? 'bg-green-50' : 'bg-blue-50'} p-4 rounded-lg`}>
                <div className="flex items-center gap-2">
                  {monthlySavings >= 0 ? 
                    <TrendingDown className="h-5 w-5 text-green-600" /> :
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  }
                  <span className="font-medium">{monthlySavings >= 0 ? '1-Year PTU Savings' : 'Selected PAYGO Advantage'}</span>
                </div>
                <div className={`text-2xl font-bold ${monthlySavings >= 0 ? 'text-green-700' : 'text-blue-700'}`}>
                  {formatCurrency(Math.abs(monthlySavings))}
                </div>
                <div className={`text-sm ${monthlySavings >= 0 ? 'text-green-600' : 'text-blue-600'}`}>
                  {monthlySavings >= 0 ? 'vs selected PAYGO mix' : 'vs 1-year PTU monthly equivalent'}
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Recommended</span>
                </div>
                <div className="text-lg font-bold text-blue-700">
                  {recommendation}
                </div>
                <div className="text-sm text-blue-600">
                  {getSavingsBadge()}
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Annual Impact</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency(Math.abs(monthlySavings) * 12)}
                </div>
                <div className="text-sm text-purple-600">
                  {monthlySavings >= 0 ? '1-year PTU vs selected PAYGO mix' : 'selected PAYGO vs 1-year PTU'}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">
                {results.recommendationIcon || '📊'} Smart Recommendation
              </h4>
              <p className="text-sm text-gray-600">{results.recommendationReason || 'Enter usage data to see recommendations.'}</p>
              <p className="text-sm text-gray-600 mt-2">
                PAYGO mix: {results.processingScenario?.priorityShare ?? 0}% Priority.
                {' '}Spillover mix: {results.processingScenario?.spilloverPriorityShare ?? 0}% Priority.
                {' '}Savings above compare the selected PAYGO mix with a 1-year PTU reservation; they are not a latency guarantee.
              </p>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={onExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Summary
              </Button>
              <Button 
                onClick={() => navigator.clipboard.writeText(JSON.stringify(results, null, 2))}
                variant="outline" 
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Results
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('breakdown')}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Cost Breakdown</CardTitle>
            {expandedSections.breakdown ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.breakdown && (
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Selected PAYGO mix ({results.processingScenario?.priorityShare ?? 0}% Priority)</span>
                <span className="font-semibold">{formatCurrency(results.monthlyPaygoCost)}</span>
              </div>
              {results.isPrioritySupported && results.monthlyPriorityCost > 0 && (
                <div className="flex justify-between items-center p-2 bg-amber-50 rounded">
                  <span className="text-sm font-medium">Priority Processing (100% reference)</span>
                  <span className="font-semibold">{formatCurrency(results.monthlyPriorityCost)}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-sm font-medium">PTU On-Demand ({results.ptuNeeded || 0} PTUs)</span>
                <span className="font-semibold">{formatCurrency(results.monthlyPtuCost)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="text-sm font-medium">PTU Monthly Reservation</span>
                <span className="font-semibold">{formatCurrency(results.monthlyPtuReservationCost)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                <span className="text-sm font-medium">PTU 1-Year Reservation</span>
                <span className="font-semibold">{formatCurrency(results.yearlyReservationMonthly)}</span>
              </div>
              {results.hybridTotalCost != null && (
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-sm font-medium">Spillover, monthly base ({results.processingScenario?.spilloverPriorityShare ?? 0}% Priority)</span>
                  <span className="font-semibold">{formatCurrency(results.hybridTotalCost)}</span>
                </div>
              )}
              {results.hybridYearlyTotalCost != null && (
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-sm font-medium">Spillover, 1-year base ({results.processingScenario?.spilloverPriorityShare ?? 0}% Priority)</span>
                  <span className="font-semibold">{formatCurrency(results.hybridYearlyTotalCost)}</span>
                </div>
              )}
              {results.spilloverUnavailableReason && <p role="alert">Spillover unavailable: {results.spilloverUnavailableReason}</p>}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('details')}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Technical Details</CardTitle>
            {expandedSections.details ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.details && (
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Utilization Rate</span>
                <span className="font-medium">{((results.utilizationRate || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Usage Pattern</span>
                <span className="font-medium">{results.usagePattern || 'Steady'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Burst Ratio</span>
                <span className="font-medium">{(results.burstRatio || 1).toFixed(2)}x</span>
              </div>
              {results.breakEvenAnalysis && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Break-Even PTUs</span>
                  <span className="font-medium">{results.breakEvenAnalysis.breakEvenPTUs || 0}</span>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default EnhancedResults;