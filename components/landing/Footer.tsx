"use client";

import Link from "next/link";
import { Languages, Github, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
      { label: "Roadmap", href: "#roadmap" },
    ],
    company: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#blog" },
      { label: "Careers", href: "#careers" },
      { label: "Contact", href: "#contact" },
    ],
    legal: [
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },
      { label: "Cookie Policy", href: "#cookies" },
      { label: "GDPR", href: "#gdpr" },
    ],
    support: [
      { label: "Help Center", href: "#help" },
      { label: "Documentation", href: "#docs" },
      { label: "API Reference", href: "#api" },
      { label: "Status", href: "#status" },
    ],
  };

  const socialLinks = [
    { icon: Github, href: "#github", label: "GitHub" },
    { icon: Twitter, href: "#twitter", label: "Twitter" },
    { icon: Linkedin, href: "#linkedin", label: "LinkedIn" },
    { icon: Mail, href: "mailto:hello@linguaflow.com", label: "Email" },
  ];

  return (
    <footer className="bg-neural-900 dark:bg-neural-950 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-background opacity-20"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-400 to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 group mb-4">
              <div className="relative">
                <Languages className="h-8 w-8 text-cyber-400 group-hover:text-neon-400 transition-colors duration-300" />
                <div className="absolute inset-0 bg-cyber-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-300"></div>
              </div>
              <span className="text-xl font-bold gradient-text">LinguaFlow</span>
            </Link>
            <p className="text-gray-300 mb-6 max-w-sm">
              Revolutionizing language education with AI-powered personalized lessons. 
              Create engaging, interactive content tailored to each student's unique learning journey.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-gray-400 hover:text-cyber-400 transition-colors duration-300 group"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-cyber-400 transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-cyber-400 transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-cyber-400 transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-cyber-400 transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} LinguaFlow. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex items-center space-x-6">
              <span className="text-gray-400 text-sm">Made with ❤️ for educators worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}