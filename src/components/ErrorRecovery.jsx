import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, X, RefreshCw, Settings, HelpCircle, ExternalLink, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Enhanced error message with recovery actions
const ErrorRecovery = ({ 
  error = null,
  onRetry = null,
  onFix = null,
  onDismiss = null,
  showHelp = true,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!error) return null;

  // Error type detection and recovery suggestions
  const getErrorConfig = (errorMessage) => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        type: 'validation',
        severity: 'warning',
        icon: AlertTriangle,
        title: 'Input Validation Error',
        suggestions: [
          'Check that all required fields are filled',
          'Verify numeric values are positive',
          'Ensure TPM values are realistic (1-100,000)',
          'Check that P99 TPM ≥ Average TPM'
        ],
        quickFixes: [
          { label: 'Auto-correct values', action: 'auto-correct' },
          { label: 'Use sample data', action: 'sample-data' },
          { label: 'Reset form', action: 'reset' }
        ]
      };
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: 'network',
        severity: 'error',
        icon: AlertCircle,
        title: 'Connection Error',
        suggestions: [
          'Check your internet connection',
          'Verify the service is available',
          'Try refreshing the page',
          'Check if you\'re behind a firewall'
        ],
        quickFixes: [
          { label: 'Retry request', action: 'retry' },
          { label: 'Use offline mode', action: 'offline' },
          { label: 'Check status', action: 'status' }
        ]
      };
    }
    
    if (message.includes('calculation') || message.includes('pricing')) {
      return {
        type: 'calculation',
        severity: 'error',
        icon: AlertCircle,
        title: 'Calculation Error',
        suggestions: [
          'Verify all input values are valid numbers',
          'Check that model and region are selected',
          'Ensure PTU values are within valid ranges',
          'Try with different input values'
        ],
        quickFixes: [
          { label: 'Recalculate', action: 'recalculate' },
          { label: 'Reset inputs', action: 'reset-inputs' },
          { label: 'Use defaults', action: 'defaults' }
        ]
      };
    }
    
    // Default error config
    return {
      type: 'general',
      severity: 'error',
      icon: AlertCircle,
      title: 'Something went wrong',
      suggestions: [
        'Try refreshing the page',
        'Check your inputs and try again',
        'Contact support if the problem persists'
      ],
      quickFixes: [
        { label: 'Try again', action: 'retry' },
        { label: 'Reset', action: 'reset' }
      ]
    };
  };

  const config = getErrorConfig(error.message || error);
  const IconComponent = config.icon;

  const handleQuickFix = (action) => {
    if (onFix) {
      onFix(action);
    }
  };

  const severityColors = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500'
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200', 
      text: 'text-orange-800',
      icon: 'text-orange-500'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-500'
    }
  };

  const colors = severityColors[config.severity];

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <IconComponent className={`w-5 h-5 mt-0.5 ${colors.icon}`} />
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-medium ${colors.text}`}>
              {config.title}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {config.type}
              </Badge>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`${colors.text} hover:opacity-70`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Error message */}
          <p className={`text-sm ${colors.text} mb-3`}>
            {error.message || error}
          </p>
          
          {/* Quick fix buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {config.quickFixes.map((fix, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickFix(fix.action)}
                className={`text-xs ${colors.text} border-current hover:bg-white/50`}
              >
                {fix.label}
              </Button>
            ))}
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className={`text-xs ${colors.text} border-current hover:bg-white/50`}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
          
          {/* Expandable help section */}
          {showHelp && (
            <div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-1 text-sm ${colors.text} hover:opacity-70`}
              >
                <HelpCircle className="w-4 h-4" />
                {isExpanded ? 'Hide' : 'Show'} help
              </button>
              
              {isExpanded && (
                <div className="mt-2 space-y-2">
                  <h4 className={`text-sm font-medium ${colors.text}`}>
                    Troubleshooting suggestions:
                  </h4>
                  <ul className={`text-sm ${colors.text} space-y-1`}>
                    {config.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-xs mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Validation error specifically for form fields
const ValidationError = ({ 
  field = "",
  message = "",
  suggestions = [],
  onFix = null,
  className = ""
}) => {
  if (!message) return null;

  const getFieldSuggestions = (fieldName) => {
    const field = fieldName.toLowerCase();
    
    if (field.includes('tpm')) {
      return [
        'Enter a positive number between 1 and 100,000',
        'Use realistic values based on your actual usage',
        'P99 TPM should be higher than Average TPM'
      ];
    }
    
    if (field.includes('ptu')) {
      return [
        'PTU values should be positive integers',
        'Check minimum PTU requirements for your model',
        'Ensure PTU values align with your TPM requirements'
      ];
    }
    
    if (field.includes('region')) {
      return [
        'Select a valid Azure region',
        'Check if your model is available in the selected region'
      ];
    }
    
    if (field.includes('model')) {
      return [
        'Choose a supported OpenAI model',
        'Verify model availability in your region'
      ];
    }
    
    return suggestions;
  };

  const fieldSuggestions = getFieldSuggestions(field);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">
            {field && `${field}: `}{message}
          </p>
          
          {fieldSuggestions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-red-700 mb-1">Quick fixes:</p>
              <div className="flex flex-wrap gap-1">
                {fieldSuggestions.slice(0, 2).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onFix && onFix(suggestion)}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Smart error boundary with recovery options
const ErrorBoundaryWithRecovery = ({ 
  children,
  fallback = null,
  onReset = null,
  className = ""
}) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  const resetError = () => {
    setHasError(false);
    setError(null);
    if (onReset) onReset();
  };

  // In a real implementation, this would use React Error Boundary
  // For now, we'll provide the structure
  
  if (hasError) {
    return fallback || (
      <div className={`p-6 text-center ${className}`}>
        <div className="max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={resetError} variant="outline">
              Try again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

// Help tooltip with contextual guidance
const HelpTooltip = ({ 
  content = "",
  suggestions = [],
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="text-gray-400 hover:text-gray-600"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
            <div className="relative">
              <p className="mb-2">{content}</p>
              
              {suggestions.length > 0 && (
                <div>
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <Lightbulb className="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export {
  ErrorRecovery,
  ValidationError,
  ErrorBoundaryWithRecovery,
  HelpTooltip
};

export default ErrorRecovery;