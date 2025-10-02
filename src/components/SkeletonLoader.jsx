import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';

// Base skeleton component with shimmer animation
const SkeletonBase = ({ className = "", style = {} }) => (
  <div 
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    style={style}
  />
);

// Skeleton for text lines
const SkeletonText = ({ lines = 1, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBase 
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

// Skeleton for results card
const SkeletonResultCard = ({ showChart = false }) => (
  <Card className="animate-fade-in">
    <CardHeader>
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-6 w-48" />
        <SkeletonBase className="h-8 w-16 rounded-full" />
      </div>
      <SkeletonBase className="h-4 w-64" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Main metric */}
        <div className="text-center">
          <SkeletonBase className="h-8 w-32 mx-auto mb-2" />
          <SkeletonBase className="h-4 w-24 mx-auto" />
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <SkeletonBase className="h-6 w-20 mx-auto mb-1" />
              <SkeletonBase className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
        
        {/* Chart placeholder */}
        {showChart && (
          <div className="mt-6">
            <SkeletonBase className="h-48 w-full rounded-lg" />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Skeleton for form sections
const SkeletonForm = ({ fields = 3 }) => (
  <Card>
    <CardHeader>
      <SkeletonBase className="h-5 w-40" />
      <SkeletonBase className="h-3 w-64" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBase className="h-4 w-24" />
            <SkeletonBase className="h-10 w-full" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Skeleton for chart/visualization
const SkeletonChart = ({ type = "bar" }) => (
  <Card>
    <CardHeader>
      <SkeletonBase className="h-6 w-48" />
      <SkeletonBase className="h-4 w-32" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Chart legend */}
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <SkeletonBase className="h-3 w-3 rounded-full" />
              <SkeletonBase className="h-3 w-16" />
            </div>
          ))}
        </div>
        
        {/* Chart area */}
        {type === "bar" && (
          <div className="flex items-end gap-2 h-48">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonBase 
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
          </div>
        )}
        
        {type === "line" && (
          <SkeletonBase className="h-48 w-full rounded" />
        )}
        
        {type === "pie" && (
          <div className="flex justify-center">
            <SkeletonBase className="h-48 w-48 rounded-full" />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Skeleton for pricing table
const SkeletonPricingTable = () => (
  <Card>
    <CardHeader>
      <SkeletonBase className="h-6 w-40" />
      <SkeletonBase className="h-4 w-56" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 pb-2 border-b">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBase key={i} className="h-4" />
          ))}
        </div>
        
        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <SkeletonBase key={j} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Loading screen with multiple skeletons
const SkeletonLoadingScreen = ({ 
  showResults = true, 
  showCharts = true, 
  showForms = true 
}) => (
  <div className="space-y-6 animate-fade-in">
    {showResults && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonResultCard />
        <SkeletonResultCard />
        <SkeletonResultCard showChart />
      </div>
    )}
    
    {showCharts && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart type="bar" />
        <SkeletonChart type="pie" />
      </div>
    )}
    
    {showForms && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonForm fields={4} />
        <SkeletonPricingTable />
      </div>
    )}
  </div>
);

export {
  SkeletonBase,
  SkeletonText,
  SkeletonResultCard,
  SkeletonForm,
  SkeletonChart,
  SkeletonPricingTable,
  SkeletonLoadingScreen
};

export default SkeletonLoadingScreen;