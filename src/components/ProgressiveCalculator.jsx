// Progressive Disclosure Component for better UX flow
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronRight, ChevronDown, Zap, Settings, BarChart3 } from 'lucide-react';

export const ProgressiveCalculator = ({ children, onModeChange }) => {
  const [mode, setMode] = useState('quick'); // 'quick' | 'advanced' | 'expert'
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advanced: false,
    expert: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
    
    // Auto-expand relevant sections
    if (newMode === 'advanced') {
      setExpandedSections(prev => ({ ...prev, advanced: true }));
    } else if (newMode === 'expert') {
      setExpandedSections(prev => ({ ...prev, advanced: true, expert: true }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Calculation Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant={mode === 'quick' ? 'default' : 'outline'}
              className="h-auto p-4 flex-col items-start"
              onClick={() => handleModeChange('quick')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Quick Estimate</span>
              </div>
              <span className="text-sm text-left opacity-75">
                Basic calculation with 3 key inputs
              </span>
            </Button>
            
            <Button
              variant={mode === 'advanced' ? 'default' : 'outline'}
              className="h-auto p-4 flex-col items-start"
              onClick={() => handleModeChange('advanced')}
            >
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Detailed Analysis</span>
              </div>
              <span className="text-sm text-left opacity-75">
                Comprehensive cost optimization
              </span>
            </Button>
            
            <Button
              variant={mode === 'expert' ? 'default' : 'outline'}
              className="h-auto p-4 flex-col items-start"
              onClick={() => handleModeChange('expert')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Expert Mode</span>
              </div>
              <span className="text-sm text-left opacity-75">
                Full customization and scenarios
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Basic Inputs - Always visible */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('basic')}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Essential Information</CardTitle>
            {expandedSections.basic ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.basic && (
          <CardContent>
            {children?.basic}
          </CardContent>
        )}
      </Card>

      {/* Advanced Options - Shown in advanced/expert modes */}
      {(mode === 'advanced' || mode === 'expert') && (
        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('advanced')}
          >
            <div className="flex items-center justify-between">
              <CardTitle>Advanced Configuration</CardTitle>
              {expandedSections.advanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CardHeader>
          {expandedSections.advanced && (
            <CardContent>
              {children?.advanced}
            </CardContent>
          )}
        </Card>
      )}

      {/* Expert Options - Shown only in expert mode */}
      {mode === 'expert' && (
        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('expert')}
          >
            <div className="flex items-center justify-between">
              <CardTitle>Expert Settings</CardTitle>
              {expandedSections.expert ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CardHeader>
          {expandedSections.expert && (
            <CardContent>
              {children?.expert}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default ProgressiveCalculator;