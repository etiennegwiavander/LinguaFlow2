"use client";

import LandingLayout from "@/components/landing/LandingLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, BrainCircuit, Clock, Globe, GraduationCap, Languages, Rocket, Shield, Sparkles, Target, Users, Zap } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neural-50 via-cyber-50/30 to-neon-50/20 dark:from-neural-900 dark:via-neural-800 dark:to-neural-900"></div>
        <div className="absolute inset-0 grid-background opacity-30"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-cyber-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-neon-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
            <Languages className="w-3 h-3 mr-1" />
            Our Story
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About <span className="gradient-text">LinguaFlow</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Transforming language tutoring through AI-powered personalization
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-up">
              <h2 className="text-3xl font-bold">
                The <span className="gradient-text">Inspiration</span> Behind LinguaFlow
              </h2>
              
              <div className="prose prose-lg dark:prose-invert">
                <p>
                  LinguaFlow was born from a deeply personal challenge faced by our founder, Etienne Gwiavander. As a part-time online language tutor managing over 50 students monthly, Etienne experienced firsthand the overwhelming burden of lesson preparation.
                </p>
                
                <p>
                  The reality was stark: understanding each student's unique needs, crafting personalized lesson plans, and creating interactive materials for every session consumed more time than the actual teaching. This wasn't just Etienne's struggle—it's a challenge shared by over a million private tutors globally.
                </p>
                
                <p>
                  While giant platforms like Preply and Italki focus primarily on connecting learners with tutors, they overlook the critical needs of the tutors themselves. This revealed a massive market gap: tutors needed a tool that would empower them, reduce their administrative load, and allow them to scale their impact without sacrificing the personalization that makes their teaching effective.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 group">
                    <Rocket className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="border-cyber-400/30 text-cyber-600 dark:text-cyber-400 hover:bg-cyber-400/10 hover:border-cyber-400 transition-all duration-300">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-400/20 to-neon-400/20 rounded-2xl blur-xl"></div>
              <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  <img 
                    src="https://images.pexels.com/photos/4145153/pexels-photo-4145153.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Online language tutoring" 
                    className="w-full h-auto rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-400/20 to-pink-400/20 text-purple-600 dark:text-purple-400 border-purple-400/30">
              <Target className="w-3 h-3 mr-1" />
              Our Mission
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Transforming <span className="gradient-text">Hours</span> into <span className="gradient-text">Seconds</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              LinguaFlow was created to transform hours of tedious work into seconds of intelligent creation, keeping the human touch at its core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-cyber-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 text-cyber-400" />
                </div>
                <h3 className="text-xl font-semibold group-hover:text-cyber-400 transition-colors duration-300">
                  Save Valuable Time
                </h3>
                <p className="text-muted-foreground">
                  Reduce lesson preparation from hours to seconds, allowing tutors to focus on what they do best: teaching.
                </p>
              </CardContent>
            </Card>

            <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-neon-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BrainCircuit className="w-6 h-6 text-neon-400" />
                </div>
                <h3 className="text-xl font-semibold group-hover:text-neon-400 transition-colors duration-300">
                  AI-Powered Personalization
                </h3>
                <p className="text-muted-foreground">
                  Create hyper-personalized lessons that address each student's unique learning style, strengths, and weaknesses.
                </p>
              </CardContent>
            </Card>

            <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-purple-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold group-hover:text-purple-400 transition-colors duration-300">
                  Scale Your Impact
                </h3>
                <p className="text-muted-foreground">
                  Manage more students without sacrificing quality, allowing tutors to grow their business and impact.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-400/20 to-cyber-400/20 rounded-2xl blur-xl"></div>
              <Card className="floating-card glass-effect border-0 hover:border-neon-400/30 transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  <img 
                    src="https://images.pexels.com/photos/4145354/pexels-photo-4145354.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Language tutor preparing lessons" 
                    className="w-full h-auto rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="order-1 lg:order-2 space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Badge className="mb-2 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 text-emerald-600 dark:text-emerald-400 border-emerald-400/30">
                <Zap className="w-3 h-3 mr-1" />
                The Problem We Solve
              </Badge>
              
              <h2 className="text-3xl font-bold">
                Empowering the <span className="gradient-text">Overlooked</span> Tutors
              </h2>
              
              <div className="prose prose-lg dark:prose-invert">
                <p>
                  While major platforms focus on connecting learners with tutors, they've overlooked a critical need: supporting the tutors themselves in their day-to-day work.
                </p>
                
                <p>
                  Private language tutors globally face the same challenge: spending more time on lesson preparation than on actual teaching. This administrative burden limits their ability to take on more students and grow their business.
                </p>
                
                <p>
                  LinguaFlow addresses this gap by providing an AI-powered tool that:
                </p>
              </div>
              
              <ul className="space-y-3 pl-6">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyber-400 to-neon-400 flex items-center justify-center text-white font-bold text-xs mt-1 mr-3">✓</div>
                  <span>Reduces lesson preparation time by up to 90%</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyber-400 to-neon-400 flex items-center justify-center text-white font-bold text-xs mt-1 mr-3">✓</div>
                  <span>Creates personalized lesson plans based on each student's profile</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyber-400 to-neon-400 flex items-center justify-center text-white font-bold text-xs mt-1 mr-3">✓</div>
                  <span>Generates interactive teaching materials in seconds</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyber-400 to-neon-400 flex items-center justify-center text-white font-bold text-xs mt-1 mr-3">✓</div>
                  <span>Integrates with calendar systems for seamless scheduling</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-600 dark:text-yellow-400 border-yellow-400/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Our Values
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              What <span className="gradient-text">Drives</span> Us
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our core values shape everything we do at LinguaFlow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold group-hover:text-blue-400 transition-colors duration-300">
                  Educator-First
                </h3>
                <p className="text-muted-foreground">
                  We build for tutors, understanding their unique challenges and needs in the teaching process.
                </p>
              </CardContent>
            </Card>

            <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-green-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold group-hover:text-green-400 transition-colors duration-300">
                  Personalization
                </h3>
                <p className="text-muted-foreground">
                  We believe every student deserves learning materials tailored to their unique needs and learning style.
                </p>
              </CardContent>
            </Card>

            <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-orange-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold group-hover:text-orange-400 transition-colors duration-300">
                  Global Perspective
                </h3>
                <p className="text-muted-foreground">
                  We embrace cultural diversity and support multiple languages to serve tutors worldwide.
                </p>
              </CardContent>
            </Card>

            <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-red-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold group-hover:text-red-400 transition-colors duration-300">
                  Human-AI Partnership
                </h3>
                <p className="text-muted-foreground">
                  We believe in AI as a tool to enhance human teaching, not replace it, keeping the human touch at the core.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About the Founder */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-up">
              <Badge className="mb-2 bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
                <Users className="w-3 h-3 mr-1" />
                Meet the Founder
              </Badge>
              
              <h2 className="text-3xl font-bold">
                Etienne <span className="gradient-text">Gwiavander</span>
              </h2>
              
              <div className="prose prose-lg dark:prose-invert">
                <p>
                  As a passionate language tutor with years of experience teaching students from diverse backgrounds, Etienne Gwiavander intimately understood the challenges faced by private tutors.
                </p>
                
                <p>
                  Managing over 50 students monthly, he found himself spending more time on lesson preparation than on actual teaching. This frustration led to a realization: tutors needed better tools to scale their impact without sacrificing quality.
                </p>
                
                <p>
                  With a background in both education and technology, Etienne founded LinguaFlow to bridge this gap, creating a platform that empowers tutors to do what they do best—teach—while automating the time-consuming aspects of lesson preparation.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/contact">
                  <Button className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 group">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-400/20 to-neon-400/20 rounded-full blur-xl"></div>
              <div className="relative rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                <img 
                  src="https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Etienne Gwiavander" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-cyber-900 via-neon-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-30"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-cyber-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-neon-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '3s' }}></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
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
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">14 days</span>
              </Button>
            </Link>
            <Link href="/pricing">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 hover:bg-white/10 hover:border-white transition-all duration-300 px-8 py-6 text-lg text-white"
              >
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}