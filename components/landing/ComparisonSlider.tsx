"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  FileText,
  User,
  RefreshCw,
  Zap,
  Target,
  BarChart3,
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";

export default function ComparisonSlider() {
  const [showAfter, setShowAfter] = useState(true);
  const linguaFlowMethods = [
    {
      icon: Zap,
      text: "30 seconds per lesson",
      subtext: "AI generates complete lesson plans",
      color: "text-emerald-500",
      highlight: "95% time savings",
    },
    {
      icon: Target,
      text: "Hyper-personalized for each student",
      subtext: "15+ profile factors analyzed",
      color: "text-emerald-500",
      highlight: "Individual learning paths",
    },
    {
      icon: BarChart3,
      text: "Automated progress analytics",
      subtext: "Real-time performance insights",
      color: "text-emerald-500",
      highlight: "Data-driven decisions",
    },
    {
      icon: Brain,
      text: "AI adapts to student performance",
      subtext: "Continuous lesson optimization",
      color: "text-emerald-500",
      highlight: "Smart adaptation",
    },
    {
      icon: Sparkles,
      text: "Interactive learning tools",
      subtext: "Discussion topics, flashcards, games",
      color: "text-emerald-500",
      highlight: "85% more engagement",
    },
  ];  

  const traditionalMethods = [
    {
      icon: Clock,
      text: "3+ hours per lesson",
      subtext: "Manual research and planning",
      color: "text-red-500",
    },
    {
      icon: FileText,
      text: "Generic, one-size-fits-all content",
      subtext: "Same materials for all students",
      color: "text-red-500",
    },
    {
      icon: User,
      text: "Manual student tracking",
      subtext: "Spreadsheets and paper notes",
      color: "text-red-500",
    },
    {
      icon: RefreshCw,
      text: "Static lessons, no adaptation",
      subtext: "Fixed content regardless of progress",
      color: "text-red-500",
    },
    {
      icon: AlertCircle,
      text: "Limited engagement tools",
      subtext: "Basic worksheets and exercises",
      color: "text-red-500",
    },
  ];



  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 via-background to-emerald-50/20 dark:from-red-900/10 dark:via-background dark:to-emerald-900/10"></div>
      <div className="absolute inset-0 grid-background opacity-20"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-gradient-to-r from-red-400/20 to-emerald-400/20 text-foreground border-border">
            <TrendingUp className="w-3 h-3 mr-1" />
            The Transformation
          </Badge>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Traditional Planning vs
            <span className="gradient-text"> LinguaFlow AI</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            See the dramatic difference Lingua Flow makes in lesson preparation time, 
            personalization, and student engagement.
          </p>
          
          <div className="flex items-center justify-center space-x-4 mb-8">


            <span className={`font-medium transition-colors duration-300 ${showAfter ? 'text-foreground' : 'text-muted-foreground'}`}>
              With LinguaFlow
            </span>

            <Switch
              checked={showAfter}
              onCheckedChange={setShowAfter}
              className="data-[state=checked]:bg-emerald-400"
            />
            <span className={`font-medium transition-colors duration-300 ${!showAfter ? 'text-foreground' : 'text-muted-foreground'}`}>
              Traditional Method
            </span>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Traditional Method Card */}
          <Card className={`transition-all duration-500 ${!showAfter ? 'ring-2 ring-red-400 scale-105' : 'opacity-60 scale-95'} border-red-400/30`}>
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                Traditional Planning
              </CardTitle>
              <p className="text-muted-foreground">The old way of doing things</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {traditionalMethods.map((method, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30">
                  <method.icon className={`w-5 h-5 mt-0.5 ${method.color} flex-shrink-0`} />
                  <div>
                    <div className={`font-medium ${method.color}`}>
                      {method.text}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {method.subtext}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-red-100/50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                    3+ Hours
                  </div>
                  <div className="text-sm text-red-600/80 dark:text-red-400/80">
                    Average prep time per lesson
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LinguaFlow Method Card */}
          <Card className={`transition-all duration-500 ${showAfter ? 'ring-2 ring-emerald-400 scale-105' : 'opacity-60 scale-95'} border-emerald-400/30`}>
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-emerald-500" />
              </div>
              <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
                With LinguaFlow
              </CardTitle>
              <p className="text-muted-foreground">AI-powered efficiency</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {linguaFlowMethods.map((method, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30">
                  <method.icon className={`w-5 h-5 mt-0.5 ${method.color} flex-shrink-0`} />
                  <div className="flex-1">
                    <div className={`font-medium ${method.color}`}>
                      {method.text}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {method.subtext}
                    </div>
                    {method.highlight && (
                      <Badge className="mt-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                        {method.highlight}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    30 Seconds
                  </div>
                  <div className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                    AI generates complete lesson plans
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">95%</div>
              <div className="text-muted-foreground">Less Prep Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">85%</div>
              <div className="text-muted-foreground">Higher Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">100%</div>
              <div className="text-muted-foreground">Personalized Content</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}