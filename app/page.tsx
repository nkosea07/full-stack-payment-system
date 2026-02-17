import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  Smartphone,
  CreditCard,
  Zap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S&P</span>
            </div>
            <span className="font-semibold">Smile&Pay</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/checkout">Start Payment</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
            Accept Payments in Zimbabwe
          </h1>
          <p className="mt-6 text-lg text-muted-foreground text-pretty">
            A complete payment gateway integration with Smile&Pay. Accept EcoCash, 
            Visa, and Mastercard payments with both Standard and Express checkout flows.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/checkout">
                Try Checkout Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 border-t">
        <h2 className="text-2xl font-bold text-center mb-12">Payment Methods Supported</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">EcoCash</h3>
              <p className="text-muted-foreground mt-2">
                Accept mobile money payments via EcoCash with USSD push notifications.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Visa / Mastercard</h3>
              <p className="text-muted-foreground mt-2">
                Process debit and credit card payments with 3D Secure authentication.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Coming Soon</h3>
              <p className="text-muted-foreground mt-2">
                Innbucks, Omari, and SmileCash support planned for future releases.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Checkout Types */}
      <section className="container mx-auto px-4 py-16 border-t">
        <h2 className="text-2xl font-bold text-center mb-12">Checkout Options</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-primary">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Standard Checkout</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Hosted payment page by Smile&Pay</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>PCI compliant - no card data on your server</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Multiple payment methods in one page</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Minimal integration effort</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Express Checkout</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Direct API integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Custom checkout experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>EcoCash USSD push support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span>Card payments with 3DS</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sandbox Notice */}
      <section className="container mx-auto px-4 py-16 border-t">
        <Card className="max-w-2xl mx-auto bg-muted/50">
          <CardContent className="p-6 text-center">
            <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Sandbox Mode Active</h3>
            <p className="text-muted-foreground mt-2">
              This demo runs in sandbox mode. No real payments are processed. 
              Use the simulation buttons to test different payment outcomes.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span>USD and ZWG currencies</span>
              <span>|</span>
              <span>Test phone: 0771234567</span>
              <span>|</span>
              <span>Test card: 4111 1111 1111 1111</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">S&P</span>
              </div>
              <span>Smile&Pay Payment Gateway Demo</span>
            </div>
            <p>Built for Zimbabwe&apos;s payment ecosystem</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
