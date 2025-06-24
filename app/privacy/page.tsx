"use client";

import LandingLayout from "@/components/landing/LandingLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, Globe, Users, Lock, Eye } from "lucide-react";

export default function PrivacyPage() {
  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neural-50 via-cyber-50/30 to-neon-50/20 dark:from-neural-900 dark:via-neural-800 dark:to-neural-900"></div>
        <div className="absolute inset-0 grid-background opacity-30"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
            <Shield className="w-3 h-3 mr-1" />
            Privacy Policy
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Your Privacy
            <span className="gradient-text"> Matters</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            We are committed to protecting your personal information and being transparent about how we collect, use, and share your data.
          </p>
          
          <div className="text-sm text-muted-foreground">
            Last updated: January 2025
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-12 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300">
            <CardContent className="p-8 md:p-12">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                
                {/* Overview */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Eye className="w-6 h-6 mr-2 text-cyber-400" />
                    Overview
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    This Privacy Policy ("Policy") outlines the principles and practices of LinguaFlow and all its affiliates ("LinguaFlow" or "Service") regarding the collection, use, and disclosure of user data. LinguaFlow's utmost priority is the protection and confidentiality of its users' personal data. This Policy applies to LinguaFlow, its affiliates, subsidiaries, products and all related entities, unless otherwise stated in the Policy.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    LinguaFlow may share personal data internally within our group of companies, for the purposes described in this Policy. In addition, should LinguaFlow or any of its subsidiaries or affiliates undergo any change in control or ownership, including by means of merger, acquisition or purchase of substantially all or part of its assets, your personal data may be shared with the parties involved in such an event. If we believe that such change in control might materially affect your personal data then stored with us, we will notify you of this event and the choices you may have via e-mail or prominent notice on our Services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    By using LinguaFlow's services, users acknowledge and agree to this Privacy Policy. If you do not agree with any part of this Policy, please refrain from using our services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    Queries or concerns related to this Policy should be directed to: <a href="mailto:privacy@linguaflow.com" className="text-cyber-400 hover:underline">privacy@linguaflow.com</a>
                  </p>
                </div>

                {/* Definitions */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Globe className="w-6 h-6 mr-2 text-cyber-400" />
                    Definitions
                  </h2>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>"User":</strong> Anyone who accesses or uses the services of LinguaFlow.</li>
                    <li><strong>"Tutor User":</strong> Anyone who signs up with an account type "Tutor".</li>
                    <li><strong>"Student User":</strong> Anyone who signs up with an account type "Student" via email invitation.</li>
                    <li><strong>"Personal Data":</strong> Any information that can identify an individual.</li>
                    <li><strong>"Third-party":</strong> Entities other than LinguaFlow.</li>
                  </ul>
                </div>

                {/* Part 1: Tutor User Privacy Policy */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Users className="w-6 h-6 mr-2 text-cyber-400" />
                    Part 1: Tutor User Privacy Policy
                  </h2>

                  {/* I. Collection of Data */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">I. Collection of Data</h3>
                    <p className="text-muted-foreground mb-4">
                      When Tutor Users access or engage with LinguaFlow, the Company may gather the following:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Primary Information: Such as Name, Email Address, and Password.</li>
                      <li>Content that users upload or create on LinguaFlow platform.</li>
                      <li>Any other data voluntarily shared by the user.</li>
                    </ul>
                    <p className="text-muted-foreground mt-4 mb-2">
                      Additionally, LinguaFlow collects non-identifiable information including:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Logs from browsers when accessing LinguaFlow's services.</li>
                      <li>User interaction patterns, specific device details, and cookie-related data.</li>
                    </ul>
                  </div>

                  {/* II. Use of Data */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">II. Use of Data</h3>
                    <p className="text-muted-foreground mb-4">
                      LinguaFlow uses the collected data for various purposes, including:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>To improve, provide, and customize our services.</li>
                      <li>For research, to communicate with users, process payments, and offer tailored experience.</li>
                      <li>To safeguard against potential fraud, enhance security measures, and ensure compliance with legal requirements.</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      User data will be retained for as long as necessary to fulfill the purposes for which it was collected, in compliance with our legal obligations, dispute resolution, and enforcement of our agreements.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      LinguaFlow uses cookies to enhance user experience. These can be session or persistent cookies, and can be either first-party or third-party cookies. Users can control or opt out of cookies through their browser settings.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      LinguaFlow is committed to maintaining the privacy and security of your personal data. As part of our operations, we may collect Personal Data through Google APIs, which are subject to strict usage limitations. It is our policy to never utilize this data for advertising purposes, nor will it be accessed by our staff, unless specific circumstances apply. Such exceptions include instances where we have received your explicit permission, when access is essential for security reasons, in order to fulfill legal obligations, or when the data is processed in a manner that renders it anonymous and aggregated.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      Our practices concerning the handling, usage, and transfer of Personal Data obtained via Google APIs are fully aligned with the Google API Services User Data Policy, especially regarding the Limited Use Requirements. Rest assured, LinguaFlow prioritizes your privacy in compliance with these guidelines.
                    </p>
                  </div>

                  {/* III. Data Sharing */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">III. Data Sharing</h3>
                    <p className="text-muted-foreground mb-4">
                      LinguaFlow assures users that their personal data will neither be sold nor rented to third parties. Third-party service providers essential for LinguaFlow's operations might have access to the data based on contractual agreements ensuring the protection of your data.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Entities potentially having access include:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Stripe (Billing: manages financial transactions).</li>
                      <li>Brevo (Email Services: handles the sending and management of emails).</li>
                      <li>Amazon AWS (Hosting: ensures the protection of user data and provides service infrastructure).</li>
                      <li>Google Analytics and Microsoft Clarity (Data Analytics: analyze user data to offer insights).</li>
                      <li>OpenAI and Anthropic (Generative AI: generates content based on user input).</li>
                      <li>Google reCAPTCHA (Security: helps prevent spam and abuse by analyzing user interactions). The service is subject to Google's Privacy Policy and Terms of Service.</li>
                      <li>Other relevant third-party entities as required.</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      LinguaFlow may also anonymize and aggregate data, subsequently sharing such de-identified data with third parties. Additionally, data may be disclosed when required for legal reasons, ensuring safety, or during business transitions, always ensuring adherence to privacy standards.
                    </p>
                  </div>

                  {/* IV. Cross-border Data Management */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">IV. Cross-border Data Management</h3>
                    <p className="text-muted-foreground mb-4">
                      LinguaFlow might need to transfer user data across borders and jurisdictions, possibly exposing the data to areas with different data protection rules. By using LinguaFlow's services, users consent to such transfers, trusting LinguaFlow to uphold protective measures as required by relevant laws.
                    </p>
                    <p className="text-muted-foreground">
                      For such cross-border transfers, LinguaFlow uses mechanisms like standard contractual clauses to ensure data is protected as per relevant standards.
                    </p>
                  </div>

                  {/* V. Data Protection */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-green-500" />
                      V. Data Protection
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      LinguaFlow employs several measures to protect users' data:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Storage solutions via Amazon AWS.</li>
                      <li>Encrypted data transmission using HTTPS.</li>
                      <li>Password protection mechanisms; with passwords stored securely in hashed formats.</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      Users are reminded to maintain their password's confidentiality and to be vigilant with communications received from LinguaFlow.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      In the unfortunate event of a data breach, we will notify affected users and take appropriate measures to mitigate the breach as mandated by relevant laws.
                    </p>
                  </div>

                  {/* VI. Limitations and Third-party Interactions */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">VI. Limitations and Third-party Interactions</h3>
                    <p className="text-muted-foreground mb-4">
                      While LinguaFlow is dedicated to maximizing security, the Company cannot assure immunity from all potential breaches or unauthorized access. Interactions with third-party platforms (like browser extensions) might impact users' data privacy on LinguaFlow. The Company isn't responsible for the security practices of these external entities.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Users are advised to familiarize themselves with the privacy policies of third-party platforms they interact with.
                    </p>
                    <p className="text-muted-foreground">
                      Our platform may contain links to external sites. We are not responsible for the privacy practices or content of such external sites.
                    </p>
                  </div>

                  {/* VII. Users' Rights and Control Over Data */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">VII. Users' Rights and Control Over Data</h3>
                    <p className="text-muted-foreground mb-4">
                      Users have the right to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Access their data.</li>
                      <li>Modify their data.</li>
                      <li>Transfer their data.</li>
                      <li>Delete their data.</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      For exercising these rights, users should contact: <a href="mailto:privacy@linguaflow.com" className="text-cyber-400 hover:underline">privacy@linguaflow.com</a>.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      Users can opt out of marketing or promotional communications by clicking on the "unsubscribe" link located on the bottom of our emails or by contacting <a href="mailto:privacy@linguaflow.com" className="text-cyber-400 hover:underline">privacy@linguaflow.com</a>.
                    </p>
                  </div>

                  {/* VIII. Children's Data Protection */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">VIII. Children's Data Protection</h3>
                    <p className="text-muted-foreground mb-4">
                      LinguaFlow's services are designed for individuals above 13 years of age. The Company does not intentionally gather data from those under this age. If unintentional collection occurs, immediate corrective actions, such as deletion, will be initiated.
                    </p>
                    <p className="text-muted-foreground">
                      If you are a parent or guardian and believe that your child has provided personal data to LinguaFlow without your consent, please contact us.
                    </p>
                  </div>
                </div>

                {/* Part 2: Student User Privacy Policy */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Users className="w-6 h-6 mr-2 text-neon-400" />
                    Part 2: Student User Privacy Policy
                  </h2>

                  {/* I. Collection of Data */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">I. Collection of Data</h3>
                    <p className="text-muted-foreground mb-4">
                      When Student Users access or engage with LinguaFlow, the Company may gather the following:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Account Information: Name and email address provided during sign-up via Tutor User invitations.</li>
                      <li>Usage Data: Pages visited, interaction history, completed assignments.</li>
                    </ul>
                  </div>

                  {/* II. Use of Data */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">II. Use of Data</h3>
                    <p className="text-muted-foreground mb-4">
                      Collected data is used for:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Providing educational services and improving user experience.</li>
                      <li>Compliance with legal requirements and service security.</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      User data will be retained for as long as necessary to fulfill the purposes for which it was collected, in compliance with our legal obligations, dispute resolution, and enforcement of our agreements.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      LinguaFlow uses cookies to enhance user experience. These can be session or persistent cookies, and can be either first-party or third-party cookies. Users can control or opt out of cookies through their browser settings.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      LinguaFlow is committed to maintaining the privacy and security of your personal data. As part of our operations, we may collect Personal Data through Google APIs, which are subject to strict usage limitations. It is our policy to never utilize this data for advertising purposes, nor will it be accessed by our staff, unless specific circumstances apply. Such exceptions include instances where we have received your explicit permission, when access is essential for security reasons, in order to fulfill legal obligations, or when the data is processed in a manner that renders it anonymous and aggregated.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      Our practices concerning the handling, usage, and transfer of Personal Data obtained via Google APIs are fully aligned with the Google API Services User Data Policy, especially regarding the Limited Use Requirements. Rest assured, LinguaFlow prioritizes your privacy in compliance with these guidelines.
                    </p>
                  </div>

                  {/* III. Data Sharing */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">III. Data Sharing</h3>
                    <p className="text-muted-foreground mb-4">
                      Data is shared with:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Associated Tutor Users and schools for educational purposes.</li>
                      <li>Third-party service providers under data protection agreements.</li>
                      <li>Legal Authorities, if required by law.</li>
                    </ul>
                    <p className="text-muted-foreground mt-4 mb-4">
                      Entities potentially having access include:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Brevo (Email Services: handles the sending and management of emails).</li>
                      <li>Amazon AWS (Hosting: ensures the protection of user data and provides service infrastructure).</li>
                      <li>Google Analytics and Microsoft Clarity (Data Analytics: analyze user data to offer insights).</li>
                      <li>Other relevant third-party entities as required.</li>
                    </ul>
                  </div>

                  {/* IV. Users' Rights and Control Over Data */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">IV. Users' Rights and Control Over Data</h3>
                    <p className="text-muted-foreground mb-4">
                      Student Users have the right to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Access their data.</li>
                      <li>Modify their data.</li>
                      <li>Transfer their data.</li>
                      <li>Delete their data.</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      For exercising these rights, users should contact: <a href="mailto:privacy@linguaflow.com" className="text-cyber-400 hover:underline">privacy@linguaflow.com</a>.
                    </p>
                  </div>

                  {/* V. Guardian Consent for Minors */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">V. Guardian Consent for Minors</h3>
                    <p className="text-muted-foreground mb-4">
                      By signing up to use LinguaFlow's services, Tutor Users acknowledge, affirm, and pledge to LinguaFlow that they or their institution have obtained all necessary parental or eligible student written consent to share the personal data of their students with LinguaFlow when consent is the applicable lawful basis, in each case, solely to enable LinguaFlow's operation of the service.
                    </p>
                    <p className="text-muted-foreground">
                      By using LinguaFlow's services, users over the age of 13 acknowledge and agree to this Privacy Policy. LinguaFlow's services are designed for individuals above 13 years of age. The Company does not intentionally gather data from those under this age. If unintentional collection occurs, immediate corrective actions, such as deletion, will be initiated.
                    </p>
                  </div>

                  {/* VI. Cross-border Data Management */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">VI. Cross-border Data Management</h3>
                    <p className="text-muted-foreground mb-4">
                      LinguaFlow might need to transfer user data across borders and jurisdictions, possibly exposing the data to areas with different data protection rules. By using LinguaFlow's services, users consent to such transfers, trusting LinguaFlow to uphold protective measures as required by relevant laws.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      For such cross-border transfers, LinguaFlow uses mechanisms like standard contractual clauses to ensure data is protected as per relevant standards.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      LinguaFlow employs several measures to protect users' data:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Storage solutions via Amazon AWS.</li>
                      <li>Encrypted data transmission using HTTPS.</li>
                      <li>Password protection mechanisms; with passwords stored securely in hashed formats.</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      Users are reminded to maintain their password's confidentiality and to be vigilant with communications received from LinguaFlow.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      In the unfortunate event of a data breach, we will notify affected users and take appropriate measures to mitigate the breach as mandated by relevant laws.
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Mail className="w-6 h-6 mr-2 text-cyber-400" />
                    Contact Information
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    For questions or to exercise data rights, contact:
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6">
                    <h3 className="font-semibold mb-2">LinguaFlow Privacy Team</h3>
                    <p className="text-muted-foreground">
                      Email: <a href="mailto:privacy@linguaflow.com" className="text-cyber-400 hover:underline">privacy@linguaflow.com</a>
                    </p>
                  </div>
                </div>

                {/* Updates to this Policy */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4">Updates to this Policy</h2>
                  <p className="text-muted-foreground">
                    LinguaFlow may update this Policy periodically, notifying users of significant changes via email or platform notifications. Regular review of this Policy is advised.
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </LandingLayout>
  );
}