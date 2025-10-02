import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Calendar,
  Percent,
  Target,
  Award
} from 'lucide-react';

const SavingsHighlight = ({ calculations }) => {
  if (!calculations || Object.keys(calculations).length === 0) {
    return null;
  }

  const {
    monthlyPaygoCost,
    monthlyPtuReservationCost,
    monthlySavings,
    oneYearSavings,
    threeYearSavings,
    utilizationRate,
    recommendation
  } = calculations;

  // Calculate savings metrics
  const annualSavings = (monthlySavings || 0) * 12;
  const threeYearTotalSavings = (threeYearSavings || 0) * 12 * 3;
  
  const monthlySavingsPercent = monthlyPaygoCost > 0 ? 
    ((monthlySavings || 0) / monthlyPaygoCost) * 100 : 0;
  
  const annualSavingsPercent = monthlyPaygoCost > 0 ? 
    (annualSavings / (monthlyPaygoCost * 12)) * 100 : 0;

  // Determine if there are actual savings
  const hasSavings = (monthlySavings || 0) > 0;
  const isHighSavings = monthlySavingsPercent > 20;
  const isModerateSavings = monthlySavingsPercent > 10 && monthlySavingsPercent <= 20;

  // Get appropriate styling based on savings level
  const getSavingsStyle = () => {
    if (!hasSavings) {
      return {
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-700',
        accentColor: 'text-gray-600',
        badgeVariant: 'secondary'
      };
    } else if (isHighSavings) {
      return {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        accentColor: 'text-green-600',
        badgeVariant: 'default'
      };
    } else if (isModerateSavings) {
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        accentColor: 'text-blue-600',
        badgeVariant: 'secondary'
      };
    } else {
      return {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        accentColor: 'text-yellow-600',
        badgeVariant: 'outline'
      };
    }
  };

  const style = getSavingsStyle();
  const formatCurrency = (amount) => `$${amount?.toFixed(0) || '0'}`;
  const formatPercent = (percent) => `${percent?.toFixed(1) || '0.0'}%`;

  return (
    <Card className={`savings-highlight ${style.bgColor} ${style.borderColor} mb-6 shadow-lg`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasSavings ? (
              <div className="relative">
                <DollarSign className={`h-6 w-6 ${style.accentColor}`} />
                {isHighSavings && <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />}
              </div>
            ) : (
              <TrendingUp className={`h-6 w-6 ${style.accentColor}`} />
            )}
            <div>
              <CardTitle className={`text-xl ${style.textColor}`}>
                {hasSavings ? 'Potential Cost Savings' : 'Cost Analysis'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {hasSavings 
                  ? 'Projected savings by switching to PTU reservations'
                  : 'Current cost structure analysis'
                }
              </p>
            </div>
          </div>
          {hasSavings && (
            <Badge variant={style.badgeVariant} className="text-sm px-3 py-1">
              {isHighSavings ? 'High Savings' : isModerateSavings ? 'Moderate Savings' : 'Low Savings'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {hasSavings ? (
          <div className="space-y-6">
            {/* Main Savings Display */}
            <div className="text-center p-6 bg-white rounded-lg border-2 border-dashed border-green-300">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Award className="h-8 w-8 text-green-600" />
                <span className="text-lg font-semibold text-green-800">Monthly Savings</span>
              </div>
              <div className="text-5xl font-bold text-green-700 mb-2">
                {formatCurrency(monthlySavings)}
              </div>
              <div className="text-xl text-green-600">
                {formatPercent(monthlySavingsPercent)} reduction in costs
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Switching from PAYGO to PTU Monthly Reservations
              </p>
            </div>

            {/* Savings Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Annual Projection */}
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Annual Savings</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(annualSavings)}
                </div>
                <div className="text-sm text-blue-600">
                  {formatPercent(annualSavingsPercent)} annually
                </div>
              </div>

              {/* 3-Year Projection */}
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-800">3-Year Impact</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency(threeYearTotalSavings)}
                </div>
                <div className="text-sm text-purple-600">
                  Long-term savings
                </div>
              </div>

              {/* Break-even Time */}
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-orange-800">ROI Timeline</span>
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  Immediate
                </div>
                <div className="text-sm text-orange-600">
                  Savings start month 1
                </div>
              </div>
            </div>

            {/* Savings Visualization */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-800 mb-3">Monthly Cost Comparison</h4>
              <div className="space-y-3">
                {/* PAYGO Bar */}
                <div className="flex items-center gap-3">
                  <span className="w-20 text-sm text-gray-600">PAYGO:</span>
                  <div className="flex-1 bg-red-200 rounded-full h-6 relative">
                    <div 
                      className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-3"
                      style={{ width: '100%' }}
                    >
                      <span className="text-white text-sm font-medium">
                        {formatCurrency(monthlyPaygoCost)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* PTU Bar */}
                <div className="flex items-center gap-3">
                  <span className="w-20 text-sm text-gray-600">PTU:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div 
                      className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-3"
                      style={{ 
                        width: `${(monthlyPtuReservationCost / monthlyPaygoCost) * 100}%` 
                      }}
                    >
                      <span className="text-white text-sm font-medium">
                        {formatCurrency(monthlyPtuReservationCost)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Savings Highlight */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <span className="w-20 text-sm font-medium text-green-600">Savings:</span>
                  <div className="flex-1">
                    <span className="text-lg font-bold text-green-700">
                      {formatCurrency(monthlySavings)} ({formatPercent(monthlySavingsPercent)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* No Savings Display */
          <div className="text-center p-6">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Current Setup Analysis
            </h3>
            <p className="text-gray-600 mb-4">
              Based on your usage pattern, PAYGO appears to be the most cost-effective option currently.
            </p>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-700 mb-1">
                {formatCurrency(monthlyPaygoCost)}
              </div>
              <div className="text-sm text-gray-600">
                Current monthly PAYGO cost
              </div>
              <div className="mt-3 text-sm text-gray-500">
                Utilization: {formatPercent((utilizationRate || 0) * 100)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavingsHighlight;