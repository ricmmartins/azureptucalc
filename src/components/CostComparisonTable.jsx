import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle,
  Calendar,
  Zap,
  Percent
} from 'lucide-react';

const CostComparisonTable = ({ calculations, currentPricing }) => {
  if (!calculations || Object.keys(calculations).length === 0) {
    return null;
  }

  const {
    monthlyPaygoCost,
    monthlyPtuReservationCost,
    monthlyPtuHourlyCost,
    yearlyPtuReservationCost,
    ptuNeeded,
    utilizationRate,
    monthlySavings,
    oneYearSavings,
    threeYearSavings
  } = calculations;

  // Calculate comparison metrics
  const paygoAnnual = monthlyPaygoCost * 12;
  const ptuHourlyAnnual = monthlyPtuHourlyCost * 12;
  const ptuReservationAnnual = monthlyPtuReservationCost * 12;
  const ptuYearlyReservationAnnual = yearlyPtuReservationCost;

  const monthlySavingsPercent = monthlyPaygoCost > 0 ? 
    ((monthlySavings || 0) / monthlyPaygoCost) * 100 : 0;
  
  const annualSavingsVsPaygo = paygoAnnual - ptuReservationAnnual;
  const annualSavingsPercent = paygoAnnual > 0 ? 
    (annualSavingsVsPaygo / paygoAnnual) * 100 : 0;

  // Determine best option
  const costs = [
    { name: 'PAYGO', monthly: monthlyPaygoCost, annual: paygoAnnual },
    { name: 'PTU Hourly', monthly: monthlyPtuHourlyCost, annual: ptuHourlyAnnual },
    { name: 'PTU Monthly', monthly: monthlyPtuReservationCost, annual: ptuReservationAnnual },
    { name: 'PTU Yearly', monthly: yearlyPtuReservationCost / 12, annual: ptuYearlyReservationAnnual }
  ];

  const bestMonthly = costs.reduce((prev, current) => 
    current.monthly < prev.monthly ? current : prev
  );
  const bestAnnual = costs.reduce((prev, current) => 
    current.annual < prev.annual ? current : prev
  );

  const formatCurrency = (amount) => `$${amount?.toFixed(2) || '0.00'}`;
  const formatPercent = (percent) => `${percent?.toFixed(1) || '0.0'}%`;

  return (
    <Card className="cost-comparison mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <CardTitle>Cost Comparison Analysis</CardTitle>
        </div>
        <p className="text-sm text-gray-600">
          Side-by-side comparison of PAYGO vs PTU pricing options for {ptuNeeded || 0} PTUs
        </p>
      </CardHeader>
      
      <CardContent>
        {/* Main Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold text-gray-700">Pricing Model</th>
                <th className="text-center p-3 font-semibold text-gray-700">Monthly Cost</th>
                <th className="text-center p-3 font-semibold text-gray-700">Annual Cost</th>
                <th className="text-center p-3 font-semibold text-gray-700">vs PAYGO</th>
                <th className="text-center p-3 font-semibold text-gray-700">Best For</th>
              </tr>
            </thead>
            <tbody>
              {/* PAYGO Row */}
              <tr className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Pay-as-you-go</div>
                      <div className="text-sm text-gray-500">No commitment</div>
                    </div>
                    {bestMonthly.name === 'PAYGO' && (
                      <Badge className="ml-2 bg-green-100 text-green-800">Best Monthly</Badge>
                    )}
                  </div>
                </td>
                <td className="text-center p-3">
                  <div className="font-bold text-lg">{formatCurrency(monthlyPaygoCost)}</div>
                  <div className="text-sm text-gray-500">Variable usage</div>
                </td>
                <td className="text-center p-3">
                  <div className="font-bold text-lg">{formatCurrency(paygoAnnual)}</div>
                  <div className="text-sm text-gray-500">Scales with usage</div>
                </td>
                <td className="text-center p-3">
                  <div className="text-gray-500">—</div>
                  <div className="text-sm text-gray-500">Baseline</div>
                </td>
                <td className="text-center p-3">
                  <div className="text-sm text-gray-600">Low/Variable usage</div>
                  <div className="text-xs text-gray-500">&lt;20% utilization</div>
                </td>
              </tr>

              {/* PTU Hourly Row */}
              <tr className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">PTU Hourly</div>
                      <div className="text-sm text-gray-500">Hourly billing</div>
                    </div>
                  </div>
                </td>
                <td className="text-center p-3">
                  <div className="font-bold text-lg">{formatCurrency(monthlyPtuHourlyCost)}</div>
                  <div className="text-sm text-gray-500">{ptuNeeded} PTUs</div>
                </td>
                <td className="text-center p-3">
                  <div className="font-bold text-lg">{formatCurrency(ptuHourlyAnnual)}</div>
                  <div className="text-sm text-gray-500">No commitment</div>
                </td>
                <td className="text-center p-3">
                  {ptuHourlyAnnual < paygoAnnual ? (
                    <div className="text-green-600 flex items-center justify-center gap-1">
                      <TrendingDown className="h-4 w-4" />
                      <span className="font-medium">
                        {formatPercent(((paygoAnnual - ptuHourlyAnnual) / paygoAnnual) * 100)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-red-600 flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">
                        +{formatPercent(((ptuHourlyAnnual - paygoAnnual) / paygoAnnual) * 100)}
                      </span>
                    </div>
                  )}
                </td>
                <td className="text-center p-3">
                  <div className="text-sm text-gray-600">Predictable workloads</div>
                  <div className="text-xs text-gray-500">20-60% utilization</div>
                </td>
              </tr>

              {/* PTU Monthly Row */}
              <tr className="border-b hover:bg-gray-50 bg-green-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">PTU Monthly Reservation</div>
                      <div className="text-sm text-gray-500">1-month commitment</div>
                    </div>
                    {bestMonthly.name === 'PTU Monthly' && (
                      <Badge className="ml-2 bg-green-100 text-green-800">Best Monthly</Badge>
                    )}
                  </div>
                </td>
                <td className="text-center p-3">
                  <div className="font-bold text-lg text-green-700">{formatCurrency(monthlyPtuReservationCost)}</div>
                  <div className="text-sm text-green-600">{ptuNeeded} PTUs reserved</div>
                </td>
                <td className="text-center p-3">
                  <div className="font-bold text-lg text-green-700">{formatCurrency(ptuReservationAnnual)}</div>
                  <div className="text-sm text-green-600">~25% discount</div>
                </td>
                <td className="text-center p-3">
                  {ptuReservationAnnual < paygoAnnual ? (
                    <div className="text-green-600 flex items-center justify-center gap-1">
                      <TrendingDown className="h-4 w-4" />
                      <span className="font-bold">
                        {formatPercent(annualSavingsPercent)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-red-600 flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">
                        +{formatPercent(((ptuReservationAnnual - paygoAnnual) / paygoAnnual) * 100)}
                      </span>
                    </div>
                  )}
                </td>
                <td className="text-center p-3">
                  <div className="text-sm text-gray-600">Consistent workloads</div>
                  <div className="text-xs text-gray-500">&gt;60% utilization</div>
                </td>
              </tr>

              {/* PTU Yearly Row */}
              <tr className="border-b hover:bg-gray-50 bg-blue-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div>
                      <div className="font-medium">PTU Yearly Reservation</div>
                      <div className="text-sm text-gray-500">12-month commitment</div>
                    </div>
                    {bestAnnual.name === 'PTU Yearly' && (
                      <Badge className="ml-2 bg-blue-100 text-blue-800">Best Annual</Badge>
                    )}
                  </div>
                </td>
                <td className="text-center p-3">
                  <div className="font-bold text-lg text-blue-700">{formatCurrency(yearlyPtuReservationCost / 12)}</div>
                  <div className="text-sm text-blue-600">Yearly prepaid</div>
                </td>
                <td className="text-center p-3">
                  <div className="font-bold text-lg text-blue-700">{formatCurrency(ptuYearlyReservationAnnual)}</div>
                  <div className="text-sm text-blue-600">~40% discount</div>
                </td>
                <td className="text-center p-3">
                  {ptuYearlyReservationAnnual < paygoAnnual ? (
                    <div className="text-green-600 flex items-center justify-center gap-1">
                      <TrendingDown className="h-4 w-4" />
                      <span className="font-bold">
                        {formatPercent(((paygoAnnual - ptuYearlyReservationAnnual) / paygoAnnual) * 100)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-red-600 flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">
                        +{formatPercent(((ptuYearlyReservationAnnual - paygoAnnual) / paygoAnnual) * 100)}
                      </span>
                    </div>
                  )}
                </td>
                <td className="text-center p-3">
                  <div className="text-sm text-gray-600">Long-term projects</div>
                  <div className="text-xs text-gray-500">High utilization</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Key Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Recommended</span>
            </div>
            <div className="text-lg font-bold text-green-700">{bestMonthly.name}</div>
            <div className="text-sm text-green-600">Lowest monthly cost</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Annual Savings</span>
            </div>
            <div className="text-lg font-bold text-blue-700">{formatCurrency(annualSavingsVsPaygo)}</div>
            <div className="text-sm text-blue-600">vs PAYGO annually</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-orange-800">Utilization</span>
            </div>
            <div className="text-lg font-bold text-orange-700">{formatPercent((utilizationRate || 0) * 100)}</div>
            <div className="text-sm text-orange-600">Current efficiency</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostComparisonTable;