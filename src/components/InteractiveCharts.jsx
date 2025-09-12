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
  ComposedChart,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Zap, Clock, BarChart3 } from 'lucide-react';

const InteractiveCharts = ({ 
  costData, 
  utilizationData, 
  projectionData, 
  burstData,
}) => {
  const [activeChart, setActiveChart] = useState('cost-comparison');
  const [hoveredData, setHoveredData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('monthly');

  // Enhanced cost comparison data with interactive features
  const enhancedCostData = useMemo(() => {
    if (!costData) return [];
    
    return [
      {
        name: 'PAYGO',
        cost: costData.paygo || 0,
        color: '#3b82f6',
        icon: '💳',
        description: 'Pay-as-you-go pricing',
        efficiency: 'High for low usage',
        risk: 'Low'
      },
      {
        name: 'PTU Hourly',
        cost: costData.ptuHourly || 0,
        color: '#f59e0b',
        icon: '⚡',
        description: 'On-demand PTU reservation',
        efficiency: 'Medium',
        risk: 'Medium'
      },
      {
        name: 'PTU Monthly',
        cost: costData.ptuMonthly || 0,
        color: '#10b981',
        icon: '📅',
        description: '1-month PTU commitment',
        efficiency: 'High for steady usage',
        risk: 'Low'
      },
      {
        name: 'PTU Yearly',
        cost: costData.ptuYearly || 0,
        color: '#8b5cf6',
        icon: '🎯',
        description: '1-year PTU commitment',
        efficiency: 'Highest savings',
        risk: 'High'
      }
    ];
  }, [costData]);

  // Utilization timeline data
  const utilizationTimeline = useMemo(() => {
    if (!utilizationData) return [];

    const baseUtilization = (utilizationData.utilization || 0) * 100;
    const burstRatio = utilizationData.burstRatio || 1.0;
    const peakRatio = utilizationData.peakRatio || 1.0;
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => {
      // Create realistic usage patterns based on actual data
      let hourlyMultiplier = 1.0;
      
      // Business hours pattern (9 AM - 5 PM higher usage)
      if (hour >= 9 && hour <= 17) {
        hourlyMultiplier = Math.min(peakRatio, 1.5);
      } else if (hour >= 6 && hour <= 8 || hour >= 18 && hour <= 22) {
        hourlyMultiplier = Math.min(burstRatio, 1.2);
      } else {
        hourlyMultiplier = 0.3; // Night hours
      }
      
      // Add some realistic variance
      const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
      const utilization = Math.max(0, Math.min(100, baseUtilization * hourlyMultiplier * (1 + variance)));
      
      return {
        hour: `${hour}:00`,
        utilization: Math.round(utilization * 10) / 10,
        cost: (utilization / 100) * 1000,
        tokens: (utilization / 100) * 50000,
        efficiency: Math.min(100, utilization * 1.2)
      };
    });
  }, [utilizationData]);

  // Cost projection data with scenarios
  const costProjections = useMemo(() => {
    if (!projectionData || !costData) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => {
      const growth = 1 + (index * 0.01); // 5% monthly growth projection
      const variance = 0.9 + (Math.random() * 0.2); // 10% variance
      
      return {
        month,
        paygo: (costData.paygo || 0) * growth * variance,
        ptuHourly: (costData.ptuHourly || 0) * growth * variance,
        ptuMonthly: (costData.ptuMonthly || 0) * growth * variance,
        ptuYearly: (costData.ptuYearly || 0) * growth * variance,
        projected: (costData.savings || 0) * growth * variance
      };
    });
  }, [projectionData, costData]);

  // Burst pattern analysis
  const burstAnalysis = useMemo(() => {
    if (!burstData) return [];

    // Calculate dynamic percentages based on usage pattern and utilization
    const utilization = burstData.efficiency || 0;
    const pattern = burstData.pattern || 'Steady';
    
    let steadyUsage, burstPeriods, peakSpikes;

    // Special case for very low utilization
    if (utilization < 0.05) {
      steadyUsage = utilization * 100;
      burstPeriods = Math.min(10, (1 - utilization) * 15);
      peakSpikes = Math.max(0, 100 - steadyUsage - burstPeriods);
    } else
    
    if (pattern === 'Steady') {
      steadyUsage = utilization * 100;
      burstPeriods = Math.min(100 - steadyUsage, (1 - utilization) * 30);
      peakSpikes = Math.max(0, 100 - steadyUsage - burstPeriods);
    } else if (pattern === 'Bursty') {
      steadyUsage = utilization * 80;
      burstPeriods = Math.min(100 - steadyUsage, (1 - utilization) * 40);
      peakSpikes = Math.max(0, 100 - steadyUsage - burstPeriods);
    } else if (pattern === 'Spiky') {
      steadyUsage = utilization * 60;
      burstPeriods = Math.min(100 - steadyUsage, (1 - utilization) * 50);
      peakSpikes = Math.max(0, 100 - steadyUsage - burstPeriods);
    } else {
      // Default fallback
      steadyUsage = 60;
      burstPeriods = 25;
      peakSpikes = 15;
    }

    return [
      { name: 'Steady Usage', value: Math.round(steadyUsage), color: '#10b981' },
      { name: 'Burst Periods', value: Math.round(burstPeriods), color: '#f59e0b' },
      { name: 'Peak Spikes', value: Math.round(peakSpikes), color: '#ef4444' }
    ];
  }, [burstData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label, type = 'default' }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mt-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="font-medium">
                {type === 'currency' ? `$${entry.value.toLocaleString()}` : 
                 type === 'percentage' ? `${entry.value.toFixed(1)}%` : 
                 entry.value.toLocaleString()}
              </span>
            </div>
          ))}
          {data.description && (
            <p className="text-xs text-gray-500 mt-2">{data.description}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Interactive cost comparison chart
  const CostComparisonChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Interactive Cost Comparison</h3>
        <p className="text-sm text-gray-600 mb-4">Real-time cost comparison based on your actual TPM inputs. Hover over bars for detailed breakdown and efficiency metrics.</p>
        <div className="flex gap-2">
          {['monthly', 'yearly'].map(timeframe => (
            <Badge 
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </Badge>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={enhancedCostData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
          <Tooltip content={<CustomTooltip type="currency" />} />
          <Bar 
            dataKey="cost" 
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            onMouseEnter={(data) => setHoveredData(data)}
            onMouseLeave={() => setHoveredData(null)}
          >
            {enhancedCostData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {hoveredData && (
        <Card className="mt-4">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{hoveredData.icon}</span>
              <div>
                <h4 className="font-semibold">{hoveredData.name}</h4>
                <p className="text-sm text-gray-600">{hoveredData.description}</p>
                <div className="flex gap-4 mt-2">
                  <Badge variant="outline">Efficiency: {hoveredData.efficiency}</Badge>
                  <Badge variant="outline">Risk: {hoveredData.risk}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Utilization heatmap
  const UtilizationChart = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">24-Hour Utilization Pattern</h3>
        <p className="text-sm text-gray-600 mb-4">Simulated hourly usage based on your utilization rate with realistic business hours patterns (9AM-5PM peaks, 6-8AM/6-10PM moderate, nights low).</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={utilizationTimeline}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis tickFormatter={(value) => `${value}%`} />
          <Tooltip content={<CustomTooltip type="percentage" />} />
          <Area 
            type="monotone" 
            dataKey="utilization" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  // Cost projection chart
  const ProjectionChart = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">12-Month Cost Projection</h3>
        <p className="text-sm text-gray-600 mb-4">Cost projections based on your current usage with 1% monthly growth assumption. Shows how costs might evolve over time.</p>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={costProjections}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
          <Tooltip content={<CustomTooltip type="currency" />} />
          <Legend />
          <Line type="monotone" dataKey="paygo" stroke="#3b82f6" name="PAYGO" />
          <Line type="monotone" dataKey="ptuMonthly" stroke="#10b981" name="PTU Monthly" />
          <Line type="monotone" dataKey="ptuYearly" stroke="#8b5cf6" name="PTU Yearly" />
          <Area 
            type="monotone" 
            dataKey="projected" 
            stroke="#f59e0b" 
            fill="#f59e0b" 
            fillOpacity={0.2}
            name="Projected"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  // Burst pattern pie chart
  const BurstPatternChart = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Usage Pattern Distribution</h3>
        <p className="text-sm text-gray-600 mb-4">Distribution of your workload patterns calculated from TPM ratios. Steady Usage = consistent baseline, Burst Periods = moderate spikes, Peak Spikes = maximum demand periods.</p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={burstAnalysis}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={5}
            dataKey="value"
          >
            {burstAnalysis.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip type="percentage" />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Interactive Analytics Dashboard
        </CardTitle>
        <CardDescription>
          Explore your Azure OpenAI usage patterns and cost projections with interactive visualizations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeChart} onValueChange={setActiveChart} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cost-comparison" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Costs
            </TabsTrigger>
            <TabsTrigger value="utilization" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Utilization
            </TabsTrigger>
            <TabsTrigger value="projections" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Projections
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Patterns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cost-comparison" className="mt-6">
            <CostComparisonChart />
          </TabsContent>

          <TabsContent value="utilization" className="mt-6">
            <UtilizationChart />
          </TabsContent>

          <TabsContent value="projections" className="mt-6">
            <ProjectionChart />
          </TabsContent>

          <TabsContent value="patterns" className="mt-6">
            <BurstPatternChart />
          </TabsContent>
        </Tabs>

        {/* Quick insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Potential Savings</p>
                  <p className="text-lg font-semibold">{`$${costData?.savings?.toFixed(2) || "0"}/month`}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Peak Efficiency</p>
                  <p className="text-lg font-semibold">{`${Math.min((utilizationData?.utilization || 0) * 100, 100).toFixed(1)}%`}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Burst Frequency</p>
                  <p className="text-lg font-semibold">{`${(utilizationData?.burstRatio || 0).toFixed(1)}x daily`}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveCharts;

