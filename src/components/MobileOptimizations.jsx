import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { 
  Menu, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Smartphone, 
  Tablet, 
  Monitor,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Home,
  BarChart3,
  Calculator,
  Share2
} from 'lucide-react';

const MobileOptimizations = ({ 
  children, 
  onViewportChange,
  currentSection = 'dashboard' 
}) => {
  const [UNUSED_isCollapsed, UNUSED_setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(currentSection);
  const [UNUSED_showMobileNav, UNUSED_setShowMobileNav] = useState(false);
  const [viewMode, setViewMode] = useState('auto'); // auto, mobile, tablet, desktop
  const [orientation, setOrientation] = useState('portrait');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [hiddenSections, setHiddenSections] = useState(new Set());

  // Detect device type and orientation
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (viewMode === 'auto') {
        if (width < 768) {
          setViewMode('mobile');
        } else if (width < 1024) {
          setViewMode('tablet');
        } else {
          setViewMode('desktop');
        }
      }
      
      setOrientation(width > height ? 'landscape' : 'portrait');
      onViewportChange?.({ width, height, viewMode, orientation });
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);
    
    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
    };
  }, [viewMode, onViewportChange, orientation]);

  // Mobile navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'charts', label: 'Charts', icon: BarChart3 },
    { id: 'share', label: 'Share', icon: Share2 }
  ];

  // Toggle section visibility
  const toggleSection = (sectionId) => {
    setHiddenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Swipe gesture handling
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left - next section
      const currentIndex = navigationItems.findIndex(item => item.id === activeSection);
      const nextIndex = (currentIndex + 1) % navigationItems.length;
      setActiveSection(navigationItems[nextIndex].id);
    }
    
    if (isRightSwipe) {
      // Swipe right - previous section
      const currentIndex = navigationItems.findIndex(item => item.id === activeSection);
      const prevIndex = currentIndex === 0 ? navigationItems.length - 1 : currentIndex - 1;
      setActiveSection(navigationItems[prevIndex].id);
    }
  };

  // Mobile-optimized input component
  const MobileInput = ({ label, value, onChange, type = 'text', placeholder, ...props }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-base ${
          viewMode === 'mobile' ? 'text-lg' : ''
        }`}
        style={{ fontSize: viewMode === 'mobile' ? '16px' : '14px' }} // Prevent zoom on iOS
        {...props}
      />
    </div>
  );

  // Mobile-optimized select component
  const MobileSelect = ({ label, value, onChange, options, ...props }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-white ${
          viewMode === 'mobile' ? 'text-lg' : ''
        }`}
        style={{ fontSize: viewMode === 'mobile' ? '16px' : '14px' }}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Collapsible section component
  const CollapsibleSection = ({ id, title, children, defaultCollapsed = false }) => {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const isHidden = hiddenSections.has(id);

    if (isHidden) return null;

    return (
      <Card className="mb-4">
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection(id);
                }}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </div>
          </div>
        </CardHeader>
        {!collapsed && (
          <CardContent>
            {children}
          </CardContent>
        )}
      </Card>
    );
  };

  // Mobile navigation bar
  const MobileNavBar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Mobile header with hamburger menu
  const MobileHeader = () => (
    <div className="sticky top-0 bg-white border-b border-gray-200 z-40 md:hidden">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-bold text-gray-900">PTU Calculator</h1>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1 rounded ${viewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
            >
              <Smartphone className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              className={`p-1 rounded ${viewMode === 'tablet' ? 'bg-white shadow-sm' : ''}`}
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1 rounded ${viewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>
          
          {/* Settings menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Mobile Settings</SheetTitle>
                <SheetDescription>
                  Customize your mobile experience
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Zoom controls */}
                <div>
                  <label className="block text-sm font-medium mb-2">Zoom Level</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-3">{zoomLevel}%</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Section visibility */}
                <div>
                  <label className="block text-sm font-medium mb-2">Hidden Sections</label>
                  <div className="space-y-2">
                    {Array.from(hiddenSections).map(sectionId => (
                      <div key={sectionId} className="flex items-center justify-between">
                        <span className="text-sm">{sectionId}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSection(sectionId)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reset button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setZoomLevel(100);
                    setHiddenSections(new Set());
                    setViewMode('auto');
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Settings
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );

  // Responsive container
  const ResponsiveContainer = ({ children }) => (
    <div
      className={`transition-all duration-300 ${
        viewMode === 'mobile' ? 'max-w-sm mx-auto px-4' :
        viewMode === 'tablet' ? 'max-w-4xl mx-auto px-6' :
        'max-w-7xl mx-auto px-8'
      }`}
      style={{ 
        zoom: `${zoomLevel}%`,
        paddingBottom: viewMode === 'mobile' ? '80px' : '20px' // Account for mobile nav
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );

  // Touch-friendly button component
  const TouchButton = ({ children, className = '', ...props }) => (
    <Button
      className={`min-h-[44px] min-w-[44px] ${className}`}
      {...props}
    >
      {children}
    </Button>
  );

  // Swipe indicator
  const SwipeIndicator = () => (
    <div className="flex justify-center py-2 md:hidden">
      <div className="flex gap-1">
        {navigationItems.map((item) => (
          <div
            key={item.id}
            className={`w-2 h-2 rounded-full transition-colors ${
              activeSection === item.id ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <MobileHeader />

      {/* Main content */}
      <ResponsiveContainer>
        {/* Swipe indicator */}
        <SwipeIndicator />

        {/* Content sections */}
        <div className="space-y-4">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                viewMode,
                isMobile: viewMode === 'mobile',
                isTablet: viewMode === 'tablet',
                orientation,
                MobileInput,
                MobileSelect,
                CollapsibleSection,
                TouchButton
              });
            }
            return child;
          })}
        </div>

        {/* Mobile-specific components */}
        {viewMode === 'mobile' && (
          <div className="space-y-4 mt-6">
            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <TouchButton variant="outline" className="flex flex-col items-center py-4">
                    <Calculator className="h-6 w-6 mb-1" />
                    <span className="text-sm">Calculate</span>
                  </TouchButton>
                  <TouchButton variant="outline" className="flex flex-col items-center py-4">
                    <Share2 className="h-6 w-6 mb-1" />
                    <span className="text-sm">Share</span>
                  </TouchButton>
                </div>
              </CardContent>
            </Card>

            {/* Mobile tips */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Mobile Tips</h4>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Swipe left/right to navigate sections</li>
                      <li>• Tap section headers to collapse/expand</li>
                      <li>• Use the settings menu to customize view</li>
                      <li>• Rotate device for landscape mode</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </ResponsiveContainer>

      {/* Mobile navigation bar */}
      <MobileNavBar />

      {/* Orientation change notification */}
      {viewMode === 'mobile' && (
        <div className="fixed top-20 left-4 right-4 z-50">
          {orientation === 'landscape' && (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-800">
                Landscape mode detected. Some features may be optimized for portrait view.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Hook for mobile detection
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return { isMobile, isTablet, orientation };
};

// Mobile-optimized form component
export const MobileForm = ({ children, onSubmit, className = '' }) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return (
            <div className="space-y-1">
              {child}
            </div>
          );
        }
        return child;
      })}
    </form>
  );
};

export default MobileOptimizations;

