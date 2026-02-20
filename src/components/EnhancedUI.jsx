// Enhanced Loading States and Micro-interactions
import React from 'react';
import { Card, CardContent } from './ui/card';
import { Loader2 } from 'lucide-react';

export const SkeletonCard = ({ className = '' }) => (
  <Card className={`animate-pulse ${className}`}>
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    </CardContent>
  </Card>
);

export const CalculationLoader = ({ message = "Calculating optimal pricing..." }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <div className="relative">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <div className="absolute inset-0 h-8 w-8 border-2 border-blue-200 rounded-full animate-ping"></div>
    </div>
    <div className="text-center">
      <div className="font-medium text-gray-900">{message}</div>
      <div className="text-sm text-gray-500 mt-1">Analyzing your usage patterns</div>
    </div>
    <div className="flex space-x-1">
      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  </div>
);

export const SuccessAnimation = ({ visible, onComplete }) => {
  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 animate-in zoom-in-50 duration-500">
        <div className="relative">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <div className="h-8 w-8 text-green-600">
              ✓
            </div>
          </div>
          <div className="absolute inset-0 h-16 w-16 border-4 border-green-500 rounded-full animate-ping"></div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-900">Calculation Complete!</div>
          <div className="text-sm text-gray-500">Your results are ready</div>
        </div>
      </div>
    </div>
  );
};

export const AnimatedButton = ({ children, onClick, className = '', ...props }) => {
  const [isClicked, setIsClicked] = React.useState(false);

  const handleClick = (e) => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    onClick?.(e);
  };

  return (
    <button
      {...props}
      className={`
        ${className}
        transform transition-all duration-150 ease-in-out
        hover:scale-105 hover:shadow-md
        active:scale-95
        ${isClicked ? 'scale-95' : ''}
      `}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export const PulsingIndicator = ({ active = false, color = 'green' }) => {
  if (!active) return null;

  return (
    <div className={`relative inline-flex`}>
      <div className={`h-3 w-3 bg-${color}-500 rounded-full`}></div>
      <div className={`absolute inset-0 h-3 w-3 bg-${color}-400 rounded-full animate-ping opacity-75`}></div>
    </div>
  );
};