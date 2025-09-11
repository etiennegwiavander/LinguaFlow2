"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import LandingLayout from "@/components/landing/LandingLayout";
import InteractiveFeaturesSection from "@/components/landing/InteractiveFeaturesSection";
import TrustSecuritySection from "@/components/landing/TrustSecuritySection";
import ComparisonSlider from "@/components/landing/ComparisonSlider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Brain,
  Zap,
  Globe,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star,
  Languages,
  Target,
  Clock,
  TrendingUp,
  Shield,
  Rocket,
  MessageSquare,
  BarChart3,
  Lightbulb,
  Loader2,
  GraduationCap,
  Play,
  X,
  Calendar,
  MousePointer2,
  Building,
  Briefcase,

} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const videoSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!loading && user) {
      // User is authenticated, redirect to dashboard
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleWatchDemo = () => {
    setShowDemoVideo(!showDemoVideo);

    // If showing video, scroll to it after a short delay to ensure it's rendered
    if (!showDemoVideo) {
      setTimeout(() => {
        if (videoSectionRef.current) {
          videoSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Show loading state while checking auth
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src="/linguaflowfavicon.png"
              alt="LinguaFlow Logo"
              className="h-12 w-12 animate-pulse"
            />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-lg font-medium">Loading LinguaFlow...</span>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, don't show landing page (redirect will happen)
  if (user) {
    return null;
  }

  const features = [
    {
      icon: Brain,
      title: "Quick Lesson Creation",
      description: "Create complete lesson plans with interactive exercises, discussion topics, and vocabulary flashcards in under 30 seconds that understands 15+ student profile factors.",
      color: "text-cyber-400",
      bgColor: "bg-cyber-400/10",
    },
    {
      icon: Target,
      title: "True Personalization",
      description: "In-depth analysis of students' individual learning styles, strengths, weaknesses, and cultural background creating lessons that adapt to each student's needs.",
      color: "text-neon-400",
      bgColor: "bg-neon-400/10",
    },
    {
      icon: MessageSquare,
      title: "Instant Discussion Topics",
      description: "Unlimited conversation starters with follow-up questions, in different cultural contexts tailored to each student interests and proficiency level.",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      icon: BookOpen,
      title: "Infinite Vocabulary Flashcards",
      description: "Lingua Flow creates vocabulary sets with semantic relationships, pronunciation guides, and contextual examples. Never run out of relevant words to teach.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      icon: Calendar,
      title: "Calendar Integration",
      description: "Seamlessly sync your Google Calendar and automatically generate lessons for upcoming sessions.",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      icon: MousePointer2,
      title: "Instant Translation & Context",
      description: "Double-click any word for instant translation with cultural context - eliminating the need for external tools.",
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
    {
      icon: TrendingUp,
      title: "Adaptive Learning Analytics",
      description: "Track student progress with detailed insights showing engagement patterns, skill development, and learning velocity to optimize outcomes.",
      color: "text-teal-400",
      bgColor: "bg-teal-400/10",
    },
    {
      icon: Shield,
      title: "Enterprise Security & Privacy",
      description: "GDPR compliant, SOC 2 certified platform with AES-256 encryption, ensuring your student's data is protected with bank-level security.",
      color: "text-indigo-400",
      bgColor: "bg-indigo-400/10",
    },
  ];

  const stats = [
    { number: "95%", label: "Less Prep Time", icon: Clock, color: "text-emerald-400" },
    { number: "85%", label: "Higher Engagement", icon: TrendingUp, color: "text-blue-400" },
    { number: "2.5K+", label: "Active Educators", icon: Users, color: "text-purple-400" },
    { number: "50+", label: "Countries Served", icon: Globe, color: "text-cyan-400" },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "ESL Teacher, International Language Academy",
      avatar: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      content: "My lesson prep time dropped from 3 hours to 15 minutes. Student engagement increased 85% with the interactive discussion topics and vocabulary flashcards.",
      metrics: "85% engagement increase",
      rating: 5,
    },
    {
      name: "Miguel Rodriguez",
      role: "Language School Director, 200+ students",
      avatar: "https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      content: "LinguaFlow creates culturally relevant content that resonates with students from 15+ countries. Our retention rate improved by 40% since implementation.",
      metrics: "40% retention improvement",
      rating: 5,
    },
    {
      name: "Emma Thompson",
      role: "Private Tutor, Business English Specialist",
      avatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      content: "The vocabulary flashcards with semantic relationships help my corporate clients learn 3x faster. They love the personalized content that matches their industry.",
      metrics: "3x faster learning",
      rating: 5,
    },
  ];

  return (
    <LandingLayout>


      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-neural-50 via-cyber-50/30 to-neon-50/20 dark:from-neural-900 dark:via-neural-800 dark:to-neural-900"></div>
        <div className="absolute inset-0 grid-background opacity-30"></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-cyber-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-neon-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-slide-up">
            <Badge className="mb-6 bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-800 dark:text-cyber-200 border-cyber-400/30 hover:bg-gradient-to-r hover:from-cyber-400/30 hover:to-neon-400/30 transition-all duration-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Built for Private One-on-One Language Tutors
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Hyper-Personalized Lessons</span>
              <br />
              <span className="text-foreground">That Adapts to Every</span>
              <br />
              <span className="text-foreground/80">Student in Seconds</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
              Create engaging personalized interactive lesson materials with interactive discussion topics, vocabulary flashcards,
              and adaptive exercises. Reduce prep time by 95% while increasing student engagement by 85%.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 group px-8 py-6 text-lg">
                  <Rocket className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  Start Creating Lessons
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-cyber-400/30 text-cyber-600 dark:text-cyber-400 hover:bg-cyber-400/10 hover:border-cyber-400 transition-all  hover:text-cyber-400 duration-300 px-8 py-6 text-lg"
                onClick={handleWatchDemo}
              >
                {showDemoVideo ? (
                  <>
                    <X className="w-5 h-5 mr-2" />
                    Hide Demo
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Watch Demo
                  </>
                )}
              </Button>
            </div>

            {/* Demo Video Section */}
            {showDemoVideo && (
              <div
                ref={videoSectionRef}
                className="w-full max-w-4xl mx-auto mb-12 animate-scale-in"
                id="demo-video-section"
              >
                <div className="relative rounded-lg overflow-hidden shadow-xl border border-cyber-400/30">
                  <div className="aspect-video">
                    <iframe
                      src="https://www.youtube.com/embed/haCKxBlcc6E?si=xVLIN0p4iGD9iwuf&autoplay=1"
                      title="YouTube video player"
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </div>
            )}




            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex justify-center mb-2">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-cyber-400/20 to-neon-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.number}</div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <InteractiveFeaturesSection />

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-400/20 to-pink-400/20 text-purple-200 dark:text-purple-800 border-purple-400/30">
              <Lightbulb className="w-3 h-3 mr-1" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Revitalize Your
              <span className="gradient-text"> Teaching Experience</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Lingua Flow provides vital tools you need to create engaging,
              personalized language lessons that adapt to each student's learning goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl group-hover:text-cyber-400 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Slider Section */}
      <ComparisonSlider />

      {/* How It Works Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-50/30 to-neon-50/20 dark:from-cyber-900/20 dark:to-neon-900/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 text-emerald-800 dark:text-emerald-100 border-emerald-400/30">
              <Zap className="w-3 h-3 mr-1" />
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              From Student Profile to
              <span className="gradient-text"> Perfect Lesson</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our intelligent system transforms student information into engaging,
              personalized lessons in just three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Add Student Profile",
                description: "Input student details, learning goals, strengths, and areas for improvement. Our system analyzes this data to understand their unique learning needs.",
                icon: Users,
                color: "text-cyber-400",
                bgColor: "bg-cyber-400/10",
              },
              {
                step: "02",
                title: "Automated Content Generation",
                description: "Our intelligent system creates personalized lesson plans with interactive exercises, vocabulary, and activities tailored to the student's profile.",
                icon: Brain,
                color: "text-neon-400",
                bgColor: "bg-neon-400/10",
              },
              {
                step: "03",
                title: "Teach & Adapt",
                description: "Use the generated lessons in your classes. The system learns from student progress and continuously improves future content.",
                icon: TrendingUp,
                color: "text-emerald-400",
                bgColor: "bg-emerald-400/10",
              },
            ].map((step, index) => (
              <div key={index} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-cyber-400/50 to-transparent z-0"></div>
                )}
                <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group relative z-10">
                  <CardHeader className="text-center">
                    <div className="text-6xl font-bold gradient-text mb-4 group-hover:scale-110 transition-transform duration-300">
                      {step.step}
                    </div>
                    <div className={`w-16 h-16 rounded-full ${step.bgColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className={`w-8 h-8 ${step.color}`} />
                    </div>
                    <CardTitle className="text-xl group-hover:text-cyber-400 transition-colors duration-300">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed text-center">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <TrustSecuritySection />

      {/* Testimonials Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-900 dark:text-yellow-400 border-yellow-400/30">
              <Star className="w-3 h-3 mr-1" />
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Loved by
              <span className="gradient-text"> Educators Worldwide</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of language teachers who have transformed their teaching with LinguaFlow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    "{testimonial.content}&quot;
                  </p>

                  {testimonial.metrics && (
                    <div className="mb-4">
                      <Badge className="bg-gradient-to-r from-emerald-400/20 to-blue-400/20 text-emerald-100 dark:text-emerald-400 border-emerald-400/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {testimonial.metrics}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300"
                    />
                    <div>
                      <div className="font-semibold group-hover:text-cyber-400 transition-colors duration-300">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-50/30 to-neon-50/20 dark:from-cyber-900/20 dark:to-neon-900/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-900 dark:text-cyber-100 border-cyber-400/30">
              <Users className="w-3 h-3 mr-1" />
              Built for Private Tutors
            </Badge>

            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Designed for
              <span className="gradient-text"> One-on-One Teaching</span>
            </h2>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              LinguaFlow was specifically built for private language tutors who provide personalized,
              one-on-one instruction and need to adapt to each student&apos;s ever-evolving learning needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Beginner Students",
                description: "Perfect for students just starting their language journey. Create foundational lessons with basic vocabulary, pronunciation guides, and simple conversation starters.",
                features: ["Basic vocabulary flashcards", "Pronunciation practice", "Simple grammar exercises", "Cultural introductions"],
                icon: GraduationCap,
                color: "text-cyber-400",
                bgColor: "bg-cyber-400/10",
                borderColor: "border-cyber-400/30",
              },
              {
                title: "Intermediate Learners",
                description: "Adapt to students, building confidence with more complex conversations, grammar structures, and real-world scenarios tailored to their interests.",
                features: ["Advanced discussion topics", "Complex grammar patterns", "Role-play scenarios", "Personalized content"],
                icon: TrendingUp,
                color: "text-neon-400",
                bgColor: "bg-neon-400/10",
                borderColor: "border-neon-400/30",
              },
              {
                title: "Advanced Speakers",
                description: "Challenge fluent students with nuanced discussions, professional vocabulary, and specialized content that matches their career or academic goals.",
                features: ["Professional vocabulary", "Academic discussions", "Industry-specific content", "Cultural nuances"],
                icon: Target,
                color: "text-purple-400",
                bgColor: "bg-purple-400/10",
                borderColor: "border-purple-400/30",
              },
            ].map((useCase, index) => (
              <Card key={index} className={`floating-card glass-effect border-0 hover:${useCase.borderColor} transition-all duration-300 group`}>
                <CardHeader>
                  <div className={`w-16 h-16 rounded-full ${useCase.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <useCase.icon className={`w-8 h-8 ${useCase.color}`} />
                  </div>
                  <CardTitle className="text-xl group-hover:text-cyber-400 transition-colors duration-300">
                    {useCase.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-base leading-relaxed">
                    {useCase.description}
                  </CardDescription>
                  <div className="space-y-2">
                    {useCase.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-900 via-neon-900 to-purple-900"></div>
        <div className="absolute inset-0 grid-background opacity-30"></div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-cyber-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-neon-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '3s' }}></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20 transition-all duration-300">
            <Shield className="w-3 h-3 mr-1" />
            Trusted by 2,500+ Educators in 50+ Countries
          </Badge>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Save 95% of Your
            <span className="gradient-text"> Prep Time?</span>
          </h2>

          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of educators who&apos;ve transformed their teaching with Lingua Flow.
            Create personalized, engaging lessons in 30 seconds instead of 3 hours.
            Start your free trial today - no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-cyber-900 hover:bg-white/90 border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 group px-8 py-6 text-lg font-semibold">
                <Rocket className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 hover:bg-white hover:text-cyber-900 hover:border-white transition-all duration-300 px-8 py-6 text-lg text-white bg-white/10"
              >
                View Pricing
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-white/60">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}