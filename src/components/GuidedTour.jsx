import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronLeft, ChevronRight, X, Target, MapPin, BarChart3, Download, Settings, Zap } from 'lucide-react';

const GuidedTour = ({ isActive, onComplete, onSkip, onPopulateSampleData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isDataPopulated, setIsDataPopulated] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Add/remove body class when tour is active
  useEffect(() => {
    if (isActive) {
      document.body.classList.add('tour-active');
    } else {
      document.body.classList.remove('tour-active');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('tour-active');
    };
  }, [isActive]);
  
  const [tourSteps] = useState([
    {
      id: 'region-model',
      title: 'Step 1: Choose Your Configuration',
      description: 'Start by selecting your Azure region and OpenAI model. These choices affect pricing and availability.',
      target: '.region-model-section',
      position: 'bottom',
      icon: <MapPin className="h-4 w-4" />,
      highlight: 'Select region and model that match your deployment'
    },
    {
      id: 'usage-data',
      title: 'Step 2: Input Your Usage Data',
      description: 'Enter your usage patterns. You can use data from Azure Log Analytics, Portal metrics, or manual estimates.',
      target: '.usage-inputs-section',
      position: 'bottom',
      icon: <Target className="h-4 w-4" />,
      highlight: 'Most important: Average Tokens Per Minute (TPM)'
    },
    {
      id: 'results',
      title: 'Step 3: Review Recommendations',
      description: 'Enter some usage data first, then the calculator will analyze your data and recommend the most cost-effective pricing strategy.',
      target: '.results-section',
      fallbackTarget: '.usage-inputs-section', // Fallback if results not visible
      position: 'top',
      icon: <BarChart3 className="h-4 w-4" />,
      highlight: 'Look for green savings indicators and clear recommendations'
    },
    {
      id: 'charts',
      title: 'Step 4: Interactive Analytics',
      description: 'With data entered, explore detailed cost analysis, utilization patterns, and growth projections in the dashboard.',
      target: '.interactive-charts-section',
      fallbackTarget: '.results-section',
      position: 'top',
      icon: <BarChart3 className="h-4 w-4" />,
      highlight: '4 tabs: Costs, Utilization, Projections, and Patterns'
    },
    {
      id: 'export',
      title: 'Step 5: Export & Share',
      description: 'Generate reports in CSV or JSON format to share with stakeholders and support decision-making.',
      target: '.export-section',
      fallbackTarget: '.interactive-charts-section',
      position: 'top',
      icon: <Download className="h-4 w-4" />,
      highlight: 'Perfect for executive presentations and budget planning'
    },
    {
      id: 'advanced',
      title: 'Step 6: Advanced Features',
      description: 'Customize pricing for enterprise agreements and explore additional configuration options.',
      target: '.custom-pricing-section',
      position: 'bottom',
      icon: <Settings className="h-4 w-4" />,
      highlight: 'Custom pricing for negotiated Microsoft rates'
    }
  ]);

  const [highlightedElement, setHighlightedElement] = useState(null);

  // Stable function to populate data and handle UI updates
  const handleDataPopulation = useCallback(async () => {
    if (!onPopulateSampleData || isDataPopulated) return;
    
    setIsUpdating(true);
    onPopulateSampleData();
    setIsDataPopulated(true);
    
    // Allow time for UI to fully update before proceeding
    return new Promise(resolve => {
      setTimeout(() => {
        setIsUpdating(false);
        resolve();
      }, 800);
    });
  }, [onPopulateSampleData, isDataPopulated]);

  useEffect(() => {
    if (!isActive) return;

    const step = tourSteps[currentStep];
    if (!step) return;

    const findAndHighlightElement = async (step) => {
      // If we're on a results-dependent step and need data, populate it first
      if ((currentStep === 2 || currentStep === 3) && !isDataPopulated && onPopulateSampleData) {
        await handleDataPopulation();
        // Add extra delay for results sections to stabilize
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Try to find the target element, use fallback if not found
      let element = document.querySelector(step.target);
      if (!element && step.fallbackTarget) {
        element = document.querySelector(step.fallbackTarget);
      }
      
      if (element) {
        setHighlightedElement(element);
        
        // Scroll element into view with longer delay
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Add highlight class after scroll completes
          setTimeout(() => {
            element.classList.add('tour-highlight');
          }, 200);
        }, 100);
      }
    };

    findAndHighlightElement(step);

    return () => {
      // Cleanup highlight classes
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
    };
  }, [currentStep, isActive, tourSteps, handleDataPopulation, isDataPopulated]);

  useEffect(() => {
    if (!isActive) {
      // Clean up any remaining highlights
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
      setHighlightedElement(null);
      // Reset states when tour is closed
      setCurrentStep(0);
      setIsDataPopulated(false);
      setIsUpdating(false);
    }
  }, [isActive]);

  const nextStep = () => {
    if (isUpdating) return; // Prevent navigation during updates
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (isUpdating) return; // Prevent navigation during updates
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    // Clean up highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    onComplete();
  };

  const skipTour = () => {
    // Clean up highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    onSkip();
  };

  if (!isActive) return null;

  const currentTourStep = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50" style={{ zIndex: 999999 }} />
      
      {/* Tour Step Card */}
      <div 
        className="tour-controls" 
        style={{ 
          position: 'fixed', 
          top: '1rem', 
          right: '1rem', 
          zIndex: 1000000,
          width: '20rem'
        }}
      >
        <Card className="border-2 border-blue-500 shadow-2xl">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  {currentTourStep.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">{currentTourStep.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {currentStep + 1} of {tourSteps.length}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                {currentTourStep.description}
              </p>
              
              {/* Show status message for steps that might not be visible */}
              {(currentStep === 2 || currentStep === 3 || currentStep === 4) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  <div className="flex items-start gap-2">
                    <Zap className="h-3 w-3 text-yellow-600 flex-shrink-0 mt-1" />
                    <p className="text-xs text-yellow-700">
                      {currentStep === 2 && "Adding sample data to show results..."}
                      {currentStep === 3 && "Interactive charts appear when you have usage data"}
                      {currentStep === 4 && "Export features are always available"}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 font-medium">
                    {currentTourStep.highlight}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.round(((currentStep + 1) / tourSteps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0 || isUpdating}
                  className="h-8"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Back
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  disabled={isUpdating}
                  className="h-8 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Skip Tour
                </Button>
              </div>
              
              <div className="flex gap-2">
                {/* Special button for usage data step */}
                {currentStep === 1 && onPopulateSampleData && !isDataPopulated && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await handleDataPopulation();
                      nextStep();
                    }}
                    disabled={isUpdating}
                    className="h-8 text-blue-600 border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                  >
                    {isUpdating ? 'Loading...' : 'Try with Sample Data'}
                  </Button>
                )}
                
                <Button
                  onClick={nextStep}
                  disabled={isUpdating}
                  size="sm"
                  className="h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isUpdating ? 'Updating...' : currentStep === tourSteps.length - 1 ? (
                    'Complete Tour'
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Arrow (points to highlighted element) */}
      {highlightedElement && (
        <div className="fixed z-50 pointer-events-none">
          <div className="animate-bounce">
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-500" />
          </div>
        </div>
      )}

      {/* CSS for highlighting */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          border: 2px solid #3b82f6 !important;
          border-radius: 8px;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 10px 25px rgba(0, 0, 0, 0.2) !important;
          background-color: rgba(255, 255, 255, 0.98) !important;
        }
        
        .tour-highlight::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 8px;
          padding: 2px;
          background: linear-gradient(45deg, #3b82f6, #60a5fa);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          pointer-events: none;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
};

export default GuidedTour;