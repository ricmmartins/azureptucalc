// Smart Input Component with validation and formatting
import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Check, AlertCircle, Info } from 'lucide-react';

export const SmartNumberInput = ({ 
  value, 
  onChange, 
  label, 
  placeholder, 
  min, 
  max, 
  suggestedRange,
  formatAs = 'number',
  className = '',
  error,
  helpText
}) => {
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const [isValid, setIsValid] = useState(true);

  // Format number for display
  const formatNumber = (num) => {
    if (!num) return '';
    const numValue = parseFloat(num);
    if (formatAs === 'tokens') {
      if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
      if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K`;
      return numValue.toLocaleString();
    }
    return numValue.toLocaleString();
  };

  // Parse formatted input
  const parseInput = (str) => {
    const cleaned = str.replace(/[,$K]/g, '');
    const multiplier = str.toLowerCase().includes('k') ? 1000 : 
                     str.toLowerCase().includes('m') ? 1000000 : 1;
    return parseFloat(cleaned) * multiplier || 0;
  };

  // Validation
  useEffect(() => {
    const numValue = parseInput(localValue);
    const valid = numValue >= (min || 0) && numValue <= (max || Infinity);
    setIsValid(valid);
  }, [localValue, min, max]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    const numValue = parseInput(newValue);
    onChange(numValue);
  };

  const handleBlur = () => {
    setFocused(false);
    if (localValue && !isNaN(parseInput(localValue))) {
      setLocalValue(formatNumber(parseInput(localValue)));
    }
  };

  const handleFocus = () => {
    setFocused(true);
    setLocalValue(value?.toString() || '');
  };

  const getValidationIcon = () => {
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (isValid && localValue) return <Check className="h-4 w-4 text-green-500" />;
    return null;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={focused ? localValue : formatNumber(value) || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`pr-10 transition-all duration-200 ${
            error ? 'border-red-500 focus:border-red-500' : 
            isValid && localValue ? 'border-green-500 focus:border-green-500' : ''
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      
      {suggestedRange && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Info className="h-3 w-3" />
          <span>Typical range: {suggestedRange}</span>
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-600">{error}</div>
      )}
      
      {helpText && !error && (
        <div className="text-xs text-gray-500">{helpText}</div>
      )}
    </div>
  );
};

export default SmartNumberInput;