"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  Globe,
  Award,
  CheckCircle,
  Users,
  Building,
  Star,
} from "lucide-react";

export default function TrustSecuritySection() {
  const trustFeatures = [
    {
      icon: Shield,
      title: "GDPR Compliant",
      description: "Full data protection compliance with European privacy standards",
      color: "text-cyber-400",
      bgColor: "bg-cyber-400/10",
    },
    {
      icon: Lock,
      title: "AES-256 Encryption",
      description: "Bank-level security for all data in transit and at rest",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      icon: Globe,
      title: "50+ Countries",
      description: "Trusted by educators worldwide with 99.9% uptime",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      icon: Award,
      title: "SOC 2 Certified",
      description: "Independently audited security and availability controls",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
  ];

  const stats = [
    { number: "2,500+", label: "Active Educators", icon: Users },
    { number: "15,000+", label: "Students Taught", icon: Building },
    { number: "99.9%", label: "Uptime SLA", icon: CheckCircle },
    { number: "4.9/5", label: "User Rating", icon: Star },
  ];

  return (
    <section className="py-20 bg-muted/20 relative overflow-hidden">
      <div className="absolute inset-0 grid-background opacity-20"></div>
      
      {/* Floating security elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-cyber-400/20 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-emerald-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '3s' }}></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-gradient-to-r from-cyber-400/20 to-emerald-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
            <Shield className="w-3 h-3 mr-1" />
            Enterprise-Grade Security
          </Badge>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Trusted by Educators
            <span className="gradient-text"> Worldwide</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your student data deserves the highest level of protection. We implement enterprise-grade 
            security measures and comply with international privacy standards.
          </p>
        </div>

        {/* Trust Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {trustFeatures.map((feature, index) => (
            <Card key={index} className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group text-center">
              <CardContent className="p-6">
                <div className={`w-16 h-16 rounded-full ${feature.bgColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-cyber-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyber-400/20 to-neon-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-6 h-6 text-cyber-400" />
                </div>
              </div>
              <div className="text-3xl font-bold gradient-text mb-1">{stat.number}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Compliance Badges */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-8 p-6 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>SOC 2 Type II</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>ISO 27001</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>FERPA Compliant</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto">
            We undergo regular third-party security audits and maintain the highest standards 
            for educational data protection and privacy.
          </p>
        </div>
      </div>
    </section>
  );
}