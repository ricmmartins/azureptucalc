import React, { useState, useEffect } from 'react';
import { CheckCircle, Check, Download, Copy, Zap, TrendingUp } from 'lucide-react';

// Success animation component with configurable styles
const SuccessAnimation = ({ 
  isVisible = false, 
  duration = 2000,
  onComplete = null,
  type = "checkmark", // checkmark, pulse, bounce, slide
  size = "md", // sm, md, lg
  className = ""
}) => {
  const [animationState, setAnimationState] = useState('idle');

  useEffect(() => {
    if (isVisible) {
      setAnimationState('animating');
      const timer = setTimeout(() => {
        setAnimationState('complete');
        if (onComplete) onComplete();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setAnimationState('idle');
    }
  }, [isVisible, duration, onComplete]);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  const animations = {
    checkmark: `
      ${animationState === 'animating' ? 'animate-bounce scale-110' : ''}
      ${animationState === 'complete' ? 'scale-100' : ''}
      transition-all duration-300 ease-out
    `,
    pulse: `
      ${animationState === 'animating' ? 'animate-pulse scale-125' : ''}
      transition-all duration-500 ease-out
    `,
    bounce: `
      ${animationState === 'animating' ? 'animate-bounce' : ''}
      transition-all duration-300 ease-out
    `,
    slide: `
      ${animationState === 'animating' ? 'transform translate-x-1 scale-105' : ''}
      transition-all duration-400 ease-out
    `
  };

  if (!isVisible && animationState === 'idle') return null;

  return (
    <div className={`
      inline-flex items-center justify-center rounded-full bg-green-100 text-green-600
      ${sizeClasses[size]} ${animations[type]} ${className}
    `}>
      <CheckCircle className="w-full h-full" />
    </div>
  );
};

// Floating success notification
const SuccessToast = ({ 
  isVisible = false, 
  message = "Success!", 
  icon = null,
  duration = 3000,
  onClose = null,
  position = "top-right" // top-right, top-left, bottom-right, bottom-left, top-center
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setShouldRender(false);
          if (onClose) onClose();
        }, 300);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
  };

  if (!shouldRender) return null;

  return (
    <div className={`
      fixed z-50 ${positionClasses[position]}
      transform transition-all duration-300 ease-out
      ${isAnimating 
        ? 'translate-y-0 opacity-100 scale-100' 
        : 'translate-y-[-10px] opacity-0 scale-95'
      }
    `}>
      <div className="
        flex items-center gap-2 px-4 py-3 bg-white border border-green-200 
        rounded-lg shadow-lg ring-1 ring-green-500/20
      ">
        <div className="text-green-500">
          {icon || <CheckCircle className="w-5 h-5" />}
        </div>
        <span className="text-sm font-medium text-gray-900">{message}</span>
      </div>
    </div>
  );
};

// Button with success feedback
const SuccessButton = ({ 
  onClick = null,
  children,
  successMessage = "Done!",
  successDuration = 1500,
  className = "",
  variant = "primary", // primary, secondary, outline
  ...props 
}) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    if (onClick) {
      setIsLoading(true);
      try {
        await onClick(e);
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), successDuration);
      } catch (error) {
        setIsLoading(false);
      }
    }
  };

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700"
  };

  const successClasses = isSuccess 
    ? "bg-green-600 border-green-600 text-white transform scale-105" 
    : "";

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isSuccess}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isSuccess ? successClasses : variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center gap-2">
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {isSuccess && (
          <Check className="w-4 h-4" />
        )}
        <span>
          {isSuccess ? successMessage : children}
        </span>
      </div>
    </button>
  );
};

// Progress fill animation for completed sections
const CompletionFill = ({ 
  isComplete = false, 
  children, 
  className = "",
  fillColor = "green" 
}) => {
  const [fillWidth, setFillWidth] = useState(0);

  useEffect(() => {
    if (isComplete) {
      setTimeout(() => setFillWidth(100), 100);
    } else {
      setFillWidth(0);
    }
  }, [isComplete]);

  const fillColors = {
    green: "bg-green-100 border-green-300",
    blue: "bg-blue-100 border-blue-300",
    purple: "bg-purple-100 border-purple-300"
  };

  return (
    <div className={`relative overflow-hidden border rounded-lg transition-all duration-500 ${
      isComplete ? fillColors[fillColor] : "border-gray-200"
    } ${className}`}>
      {/* Fill animation */}
      <div 
        className={`
          absolute inset-0 transition-all duration-1000 ease-out opacity-20
          ${fillColor === 'green' ? 'bg-green-200' : fillColor === 'blue' ? 'bg-blue-200' : 'bg-purple-200'}
        `}
        style={{ 
          width: `${fillWidth}%`,
          transition: 'width 1000ms ease-out'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Success indicator */}
      {isComplete && (
        <div className="absolute top-2 right-2 z-20">
          <SuccessAnimation isVisible={true} type="checkmark" size="sm" />
        </div>
      )}
    </div>
  );
};

// Celebration animation for major milestones
const CelebrationAnimation = ({ 
  isVisible = false, 
  type = "confetti", // confetti, sparkles, pulse
  duration = 3000 
}) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isVisible && type === "confetti") {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)],
        rotation: Math.random() * 360,
        delay: Math.random() * 200
      }));
      setParticles(newParticles);
      
      setTimeout(() => setParticles([]), duration);
    }
  }, [isVisible, type, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {type === "confetti" && particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 animate-bounce"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            animationDuration: '2s',
            transform: `rotate(${particle.rotation}deg)`
          }}
        />
      ))}
      
      {type === "sparkles" && (
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-100/20 to-transparent animate-pulse" />
      )}
      
      {type === "pulse" && (
        <div className="absolute inset-0 bg-green-500/10 animate-ping" />
      )}
    </div>
  );
};

// Ripple effect for interactive elements
const RippleEffect = ({ 
  isActive = false, 
  color = "blue",
  size = "md",
  className = "" 
}) => {
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    if (isActive) {
      const newRipple = {
        id: Date.now(),
        x: 50,
        y: 50
      };
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }
  }, [isActive]);

  const colorClasses = {
    blue: "bg-blue-400",
    green: "bg-green-400",
    purple: "bg-purple-400"
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className={`
            absolute rounded-full opacity-30 animate-ping
            ${colorClasses[color]}
          `}
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            width: '10px',
            height: '10px',
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </div>
  );
};

export {
  SuccessAnimation,
  SuccessToast,
  SuccessButton,
  CompletionFill,
  CelebrationAnimation,
  RippleEffect
};

export default SuccessAnimation;