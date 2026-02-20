import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Accessibility, Type, Contrast, Volume2, Keyboard, Eye } from 'lucide-react';

const AccessibilityEnhancements = ({ accessibilityMode, onToggleAccessibility }) => {
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReaderOptimized: false,
    keyboardNavigation: false,
    voiceAnnouncements: false
  });

  useEffect(() => {
    // Load accessibility preferences
    const saved = localStorage.getItem('azurePTUAccessibility');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load accessibility settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Apply accessibility settings to DOM
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }
    
    if (settings.largeText) {
      root.classList.add('accessibility-large-text');
    } else {
      root.classList.remove('accessibility-large-text');
    }
    
    if (settings.reducedMotion) {
      root.classList.add('accessibility-reduced-motion');
    } else {
      root.classList.remove('accessibility-reduced-motion');
    }

    // Save settings
    localStorage.setItem('azurePTUAccessibility', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const announceToScreenReader = (message) => {
    if (settings.screenReaderOptimized || settings.voiceAnnouncements) {
      // Create temporary element for screen reader announcement
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };

  const keyboardShortcuts = [
    { key: 'Ctrl + Enter', action: 'Run calculation' },
    { key: 'Ctrl + R', action: 'Refresh pricing data' },
    { key: 'Ctrl + E', action: 'Export results' },
    { key: 'Tab', action: 'Navigate between fields' },
    { key: 'Space', action: 'Toggle switches and buttons' },
    { key: 'Enter', action: 'Activate focused button' }
  ];

  if (!accessibilityMode) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleAccessibility(true)}
          className="flex items-center gap-2"
        >
          <Accessibility className="h-4 w-4" />
          Accessibility
        </Button>
      </div>
    );
  }

  return (
    <Card className="accessibility-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-blue-600" />
            <CardTitle>Accessibility Settings</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleAccessibility(false)}
          >
            Close
          </Button>
        </div>
        <CardDescription>
          Customize the calculator for better accessibility
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Accessibility */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visual Accessibility
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">High Contrast Mode</div>
                <div className="text-sm text-gray-600">Enhance color contrast for better visibility</div>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                aria-label="Toggle high contrast mode"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Large Text</div>
                <div className="text-sm text-gray-600">Increase font size for better readability</div>
              </div>
              <Switch
                checked={settings.largeText}
                onCheckedChange={(checked) => updateSetting('largeText', checked)}
                aria-label="Toggle large text mode"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Reduced Motion</div>
                <div className="text-sm text-gray-600">Minimize animations and transitions</div>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                aria-label="Toggle reduced motion mode"
              />
            </div>
          </div>
        </div>

        {/* Screen Reader Optimization */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Screen Reader Support
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Screen Reader Optimization</div>
                <div className="text-sm text-gray-600">Optimize interface for screen readers</div>
              </div>
              <Switch
                checked={settings.screenReaderOptimized}
                onCheckedChange={(checked) => updateSetting('screenReaderOptimized', checked)}
                aria-label="Toggle screen reader optimization"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Voice Announcements</div>
                <div className="text-sm text-gray-600">Announce calculation results and status</div>
              </div>
              <Switch
                checked={settings.voiceAnnouncements}
                onCheckedChange={(checked) => updateSetting('voiceAnnouncements', checked)}
                aria-label="Toggle voice announcements"
              />
            </div>
          </div>
        </div>

        {/* Keyboard Navigation */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Keyboard Navigation
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Enhanced Keyboard Navigation</div>
                <div className="text-sm text-gray-600">Improve focus indicators and navigation</div>
              </div>
              <Switch
                checked={settings.keyboardNavigation}
                onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
                aria-label="Toggle enhanced keyboard navigation"
              />
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div>
          <h3 className="font-medium mb-3">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {keyboardShortcuts.map((shortcut, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <Badge variant="outline" className="font-mono text-xs">
                  {shortcut.key}
                </Badge>
                <span className="text-sm text-gray-600">{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              announceToScreenReader('Accessibility settings reset to defaults');
              setSettings({
                highContrast: false,
                largeText: false,
                reducedMotion: false,
                screenReaderOptimized: false,
                keyboardNavigation: false,
                voiceAnnouncements: false
              });
            }}
          >
            Reset Defaults
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              announceToScreenReader('All accessibility features enabled');
              setSettings({
                highContrast: true,
                largeText: true,
                reducedMotion: true,
                screenReaderOptimized: true,
                keyboardNavigation: true,
                voiceAnnouncements: true
              });
            }}
          >
            Enable All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Provide the announceToScreenReader function for external use
export const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

export default AccessibilityEnhancements;