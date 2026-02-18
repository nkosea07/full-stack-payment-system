'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Smartphone,
  CreditCard,
  Wallet,
  Key,
  Globe,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export default function AdminPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods');
      const data = await response.json();
      if (data.success) {
        setPaymentMethods(data.payment_methods);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = async (id: string, isActive: boolean) => {
    setSaving(id);
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: isActive }),
      });

      const data = await response.json();
      if (data.success) {
        setPaymentMethods((prev) =>
          prev.map((pm) => (pm.id === id ? { ...pm, is_active: isActive } : pm))
        );
      }
    } catch (error) {
      console.error('Failed to update payment method:', error);
    } finally {
      setSaving(null);
    }
  };

  const getMethodIcon = (code: string) => {
    switch (code) {
      case 'ECO_CASH':
        return Smartphone;
      case 'VISA_MASTERCARD':
        return CreditCard;
      default:
        return Wallet;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S&P</span>
              </div>
              <span className="font-semibold">Admin Settings</span>
            </div>
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            Sandbox Mode
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="payment-methods">
          <TabsList className="mb-6">
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="api-config">API Configuration</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="payment-methods">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Enable or disable payment methods available for checkout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.map((method) => {
                  const Icon = getMethodIcon(method.code);
                  return (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">{method.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {saving === method.id && (
                          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        <Switch
                          checked={method.is_active}
                          onCheckedChange={(checked) => togglePaymentMethod(method.id, checked)}
                          disabled={saving === method.id}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="p-4 border border-dashed rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Additional payment methods (Innbucks, Omari, SmileCash) coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-config">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Configure your Smile&Pay API credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Environment: Sandbox</p>
                    <p className="text-sm text-muted-foreground">
                      You are currently using the sandbox environment for testing
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey" className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Key
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your Smile&Pay API key"
                      defaultValue=""
                    />
                    <p className="text-xs text-muted-foreground">
                      Set via SMILEPAY_API_KEY environment variable
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiSecret" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      API Secret
                    </Label>
                    <Input
                      id="apiSecret"
                      placeholder="Enter your API Secret"
                      defaultValue=""
                    />
                    <p className="text-xs text-muted-foreground">
                      Set via SMILEPAY_API_SECRET environment variable
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">API Endpoints</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sandbox</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        zbnet.zb.co.zw/wallet_sandbox_api
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Production</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        zbnet.zb.co.zw/wallet_api
                      </code>
                    </div>
                  </div>
                </div>

                <Button disabled>
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>
                  Configure webhook endpoints for payment notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Result URL (Webhook)</Label>
                  <Input
                    id="webhookUrl"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/smilepay` : '/api/webhooks/smilepay'}
                  />
                  <p className="text-xs text-muted-foreground">
                    This URL receives payment status updates from Smile&Pay
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Secret</Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    placeholder="Enter webhook secret for signature validation"
                    defaultValue=""
                  />
                  <p className="text-xs text-muted-foreground">
                    Set via WEBHOOK_SECRET environment variable
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Webhook Events</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Payment Success</span>
                      <Badge variant="outline" className="text-success">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Payment Failed</span>
                      <Badge variant="outline" className="text-success">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Payment Cancelled</span>
                      <Badge variant="outline" className="text-success">Active</Badge>
                    </div>
                  </div>
                </div>

                <Button disabled>
                  Save Webhook Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
