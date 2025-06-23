"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  MessageSquare, 
  Lightbulb, 
  Sparkles, 
  Pencil, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Languages,
  Volume2,
  Headphones,
  Mic,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  List,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  HelpCircle,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Users,
  Settings,
  FileText,
  Folder,
  FolderOpen,
  Image,
  Video,
  Music,
  Download,
  Upload,
  Share2,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Flag,
  Send,
  Trash,
  Edit,
  Copy,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  Link,
  ExternalLink,
  RefreshCw,
  RotateCw,
  RotateCcw,
  Filter,
  Search,
  ZoomIn,
  ZoomOut,
  Plus,
  Minus,
  Divide,
  Asterisk,
  Hash,
  Percent,
  DollarSign,
  Euro,
  CreditCard,
  ShoppingCart,
  ShoppingBag,
  Gift,
  Tag,
  Truck,
  Map,
  MapPin,
  Navigation,
  Globe,
  Wifi,
  Bluetooth,
  Battery,
  BatteryCharging,
  Smartphone,
  Tablet,
  Laptop,
  Server,
  Printer,
  Camera,
  Tv,
  Radio,
  Speaker,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  FileKey,
  Shield,
  ShieldOff,
  AlertTriangle,
  Award,
  Briefcase,
  Coffee,
  Compass,
  Crop,
  Crosshair,
  Database,
  Disc,
  File,
  FilePlus,
  FileMinus,
  FileText as FileTextIcon,
  Film,
  Fingerprint,
  Flag as FlagIcon,
  Folder as FolderIcon,
  FolderPlus,
  FolderMinus,
  Gift as GiftIcon,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Gitlab,
  Github,
  Globe as GlobeIcon,
  Grid,
  HardDrive,
  Hash as HashIcon,
  Headphones as HeadphonesIcon,
  Heart as HeartIcon,
  HelpCircle as HelpCircleIcon,
  Home,
  Image as ImageIcon,
  Inbox,
  Instagram,
  Layers,
  Layout,
  LifeBuoy,
  Link as LinkIcon,
  Linkedin,
  List as ListIcon,
  Loader,
  Lock as LockIcon,
  LogIn,
  LogOut,
  Mail,
  Map as MapIcon,
  MapPin as MapPinIcon,
  Maximize,
  Minimize,
  Mic as MicIcon,
  Monitor,
  Moon,
  MoreHorizontal as MoreHorizontalIcon,
  MoreVertical,
  MousePointer,
  Move,
  Music as MusicIcon,
  Navigation as NavigationIcon,
  Package,
  Paperclip,
  Pause as PauseIcon,
  Percent as PercentIcon,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Pie,
  Play as PlayIcon,
  Plus as PlusIcon,
  PlusCircle,
  PlusSquare,
  Pocket,
  Power,
  Printer as PrinterIcon,
  Radio as RadioIcon,
  RefreshCcw,
  RefreshCw as RefreshCwIcon,
  Repeat as RepeatIcon,
  Rewind,
  RotateCcw as RotateCcwIcon,
  RotateCw as RotateCwIcon,
  Rss,
  Save,
  Scissors,
  Search as SearchIcon,
  Send as SendIcon,
  Server as ServerIcon,
  Settings as SettingsIcon,
  Share,
  Shield as ShieldIcon,
  ShieldOff as ShieldOffIcon,
  ShoppingBag as ShoppingBagIcon,
  ShoppingCart as ShoppingCartIcon,
  Shuffle as ShuffleIcon,
  Sidebar,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  Slack,
  Slash,
  Sliders,
  Smartphone as SmartphoneIcon,
  Smile,
  Speaker as SpeakerIcon,
  Square,
  Star as StarIcon,
  StopCircle,
  Sun,
  Sunrise,
  Sunset,
  Tablet as TabletIcon,
  Tag as TagIcon,
  Target,
  Terminal,
  Thermometer,
  ThumbsDown as ThumbsDownIcon,
  ThumbsUp as ThumbsUpIcon,
  ToggleLeft,
  ToggleRight,
  Tool,
  Trash as TrashIcon,
  Trash2,
  Trello,
  TrendingDown,
  TrendingUp,
  Triangle,
  Truck as TruckIcon,
  Tv as TvIcon,
  Twitch,
  Twitter,
  Type,
  Umbrella,
  Underline,
  Unlock as UnlockIcon,
  Upload as UploadIcon,
  User as UserIcon,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
  Users as UsersIcon,
  Video as VideoIcon,
  VideoOff,
  Voicemail,
  Volume,
  Volume1,
  Volume2 as Volume2Icon,
  VolumeX,
  Watch,
  Wifi as WifiIcon,
  WifiOff,
  Wind,
  X as XIcon,
  XCircle as XCircleIcon,
  XOctagon,
  XSquare,
  Youtube,
  Zap as ZapIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from "lucide-react";
import WordTranslationPopup from "./WordTranslationPopup";
import { cn } from "@/lib/utils";

interface LessonMaterialDisplayProps {
  content: any;
  onTranslationRequest?: (text: string) => Promise<string>;
}

interface TranslationPopupState {
  word: string;
  translation: string;
  rect: DOMRect;
  visible: boolean;
}

export default function LessonMaterialDisplay({ 
  content, 
  onTranslationRequest 
}: LessonMaterialDisplayProps) {
  const [activeTab, setActiveTab] = useState("lesson");
  const [translationPopup, setTranslationPopup] = useState<TranslationPopupState>({
    word: "",
    translation: "",
    rect: new DOMRect(),
    visible: false
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Close translation popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (translationPopup.visible) {
        setTranslationPopup(prev => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [translationPopup.visible]);

  const handleTextDoubleClick = async (event: React.MouseEvent<HTMLElement>) => {
    if (!onTranslationRequest) return;
    
    // Get the text selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    if (!selectedText || selectedText.length > 50) return;
    
    // Get the bounding rectangle of the selection
    const rect = range.getBoundingClientRect();
    
    // Adjust rect position relative to the viewport
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    
    const adjustedRect = new DOMRect(
      rect.x + scrollLeft,
      rect.y + scrollTop,
      rect.width,
      rect.height
    );
    
    setIsTranslating(true);
    setTranslationPopup({
      word: selectedText,
      translation: "Translating...",
      rect: adjustedRect,
      visible: true
    });
    
    try {
      const translation = await onTranslationRequest(selectedText);
      setTranslationPopup(prev => ({
        ...prev,
        translation,
        visible: true
      }));
    } catch (error) {
      console.error("Translation error:", error);
      setTranslationPopup(prev => ({
        ...prev,
        translation: "Translation failed",
        visible: true
      }));
    } finally {
      setIsTranslating(false);
    }
  };

  const closeTranslationPopup = () => {
    setTranslationPopup(prev => ({ ...prev, visible: false }));
  };

  const renderSection = (section: any) => {
    switch (section.type) {
      case "title":
        return (
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 gradient-text">{section.title}</h1>
            {section.subtitle && (
              <p className="text-lg text-muted-foreground">{section.subtitle}</p>
            )}
            {section.image_url && (
              <div className="mt-4 rounded-lg overflow-hidden">
                <img 
                  src={section.image_url} 
                  alt={section.title} 
                  className="w-full h-auto object-cover max-h-[300px]"
                />
              </div>
            )}
          </div>
        );
      
      case "info_card":
        return (
          <Card className={`mb-6 border-cyber-400/30 ${section.background_color_var ? `${section.background_color_var}` : 'bg-muted/30'}`}>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Lightbulb className="mr-2 h-5 w-5 text-cyber-400" />
                {section.title}
              </h2>
              
              {section.content_type === "text" && (
                <div 
                  className="prose dark:prose-invert max-w-none" 
                  onDoubleClick={handleTextDoubleClick}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.content || ""}
                  </ReactMarkdown>
                </div>
              )}
              
              {section.content_type === "list" && (
                <ul className="space-y-2">
                  {section.items?.map((item: string, index: number) => (
                    <li 
                      key={index} 
                      className="flex items-start"
                      onDoubleClick={handleTextDoubleClick}
                    >
                      <Sparkles className="h-5 w-5 text-cyber-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      
      case "exercise":
        return (
          <Card className="mb-6 border-cyber-400/30 hover:border-cyber-400/50 transition-all duration-300">
            <CardContent className="p-0">
              <div className="border-b border-cyber-400/20 p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-cyber-400" />
                  {section.title}
                </h2>
              </div>
              
              {section.instruction && (
                <div className={`p-4 ${section.instruction_bg_color_var ? `${section.instruction_bg_color_var}` : 'bg-muted/30'} border-b border-cyber-400/20`}>
                  <p className="text-sm flex items-center">
                    <Info className="h-4 w-4 mr-2 text-cyber-400" />
                    {section.instruction}
                  </p>
                </div>
              )}
              
              <div className="p-4">
                {section.content_type === "text" && (
                  <div 
                    className="prose dark:prose-invert max-w-none" 
                    onDoubleClick={handleTextDoubleClick}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.content || ""}
                    </ReactMarkdown>
                  </div>
                )}
                
                {section.content_type === "list" && (
                  <ul className="space-y-3">
                    {section.items?.map((item: string, index: number) => (
                      <li 
                        key={index} 
                        className="flex items-start"
                        onDoubleClick={handleTextDoubleClick}
                      >
                        <div className="h-5 w-5 rounded-full bg-cyber-400/20 flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-xs font-medium text-cyber-600 dark:text-cyber-400">{index + 1}</span>
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                {section.content_type === "vocabulary_matching" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {section.vocabulary_items?.map((item: any, index: number) => (
                      <div 
                        key={index} 
                        className="border border-cyber-400/30 rounded-lg p-4 hover:border-cyber-400/50 transition-all duration-300"
                        onDoubleClick={handleTextDoubleClick}
                      >
                        {item.image_url && (
                          <div className="mb-3 rounded-md overflow-hidden">
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.prompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {section.content_type === "full_dialogue" && (
                  <div className="space-y-4" onDoubleClick={handleTextDoubleClick}>
                    {section.dialogue_lines?.map((line: any, index: number) => (
                      <div 
                        key={index} 
                        className={`flex ${line.character === "Tutor" ? "justify-start" : "justify-end"}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 ${
                            line.character === "Tutor" 
                              ? "bg-muted/50 text-foreground rounded-tl-none" 
                              : "bg-cyber-400/20 text-foreground rounded-tr-none"
                          }`}
                        >
                          <div className="font-semibold text-xs mb-1">
                            {line.character}
                          </div>
                          <p>{line.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {section.content_type === "matching" && (
                  <div className="space-y-6" onDoubleClick={handleTextDoubleClick}>
                    {section.matching_pairs?.map((pair: any, index: number) => (
                      <div key={index} className="border border-cyber-400/30 rounded-lg p-4">
                        <div className="font-semibold mb-2">{pair.question}</div>
                        <div className="pl-4 space-y-2">
                          {pair.answers?.map((answer: string, answerIndex: number) => (
                            <div key={answerIndex} className="flex items-center">
                              <div className="h-4 w-4 rounded-full border border-cyber-400/50 mr-2"></div>
                              <span>{answer}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {section.content_type === "fill_in_the_blanks_dialogue" && (
                  <div className="space-y-4" onDoubleClick={handleTextDoubleClick}>
                    {section.dialogue_elements?.map((element: any, index: number) => {
                      if (element.type === "multiple_choice") {
                        return (
                          <div key={index} className="border border-cyber-400/30 rounded-lg p-4 bg-muted/30">
                            <p className="font-medium mb-2">{element.question}</p>
                            <div className="grid gap-2">
                              {element.options?.map((option: string, optionIndex: number) => (
                                <div key={optionIndex} className="flex items-center">
                                  <div className="h-4 w-4 rounded-full border border-cyber-400/50 mr-2"></div>
                                  <span>{option}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div 
                            key={index} 
                            className={`flex ${element.character === "Tutor" ? "justify-start" : "justify-end"}`}
                          >
                            <div 
                              className={`max-w-[80%] rounded-lg p-3 ${
                                element.character === "Tutor" 
                                  ? "bg-muted/50 text-foreground rounded-tl-none" 
                                  : "bg-cyber-400/20 text-foreground rounded-tr-none"
                              }`}
                            >
                              <div className="font-semibold text-xs mb-1">
                                {element.character}
                              </div>
                              <p>{element.text}</p>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
                
                {section.content_type === "ordering" && (
                  <div className="space-y-3" onDoubleClick={handleTextDoubleClick}>
                    {section.ordering_items?.map((item: string, index: number) => (
                      <div 
                        key={index} 
                        className="border border-cyber-400/30 rounded-lg p-3 flex items-center"
                      >
                        <div className="h-6 w-6 rounded-full bg-cyber-400/20 flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-xs font-medium text-cyber-600 dark:text-cyber-400">{index + 1}</span>
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {section.content_type === "grammar_explanation" && (
                  <div 
                    className="prose dark:prose-invert max-w-none" 
                    onDoubleClick={handleTextDoubleClick}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.explanation_content || ""}
                    </ReactMarkdown>
                  </div>
                )}
                
                {section.content_type === "example_sentences" && (
                  <ul className="space-y-3" onDoubleClick={handleTextDoubleClick}>
                    {section.sentences?.map((sentence: string, index: number) => (
                      <li 
                        key={index} 
                        className="border-l-4 border-cyber-400 pl-3 py-1"
                      >
                        {sentence}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (!content || !content.sections || !Array.isArray(content.sections)) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No content available</h3>
          <p className="text-muted-foreground">
            This lesson doesn't have any interactive content yet.
          </p>
        </div>
      );
    }

    return (
      <div ref={contentRef}>
        {content.sections.map((section: any, index: number) => (
          <div key={index} className="mb-8">
            {renderSection(section)}
          </div>
        ))}
      </div>
    );
  };

  // Define explicit components for ReactMarkdown
  const components = {
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="mb-4 leading-relaxed" onDoubleClick={handleTextDoubleClick} {...props}>
        {children}
      </p>
    ),
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-3xl font-bold mt-6 mb-4" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-2xl font-bold mt-6 mb-3" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-xl font-bold mt-5 mb-3" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 className="text-lg font-bold mt-4 mb-2" {...props}>
        {children}
      </h4>
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="list-disc list-inside mb-4 space-y-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
      <ol className="list-decimal list-inside mb-4 space-y-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="ml-2" {...props}>
        {children}
      </li>
    ),
    a: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a className="text-cyber-400 hover:underline" {...props}>
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote className="border-l-4 border-cyber-400/50 pl-4 italic my-4" {...props}>
        {children}
      </blockquote>
    ),
    code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    ),
    pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-sm" {...props}>
        {children}
      </pre>
    ),
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <img 
        src={src} 
        alt={alt || "Image"} 
        className="max-w-full h-auto rounded-lg my-4" 
        {...props} 
      />
    ),
    table: ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className="bg-muted/50" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <tbody {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr className="border-b border-border" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
      <th className="px-4 py-2 text-left font-medium" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
      <td className="px-4 py-2" {...props}>
        {children}
      </td>
    ),
    hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
      <hr className="my-6 border-border" {...props} />
    ),
    strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <strong className="font-bold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    del: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <del className="line-through" {...props}>
        {children}
      </del>
    ),
  };

  return (
    <div className="relative">
      <Tabs defaultValue="lesson" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="lesson" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Lesson Material</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Notes & Tips</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="lesson" className="space-y-4">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
                Teaching Notes
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={components}
                >
                  {content?.teaching_notes || "No teaching notes available for this lesson."}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
                Additional Resources
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={components}
                >
                  {content?.additional_resources || "No additional resources available for this lesson."}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {translationPopup.visible && (
        <WordTranslationPopup
          word={translationPopup.word}
          translation={translationPopup.translation}
          wordRect={translationPopup.rect}
          onClose={closeTranslationPopup}
        />
      )}
      
      {onTranslationRequest && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            size="sm" 
            variant="outline"
            className="bg-background/80 backdrop-blur-sm border-cyber-400/30 text-xs flex items-center space-x-1"
          >
            <Languages className="h-3 w-3 mr-1" />
            <span>Double-click text to translate</span>
          </Button>
        </div>
      )}
    </div>
  );
}