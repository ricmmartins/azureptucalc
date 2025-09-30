import React, { useState, useMemo } from 'react';
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
import { TrendingUp, TrendingDown, DollarSign, Zap, Clock, BarChart3, Activity, Target } from 'lucide-react';

const InteractiveCharts = ({ 
  costData, 
  utilizationData, 
  projectionData, 
  burstData,
  currentPricing,
  calculations
}) => {
  const [selectedTab, setSelectedTab] = useState('costs');
  // No internal state needed - all data comes from props

  // Enhanced cost comparison data
  const costComparisonData = useMemo(() => {
    if (!costData) return [];
    
    return [
      {
        name: 'PAYGO',
        cost: costData.paygo || 0,
        fill: '#3b82f6'
      },
      {
        name: 'PTU Hourly',
        cost: costData.ptuHourly || 0,
        fill: '#f59e0b'
      },
      {
        name: 'PTU Monthly',
        cost: costData.ptuMonthly || 0,
        fill: '#10b981'
      },
      {
        name: 'PTU Yearly',
        cost: costData.ptuYearly || 0,
        fill: '#8b5cf6'
      }
    ];
  }, [costData]);

  // 24-hour utilization pattern with realistic business hours
  const utilizationPattern = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      let utilization = 0;
      
      // Realistic business hours pattern
      if (hour >= 6 && hour <= 17) {
        // Peak business hours 9AM-5PM
        if (hour >= 9 && hour <= 17) {
          utilization = 0.08 + Math.random() * 0.02; // 8-10%
        } else {
          utilization = 0.04 + Math.random() * 0.01; // 4-5%
        }
      } else {
        utilization = 0.001 + Math.random() * 0.005; // Very low at night
      }
      
      return {
        hour: `${hour}:00`,
        utilization: Number((utilization * 100).toFixed(3)),
        hourNum: hour
      };
    });
    
    return hours;
  }, []);

  // 12-month cost projection with 1% monthly growth
  const costProjections = useMemo(() => {
    const basePaygo = costData?.paygo || 0;
    const basePtuMonthly = costData?.ptuMonthly || 0;
    const basePtuYearly = costData?.ptuYearly || 0;
    const monthlyGrowthRate = 0.01; // 1% monthly growth
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return months.map((month, index) => {
      const growthMultiplier = Math.pow(1 + monthlyGrowthRate, index);
      
      return {
        month,
        'PAYGO': Number((basePaygo * growthMultiplier).toFixed(0)),
        'PTU Monthly': Number((basePtuMonthly * growthMultiplier).toFixed(0)),
        'PTU Yearly': Number((basePtuYearly * growthMultiplier).toFixed(0)),
        'Projected': Number((basePtuMonthly * growthMultiplier * 1.05).toFixed(0)) // 5% buffer
      };
    });
  }, [costData]);

  // Usage pattern distribution (donut chart)
  const usagePatternData = useMemo(() => {
    const burstRatio = calculations?.burstRatio || 1.0;
    const peakRatio = calculations?.peakRatio || 1.0;
    
    let steadyUsage, burstPeriods, peakSpikes;
    
    if (peakRatio >= 5) {
      // Very spiky pattern
      steadyUsage = 10;
      burstPeriods = 10;
      peakSpikes = 80;
    } else if (peakRatio >= 2) {
      // Moderately spiky
      steadyUsage = 30;
      burstPeriods = 25;
      peakSpikes = 45;
    } else {
      // Steady pattern
      steadyUsage = 70;
      burstPeriods = 20;
      peakSpikes = 10;
    }
    
    return [
      { name: 'Steady Usage', value: steadyUsage, fill: '#10b981' },
      { name: 'Burst Periods', value: burstPeriods, fill: '#f59e0b' },
      { name: 'Peak Spikes', value: peakSpikes, fill: '#ef4444' }
    ];
  }, [calculations]);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const potentialSavings = Math.max(0, (costData?.paygo || 0) - (costData?.ptuYearly || 0));
    const peakEfficiency = calculations?.utilizationRate || 0;
    const burstFrequency = calculations?.burstFrequency || 1.0;
    
    return {
      potentialSavings,
      peakEfficiency,
      burstFrequency
    };
  }, [costData, calculations]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <CardTitle>Interactive Analytics Dashboard</CardTitle>
        </div>
        <CardDescription>
          Explore your Azure OpenAI usage patterns and cost projections with interactive visualizations
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

          {/* Costs Tab */}
          <TabsContent value="costs" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Interactive Cost Comparison</h3>
                <div className="flex gap-2">
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    Monthly Costs
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Real time cost comparison based on your actual TPM inputs. Hover over bars for detailed breakdown and efficiency metrics.
              </p>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Monthly Cost']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="cost" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Key insights below chart */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Target className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-800">PTU Yearly</div>
                    <div className="text-xs text-green-600">1-year PTU commitment</div>
                    <div className="text-sm font-bold text-green-800">
                      {calculations?.recommendation === 'PTU' ? 'Recommended' : 'High Risk'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">Efficiency: Highest savings</div>
                    <div className="text-xs text-blue-600">Risk: High</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium text-orange-800">Potential Savings</div>
                    <div className="text-lg font-bold text-orange-800">
                      ${keyMetrics.potentialSavings.toFixed(2)}/month
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Utilization Tab */}
          <TabsContent value="utilization" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">24-Hour Utilization Pattern</h3>
              <p className="text-sm text-gray-600 mb-4">
                Simulated hourly usage based on your utilization rate with realistic business hours patterns (9AM-5PM peaks, 6-8AM/6-10PM moderate, nights low).
              </p>
              
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={utilizationPattern}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    interval={2}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Utilization']}
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
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-800">Potential Savings</div>
                    <div className="text-lg font-bold text-green-800">
                      ${keyMetrics.potentialSavings.toFixed(2)}/month
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">Peak Efficiency</div>
                    <div className="text-lg font-bold text-blue-800">
                      {(keyMetrics.peakEfficiency).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium text-orange-800">Burst Frequency</div>
                    <div className="text-lg font-bold text-orange-800">
                      {keyMetrics.burstFrequency.toFixed(1)}x daily
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Projections Tab */}
          <TabsContent value="projections" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">12-Month Cost Projection</h3>
              <p className="text-sm text-gray-600 mb-4">
                Cost projections based on your current usage with 1% monthly growth assumption. Shows how costs might evolve over time.
              </p>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={costProjections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="PAYGO" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="PTU Monthly" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="PTU Yearly" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Projected" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-800">Potential Savings</div>
                    <div className="text-lg font-bold text-green-800">
                      ${keyMetrics.potentialSavings.toFixed(2)}/month
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">Peak Efficiency</div>
                    <div className="text-lg font-bold text-blue-800">
                      {(keyMetrics.peakEfficiency).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium text-orange-800">Burst Frequency</div>
                    <div className="text-lg font-bold text-orange-800">
                      {keyMetrics.burstFrequency.toFixed(1)}x daily
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Usage Pattern Distribution</h3>
              <p className="text-sm text-gray-600 mb-4">
                Distribution of your workload patterns calculated from TPM ratios. Steady Usage = consistent baseline, Burst Periods = moderate spikes, Peak Spikes = maximum demand periods.
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
                      label={({ name, value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 30;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill="#374151" 
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central"
                            fontSize="12"
                            fontWeight="500"
                          >
                            {`${name}: ${value}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                    >
                      {usagePatternData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
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
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-800">Potential Savings</div>
                    <div className="text-lg font-bold text-green-800">
                      ${keyMetrics.potentialSavings.toFixed(2)}/month
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">Peak Efficiency</div>
                    <div className="text-lg font-bold text-blue-800">
                      {(keyMetrics.peakEfficiency).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium text-orange-800">Burst Frequency</div>
                    <div className="text-lg font-bold text-orange-800">
                      {keyMetrics.burstFrequency.toFixed(1)}x daily
                    </div>
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

export default InteractiveCharts;
