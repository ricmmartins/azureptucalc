import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Share2, 
  Copy, 
  Link, 
  Mail, 
  Download, 
  QrCode,
  Eye,
  CheckCircle,
  ExternalLink,
  FileText,
  BarChart3
} from 'lucide-react';

const ShareAnalysis = ({ 
  analysisData, 
  onGenerateShareLink, 
  onExportData,
}) => {
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareStats, setShareStats] = useState({
    views: 0,
    shares: 0,
    lastAccessed: null
  });
  const [shareOptions, setShareOptions] = useState({
    includeData: true,
    includeCharts: true,
    includeRecommendations: true,
    allowEditing: false,
    expiresIn: '30d'
  });

  // Generate shareable URL with encoded analysis data
  const generateShareableUrl = async () => {
    setIsGenerating(true);
    try {
      // Encode analysis data
      const shareData = {
        timestamp: new Date().toISOString(),
        config: {
          region: analysisData?.region,
          model: analysisData?.model,
          deploymentType: analysisData?.deploymentType
        },
        kqlData: analysisData?.kqlData,
        results: shareOptions.includeData ? analysisData?.results : null,
        recommendations: shareOptions.includeRecommendations ? analysisData?.recommendations : null,
        options: shareOptions
      };

      // Create base64 encoded URL parameter with proper UTF-8 encoding
      const jsonString = JSON.stringify(shareData);
      const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
      const baseUrl = window.location.origin + window.location.pathname;
      const newShareUrl = `${baseUrl}?shared=${encodedData}`;
      
      setShareUrl(newShareUrl);
      
      // Simulate API call to save share data
      const shareId = Math.random().toString(36).substr(2, 9);
      const shortUrl = `${baseUrl}?s=${shareId}`;
      setShareUrl(shortUrl);
      
      // Update stats
      setShareStats(prev => ({
        ...prev,
        shares: prev.shares + 1,
        lastAccessed: new Date().toISOString()
      }));

      onGenerateShareLink?.(shortUrl, shareData);
    } catch (error) {
      console.error('Error generating share URL:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Share via different platforms
  const shareVia = (platform) => {
    const title = 'Azure OpenAI PTU Cost Analysis';
    const text = `Check out my Azure OpenAI cost optimization analysis. Potential savings identified!`;
    
    const urls = {
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`,
      teams: `https://teams.microsoft.com/share?href=${encodeURIComponent(shareUrl)}&msgText=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  // Export analysis data
  const exportAnalysis = (format) => {
    const exportData = {
      timestamp: new Date().toISOString(),
      analysis: analysisData,
      shareUrl: shareUrl
    };

    switch (format) {
      case 'json':
        downloadFile(JSON.stringify(exportData, null, 2), 'azure-openai-analysis.json', 'application/json');
        break;
      case 'csv': {
        const csvData = convertToCSV(exportData);
        downloadFile(csvData, 'azure-openai-analysis.csv', 'text/csv');
        break;
      }
      case 'pdf':
        // In a real implementation, this would generate a PDF report
        alert('PDF export would be implemented with a PDF generation library');
        break;
    }
    
    onExportData?.(format, exportData);
  };

  // Helper function to download file
  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Convert data to CSV format
  const convertToCSV = (data) => {
    const headers = ['Metric', 'Value', 'Description'];
    const rows = [
      ['Region', data.analysis?.region, 'Selected Azure region'],
      ['Model', data.analysis?.model, 'Selected OpenAI model'],
      ['Deployment Type', data.analysis?.deploymentType, 'Deployment configuration'],
      ['Average TPM', data.analysis?.kqlData?.avgTPM, 'Average tokens per minute'],
      ['Recommended PTU', data.analysis?.kqlData?.recommendedPTU, 'Recommended PTU allocation'],
      ['Generated', data.timestamp, 'Analysis generation time']
    ];

    return [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
  };

  // Load shared analysis from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('shared');
    const shortId = urlParams.get('s');
    
    if (sharedData) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(escape(atob(sharedData))));
        // Load shared analysis data
        console.log('Loaded shared analysis:', decodedData);
        setShareStats(prev => ({ ...prev, views: prev.views + 1 }));
      } catch (error) {
        console.error('Error loading shared analysis:', error);
      }
    } else if (shortId) {
      // In a real implementation, this would fetch data from an API
      console.log('Loading shared analysis with ID:', shortId);
      setShareStats(prev => ({ ...prev, views: prev.views + 1 }));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Share Options Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Analysis
          </CardTitle>
          <CardDescription>
            Generate a shareable link to your cost optimization analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Share Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Include in Share</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={shareOptions.includeData}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, includeData: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Usage data & metrics</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={shareOptions.includeCharts}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Interactive charts</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={shareOptions.includeRecommendations}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, includeRecommendations: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Recommendations</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Permissions</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={shareOptions.allowEditing}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, allowEditing: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Allow editing</span>
                </label>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Expires in:</label>
                  <select
                    value={shareOptions.expiresIn}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, expiresIn: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="1d">1 day</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Share Link */}
          <div className="pt-4 border-t">
            <Button 
              onClick={generateShareableUrl} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Share Link'}
            </Button>
          </div>

          {/* Generated Share URL */}
          {shareUrl && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Share link generated!</span>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(shareUrl)}
                  className="flex items-center gap-1"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              {/* Share Statistics */}
              <div className="flex gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{shareStats.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  <span>{shareStats.shares} shares</span>
                </div>
                {shareStats.lastAccessed && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Last accessed: {new Date(shareStats.lastAccessed).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Share Actions */}
      {shareUrl && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Share via Platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Share via Platform</CardTitle>
              <CardDescription>Share your analysis on different platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => shareVia('email')}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => shareVia('teams')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Microsoft Teams
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => shareVia('linkedin')}
              >
                <Users className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Analysis</CardTitle>
              <CardDescription>Download your analysis in different formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => exportAnalysis('json')}
              >
                <FileText className="h-4 w-4 mr-2" />
                JSON Data
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => exportAnalysis('csv')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                CSV Report
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => exportAnalysis('pdf')}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF Report
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Code for Mobile Sharing */}
      {shareUrl && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Generate QR Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code for Mobile Access</DialogTitle>
              <DialogDescription>
                Scan this QR code to access the analysis on mobile devices
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-8">
              <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">QR Code would be generated here</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Or copy the link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                />
                <Button size="sm" onClick={() => copyToClipboard(shareUrl)}>
                  Copy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ShareAnalysis;

