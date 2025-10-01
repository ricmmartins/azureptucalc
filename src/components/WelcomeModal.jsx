import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, DollarSign, Zap, TrendingUp, Info } from 'lucide-react';

const WelcomeModal = ({ isOpen, onClose, onStartTour }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            Welcome to Azure PTU Calculator
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Introduction */}
          <div className="text-center space-y-2">
            <p className="text-lg text-gray-700">
              Make smart financial decisions about your Azure OpenAI capacity planning
            </p>
            <p className="text-sm text-gray-500">
              This tool analyzes your usage patterns and recommends the most cost-effective pricing model
            </p>
          </div>

          {/* Pricing Models Explanation */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <DollarSign className="h-5 w-5" />
                  PAYGO
                </CardTitle>
                <CardDescription>Pay-as-you-go</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  Flexible
                </Badge>
                <p className="text-sm text-gray-600">
                  Pay per token used. Great for variable workloads but costs more per token.
                </p>
                <div className="text-xs text-green-600 font-medium">
                  ✓ No commitment • ✓ Variable usage • ✗ Higher cost
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Zap className="h-5 w-5" />
                  PTU
                </CardTitle>
                <CardDescription>Provisioned Throughput Units</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  Reserved
                </Badge>
                <p className="text-sm text-gray-600">
                  Reserve capacity at lower cost. Best for consistent, high-volume usage.
                </p>
                <div className="text-xs text-blue-600 font-medium">
                  ✓ Lower cost • ✓ Guaranteed capacity • ✗ Fixed commitment
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <TrendingUp className="h-5 w-5" />
                  Hybrid
                </CardTitle>
                <CardDescription>PTU + PAYGO overflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  Best of Both
                </Badge>
                <p className="text-sm text-gray-600">
                  Reserve base capacity as PTU, overflow to PAYGO for spikes.
                </p>
                <div className="text-xs text-purple-600 font-medium">
                  ✓ Cost optimized • ✓ Handles spikes • ✓ Balanced approach
                </div>
              </CardContent>
            </Card>
          </div>

          {/* What This Tool Does */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                What This Calculator Does for You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Analyzes Your Usage</p>
                      <p className="text-sm text-gray-600">Input your actual Azure OpenAI usage data</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Calculates Costs</p>
                      <p className="text-sm text-gray-600">Compare PAYGO, PTU, and hybrid scenarios</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Smart Recommendations</p>
                      <p className="text-sm text-gray-600">Get data-driven pricing strategy advice</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Shows Savings</p>
                      <p className="text-sm text-gray-600">Identify potential cost optimization opportunities</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-700">Ready to Get Started?</CardTitle>
              <CardDescription>
                You can input data in three ways: Azure Log Analytics (most accurate), Azure Portal metrics, or manual estimation for planning.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={onStartTour} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Take the Guided Tour
                </Button>
                <Button 
                  onClick={onClose} 
                  variant="outline" 
                  className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Start Using Calculator
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 mb-1">💡 Quick Tips</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use 30+ days of data for most accurate analysis</li>
                  <li>• Look for the green "savings" indicators in results</li>
                  <li>• Export reports for sharing with stakeholders</li>
                  <li>• Hover over terms for explanations throughout the tool</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;