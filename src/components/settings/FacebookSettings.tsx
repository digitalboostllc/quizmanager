'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Facebook, Power, RefreshCw, ExternalLink, Copy } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FacebookPage {
  access_token: string;
  name: string;
  id: string;
  tasks: string[];
}

interface FacebookSettingsProps {
  initialSettings?: {
    isConnected: boolean;
    pageId: string;
    pageName?: string;
  };
}

export function FacebookSettings({ initialSettings }: FacebookSettingsProps) {
  const [isConnected, setIsConnected] = useState(initialSettings?.isConnected || false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPages, setIsFetchingPages] = useState(false);
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    pageId: initialSettings?.pageId || '',
    pageAccessToken: '',
    pageName: initialSettings?.pageName || '',
  });
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [userAccessToken, setUserAccessToken] = useState('');

  // Load current settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/facebook');
        const data = await response.json();
        if (data.isConnected) {
          setIsConnected(true);
          setSettings(prev => ({
            ...prev,
            pageId: data.pageId,
            pageName: data.pageName || '',
          }));
        }
      } catch {
        console.error('Error loading Facebook settings');
      }
    };
    loadSettings();
  }, []);

  const handleFetchPages = async () => {
    if (!userAccessToken) {
      toast({
        title: "Error",
        description: "Please enter a User Access Token first",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingPages(true);
    try {
      const response = await fetch('https://graph.facebook.com/v18.0/me/accounts', {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`
        }
      });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch pages');
      }

      setPages(data.data);
      toast({
        title: "Success",
        description: `Found ${data.data.length} page(s)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch pages",
        variant: "destructive",
      });
    } finally {
      setIsFetchingPages(false);
    }
  };

  const handleSelectPage = (pageId: string) => {
    const selectedPage = pages.find(p => p.id === pageId);
    if (selectedPage) {
      setSettings({
        pageId: selectedPage.id,
        pageAccessToken: selectedPage.access_token,
        pageName: selectedPage.name,
      });
      toast({
        title: "Page Selected",
        description: `Selected page: ${selectedPage.name}`,
      });
    }
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description,
      });
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/facebook/test');
      if (!response.ok) {
        throw new Error('Failed to test connection');
      }
      
      toast({
        title: 'Success',
        description: 'Connection test successful',
      });
    } catch (err) {
      console.error('Error testing connection:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to test connection',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/facebook', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      setSettings({
        pageId: '',
        pageAccessToken: '',
        pageName: '',
      });
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Facebook integration has been disabled.",
      });
    } catch (err) {
      console.error('Error disconnecting:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to disconnect Facebook integration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/facebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setIsConnected(data.isConnected);
      toast({
        title: "Settings Saved",
        description: "Facebook integration settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Facebook Integration</CardTitle>
              <CardDescription>
                Configure your Facebook page integration for automatic posting
              </CardDescription>
            </div>
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className="h-6"
            >
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Get Access Token Section */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="token-setup">
              <AccordionTrigger>How to Get Page Access Token</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">1. Get a User Access Token from Facebook Graph API Explorer:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open('https://developers.facebook.com/tools/explorer/', '_blank')}
                    >
                      Open Graph API Explorer <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">2. Enter your User Access Token:</p>
                    <div className="flex gap-2">
                      <Input
                        value={userAccessToken}
                        onChange={(e) => setUserAccessToken(e.target.value)}
                        placeholder="Paste your User Access Token here"
                        type="password"
                      />
                      <Button
                        variant="outline"
                        onClick={handleFetchPages}
                        disabled={isFetchingPages || !userAccessToken}
                      >
                        {isFetchingPages ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          "Fetch Pages"
                        )}
                      </Button>
                    </div>
                  </div>

                  {pages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">3. Select your page:</p>
                      <Select onValueChange={handleSelectPage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a page" />
                        </SelectTrigger>
                        <SelectContent>
                          {pages.map(page => (
                            <SelectItem key={page.id} value={page.id}>
                              {page.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Page Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Page ID</label>
              <div className="flex gap-2">
                <Input
                  value={settings.pageId}
                  onChange={(e) => setSettings(s => ({ ...s, pageId: e.target.value }))}
                  placeholder="Enter your Facebook Page ID"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(settings.pageId, "Page ID copied to clipboard")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Page Access Token</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={settings.pageAccessToken}
                  onChange={(e) => setSettings(s => ({ ...s, pageAccessToken: e.target.value }))}
                  placeholder="Enter your Page Access Token"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(settings.pageAccessToken, "Access Token copied to clipboard")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {isConnected && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Connected Page</label>
                <Input
                  value={settings.pageName}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            {isConnected ? (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                <Power className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={handleTestConnection}
                disabled={isTesting || !settings.pageId || !settings.pageAccessToken}
              >
                <Facebook className="mr-2 h-4 w-4" />
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isLoading || isTesting || !settings.pageId || !settings.pageAccessToken}
            >
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 