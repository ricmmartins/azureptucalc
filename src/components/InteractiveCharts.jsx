import React, { useState, useMemo, memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { TrendingUp, DollarSign, Zap, BarChart3, Activity, Target, Clock } from 'lucide-react';

const InteractiveCharts = ({ 
  costData, 
  utilizationData, 
  projectionData, 
  burstData,
  currentPricing,
  calculations
}) => {
  const [selectedTab, setSelectedTab] = useState('costs');

  // Cost comparison bar chart data with per-bar colors
  const costComparisonData = useMemo(() => {
    if (!costData) return [];
    const data = [
      { name: 'PAYGO', cost: costData.paygo || 0, fill: '#3b82f6' },
      { name: 'PTU On-Demand', cost: costData.ptuHourly || 0, fill: '#f59e0b' },
      { name: 'PTU Monthly Res.', cost: costData.ptuMonthly || 0, fill: '#10b981' },
      { name: 'PTU 1-Year Res.', cost: costData.ptuYearly || 0, fill: '#8b5cf6' }
    ];
    if (costData.priority != null && costData.priority > 0) {
      data.splice(1, 0, { name: 'Priority', cost: costData.priority, fill: '#d97706' });
    }
    return data;
  }, [costData]);

  // 24-hour utilization pattern scaled to actual user utilization
  const utilizationPattern = useMemo(() => {
    const baseUtil = (calculations?.utilizationRate || 0) * 100;
    const burstRatio = calculations?.burstRatio || 1;

    return Array.from({ length: 24 }, (_, hour) => {
      let scale;
      if (hour >= 9 && hour <= 17) {
        // Peak business hours: full utilization with burst spikes
        scale = 0.8 + (hour === 12 || hour === 14 ? 0.2 * burstRatio / 2 : 0.1);
      } else if (hour >= 6 && hour <= 20) {
        // Shoulder hours: moderate usage
        scale = 0.3 + 0.1 * Math.sin((hour - 6) * Math.PI / 14);
      } else {
        // Night: minimal
        scale = 0.05;
      }
      return {
        hour: `${hour}:00`,
        utilization: Number((baseUtil * Math.min(scale, 1.5)).toFixed(1))
      };
    });
  }, [calculations]);

  // 12-month cost projection: PAYGO grows, PTU reservations are fixed
  const costProjections = useMemo(() => {
    const basePaygo = costData?.paygo || 0;
    const ptuMonthly = costData?.ptuMonthly || 0;
    const ptuYearly = costData?.ptuYearly || 0;
    const priority = costData?.priority;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    return months.map((month, i) => {
      const growth = Math.pow(1.01, i); // 1% monthly PAYGO growth
      const entry = {
        month,
        'PAYGO': Number((basePaygo * growth).toFixed(0)),
        'PTU Monthly Res.': ptuMonthly, // fixed commitment
        'PTU 1-Year Res.': ptuYearly    // fixed commitment
      };
      // Priority Processing scales with usage like PAYGO
      if (priority != null && priority > 0) {
        entry['Priority'] = Number((priority * growth).toFixed(0));
      }
      return entry;
    });
  }, [costData]);

  // Usage pattern donut chart
  const usagePatternData = useMemo(() => {
    const burstRatio = calculations?.burstRatio || 1.0;
    const peakRatio = calculations?.peakRatio || 1.0;

    let steady, burst, peak;
    if (peakRatio >= 5) {
      steady = 10; burst = 10; peak = 80;
    } else if (peakRatio >= 3) {
      steady = 20; burst = 25; peak = 55;
    } else if (peakRatio >= 2) {
      steady = 30; burst = 30; peak = 40;
    } else if (burstRatio >= 1.5) {
      steady = 50; burst = 35; peak = 15;
    } else {
      steady = 70; burst = 20; peak = 10;
    }

    return [
      { name: 'Steady Usage', value: steady, fill: '#10b981' },
      { name: 'Burst Periods', value: burst, fill: '#f59e0b' },
      { name: 'Peak Spikes', value: peak, fill: '#ef4444' }
    ];
  }, [calculations]);

  // Key metrics
  const metrics = useMemo(() => {
    const paygo = costData?.paygo || 0;
    const bestPtu = costData?.ptuYearly || 0;
    const diff = paygo - bestPtu;
    return {
      savings: Math.abs(diff),
      ptuWins: diff > 0,
      savingsLabel: diff > 0 ? 'PTU Savings' : 'PAYGO Advantage',
      utilization: (calculations?.utilizationRate || 0) * 100,
      burstRatio: calculations?.burstRatio || 1.0,
      peakRatio: calculations?.peakRatio || 1.0,
      recommendation: calculations?.recommendation || 'PAYGO',
      usagePattern: calculations?.usagePattern || 'Steady'
    };
  }, [costData, calculations]);

  const formatCurrency = (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <CardTitle>Interactive Analytics Dashboard</CardTitle>
        </div>
        <CardDescription>
          Visualizations derived from your actual usage data and cost calculations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="costs" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Costs
            </TabsTrigger>
            <TabsTrigger value="utilization" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Utilization
            </TabsTrigger>
            <TabsTrigger value="projections" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Projections
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Patterns
            </TabsTrigger>
          </TabsList>

          {/* ── Costs Tab ── */}
          <TabsContent value="costs" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Monthly Cost Comparison</h3>
              <p className="text-sm text-gray-600 mb-4">
                Side-by-side monthly cost for each pricing tier based on your current usage.
              </p>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v), 'Monthly Cost']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                    {costComparisonData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">Recommendation</div>
                    <div className="text-lg font-bold text-blue-800">{metrics.recommendation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-800">{metrics.savingsLabel}</div>
                    <div className="text-lg font-bold text-green-800">{formatCurrency(metrics.savings)}/mo</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium text-purple-800">PTU Utilization</div>
                    <div className="text-lg font-bold text-purple-800">{metrics.utilization.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Utilization Tab ── */}
          <TabsContent value="utilization" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">24-Hour Utilization Pattern</h3>
              <p className="text-sm text-gray-600 mb-4">
                Estimated hourly PTU utilization based on your {metrics.utilization.toFixed(1)}% average rate with business-hours weighting. Peak hours (9AM–5PM) show higher demand.
              </p>

              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={utilizationPattern}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" interval={2} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Utilization']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="utilization"
                    stroke="#3b82f6"
                    fill="#93c5fd"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">Avg Utilization</div>
                    <div className="text-lg font-bold text-blue-800">{metrics.utilization.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium text-orange-800">Burst Ratio</div>
                    <div className="text-lg font-bold text-orange-800">{metrics.burstRatio.toFixed(1)}x</div>
                    <div className="text-xs text-orange-600">P99 / Avg TPM</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-sm font-medium text-red-800">Peak Ratio</div>
                    <div className="text-lg font-bold text-red-800">{metrics.peakRatio.toFixed(1)}x</div>
                    <div className="text-xs text-red-600">Max / Avg TPM</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Projections Tab ── */}
          <TabsContent value="projections" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">12-Month Cost Projection</h3>
              <p className="text-sm text-gray-600 mb-4">
                Pay-per-token costs (PAYGO{costData?.priority != null && costData.priority > 0 ? ', Priority Processing' : ''}) grow at 1% monthly as usage scales. PTU reservations remain fixed — this shows when the crossover point may occur.
              </p>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={costProjections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip
                    formatter={(v, name) => [formatCurrency(v), name]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="PAYGO" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  {costData?.priority != null && costData.priority > 0 && (
                    <Line type="monotone" dataKey="Priority" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
                  )}
                  <Line type="monotone" dataKey="PTU Monthly Res." stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="PTU 1-Year Res." stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">Current PAYGO</div>
                    <div className="text-lg font-bold text-blue-800">{formatCurrency(costData?.paygo || 0)}/mo</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-800">12-Month PAYGO Total</div>
                    <div className="text-lg font-bold text-green-800">
                      {formatCurrency(costProjections.reduce((sum, m) => sum + m['PAYGO'], 0))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium text-purple-800">12-Month 1-Year PTU</div>
                    <div className="text-lg font-bold text-purple-800">
                      {formatCurrency((costData?.ptuYearly || 0) * 12)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Patterns Tab ── */}
          <TabsContent value="patterns" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Usage Pattern Distribution</h3>
              <p className="text-sm text-gray-600 mb-4">
                Workload distribution derived from your Avg/P99/Max TPM ratios. Burst ratio: {metrics.burstRatio.toFixed(1)}x, Peak ratio: {metrics.peakRatio.toFixed(1)}x.
              </p>

              <div className="flex justify-center">
                <ResponsiveContainer width={500} height={400}>
                  <PieChart>
                    <Pie
                      data={usagePatternData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={140}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value, cx, cy, midAngle, outerRadius }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 30;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x} y={y} fill="#374151"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            fontSize="12" fontWeight="500"
                          >
                            {`${name}: ${value}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                    >
                      {usagePatternData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center mt-4">
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-green-600 font-medium">Steady Usage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-orange-600 font-medium">Burst Periods</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-red-600 font-medium">Peak Spikes</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Target className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-800">Usage Pattern</div>
                    <div className="text-lg font-bold text-green-800">{metrics.usagePattern}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium text-orange-800">Burst Ratio</div>
                    <div className="text-lg font-bold text-orange-800">{metrics.burstRatio.toFixed(1)}x</div>
                    <div className="text-xs text-orange-600">P99 / Avg TPM</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-sm font-medium text-red-800">Peak Ratio</div>
                    <div className="text-lg font-bold text-red-800">{metrics.peakRatio.toFixed(1)}x</div>
                    <div className="text-xs text-red-600">Max / Avg TPM</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default memo(InteractiveCharts);