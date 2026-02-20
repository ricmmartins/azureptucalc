import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, Clock, RotateCcw, Eye } from 'lucide-react';

const InputHistory = ({ onLoadHistory }) => {
  const [history, setHistory] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    const loadHistory = () => {
      try {
        const saved = localStorage.getItem('azurePTUInputHistory');
        if (saved) {
          setHistory(JSON.parse(saved));
        }
      } catch (error) {
        console.warn('Failed to load input history:', error);
      }
    };

    loadHistory();
  }, []);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all input history?')) {
      localStorage.removeItem('azurePTUInputHistory');
      setHistory([]);
    }
  };

  const removeItem = (id) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('azurePTUInputHistory', JSON.stringify(updatedHistory));
  };

  const toggleExpanded = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const getUsagePattern = (item) => {
    const { formData } = item;
    const totalTokens = (formData.inputTokens || 0) + (formData.outputTokens || 0);
    const rpm = formData.requestsPerMinute || 0;
    
    if (totalTokens > 1000000) return { label: 'High Volume', color: 'bg-red-100 text-red-800' };
    if (rpm > 100) return { label: 'High Frequency', color: 'bg-orange-100 text-orange-800' };
    if (totalTokens > 100000) return { label: 'Medium Volume', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low Volume', color: 'bg-green-100 text-green-800' };
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <CardTitle className="text-gray-600">Input History</CardTitle>
          </div>
          <CardDescription>No previous calculations saved yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Your calculation history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <CardTitle>Input History</CardTitle>
            <Badge variant="secondary">{history.length}</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Previous calculations (last 10 entries)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((item) => {
          const pattern = getUsagePattern(item);
          const isExpanded = expandedItem === item.id;
          
          return (
            <div
              key={item.id}
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={pattern.color}>
                    {pattern.label}
                  </Badge>
                  <div>
                    <div className="font-medium text-sm">
                      {item.selectedModel} - {item.selectedRegion}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(item.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(item.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLoadHistory(item)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-3 pt-3 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="font-medium text-gray-600">Input Tokens</div>
                      <div>{(item.formData.inputTokens || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Output Tokens</div>
                      <div>{(item.formData.outputTokens || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Requests/Min</div>
                      <div>{(item.formData.requestsPerMinute || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Deployment</div>
                      <div className="capitalize">{item.selectedDeployment}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default InputHistory;