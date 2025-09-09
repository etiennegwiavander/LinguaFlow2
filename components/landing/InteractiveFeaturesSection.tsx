"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Sparkles,
  Target,
  Brain,
  Zap,
} from "lucide-react";

export default function InteractiveFeaturesSection() {
  const interactiveFeatures = [
    {
      icon: MessageSquare,
      title: "AI Discussion Topics Generator",
      description: "Generate unlimited conversation starters tailored to student interests, level, and learning goals. Each topic includes follow-up questions and cultural context.",
      demo: "Try it: 'Business English, B2 level, Marketing professional'",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/30",
      features: ["Unlimited topics", "Cultural context", "Follow-up questions", "Level-appropriate"],
    },
    {
      icon: BookOpen,
      title: "Infinite Vocabulary Flashcards",
      description: "AI creates vocabulary sets with semantic relationships, example sentences, and pronunciation guides. Never run out of relevant words to teach.",
      demo: "Example: 'Travel vocabulary for A2 students visiting London'",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/30",
      features: ["Semantic relationships", "Pronunciation guides", "Example sentences", "Infinite generation"],
    },
    {
      icon: TrendingUp,
      title: "Adaptive Learning Paths",
      description: "Lessons automatically adjust difficulty and focus areas based on student performance and engagement analytics.",
      demo: "Student struggling with past tense? AI emphasizes grammar practice.",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/30",
      features: ["Performance tracking", "Auto-adjustment", "Focus areas", "Engagement analytics"],
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-emerald-50/20 to-blue-50/30 dark:from-purple-900/10 dark:via-emerald-900/10 dark:to-blue-900/10"></div>
      <div className="absolute inset-0 grid-background opacity-20"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-gradient-to-r from-purple-400/20 to-emerald-400/20 text-purple-600 dark:text-purple-400 border-purple-400/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Interactive Learning Tools
          </Badge>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Beyond Lesson Plans:
            <span className="gradient-text"> Interactive Learning</span>
            <br />
            <span className="text-foreground/80">That Engages</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Our AI doesn't just create static lesson plans. It generates dynamic, interactive learning experiences 
            that adapt to each student's progress and keep them engaged throughout their learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {interactiveFeatures.map((feature, index) => (
            <Card 
              key={index} 
              className={`floating-card glass-effect border-0 hover:${feature.borderColor} transition-all duration-300 group relative overflow-hidden`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <CardHeader className="relative z-10">
                <div className={`w-16 h-16 rounded-full ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl group-hover:text-cyber-400 transition-colors duration-300">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10 space-y-4">
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
                
                <div className={`p-3 rounded-lg ${feature.bgColor} border ${feature.borderColor}`}>
                  <p className="text-sm font-medium text-foreground/80">
                    {feature.demo}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {feature.features.map((feat, featIndex) => (
                    <Badge 
                      key={featIndex}
                      variant="secondary"
                      className="text-xs bg-background/50 hover:bg-background/80 transition-colors duration-200"
                    >
                      {feat}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-muted-foreground mb-4">
            <Lightbulb className="w-5 h-5 text-cyber-400" />
            <span>These features are available in all plans</span>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the full power of AI-driven language education. 
            Start your free trial and see how interactive learning transforms student engagement.
          </p>
        </div>
      </div>
    </section>
  );
}