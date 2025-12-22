import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In a real app, you would log this to an error reporting service
    // like Sentry, LogRocket, or Azure Application Insights
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-800">
                    Something went wrong
                  </CardTitle>
                  <CardDescription>
                    The application encountered an unexpected error and needs to be refreshed.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Error ID:</strong> {this.state.errorId}
                  <br />
                  We apologize for the inconvenience. Please try refreshing the page or contact support if the issue persists.
                </AlertDescription>
              </Alert>

              {/* Development-only error details */}
              {isDevelopment && this.state.error && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertDescription>
                    <details className="text-sm">
                      <summary className="font-medium cursor-pointer mb-2 text-orange-800">
                        🛠️ Development Error Details (click to expand)
                      </summary>
                      <div className="space-y-2">
                        <div>
                          <strong>Error:</strong>
                          <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto">
                            {this.state.error.toString()}
                          </pre>
                        </div>
                        {this.state.errorInfo && (
                          <div>
                            <strong>Stack Trace:</strong>
                            <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-40">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 justify-center">
                <Button onClick={this.handleRetry} variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                <Button onClick={this.handleReload} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>
                  If this problem continues, please contact support with Error ID: 
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs ml-1">
                    {this.state.errorId}
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorFallback = null) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary;