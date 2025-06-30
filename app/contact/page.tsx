"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail, Send, Loader2, MapPin, Phone, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import LandingLayout from "@/components/landing/LandingLayout";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      // Call the Supabase Edge Function
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include the anon key for authentication
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(values)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle domain verification error specifically
        if (data.details?.statusCode === 403 && data.details?.error?.includes('domain is not verified')) {
          toast.error("We're currently experiencing email delivery issues. Please contact us directly at linguaflowservices@gmail.com for immediate assistance.");
        } else {
          throw new Error(data.error || 'Failed to send message');
        }
        return;
      }
      
      // Show success message
      toast.success("Thank you for your message! We'll get back to you soon.");
      
      // Reset the form
      form.reset();
    } catch (error: any) {
      // Fallback error handling
      toast.error("We're currently experiencing technical difficulties. Please contact us directly at linguaflowservices@gmail.com for immediate assistance.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neural-50 via-cyber-50/30 to-neon-50/20 dark:from-neural-900 dark:via-neural-800 dark:to-neural-900"></div>
        <div className="absolute inset-0 grid-background opacity-30"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
            <Mail className="w-3 h-3 mr-1" />
            Get in Touch
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Contact <span className="gradient-text">Us</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Have questions about LinguaFlow? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="animate-scale-in">
              <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center">
                    <MessageSquare className="mr-2 h-6 w-6 text-cyber-400" />
                    Send Us a Message
                  </CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Your name" 
                                  className="input-cyber focus-cyber"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Your email address" 
                                  type="email"
                                  className="input-cyber focus-cyber"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="What is your message about?" 
                                className="input-cyber focus-cyber"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Your message" 
                                className="min-h-[150px] resize-y input-cyber focus-cyber"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 group"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div>
                <h2 className="text-2xl font-bold mb-6 gradient-text">Contact Information</h2>
                <p className="text-muted-foreground mb-8">
                  We're here to help with any questions you might have about our services, pricing, or how LinguaFlow can transform your language teaching experience.
                </p>
              </div>

              <div className="space-y-6">
                <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 p-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-cyber-400/10 p-3 rounded-full">
                      <Mail className="h-6 w-6 text-cyber-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <a 
                        href="mailto:linguaflowservices@gmail.com" 
                        className="text-cyber-400 hover:underline"
                      >
                        linguaflowservices@gmail.com
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 p-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-neon-400/10 p-3 rounded-full">
                      <Clock className="h-6 w-6 text-neon-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Business Hours</h3>
                      <p className="text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                      <p className="text-muted-foreground">Saturday: 10:00 AM - 2:00 PM EST</p>
                      <p className="text-muted-foreground">Sunday: Closed</p>
                    </div>
                  </div>
                </Card>

                <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 p-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-400/10 p-3 rounded-full">
                      <MapPin className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Headquarters</h3>
                      <p className="text-muted-foreground">123 Innovation Drive</p>
                      <p className="text-muted-foreground">Suite 456</p>
                      <p className="text-muted-foreground">San Francisco, CA 94103</p>
                    </div>
                  </div>
                </Card>

                <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300 p-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-emerald-400/10 p-3 rounded-full">
                      <Phone className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Phone</h3>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                      <p className="text-xs text-muted-foreground mt-1">For customer support inquiries only</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-br from-cyber-50/30 to-neon-50/20 dark:from-cyber-900/20 dark:to-neon-900/10 rounded-lg border border-cyber-400/20">
                <h3 className="font-semibold text-lg mb-3">Frequently Asked Questions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Looking for quick answers? Check out our <Link href="/faq" className="text-cyber-400 hover:underline">FAQ page</Link> for answers to common questions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}