"use client";

import { useState } from "react";
import Link from "next/link";
import LandingLayout from "@/components/landing/LandingLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle,
  Zap,
  Crown,
  Rocket,
  Star,
  Users,
  Brain,
  Globe,
  Shield,
  Headphones,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for individual tutors getting started",
      icon: Zap,
      color: "text-cyber-400",
      bgColor: "bg-cyber-400/10",
      borderColor: "border-cyber-400/30",
      monthly: 19,
      annual: 15,
      features: [
        "Up to 50 students",
        "100 AI-generated lessons/month",
        "Basic lesson templates",
        "Student progress tracking",
        "Email support",
        "Mobile app access",
      ],
      limitations: [
        "Limited customization options",
        "Standard AI models only",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Professional",
      description: "For serious educators and small language schools",
      icon: Crown,
      color: "text-neon-400",
      bgColor: "bg-neon-400/10",
      borderColor: "border-neon-400/30",
      monthly: 49,
      annual: 39,
      features: [
        "Up to 200 students",
        "Unlimited AI-generated lessons",
        "Premium lesson templates",
        "Advanced analytics & insights",
        "Calendar integration",
        "Custom branding",
        "Priority support",
        "Advanced AI models",
        "Bulk student import",
        "Export capabilities",
      ],
      limitations: [],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For large institutions and language schools",
      icon: Rocket,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/30",
      monthly: 99,
      annual: 79,
      features: [
        "Unlimited students",
        "Unlimited AI-generated lessons",
        "All premium templates",
        "Advanced analytics & reporting",
        "API access",
        "Custom integrations",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom AI model training",
        "White-label solution",
        "SSO integration",
        "Advanced security features",
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  const features = [
    {
      category: "AI & Content Generation",
      icon: Brain,
      items: [
        { name: "AI-Powered Lesson Generation", starter: true, pro: true, enterprise: true },
        { name: "Basic Lesson Templates", starter: true, pro: false, enterprise: false },
        { name: "Premium Lesson Templates", starter: false, pro: true, enterprise: true },
        { name: "Custom Template Creation", starter: false, pro: true, enterprise: true },
        { name: "Advanced AI Models", starter: false, pro: true, enterprise: true },
        { name: "Custom AI Training", starter: false, pro: false, enterprise: true },
      ],
    },
    {
      category: "Student Management",
      icon: Users,
      items: [
        { name: "Student Profiles", starter: true, pro: true, enterprise: true },
        { name: "Progress Tracking", starter: true, pro: true, enterprise: true },
        { name: "Advanced Analytics", starter: false, pro: true, enterprise: true },
        { name: "Bulk Import/Export", starter: false, pro: true, enterprise: true },
        { name: "Custom Reports", starter: false, pro: false, enterprise: true },
      ],
    },
    {
      category: "Integration & Support",
      icon: Globe,
      items: [
        { name: "Calendar Integration", starter: false, pro: true, enterprise: true },
        { name: "API Access", starter: false, pro: false, enterprise: true },
        { name: "SSO Integration", starter: false, pro: false, enterprise: true },
        { name: "Email Support", starter: true, pro: true, enterprise: true },
        { name: "Priority Support", starter: false, pro: true, enterprise: true },
        { name: "24/7 Phone Support", starter: false, pro: false, enterprise: true },
        { name: "Dedicated Account Manager", starter: false, pro: false, enterprise: true },
      ],
    },
  ];

  const faqs = [
    {
      question: "Can I change plans anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.",
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "Your data remains accessible for 30 days after cancellation. You can export all your content during this period. After 30 days, data is permanently deleted.",
    },
    {
      question: "Do you offer discounts for educational institutions?",
      answer: "Yes! We offer special pricing for schools, universities, and non-profit educational organizations. Contact our sales team for custom pricing.",
    },
    {
      question: "Is there a free trial?",
      answer: "Absolutely! All plans come with a 14-day free trial. No credit card required to start. You can explore all features during the trial period.",
    },
    {
      question: "What languages are supported?",
      answer: "LinguaFlow supports 10+ languages including English, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese, and Russian, with more being added regularly.",
    },
  ];

  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neural-50 via-cyber-50/30 to-neon-50/20 dark:from-neural-900 dark:via-neural-800 dark:to-neural-900"></div>
        <div className="absolute inset-0 grid-background opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
            <Star className="w-3 h-3 mr-1" />
            Simple, Transparent Pricing
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Choose Your
            <span className="gradient-text"> Perfect Plan</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Start with a 14-day free trial. No credit card required. 
            Scale as you grow with flexible pricing that adapts to your needs.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-cyber-400"
            />
            <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Save 20%
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative floating-card ${
                  plan.popular
                    ? 'border-2 border-neon-400 shadow-neon scale-105'
                    : `border ${plan.borderColor}`
                } transition-all duration-300 group`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-neon-400 to-purple-400 text-white px-4 py-1">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className={`w-16 h-16 rounded-full ${plan.bgColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <plan.icon className={`w-8 h-8 ${plan.color}`} />
                  </div>
                  <CardTitle className="text-2xl group-hover:text-cyber-400 transition-colors duration-300">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold gradient-text">
                        ${isAnnual ? plan.annual : plan.monthly}
                      </span>
                      <span className="text-muted-foreground ml-2">/month</span>
                    </div>
                    {isAnnual && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Billed annually (${plan.annual * 12}/year)
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-neon-400 to-purple-400 hover:from-neon-500 hover:to-purple-500 text-white border-0 shadow-glow hover:shadow-glow-lg'
                        : 'border-cyber-400/30 text-cyber-600 dark:text-cyber-400 hover:bg-cyber-400/10 hover:border-cyber-400'
                    } transition-all duration-300 group`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Compare
              <span className="gradient-text"> All Features</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See exactly what's included in each plan to make the best choice for your needs.
            </p>
          </div>

          <div className="space-y-12">
            {features.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="flex items-center mb-6">
                  <category.icon className="w-6 h-6 text-cyber-400 mr-3" />
                  <h3 className="text-xl font-semibold">{category.category}</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 pr-6 font-medium">Feature</th>
                        <th className="text-center py-3 px-4 font-medium">Starter</th>
                        <th className="text-center py-3 px-4 font-medium">Professional</th>
                        <th className="text-center py-3 px-4 font-medium">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.items.map((item, itemIndex) => (
                        <tr key={itemIndex} className="border-b border-border/50">
                          <td className="py-3 pr-6 text-sm">{item.name}</td>
                          <td className="text-center py-3 px-4">
                            {item.starter ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                            ) : (
                              <div className="w-5 h-5 mx-auto"></div>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {item.pro ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                            ) : (
                              <div className="w-5 h-5 mx-auto"></div>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {item.enterprise ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                            ) : (
                              <div className="w-5 h-5 mx-auto"></div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Frequently Asked
              <span className="gradient-text"> Questions</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our pricing and plans.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-cyber-600 dark:text-cyber-400">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-cyber-900 via-neon-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-30"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of educators who are already transforming their teaching with LinguaFlow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-cyber-900 hover:bg-white/90 border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 group px-8 py-6 text-lg">
                <Rocket className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="#contact">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:border-white transition-all duration-300 px-8 py-6 text-lg">
                <Headphones className="w-5 h-5 mr-2" />
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}