import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckSquare, 
  ArrowRight, 
  ExternalLink, 
  FileText, 
  Settings, 
  Calendar,
  Target,
  AlertTriangle,
  Lightbulb,
  Users,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';

const ActionItems = ({ calculations, selectedModel, selectedRegion, currentPricing }) => {
  if (!calculations || Object.keys(calculations).length === 0) {
    return null;
  }

  // Handle external link clicks
  const handleLinkClick = (url, linkText) => {
    if (url === '#') {
      // For placeholder links, provide helpful guidance
      let portalUrl = '';
      let instructions = '';
      
      if (linkText.includes('PTU Reservations')) {
        portalUrl = 'https://portal.azure.com/#view/Microsoft_Azure_Marketplace/GalleryItemDetailsBladeNopdl/id/microsoft-cognitive.cognitiveservices-openaistudio';
        instructions = 'This will open Azure OpenAI Studio where you can manage PTU reservations.';
      } else if (linkText.includes('Cost Management')) {
        portalUrl = 'https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/costanalysis';
        instructions = 'This will open Azure Cost Management for monitoring and budgets.';
      } else if (linkText.includes('Budget Alerts')) {
        portalUrl = 'https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/budgets';
        instructions = 'This will open Azure Budget configuration for cost alerts.';
      } else {
        alert('This feature would provide direct links to Azure portal documentation. \n\nFor now, please visit portal.azure.com and navigate to your Azure OpenAI resource.');
        return;
      }
      
      if (confirm(`${instructions}\n\nWould you like to open the Azure portal?`)) {
        window.open(portalUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle action item clicks
  const handleActionClick = (item) => {
    if (item.priority === 'High') {
      // Show implementation guidance for high priority items
      const message = `🚀 ${item.title}\n\n${item.description}\n\n⏱️ Timeframe: ${item.timeframe}\n\nThis high-priority action can help you achieve immediate results.`;
      if (confirm(message + '\n\nWould you like to copy this action to your clipboard for reference?')) {
        // Copy action details to clipboard
        const actionText = `Action Item: ${item.title}\nCategory: ${item.category}\nPriority: ${item.priority}\nDescription: ${item.description}\nTimeframe: ${item.timeframe}`;
        navigator.clipboard.writeText(actionText).then(() => {
          alert('✅ Action item copied to clipboard!');
        }).catch(() => {
          console.log('Action details:', actionText);
        });
      }
    } else {
      // Show planning guidance for lower priority items
      const message = `📋 Planning: ${item.title}\n\n${item.description}\n\n⏱️ Suggested timeframe: ${item.timeframe}`;
      if (confirm(message + '\n\nWould you like to copy this to your planning notes?')) {
        const planningText = `Planning Item: ${item.title}\nCategory: ${item.category}\nPriority: ${item.priority}\nDescription: ${item.description}\nTimeframe: ${item.timeframe}`;
        navigator.clipboard.writeText(planningText).then(() => {
          alert('✅ Planning item copied to clipboard!');
        }).catch(() => {
          console.log('Planning details:', planningText);
        });
      }
    }
  };

  const {
    recommendation,
    ptuNeeded,
    monthlySavings,
    utilizationRate,
    usagePattern,
    monthlyPaygoCost,
    monthlyPtuReservationCost
  } = calculations;

  // Generate action items based on recommendation
  const getActionItems = () => {
    const baseItems = [
      {
        id: 1,
        priority: 'High',
        category: 'Planning',
        title: 'Review Usage Patterns',
        description: `Analyze your current ${usagePattern?.toLowerCase() || 'usage'} pattern and confirm ${((utilizationRate || 0) * 100).toFixed(1)}% utilization is representative.`,
        timeframe: '1-2 days',
        icon: <TrendingUp className="h-4 w-4" />,
        actionType: 'analysis'
      }
    ];

    if (recommendation === 'Full PTU Reservation') {
      return [
        ...baseItems,
        {
          id: 2,
          priority: 'High',
          category: 'Implementation',
          title: 'Reserve PTU Capacity',
          description: `Reserve ${ptuNeeded} PTUs for ${selectedModel} in ${selectedRegion} region to start saving $${monthlySavings?.toFixed(0) || '0'}/month immediately.`,
          timeframe: '1-3 days',
          icon: <Target className="h-4 w-4" />,
          actionType: 'implementation',
          links: [
            { text: 'Azure OpenAI PTU Reservations', url: '#' },
            { text: 'Reservation Management Portal', url: '#' }
          ]
        },
        {
          id: 3,
          priority: 'Medium',
          category: 'Monitoring',
          title: 'Set Up Cost Monitoring',
          description: 'Configure Azure Cost Management alerts to track PTU utilization and ensure you stay within budget.',
          timeframe: '2-3 days',
          icon: <Shield className="h-4 w-4" />,
          actionType: 'monitoring',
          links: [
            { text: 'Azure Cost Management', url: '#' },
            { text: 'Budget Alerts Setup', url: '#' }
          ]
        },
        {
          id: 4,
          priority: 'Medium',
          category: 'Optimization',
          title: 'Implement Auto-scaling',
          description: 'Set up application-level logic to efficiently utilize your reserved PTU capacity during peak times.',
          timeframe: '1-2 weeks',
          icon: <Settings className="h-4 w-4" />,
          actionType: 'optimization'
        },
        {
          id: 5,
          priority: 'Low',
          category: 'Documentation',
          title: 'Document Architecture',
          description: 'Create documentation for your PTU setup and share cost savings with stakeholders.',
          timeframe: '1 week',
          icon: <FileText className="h-4 w-4" />,
          actionType: 'documentation'
        }
      ];
    } else if (recommendation === 'Consider Hybrid Model') {
      return [
        ...baseItems,
        {
          id: 2,
          priority: 'High',
          category: 'Strategy',
          title: 'Design Hybrid Architecture',
          description: `Plan a hybrid model with base PTU capacity for steady load and PAYGO overflow for burst periods.`,
          timeframe: '3-5 days',
          icon: <Lightbulb className="h-4 w-4" />,
          actionType: 'strategy'
        },
        {
          id: 3,
          priority: 'Medium',
          category: 'Implementation',
          title: 'Start with Minimal PTU',
          description: `Begin with ${Math.ceil((ptuNeeded || 1) * 0.6)} PTUs to cover base load, then add PAYGO for peaks.`,
          timeframe: '1-2 weeks',
          icon: <Target className="h-4 w-4" />,
          actionType: 'implementation'
        },
        {
          id: 4,
          priority: 'Medium',
          category: 'Monitoring',
          title: 'Track Utilization Patterns',
          description: 'Monitor both PTU utilization and PAYGO overflow costs to optimize the balance.',
          timeframe: 'Ongoing',
          icon: <TrendingUp className="h-4 w-4" />,
          actionType: 'monitoring'
        },
        {
          id: 5,
          priority: 'Low',
          category: 'Optimization',
          title: 'Fine-tune Thresholds',
          description: 'Adjust PTU/PAYGO split based on 30-60 days of usage data.',
          timeframe: '1-2 months',
          icon: <Settings className="h-4 w-4" />,
          actionType: 'optimization'
        }
      ];
    } else {
      // PAYGO recommendation
      return [
        ...baseItems,
        {
          id: 2,
          priority: 'High',
          category: 'Optimization',
          title: 'Optimize PAYGO Usage',
          description: 'Focus on reducing token consumption and optimizing prompts to lower PAYGO costs.',
          timeframe: '1-2 weeks',
          icon: <Target className="h-4 w-4" />,
          actionType: 'optimization'
        },
        {
          id: 3,
          priority: 'Medium',
          category: 'Monitoring',
          title: 'Track Usage Growth',
          description: 'Monitor usage patterns for potential future PTU opportunities as scale increases.',
          timeframe: 'Ongoing',
          icon: <TrendingUp className="h-4 w-4" />,
          actionType: 'monitoring'
        },
        {
          id: 4,
          priority: 'Medium',
          category: 'Planning',
          title: 'Plan for Scale',
          description: 'Set utilization thresholds (>60%) to trigger PTU evaluation as usage grows.',
          timeframe: '1 week',
          icon: <Calendar className="h-4 w-4" />,
          actionType: 'planning'
        },
        {
          id: 5,
          priority: 'Low',
          category: 'Strategy',
          title: 'Regular Cost Reviews',
          description: 'Schedule quarterly reviews to reassess PTU vs PAYGO as usage patterns evolve.',
          timeframe: 'Quarterly',
          icon: <Clock className="h-4 w-4" />,
          actionType: 'strategy'
        }
      ];
    }
  };

  const actionItems = getActionItems();

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Implementation':
        return <Target className="h-4 w-4" />;
      case 'Planning':
        return <Calendar className="h-4 w-4" />;
      case 'Monitoring':
        return <TrendingUp className="h-4 w-4" />;
      case 'Strategy':
        return <Lightbulb className="h-4 w-4" />;
      case 'Optimization':
        return <Settings className="h-4 w-4" />;
      case 'Documentation':
        return <FileText className="h-4 w-4" />;
      default:
        return <CheckSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card className="action-items mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-blue-600" />
          <CardTitle>Recommended Action Items</CardTitle>
        </div>
        <p className="text-sm text-gray-600">
          Clear next steps to implement your {recommendation.toLowerCase()} strategy
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Summary Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium text-blue-800 mb-1">
              {recommendation === 'Full PTU Reservation' && 'Ready to save money with PTU reservations'}
              {recommendation === 'Consider Hybrid Model' && 'Hybrid model offers balanced cost and flexibility'}
              {recommendation === 'PAYGO' && 'PAYGO remains your best option for now'}
            </div>
            <div className="text-blue-700 text-sm">
              {recommendation === 'Full PTU Reservation' && `Start saving $${monthlySavings?.toFixed(0) || '0'}/month immediately with ${ptuNeeded} PTU reservations.`}
              {recommendation === 'Consider Hybrid Model' && 'Combine base PTU capacity with PAYGO overflow for optimal cost-efficiency.'}
              {recommendation === 'PAYGO' && 'Focus on usage optimization and monitor for future PTU opportunities.'}
            </div>
          </AlertDescription>
        </Alert>

        {/* Action Items List */}
        <div className="space-y-4">
          {actionItems.map((item) => (
            <div 
              key={item.id}
              className="flex gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
            >
              {/* Priority and Icon */}
              <div className="flex flex-col items-center gap-2">
                <Badge className={`text-xs ${getPriorityStyle(item.priority)}`}>
                  {item.priority}
                </Badge>
                <div className="p-2 bg-gray-100 rounded-full">
                  {item.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      {getCategoryIcon(item.category)}
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.timeframe}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">
                  {item.description}
                </p>

                {/* Action Links */}
                {item.links && (
                  <div className="flex flex-wrap gap-2">
                    {item.links.map((link, index) => (
                      <Button 
                        key={index}
                        variant="outline" 
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleLinkClick(link.url, link.text)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {link.text}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center">
                <Button 
                  variant={item.priority === 'High' ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-0"
                  onClick={() => handleActionClick(item)}
                >
                  {item.priority === 'High' ? 'Start' : 'Plan'}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Team Collaboration Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border-t">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Team Collaboration</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Financial Team:</span>
              <p className="text-gray-600">Share cost analysis and savings projections</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">DevOps Team:</span>
              <p className="text-gray-600">Implement monitoring and capacity management</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Business Team:</span>
              <p className="text-gray-600">Align on utilization goals and growth planning</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionItems;