"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import WordTranslationPopup from "./WordTranslationPopup";

interface LessonMaterialDisplayProps {
  content: any;
  studentNativeLanguage?: string;
}

export default function LessonMaterialDisplay({ 
  content, 
  studentNativeLanguage 
}: LessonMaterialDisplayProps) {
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    translation: string;
    rect: DOMRect;
  } | null>(null);

  if (!content || !content.sections) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No lesson content available</p>
      </div>
    );
  }

  const handleWordClick = async (word: string, event: React.MouseEvent) => {
    if (!studentNativeLanguage) return;
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    try {
      // Mock translation for now - in production, this would call your translation API
      const translation = `Translation of "${word}" in ${studentNativeLanguage}`;
      
      setSelectedWord({
        word,
        translation,
        rect
      });
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  const renderClickableText = (text: string) => {
    if (!studentNativeLanguage) return text;
    
    return text.split(' ').map((word, index) => (
      <span key={index}>
        <span
          className="cursor-pointer hover:bg-blue-100 hover:text-blue-800 rounded px-1 transition-colors"
          onClick={(e) => handleWordClick(word.replace(/[.,!?;:]$/, ''), e)}
        >
          {word}
        </span>
        {index < text.split(' ').length - 1 ? ' ' : ''}
      </span>
    ));
  };

  const renderSection = (section: any, index: number) => {
    const colors = content.colors || {};
    
    switch (section.type) {
      case "title":
        return (
          <div key={index} className="text-center mb-8">
            {section.image_url && (
              <img 
                src={section.image_url} 
                alt={section.title}
                className="w-full max-w-md mx-auto rounded-lg mb-4 object-cover h-48"
              />
            )}
            <h1 className="text-3xl font-bold mb-2">{section.title}</h1>
            <p className="text-xl text-muted-foreground">{section.subtitle}</p>
          </div>
        );

      case "info_card":
        return (
          <Card key={index} className={cn("mb-6", colors.border_color)}>
            <CardHeader className={cn(colors[section.background_color_var] || "bg-blue-50")}>
              <CardTitle className={colors.accent_color}>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {section.content_type === "list" && section.items ? (
                <ul className="space-y-2">
                  {section.items.map((item: string, itemIndex: number) => (
                    <li key={itemIndex} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{renderClickableText(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{renderClickableText(section.content || "Content will be generated here")}</p>
              )}
            </CardContent>
          </Card>
        );

      case "exercise":
        return (
          <Card key={index} className={cn("mb-6", colors.border_color)}>
            <CardHeader>
              <CardTitle className={colors.accent_color}>{section.title}</CardTitle>
              {section.instruction && (
                <div className={cn("p-3 rounded-md", colors[section.instruction_bg_color_var] || "bg-green-50")}>
                  <p className="text-sm font-medium">{renderClickableText(section.instruction)}</p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {renderExerciseContent(section, colors)}
            </CardContent>
          </Card>
        );

      default:
        console.warn("Unknown section type:", section.type, section);
        return (
          <div key={index} className="p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800 mb-4">
            Unknown section type: {section.type || 'undefined'}
          </div>
        );
    }
  };

  const renderExerciseContent = (section: any, colors: any) => {
    console.log("Rendering exercise content:", section.content_type, section);

    switch (section.content_type) {
      case "list":
        return (
          <ul className="space-y-2">
            {(section.items || []).map((item: string, itemIndex: number) => (
              <li key={itemIndex} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{renderClickableText(item)}</span>
              </li>
            ))}
          </ul>
        );

      case "vocabulary_matching":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {(section.vocabulary_items || []).map((item: any, itemIndex: number) => (
              <div key={itemIndex} className="flex items-center space-x-3 p-3 border rounded-lg">
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{renderClickableText(item.prompt)}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case "full_dialogue":
        return (
          <div className="space-y-3">
            {(section.dialogue_lines || []).map((line: any, lineIndex: number) => (
              <div key={lineIndex} className="flex items-start space-x-2">
                <span className="font-semibold text-blue-600">{line.character}:</span>
                <span>{renderClickableText(line.text)}</span>
              </div>
            ))}
          </div>
        );

      case "matching":
        return (
          <div className="space-y-4">
            {(section.matching_pairs || []).map((pair: any, pairIndex: number) => (
              <div key={pairIndex} className="border rounded-lg p-4">
                <p className="font-medium mb-2">{renderClickableText(pair.question)}</p>
                <div className="flex flex-wrap gap-2">
                  {(pair.answers || []).map((answer: string, answerIndex: number) => (
                    <Badge key={answerIndex} variant="outline">{renderClickableText(answer)}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case "fill_in_the_blanks_dialogue":
        return (
          <div className="space-y-4">
            {(section.dialogue_elements || []).map((element: any, elementIndex: number) => {
              // Log the element to inspect its structure
              console.warn("Encountered dialogue element:", element);

              // Handle different element types with proper fallback
              switch (element.type) {
                case "character_speech":
                  return (
                    <div key={elementIndex} className="flex items-start space-x-2">
                      <span className="font-semibold text-blue-600">{element.character}:</span>
                      <span>{renderClickableText(element.text)}</span>
                    </div>
                  );

                case "multiple_choice":
                  return (
                    <div key={elementIndex} className="space-y-2 bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">{renderClickableText(element.question)}</p>
                      <div className="flex flex-wrap gap-2">
                        {(element.options || []).map((option: string, optionIndex: number) => (
                          <Badge key={optionIndex} variant="outline" className="cursor-pointer hover:bg-blue-100">
                            {renderClickableText(option)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );

                case "user_input":
                  return (
                    <div key={elementIndex} className="flex items-center space-x-2">
                      <span className="font-semibold">{element.label}:</span>
                      <Input 
                        placeholder={element.placeholder || "..."} 
                        className="max-w-xs"
                      />
                    </div>
                  );

                case "text":
                  return (
                    <div key={elementIndex} className="text-gray-700">
                      {renderClickableText(element.content || element.text || "")}
                    </div>
                  );

                default:
                  // Fallback for unknown or missing types
                  console.error("Unknown dialogue element type:", element.type, element);
                  return (
                    <div key={elementIndex} className="p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800">
                      <p className="font-medium">Unknown element type: {element.type || 'undefined'}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">Debug Info</summary>
                        <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
                          {JSON.stringify(element, null, 2)}
                        </pre>
                      </details>
                    </div>
                  );
              }
            })}
          </div>
        );

      case "ordering":
        return (
          <div className="space-y-2">
            {(section.ordering_items || []).map((item: string, itemIndex: number) => (
              <div key={itemIndex} className="p-3 border rounded-lg bg-gray-50">
                {renderClickableText(item)}
              </div>
            ))}
          </div>
        );

      case "text":
        return (
          <div className="prose max-w-none">
            {renderClickableText(section.content || "Content will be generated here")}
          </div>
        );

      default:
        console.warn("Unknown content type:", section.content_type, section);
        return (
          <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800">
            <p className="font-medium">Unknown content type: {section.content_type || 'undefined'}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm">Debug Info</summary>
              <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(section, null, 2)}
              </pre>
            </details>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {content.sections.map((section: any, index: number) => renderSection(section, index))}
      
      {selectedWord && (
        <WordTranslationPopup
          word={selectedWord.word}
          translation={selectedWord.translation}
          wordRect={selectedWord.rect}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}