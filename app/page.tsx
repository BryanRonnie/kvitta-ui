/**
 * Landing Page (Server Component)
 * 
 * This is a Server Component by default in Next.js App Router.
 * Benefits:
 * - Zero JavaScript sent to client
 * - SEO-friendly
 * - Fast initial load
 * 
 * Note: Use 'use client' directive only when you need:
 * - React hooks (useState, useEffect, etc.)
 * - Browser APIs
 * - Event handlers
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Receipt Processing
            <span className="block text-blue-600">Powered by AI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Extract, analyze, and split bills from receipt images using 
            cutting-edge Nvidia OCR and AI technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/upload">
              <Button size="lg">
                Get Started
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="🤖"
            title="AI-Powered OCR"
            description="Nvidia's advanced OCR technology extracts text from receipts with high accuracy"
          />
          <FeatureCard
            icon="💰"
            title="Smart Parsing"
            description="Automatically identifies items, prices, taxes, and fees using LLM reasoning"
          />
          <FeatureCard
            icon="📊"
            title="Easy to Use"
            description="Simple upload interface with instant results and detailed breakdowns"
          />
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="Upload Receipt"
              description="Take photos of your receipt showing items and charges"
            />
            <StepCard
              number={2}
              title="AI Processing"
              description="Our AI extracts and analyzes all the information"
            />
            <StepCard
              number={3}
              title="Get Results"
              description="View parsed items, fees, and totals instantly"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to get started?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Try Kvitta today and experience the future of receipt processing.
        </p>
        <Link href="/upload">
          <Button size="lg">
            Upload Your First Receipt
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Reusable Feature Card Component
 * This is a Server Component (no 'use client' needed)
 */
function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="text-4xl mb-2">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({
  number,
  title,
  description
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}


