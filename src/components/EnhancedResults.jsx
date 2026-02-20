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
    }).format(amount);
  };

  const getSavingsBadge = (savings) => {
    const percent = (savings.percentage || 0);
    if (percent > 20) return <Badge className="bg-green-100 text-green-800">Significant Savings</Badge>;
    if (percent > 5) return <Badge className="bg-yellow-100 text-yellow-800">Moderate Savings</Badge>;
    return <Badge className="bg-blue-100 text-blue-800">Current Optimal</Badge>;
  };

  const getRecommendation = () => {
    const { recommended, monthlyUsage } = results;
    if (monthlyUsage > 500000) return "High volume detected - PTU recommended";
    if (monthlyUsage < 50000) return "Low volume - PAYGO is most cost-effective";
    return "Variable usage - consider hybrid approach";
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
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Monthly Savings</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(results.savings?.monthly || 0)}
                </div>
                <div className="text-sm text-green-600">
                  vs current spending
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Recommended</span>
                </div>
                <div className="text-lg font-bold text-blue-700">
                  {results.recommended?.toUpperCase() || 'HYBRID'}
                </div>
                <div className="text-sm text-blue-600">
                  {getSavingsBadge(results.savings)}
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Annual Impact</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency((results.savings?.monthly || 0) * 12)}
                </div>
                <div className="text-sm text-purple-600">
                  projected savings
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Smart Recommendation</h4>
              <p className="text-sm text-gray-600">{getRecommendation()}</p>
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
            <div className="space-y-4">
              {/* Cost comparison table would go here */}
              <div className="text-sm text-gray-500">
                Detailed cost breakdown by pricing model...
              </div>
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
            <div className="space-y-4">
              {/* Technical details would go here */}
              <div className="text-sm text-gray-500">
                Model specifications, regional pricing, etc...
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default EnhancedResults;