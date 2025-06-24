"use client";

import LandingLayout from "@/components/landing/LandingLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, Users, CreditCard, Scale, Globe, Settings } from "lucide-react";

export default function TermsPage() {
  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neural-50 via-cyber-50/30 to-neon-50/20 dark:from-neural-900 dark:via-neural-800 dark:to-neural-900"></div>
        <div className="absolute inset-0 grid-background opacity-30"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
            <FileText className="w-3 h-3 mr-1" />
            Terms of Service
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Terms of
            <span className="gradient-text"> Service</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            These terms govern your use of LinguaFlow. By using our service, you agree to these terms.
          </p>
          
          <div className="text-sm text-muted-foreground">
            Last updated: January 2025
          </div>
        </div>
      </section>

      {/* Terms of Service Content */}
      <section className="py-12 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="floating-card glass-effect border-0 hover:border-cyber-400/30 transition-all duration-300">
            <CardContent className="p-8 md:p-12">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                
                {/* Overview */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-cyber-400" />
                    I. Overview
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    This agreement is entered into by and between the user ("You" or "User") and LinguaFlow and all its affiliates ("LinguaFlow" or "Service"), and governs the terms under which you may access and use LinguaFlow's services. By accessing or using the platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms" or "ToS"). If you disagree with any of the terms, you must not use or access LinguaFlow. These Terms apply to LinguaFlow, its affiliates, subsidiaries, and all related entities, unless otherwise stated in the Terms.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>In simple terms:</strong> These are the rules for using LinguaFlow. By using our service, you're agreeing to follow these rules. If you don't agree, please don't use our platform.
                    </p>
                  </div>
                </div>

                {/* License and Account */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Users className="w-6 h-6 mr-2 text-cyber-400" />
                    II. License and Account
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Subject to your compliance with these Terms, you are hereby granted a non-exclusive, limited, non-transferable, freely revocable license to access and use the Service for your business or personal needs. All rights not expressly stated in these ToS are reserved by LinguaFlow.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Each individual is entitled to register and maintain one account only. Each user must have a unique account and is responsible for any activity that occurs under their account credentials.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Sharing, leasing, transferring, or permitting another party to access the Service using your unique username, password, or other security code is strictly prohibited.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Your use of the Service must comply with LinguaFlow's Fair Use Policy.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    LinguaFlow prohibits the use of its Service for discrimination, particularly based on race, religion, sex, sexual orientation, age, disability, ancestry, or national origin. Using the Service to promote or incite discrimination, hostility, or violence is strictly forbidden.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4">Unauthorized Uses of the Service:</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                    <li>Modification, reverse engineering, or any attempts to uncover the source code of the Service is strictly prohibited.</li>
                    <li>Accessing the Service for the purpose of performance benchmarking, or with the intent to create or promote a competitive product, is forbidden.</li>
                    <li>Transmitting malicious code or using the Service to store viruses is prohibited.</li>
                    <li>Circumventing any security or access features of the Service is not permitted.</li>
                    <li>Automated access, including scraping, crawling, or spidering the Service, without LinguaFlow's explicit consent is strictly prohibited.</li>
                  </ul>
                  
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Users who wish to terminate their account may do so through the settings page. Once terminated, all associated data will be permanently deleted from our servers.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Following the termination of an account, LinguaFlow will delete all associated user data from our servers within 30 days.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Accounts found in violation of these ToS, or any other associated policy, will be subject to corrective actions, which may include temporary suspension or permanent termination. In cases of termination, users will have a 48-hour window to retrieve and backup any generated content.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>In simple terms:</strong> You can have one account (just for you, no sharing!). Let's keep things positive and respectful, so avoid any hurtful behavior or actions. Also, it'd be awesome if you didn't try to fiddle with the technical parts of our service. If you ever decide we're not the right fit for you, no hard feelings! You can close your account, and we'll remove your data within a month. If there's ever a problem and we need to close your account, you'll have 48 hours to save any content.
                    </p>
                  </div>
                </div>

                {/* Ownership and Responsibilities */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Shield className="w-6 h-6 mr-2 text-cyber-400" />
                    III. Ownership and Responsibilities
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Users retain full rights in and ownership of any content created on the LinguaFlow platform and enjoy the freedom to utilize their content outside of the LinguaFlow environment without restrictions. This includes the ability to resell, distribute, or transform their creations into derivative works, empowering users to maximize the value of their intellectual property.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    While we respect your ownership of the content you create, we also emphasize the importance of respecting the intellectual property rights of others. Users are strictly prohibited from uploading or introducing copyrighted content unless they possess the requisite permissions or licenses. Violations of this policy will result in content removal and may incur additional penalties. Copyright holders with concerns about content on LinguaFlow are encouraged to reach out to our dedicated legal team at <a href="mailto:legal@linguaflow.com" className="text-cyber-400 hover:underline">legal@linguaflow.com</a>, ensuring that everyone's rights are protected.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    For the purpose of platform enhancement, LinguaFlow retains the right to use content generated based on user inputs. This utilization is specifically aimed at model fine-tuning and training, with a commitment to safeguarding user identity and proprietary data. By participating in the LinguaFlow community, users contribute to ongoing improvements that benefit the entire user base.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    To foster a respectful and inclusive community, users are strictly prohibited from uploading or introducing any form of illegal, explicit, offensive, or inappropriate content on our platform. This includes content that promotes violence, hate, or discrimination. Violations of this policy will result in content removal and may incur additional penalties. We strive to maintain a friendly and welcoming environment for all users, and any content that goes against these principles will be promptly addressed.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>In simple terms:</strong> Anything you make on our platform is 100% yours, and you're free to share or even sell it anywhere else. Just a couple of things to remember: Please don't upload stuff you don't have the rights to, like copyrighted materials, unless you've got the proper permissions. If there's an issue with copyrights, give us a shout at legal@linguaflow.com. Also, we might use the stuff you make to improve our platform, but don't worry – we'll never reveal who you are or use your private info. Oh, and let's keep things respectful; avoid sharing anything too edgy or hurtful. If anything goes against our friendly vibe, we'll have to take it down.
                    </p>
                  </div>
                </div>

                {/* Subscription and Pricing */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <CreditCard className="w-6 h-6 mr-2 text-cyber-400" />
                    IV. Subscription and Pricing
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    LinguaFlow offers both free and paid subscription tiers, and we believe in complete transparency when it comes to pricing. Detailed information regarding the features and pricing of each tier can be found on our <a href="/pricing" className="text-cyber-400 hover:underline">pricing page</a>. Pricing may vary based on geographic location and is determined by the billing information you provide upon purchase.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    To ensure a hassle-free experience for our users, we include all applicable taxes in our subscription fees. Tax rates are calculated based on your provided billing information and the prevailing tax rate at the time of the subscription charge. This means you'll have a clear understanding of the total cost when subscribing to our services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    For users selecting the "LinguaFlow Pro" plan, we offer both monthly and yearly subscription options. These subscriptions are designed to cater to your preferences, and they will renew automatically at the end of each billing cycle, whether it's monthly or annually.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We understand that circumstances can change, and you may need to discontinue the service. Users have the flexibility to terminate their subscription at any time through their account settings. However, please note that upon cancellation, no refunds will be granted for previously paid amounts, and all outstanding fees will be immediately due. We aim to make the process as user-friendly as possible.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    In the event of a failed payment, we are committed to notifying you promptly. You'll be given a grace period of 5 days to settle the outstanding amount, ensuring minimal disruption to your access. After this period, if payments are not resolved, LinguaFlow reserves the right to suspend your access until the issue is resolved.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    To allow users to explore and experience our Service, LinguaFlow may periodically offer free plans or pilots. Eligibility criteria and the duration of these offers are determined solely by LinguaFlow, giving users a fair opportunity to test our platform and make informed decisions about their subscription.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    LinguaFlow values user feedback and continuously strives to improve our platform. As a result, we retain the right to modify features or services within subscription tiers. Any such changes will be communicated transparently to active subscribers, ensuring that you stay informed and engaged with our evolving offerings.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    LinguaFlow also retains the right to modify its pricing structure, but rest assured, we are committed to transparency in this regard. For users with active subscriptions, any pricing adjustments will take effect at the start of the subsequent renewal period or thirty (30) days post the notification of the change, whichever comes later. We aim to keep you informed and provide a clear understanding of any pricing changes.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>In simple terms:</strong> Here's the quick scoop on our subscriptions:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>We've got free and paid plans.</li>
                        <li>Prices might vary by location, but taxes are usually included.</li>
                        <li>"LinguaFlow Pro" plans auto-renew monthly or yearly.</li>
                        <li>You can change or cancel your plan anytime. No refunds for past payments though.</li>
                        <li>If a payment fails, you've got 5 days to sort it. After that, we might need to pause your access.</li>
                        <li>Sometimes, we offer free trials or special deals. Stay tuned!</li>
                        <li>We might tweak our plans or prices. If so, we'll keep you posted and new rates would apply at your next renewal or after 30 days.</li>
                      </ul>
                    </p>
                  </div>
                </div>

                {/* Liability and Indemnification */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Scale className="w-6 h-6 mr-2 text-cyber-400" />
                    V. Liability and Indemnification
                  </h2>
                  <h3 className="text-xl font-semibold mb-4">LinguaFlow's Limited Liability:</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    LinguaFlow shall not, under any circumstances, be held accountable for any misinformation, harm, or adverse effects stemming from content generated on the platform. Users expressly acknowledge and agree that LinguaFlow's services are provided "as-is" and "as-available," and LinguaFlow makes no representations or warranties, whether express or implied, regarding the accuracy, reliability, or suitability of such content.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4">User's Indemnification:</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Users hereby agree to indemnify, defend, and hold LinguaFlow, its officers, directors, employees, and affiliates (collectively referred to as "LinguaFlow Parties") harmless from any and all claims, damages, liabilities, expenses (including reasonable legal fees), and losses arising from their misuse of the platform, violation of this Terms of Service, and all applicable Policies, or infringement of any third-party rights. This indemnification obligation extends to any third-party claims, including but not limited to claims related to copyright infringement, defamation, or violation of privacy rights.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4">Third-Party Content and Services:</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    LinguaFlow does not prevent any links to the third parties' websites and platforms, but unequivocally disclaims responsibility for any links or content introduced by users that may lead to external websites or platforms. Any interactions or transactions with such external entities are solely between the user and said entities. LinguaFlow does not endorse, warrant, or guarantee the content, services, or products provided by third parties, and users should exercise caution and due diligence when engaging with external links or content.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    LinguaFlow reserves a right to remove any links to the third parties resources due to legal requirements, misleading information or other inappropriate use of such links on the platform.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4">Third-Party Integrations:</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    For any issues or disputes arising from third-party integrations with LinguaFlow's platform, LinguaFlow shall not be held responsible. Users are strongly encouraged to review and abide by the terms and conditions both of LinguaFlow and of the respective third-party services with which they choose to integrate. LinguaFlow does not assume any liability or responsibility for the actions, policies, or performance of third-party services and their impact on the user's experience with LinguaFlow.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Any use of the third parties' resources by the user on the platform is subject to the user's obligations to abide by all applicable laws in respect of any intellectual property of those third parties. LinguaFlow does not bear any responsibility in case of violation of such intellectual property rights, and the user undertakes to indemnify LinguaFlow in relation with any claim of such third parties' intellectual property rights violations.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>In simple terms:</strong> If something goes wrong because of content on LinguaFlow, we can't be blamed. If you misuse our platform or break any rules, you'll need to cover any costs or issues that arise. We aren't responsible for links to other sites that users add, or for problems with other services connected to LinguaFlow. If you have issues with those external services, please check with them directly.
                    </p>
                  </div>
                </div>

                {/* Warranty Disclaimer */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Shield className="w-6 h-6 mr-2 text-cyber-400" />
                    VI. Warranty Disclaimer
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    LinguaFlow provides the Service on an "as-is" and "as-available" basis, in accordance with industry standards and practices. To the fullest extent permitted by applicable law, LinguaFlow, its licensors, and suppliers expressly disclaim all warranties, whether express or implied, including but not limited to warranties of merchantability, fitness for a specific purpose, or non-infringement. It is essential to clarify our position regarding the nature of our service.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We acknowledge the value of transparency in our operations. While we are dedicated to delivering a robust platform, we must candidly address the realities of technology. We cannot assure uninterrupted access to the Service, as the digital environment is inherently subject to variability. Although we employ stringent quality control measures, we do not claim infallibility. The accuracy and reliability of content generated on LinguaFlow can fluctuate, influenced by various factors, including user inputs and data sources. Consequently, we strongly encourage users to independently verify the accuracy and appropriateness of any generated content. Your active participation in content validation contributes to a more dependable user experience.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Furthermore, it is imperative to recognize that despite our vigilant efforts to protect your data, LinguaFlow cannot be held accountable for potential data loss or alterations that may occur during transmissions over networks beyond our jurisdiction. While we maintain robust security protocols, the digital realm is susceptible to unforeseeable events. Our commitment to data integrity notwithstanding, users are advised to maintain regular backups of their content. This precautionary measure ensures the resilience of your data, even in unanticipated circumstances. In the unfortunate event of data loss, LinguaFlow cannot assume liability, as we operate within the constraints inherent to technology.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    LinguaFlow is proffered "as-is," with an unwavering commitment to integrity and user empowerment. While we diligently strive to furnish a high-quality service and uphold the trust reposed in us, we refrain from issuing official warranties regarding the quality or suitability of the Service for specific purposes. This stance is grounded in the necessity of managing pragmatic expectations within the dynamic digital landscape. It is judicious to exercise diligence in reviewing generated content and maintain backups of critical data. Regrettably, in cases of data loss, we emphasize that LinguaFlow cannot be held liable. We appreciate your understanding and collaboration as we navigate the ever-evolving sphere of AI technology in concert.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>In simple terms:</strong> We offer LinguaFlow "as-is" and we can't promise it'll always be perfect or available. We don't make any official guarantees about its quality or fitness for a certain use. While we try our best, we can't assure you'll always have access or that everything generated is accurate. It's a good idea to double-check the content and keep backups of your stuff. If there's data loss, we can't take the blame.
                    </p>
                  </div>
                </div>

                {/* Modifications and Amendments */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Settings className="w-6 h-6 mr-2 text-cyber-400" />
                    VII. Modifications and Amendments
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    LinguaFlow retains the right to modify, amend, or revise these ToS at its discretion. Such changes will be communicated to users through in-platform notifications or emails.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Continuous use of the platform post any changes signifies the user's acceptance of the revised terms.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>In simple terms:</strong> LinguaFlow can change these terms whenever we need to. If we do, we'll let you know through the platform or email. If you keep using LinguaFlow after we make changes, it means you're okay with the new terms.
                    </p>
                  </div>
                </div>

                {/* Governing Law and Jurisdiction */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Globe className="w-6 h-6 mr-2 text-cyber-400" />
                    VIII. Governing Law and Jurisdiction
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Any disputes arising out of or related to these Terms of Service or use of the LinguaFlow platform shall be governed by the laws of the United States, without regard to its conflict of laws rules.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Before initiating any formal legal action, both parties agree to attempt to resolve disputes amicably through mediation. If mediation is unsuccessful, the disputes are subject to consideration by arbitration according to the rules of the American Arbitration Association with one arbitrator, the language of arbitration is English.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Unless otherwise agreed upon, each party will bear its own costs related to mediation and arbitration.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>In simple terms:</strong> If there's a disagreement about these terms or using LinguaFlow, U.S. laws will guide us. Before taking it to court, we both agree to try sorting things out through friendly talks. If that doesn't work, we'll use arbitration in the U.S. And unless we decide something different, each of us pays our own costs for these processes.
                    </p>
                  </div>
                </div>

                {/* Miscellaneous */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Settings className="w-6 h-6 mr-2 text-cyber-400" />
                    IX. Miscellaneous
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Nothing in these ToS creates any partnership, joint venture, employment, or agency relationship between you and LinguaFlow.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    For information on how LinguaFlow handles, collects, and stores your personal data, please refer to our <a href="/privacy" className="text-cyber-400 hover:underline">Privacy Policy</a>.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    LinguaFlow reserves the right to assign or transfer our obligations and rights under these ToS to any affiliate or in connection with a merger, acquisition, sale, or other change of control. If the rights under these ToS are assumed by a third party, LinguaFlow will notify users of this change.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Users may not assign or delegate any rights or obligations under these ToS without LinguaFlow's prior written consent. Any unauthorized assignment or delegation will be null and void.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If any provision of these ToS is deemed illegal or unenforceable, such provision will be enforced to the maximum extent permissible, and the remaining provisions will remain in full force and effect.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Any failure by LinguaFlow to enforce or exercise any provision of these ToS, or any related right, shall not constitute a waiver of that provision or right.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    These ToS, in conjunction with any documents or policies referenced herein, represents the entire agreement between the user and LinguaFlow regarding the use of the Service, superseding and replacing any previous agreements or communications between the parties.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Neither party will be responsible for any failure or delay in its performance under these Terms due to causes beyond its reasonable control, including, but not limited to, labor disputes, strikes, lockouts, internet or telecommunications failures, power outages, and government restrictions.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>In simple terms:</strong> This agreement doesn't make us partners or coworkers. We might hand over our side of this agreement to someone else, especially if there's a big company change. If we do, we'll let you know. You can't pass on your side of the deal without asking us first. If something in these terms doesn't work legally, the rest still stands. If we don't act on a rule right away, it doesn't mean we're giving it up. This agreement, along with any linked documents, covers everything about our relationship. Lastly, if stuff out of our control (like big internet outages) happens, neither of us is to blame.
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
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6">
                    <h3 className="font-semibold mb-2">LinguaFlow Legal Team</h3>
                    <p className="text-muted-foreground">
                      Email: <a href="mailto:legal@linguaflow.com" className="text-cyber-400 hover:underline">legal@linguaflow.com</a>
                    </p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </LandingLayout>
  );
}