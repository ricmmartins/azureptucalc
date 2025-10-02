import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

// Base progress bar component
const ProgressBar = ({ 
  progress = 0, 
  className = "", 
  showPercentage = true,
  color = "blue",
  animated = true 
}) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    purple: "bg-purple-500"
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ease-out ${colorClasses[color]} ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

// Step indicator for multi-step processes
const StepIndicator = ({ 
  steps = [], 
  currentStep = 0, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <React.Fragment key={index}>
            <div className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300
                ${isCompleted 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : isCurrent 
                  ? 'bg-blue-500 border-blue-500 text-white animate-pulse' 
                  : 'bg-gray-100 border-gray-300 text-gray-500'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-2 hidden sm:block">
                <p className={`text-sm font-medium ${
                  isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500">{step.description}</p>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 transition-all duration-300 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Calculation progress overlay
const CalculationProgress = ({ 
  isVisible = false, 
  steps = [], 
  currentStep = 0, 
  title = "Processing...",
  onCancel = null 
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isVisible && steps.length > 0) {
      const progressPercent = ((currentStep + 1) / steps.length) * 100;
      setProgress(progressPercent);
    }
  }, [isVisible, currentStep, steps.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar 
            progress={progress} 
            color="blue" 
            animated={true}
          />
          
          {steps.length > 0 && (
            <div className="space-y-2">
              <StepIndicator 
                steps={steps} 
                currentStep={currentStep}
              />
              
              {steps[currentStep] && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {steps[currentStep].description || steps[currentStep].title}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {onCancel && (
            <div className="text-center">
              <button
                onClick={onCancel}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Cancel
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Inline progress for smaller operations
const InlineProgress = ({ 
  isLoading = false, 
  progress = 0, 
  message = "", 
  className = "" 
}) => {
  if (!isLoading) return null;

  return (
    <div className={`flex items-center gap-2 p-2 bg-blue-50 rounded ${className}`}>
      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      <div className="flex-1">
        {message && (
          <p className="text-sm text-blue-700 mb-1">{message}</p>
        )}
        <ProgressBar 
          progress={progress} 
          color="blue" 
          showPercentage={false}
          className="h-1"
        />
      </div>
    </div>
  );
};

// Status indicator with different states
const StatusIndicator = ({ 
  status = "loading", // loading, success, error, warning
  message = "",
  detail = "",
  className = "" 
}) => {
  const configs = {
    loading: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200"
    },
    success: {
      icon: <CheckCircle className="w-4 h-4" />,
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200"
    },
    error: {
      icon: <AlertCircle className="w-4 h-4" />,
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200"
    },
    warning: {
      icon: <AlertCircle className="w-4 h-4" />,
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      borderColor: "border-orange-200"
    }
  };

  const config = configs[status] || configs.loading;

  return (
    <div className={`
      flex items-start gap-2 p-3 rounded-lg border
      ${config.bgColor} ${config.borderColor} ${className}
    `}>
      <div className={config.textColor}>
        {config.icon}
      </div>
      <div className="flex-1">
        {message && (
          <p className={`text-sm font-medium ${config.textColor}`}>
            {message}
          </p>
        )}
        {detail && (
          <p className={`text-xs mt-1 ${config.textColor.replace('700', '600')}`}>
            {detail}
          </p>
        )}
      </div>
    </div>
  );
};

export {
  ProgressBar,
  StepIndicator,
  CalculationProgress,
  InlineProgress,
  StatusIndicator
};

export default CalculationProgress;