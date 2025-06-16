"use client";

import { useState } from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Search,
  Brain,
  Users,
  CreditCard,
  Shield,
  Settings,
  Zap,
  BookOpen,
  Globe,
} from "lucide-react";

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      title: "Getting Started",
      icon: Zap,
      color: "text-cyber-400",
      bgColor: "bg-cyber-400/10",
      faqs: [
        {
          question: "How do I get started with LinguaFlow?",
          answer: "Getting started is easy! Sign up for a free 14-day trial, add your first student profile with their learning goals and preferences, and let our AI generate personalized lesson plans. No credit card required for the trial.",
        },
        {
          question: "Do I need any technical skills to use LinguaFlow?",
          answer: "Not at all! LinguaFlow is designed for educators, not tech experts. Our intuitive interface guides you through every step, from creating student profiles to generating lessons. If you can use email, you can use LinguaFlow.",
        },
        {
          question: "How long does it take to create a lesson?",
          answer: "Our AI generates complete, personalized lesson plans in under 30 seconds. You can then customize and refine the content as needed. Most teachers save 2-3 hours per lesson compared to traditional planning methods.",
        },
        {
          question: "Can I try LinguaFlow before purchasing?",
          answer: "Absolutely! We offer a 14-day free trial with full access to all features. No credit card required. You can create student profiles, generate lessons, and explore all our templates during the trial period.",
        },
      ],
    },
    {
      title: "AI & Lesson Generation",
      icon: Brain,
      color: "text-neon-400",
      bgColor: "bg-neon-400/10",
      faqs: [
        {
          question: "How does the AI create personalized lessons?",
          answer: "Our AI analyzes each student's profile including their level, learning goals, strengths, weaknesses, and preferred learning styles. It then generates content that addresses their specific needs, using appropriate vocabulary, grammar structures, and activities that match their learning preferences.",
        },
        {
          question: "What languages does LinguaFlow support?",
          answer: "LinguaFlow currently supports 10+ languages including English, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese, and Russian. We're continuously adding more languages based on user demand.",
        },
        {
          question: "Can I edit the AI-generated lessons?",
          answer: "Yes! All AI-generated content is fully editable. You can modify objectives, activities, vocabulary, and any other elements to better suit your teaching style or specific classroom needs. Think of the AI as your starting point, not your endpoint.",
        },
        {
          question: "How accurate and appropriate is the AI-generated content?",
          answer: "Our AI is trained on high-quality educational content and follows established language learning methodologies. Content is culturally appropriate and pedagogically sound. However, we always recommend reviewing generated content before use, as you know your students best.",
        },
        {
          question: "Can the AI adapt to different teaching methodologies?",
          answer: "Yes! Our lesson templates support various teaching approaches including communicative language teaching, task-based learning, and grammar-translation methods. You can choose templates that align with your preferred methodology.",
        },
      ],
    },
    {
      title: "Student Management",
      icon: Users,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      faqs: [
        {
          question: "How many students can I manage?",
          answer: "This depends on your plan: Starter (50 students), Professional (200 students), Enterprise (unlimited). Each student gets their own detailed profile with learning history and progress tracking.",
        },
        {
          question: "What information should I include in student profiles?",
          answer: "Include the student's target language, current level, learning goals, strengths, weaknesses (grammar, vocabulary, pronunciation, conversation), preferred learning styles, and any special notes. The more detailed the profile, the better the AI can personalize lessons.",
        },
        {
          question: "Can I track student progress over time?",
          answer: "Yes! LinguaFlow tracks lesson completion, identifies patterns in student performance, and shows progress over time. Professional and Enterprise plans include advanced analytics with detailed insights and custom reports.",
        },
        {
          question: "Can I import existing student data?",
          answer: "Professional and Enterprise plans include bulk import capabilities. You can upload student information via CSV files or integrate with existing student management systems through our API (Enterprise only).",
        },
      ],
    },
    {
      title: "Pricing & Plans",
      icon: CreditCard,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      faqs: [
        {
          question: "What's included in the free trial?",
          answer: "The 14-day free trial includes full access to all features: unlimited lesson generation, all templates, student management, progress tracking, and customer support. No credit card required to start.",
        },
        {
          question: "Can I change my plan anytime?",
          answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences. Your data and settings remain intact when changing plans.",
        },
        {
          question: "Do you offer discounts for schools or institutions?",
          answer: "Yes! We offer special educational pricing for schools, universities, and non-profit organizations. Contact our sales team for custom pricing based on your institution's size and needs.",
        },
        {
          question: "What happens if I cancel my subscription?",
          answer: "You can cancel anytime. Your account remains active until the end of your billing period. After cancellation, you have 30 days to export your data before it's permanently deleted. You can reactivate anytime during this period.",
        },
        {
          question: "Do you offer refunds?",
          answer: "We offer a 30-day money-back guarantee for annual subscriptions. For monthly subscriptions, you can cancel anytime and won't be charged for the next month. We're confident you'll love LinguaFlow!",
        },
      ],
    },
    {
      title: "Features & Functionality",
      icon: BookOpen,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      faqs: [
        {
          question: "What types of lesson templates are available?",
          answer: "We offer templates for Grammar, Conversation, Business English, English for Kids, Vocabulary, Pronunciation, Picture Description, and English for Travel. Each template is available for different proficiency levels (A1-C2) and can be customized to your needs.",
        },
        {
          question: "Can I create my own lesson templates?",
          answer: "Professional and Enterprise plans allow custom template creation. You can design templates that match your specific teaching methodology and save them for future use. Enterprise customers can also request custom templates from our team.",
        },
        {
          question: "Does LinguaFlow integrate with calendar apps?",
          answer: "Yes! Professional and Enterprise plans include Google Calendar integration. You can sync lesson schedules, set reminders, and automatically generate lessons for upcoming classes based on student profiles.",
        },
        {
          question: "Can I export lessons to other formats?",
          answer: "Yes! You can export lessons as PDF, Word documents, or plain text. Professional and Enterprise plans also support bulk export and integration with learning management systems (LMS).",
        },
        {
          question: "Is there a mobile app?",
          answer: "Yes! LinguaFlow is available on iOS and Android. You can access all features, generate lessons on the go, and sync seamlessly across all your devices. Perfect for teachers who are always on the move.",
        },
      ],
    },
    {
      title: "Security & Privacy",
      icon: Shield,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      faqs: [
        {
          question: "How secure is my data?",
          answer: "We take security seriously. All data is encrypted in transit and at rest using industry-standard AES-256 encryption. We're SOC 2 compliant and undergo regular security audits. Your student data is never shared with third parties.",
        },
        {
          question: "Where is my data stored?",
          answer: "Data is stored in secure, GDPR-compliant data centers. We use multiple backup systems and disaster recovery procedures to ensure your data is always safe and accessible.",
        },
        {
          question: "Can I delete student data?",
          answer: "Yes! You have full control over student data. You can delete individual student profiles or bulk delete data at any time. We also support automated data retention policies for compliance with local regulations.",
        },
        {
          question: "Are you GDPR compliant?",
          answer: "Yes! LinguaFlow is fully GDPR compliant. We provide data processing agreements, support data portability requests, and have implemented privacy by design principles throughout our platform.",
        },
      ],
    },
    {
      title: "Support & Training",
      icon: Settings,
      color: "text-teal-400",
      bgColor: "bg-teal-400/10",
      faqs: [
        {
          question: "What kind of support do you offer?",
          answer: "All plans include email support with response times under 24 hours. Professional plans get priority support, and Enterprise customers receive 24/7 phone support plus a dedicated account manager.",
        },
        {
          question: "Do you provide training for new users?",
          answer: "Yes! We offer comprehensive onboarding including video tutorials, webinars, and documentation. Enterprise customers receive personalized training sessions and ongoing support to ensure successful adoption.",
        },
        {
          question: "Is there a user community or forum?",
          answer: "Yes! Join our active community of educators where you can share tips, ask questions, and learn from other LinguaFlow users. We also host regular webinars featuring best practices and new features.",
        },
        {
          question: "How often do you release new features?",
          answer: "We release new features and improvements monthly. All updates are automatic and included in your subscription. We actively listen to user feedback and prioritize features that will have the biggest impact on teaching effectiveness.",
        },
      ],
    },
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.faqs.length > 0);

  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neural-50 via-cyber-50/30 to-neon-50/20 dark:from-neural-900 dark:via-neural-800 dark:to-neural-900"></div>
        <div className="absolute inset-0 grid-background opacity-30"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
            <HelpCircle className="w-3 h-3 mr-1" />
            Frequently Asked Questions
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            How Can We
            <span className="gradient-text"> Help You?</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Find answers to common questions about LinguaFlow. 
            Can't find what you're looking for? Contact our support team.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-6 text-lg border-cyber-400/30 focus:border-cyber-400 focus:ring-cyber-400/20"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse all categories below.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredFAQs.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <div className="flex items-center mb-8">
                    <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mr-4`}>
                      <category.icon className={`w-6 h-6 ${category.color}`} />
                    </div>
                    <h2 className="text-2xl font-bold">{category.title}</h2>
                  </div>

                  <Accordion type="single" collapsible className="space-y-4">
                    {category.faqs.map((faq, faqIndex) => (
                      <AccordionItem
                        key={faqIndex}
                        value={`${categoryIndex}-${faqIndex}`}
                        className="border-0"
                      >
                        <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300">
                          <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <span className="text-left font-semibold text-lg">
                              {faq.question}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6">
                            <p className="text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </AccordionContent>
                        </Card>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Still Have
            <span className="gradient-text"> Questions?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Our support team is here to help. Get in touch and we'll respond within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:support@linguaflow.com">
              <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group cursor-pointer p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-cyber-400/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <HelpCircle className="w-6 h-6 text-cyber-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold group-hover:text-cyber-400 transition-colors duration-300">
                      Email Support
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      support@linguaflow.com
                    </p>
                  </div>
                </div>
              </Card>
            </a>
            
            <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 group cursor-pointer p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-neon-400/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-6 h-6 text-neon-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold group-hover:text-neon-400 transition-colors duration-300">
                    Help Center
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Browse our documentation
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}