"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import LandingLayout from "@/components/landing/LandingLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
            <Languages className="h-12 w-12 text-primary animate-pulse" />
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
      title: "AI-Powered Lesson Generation",
      description: "Create personalized lesson plans in seconds using advanced AI that understands each student's unique learning style and needs.",
      color: "text-cyber-400",
      bgColor: "bg-cyber-400/10",
    },
    {
      icon: Target,
      title: "Hyper-Personalized Content",
      description: "Every lesson is tailored to individual student profiles, addressing specific weaknesses and building on strengths.",
      color: "text-neon-400",
      bgColor: "bg-neon-400/10",
    },
    {
      icon: Calendar,
      title: "Google Calendar Integration",
      description: "Seamlessly sync with your Google Calendar to view upcoming lessons, manage your schedule, and never miss a session.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      icon: MousePointer2,
      title: "Instant Translation",
      description: "Double-click any word or select text to instantly translate, eliminating the need for external translation tools during lessons.",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      icon: Clock,
      title: "Real-Time Adaptation",
      description: "Lessons automatically adjust based on student progress and performance analytics.",
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track student progress with detailed insights and performance metrics to optimize learning outcomes.",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
  ];

  const stats = [
    { number: "50K+", label: "Lessons Generated", icon: BookOpen },
    { number: "2.5K+", label: "Active Tutors", icon: Users },
    { number: "15K+", label: "Students Taught", icon: GraduationCap },
    { number: "98%", label: "Satisfaction Rate", icon: Star },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "ESL Teacher",
      avatar: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      content: "LinguaFlow has revolutionized my teaching. I can create personalized lessons for 20+ students in minutes instead of hours.",
      rating: 5,
    },
    {
      name: "Miguel Rodriguez",
      role: "Language School Director",
      avatar: "https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      content: "The AI understands cultural nuances and creates content that resonates with students from different backgrounds.",
      rating: 5,
    },
    {
      name: "Emma Thompson",
      role: "Private Tutor",
      avatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      content: "My students are more engaged than ever. The interactive lessons keep them motivated and excited to learn.",
      rating: 5,
    },
  ];

  return (
    <LandingLayout>
      {/* Bolt Button */}
      <a 
        id="bolt-button" 
        href="https://bolt.new" 
        target="_blank" 
        title="Powered By Bolt"
        className="fixed top-20 right-8 z-50 w-25 h-25 rounded-full bg-black border-2 border-white shadow-white-glow transition-transform duration-300 hover:scale-110 flex items-center justify-center"
      >
        <img 
          src="/bolt-logo.png" 
          alt="Powered by Bolt" 
          className="w-16 h-16"
        />
      </a>

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
            <Badge className="mb-6 bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30 hover:bg-gradient-to-r hover:from-cyber-400/30 hover:to-neon-400/30 transition-all duration-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Built for Private One-on-One Language Tutors
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Hyper-Personalized</span>
              <br />
              <span className="text-foreground">Language Lessons</span>
              <br />
              <span className="text-foreground/80">in Seconds</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Create engaging, AI-powered lesson plans tailored to each student's unique learning style. 
              Sync with Google Calendar and translate on-the-fly to transform your teaching experience.
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
                className="border-cyber-400/30 text-cyber-600 dark:text-cyber-400 hover:bg-cyber-400/10 hover:border-cyber-400 transition-all duration-300 px-8 py-6 text-lg"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex justify-center mb-2">
                    <stat.icon className="w-6 h-6 text-cyber-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold gradient-text">{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-400/20 to-pink-400/20 text-purple-600 dark:text-purple-400 border-purple-400/30">
              <Lightbulb className="w-3 h-3 mr-1" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Everything You Need to
              <span className="gradient-text"> Transform Teaching</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI-powered platform provides all the tools you need to create engaging, 
              personalized language lessons that adapt to each student's learning journey.
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

      {/* How It Works Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-50/30 to-neon-50/20 dark:from-cyber-900/20 dark:to-neon-900/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 text-emerald-600 dark:text-emerald-400 border-emerald-400/30">
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
                description: "Input student details, learning goals, strengths, and areas for improvement. Our AI analyzes this data to understand their unique learning needs.",
                icon: Users,
                color: "text-cyber-400",
                bgColor: "bg-cyber-400/10",
              },
              {
                step: "02",
                title: "AI Generates Content",
                description: "Our advanced AI creates personalized lesson plans with interactive exercises, vocabulary, and activities tailored to the student's profile.",
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

      {/* Testimonials Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-600 dark:text-yellow-400 border-yellow-400/30">
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
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
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
            Trusted by 2,500+ Educators
          </Badge>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Transform Your
            <span className="gradient-text"> Teaching Experience?</span>
          </h2>
          
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of educators who are already creating amazing, personalized lessons with LinguaFlow. 
            Start your free trial today and see the difference AI can make.
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
    className="border-white/30 hover:bg-white/10 hover:border-white transition-all duration-300 px-8 py-6 text-lg text-black dark:text-white"
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