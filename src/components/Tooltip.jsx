import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';

// Tooltip definitions for technical terms
export const tooltipContent = {
  'tpm': {
    title: 'Tokens Per Minute (TPM)',
    content: 'The number of tokens (words/word pieces) processed per minute. This includes both input and output tokens from your API calls.',
    example: 'Example: A 100-word response ≈ 130 tokens'
  },
  'ptu': {
    title: 'Provisioned Throughput Units (PTU)',
    content: 'Reserved capacity units that guarantee throughput. Each PTU provides approximately 50,000 tokens per minute of processing capacity.',
    example: 'Example: 10 PTUs = 500,000 TPM capacity'
  },
  'paygo': {
    title: 'Pay-As-You-Go (PAYGO)',
    content: 'On-demand pricing where you pay per token used. More expensive per token but offers maximum flexibility with no commitments.',
    example: 'Example: $0.002 per 1K input tokens'
  },
  'custom-pricing': {
    title: 'Custom Pricing',
    content: 'Use this when you have negotiated rates with Microsoft, enterprise agreements, or special pricing contracts. Optional for government regions if you have specific contract rates.',
    example: 'Example: Enterprise discounts, government contracts, or regional pricing variations'
  },
  'p99': {
    title: '99th Percentile (P99)',
    content: 'Peak usage level - 99% of your usage is below this value. Used to understand traffic spikes and capacity planning.',
    example: 'Example: P99 of 10,000 TPM means only 1% of time you exceed 10K TPM'
  },
  'hybrid': {
    title: 'Hybrid Model',
    content: 'Combines PTU reservation for base capacity with PAYGO for overflow. Optimizes cost while handling traffic spikes.',
    example: 'Example: Reserve 5 PTUs, overflow to PAYGO during peaks'
  },
  'breakeven': {
    title: 'Break-even Analysis',
    content: 'The usage level where PTU becomes more cost-effective than PAYGO. Helps determine optimal pricing strategy.',
    example: 'Example: PTU cheaper above 80% capacity utilization'
  },
  'utilization': {
    title: 'Capacity Utilization',
    content: 'Percentage of reserved PTU capacity actually used. Higher utilization means better cost efficiency.',
    example: 'Example: 85% utilization = efficiently using reserved capacity'
  },
  'deployment': {
    title: 'Deployment Type',
    content: 'Azure OpenAI deployment models: Global (shared), Data Zone (regional group), or Regional (specific region).',
    example: 'Regional deployments have higher PTU minimums but better latency'
  },
  'increment': {
    title: 'PTU Increment',
    content: 'The minimum unit for adding PTUs. You can only purchase PTUs in these increments.',
    example: 'Example: 5 PTU increments means you can buy 15, 20, 25 PTUs etc.'
  },
  'minimum': {
    title: 'Minimum PTU',
    content: 'The smallest number of PTUs you can purchase for a model. Ensures efficient capacity allocation.',
    example: 'Example: GPT-4o requires minimum 15 PTUs globally'
  }
};

const Tooltip = ({ term, children, variant = 'icon', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const content = tooltipContent[term];
  if (!content) return children;

  const handleMouseEnter = (e) => {
    setIsVisible(true);
    
    // Calculate position
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 320; // Approximate tooltip width
    const tooltipHeight = 120; // Approximate tooltip height
    
    let x = rect.left + rect.width / 2 - tooltipWidth / 2;
    let y = rect.top - tooltipHeight - 10; // 10px gap above element
    
    // Adjust if tooltip would go off-screen
    if (x < 10) x = 10;
    if (x + tooltipWidth > window.innerWidth - 10) x = window.innerWidth - tooltipWidth - 10;
    if (y < 10) y = rect.bottom + 10; // Show below if no room above
    
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const renderTrigger = () => {
    if (variant === 'icon') {
      return (
        <button
          className={`inline-flex items-center justify-center w-4 h-4 ml-1 text-gray-400 hover:text-blue-600 transition-colors ${className}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          type="button"
        >
          <HelpCircle className="w-3 h-3" />
        </button>
      );
    } else if (variant === 'underline') {
      return (
        <span
          className={`border-b border-dotted border-gray-400 cursor-help hover:border-blue-600 hover:text-blue-600 transition-colors ${className}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </span>
      );
    } else {
      return (
        <span
          className={`cursor-help ${className}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </span>
      );
    }
  };

  return (
    <>
      {renderTrigger()}
      
      {/* Tooltip Portal */}
      {isVisible && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs"
          style={{ left: position.x, top: position.y }}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">{content.title}</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {content.content}
                </p>
                {content.example && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                    {content.example}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Arrow pointing to element */}
          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-6px]">
            <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-white"></div>
            <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-200 absolute top-[-7px] left-[-6px]"></div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper component for wrapping text with tooltip
export const TooltipText = ({ term, children, className = '' }) => (
  <Tooltip term={term} variant="underline" className={className}>
    {children}
  </Tooltip>
);

// Helper component for adding tooltip icon next to labels
export const TooltipIcon = ({ term, className = '' }) => (
  <Tooltip term={term} variant="icon" className={className} />
);

export default Tooltip;