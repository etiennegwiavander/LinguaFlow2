"use client";

import React, { useState } from 'react';
import { Volume2, BookOpen, Eye, EyeOff, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface VocabularyItem {
    word: string;
    partOfSpeech: string;
    phonetic: string;
    definition: string;
    examples: string[];
    level?: string;
}

interface EnhancedVocabularySectionProps {
    vocabularyItems: VocabularyItem[];
    level: string;
    onTextDoubleClick?: (e: React.MouseEvent<HTMLElement>) => void;
    className?: string;
}

// Part of speech color mapping for visual distinction
const partOfSpeechColors = {
    noun: 'bg-blue-100 text-blue-800 border-blue-200',
    verb: 'bg-green-100 text-green-800 border-green-200',
    adjective: 'bg-purple-100 text-purple-800 border-purple-200',
    adverb: 'bg-orange-100 text-orange-800 border-orange-200',
    preposition: 'bg-pink-100 text-pink-800 border-pink-200',
    conjunction: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    pronoun: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    interjection: 'bg-red-100 text-red-800 border-red-200',
    article: 'bg-gray-100 text-gray-800 border-gray-200',
    default: 'bg-slate-100 text-slate-800 border-slate-200'
};

// Get number of examples based on level
const getExampleCount = (level: string): number => {
    const levelLower = level.toLowerCase();
    if (levelLower === 'a1' || levelLower === 'a2') return 5;
    if (levelLower === 'b1' || levelLower === 'b2') return 4;
    if (levelLower === 'c1' || levelLower === 'c2') return 3;
    return 4; // default
};

export default function EnhancedVocabularySection({
    vocabularyItems,
    level,
    onTextDoubleClick,
    className = ''
}: EnhancedVocabularySectionProps) {
    const [playingAudio, setPlayingAudio] = useState<Record<string, boolean>>({});
    const [showAllExamples, setShowAllExamples] = useState<Record<string, boolean>>({});

    const handleAudioPlay = async (word: string, phonetic: string) => {
        const audioKey = `${word}-${phonetic}`;

        // Toggle playing state
        setPlayingAudio(prev => ({
            ...prev,
            [audioKey]: !prev[audioKey]
        }));

        try {
            // Use Web Speech API for pronunciation with enhanced human-like settings
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(word);

                // Enhanced human-like settings
                utterance.rate = 0.7; // Slower for better pronunciation learning
                utterance.pitch = 0.9; // Slightly lower pitch for more natural sound
                utterance.volume = 1;

                // Wait for voices to load if not already loaded
                const loadVoices = () => {
                    return new Promise<SpeechSynthesisVoice[]>((resolve) => {
                        let voices = speechSynthesis.getVoices();
                        if (voices.length > 0) {
                            resolve(voices);
                        } else {
                            speechSynthesis.onvoiceschanged = () => {
                                voices = speechSynthesis.getVoices();
                                resolve(voices);
                            };
                        }
                    });
                };

                const voices = await loadVoices();

                // Prioritize high-quality English voices
                const preferredVoices = [
                    // Look for premium/neural voices first
                    voices.find(voice => voice.name.includes('Neural') && voice.lang.startsWith('en')),
                    voices.find(voice => voice.name.includes('Premium') && voice.lang.startsWith('en')),
                    // Then look for specific high-quality voices
                    voices.find(voice => voice.name.includes('Samantha') && voice.lang.startsWith('en')),
                    voices.find(voice => voice.name.includes('Alex') && voice.lang.startsWith('en')),
                    voices.find(voice => voice.name.includes('Daniel') && voice.lang.startsWith('en')),
                    voices.find(voice => voice.name.includes('Karen') && voice.lang.startsWith('en')),
                    // Fallback to any English voice
                    voices.find(voice => voice.lang === 'en-US'),
                    voices.find(voice => voice.lang === 'en-GB'),
                    voices.find(voice => voice.lang.startsWith('en'))
                ].filter(Boolean) as SpeechSynthesisVoice[];

                if (preferredVoices.length > 0) {
                    utterance.voice = preferredVoices[0];
                }

                utterance.onend = () => {
                    setPlayingAudio(prev => ({
                        ...prev,
                        [audioKey]: false
                    }));
                };

                utterance.onerror = () => {
                    setPlayingAudio(prev => ({
                        ...prev,
                        [audioKey]: false
                    }));
                };

                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error('Audio playback failed:', error);
            setPlayingAudio(prev => ({
                ...prev,
                [audioKey]: false
            }));
        }
    };

    const toggleExamples = (word: string) => {
        setShowAllExamples(prev => ({
            ...prev,
            [word]: !prev[word]
        }));
    };

    const getPartOfSpeechColor = (partOfSpeech: string): string => {
        const pos = partOfSpeech.toLowerCase();
        return partOfSpeechColors[pos as keyof typeof partOfSpeechColors] || partOfSpeechColors.default;
    };

    const expectedExampleCount = getExampleCount(level);

    if (!vocabularyItems || vocabularyItems.length === 0) {
        return (
            <Card className={`mb-6 floating-card glass-effect border-cyber-400/20 ${className}`}>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-cyber-400" />
                        Vocabulary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No vocabulary items available for this lesson.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`mb-6 floating-card glass-effect border-cyber-400/20 ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-cyber-400" />
                        Vocabulary
                    </div>
                    <Badge variant="outline" className="text-xs">
                        {vocabularyItems.length} {vocabularyItems.length === 1 ? 'word' : 'words'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {vocabularyItems.map((item, index) => {
                        const audioKey = `${item.word}-${item.phonetic}`;
                        const isPlaying = playingAudio[audioKey];
                        const showingAllExamples = showAllExamples[item.word];
                        const displayedExamples = item.examples; // Show all examples by default

                        // Debug logging for vocabulary examples
                        console.log(`🔍 EnhancedVocabularySection - Processing word: ${item.word}`, {
                            examplesCount: item.examples?.length || 0,
                            examples: item.examples,
                            displayedExamplesCount: displayedExamples?.length || 0,
                            firstExample: displayedExamples?.[0] || 'No examples'
                        });

                        // If no examples, show a warning in the UI
                        if (!displayedExamples || displayedExamples.length === 0) {
                            console.warn(`⚠️ No examples to display for word: ${item.word}`);
                        }

                        return (
                            <div key={index} className="vocabulary-item">
                                {/* Word Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        {/* Word and Pronunciation */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3
                                                className="text-2xl font-bold text-gray-900 dark:text-gray-100 vocabulary-word"
                                                onDoubleClick={onTextDoubleClick}
                                            >
                                                {item.word}
                                            </h3>

                                            {/* Audio Button */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAudioPlay(item.word, item.phonetic)}
                                                className="h-8 w-8 p-0 hover:bg-cyber-400/10 transition-colors"
                                                title={`Pronounce "${item.word}"`}
                                            >
                                                {isPlaying ? (
                                                    <Pause className="w-4 h-4 text-cyber-400" />
                                                ) : (
                                                    <Volume2 className="w-4 h-4 text-cyber-400" />
                                                )}
                                            </Button>
                                        </div>

                                        {/* Part of Speech and Phonetic */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs font-medium border ${getPartOfSpeechColor(item.partOfSpeech)}`}
                                            >
                                                {item.partOfSpeech}
                                            </Badge>

                                            <span className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                {item.phonetic}
                                            </span>
                                        </div>

                                        {/* Definition */}
                                        <p
                                            className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4"
                                            onDoubleClick={onTextDoubleClick}
                                        >
                                            {item.definition}
                                        </p>
                                    </div>
                                </div>

                                <Separator className="mb-4" />

                                {/* Example Sentences */}
                                <div className="examples-section">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                                            <span className="w-2 h-2 bg-cyber-400 rounded-full mr-2"></span>
                                            Example Sentences
                                        </h4>

                                        {item.examples.length > expectedExampleCount && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleExamples(item.word)}
                                                className="text-xs h-7 px-2"
                                            >
                                                {showingAllExamples ? (
                                                    <>
                                                        <EyeOff className="w-3 h-3 mr-1" />
                                                        Show Less
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        Show All ({item.examples.length})
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {displayedExamples.map((example, exampleIndex) => (
                                            <div
                                                key={exampleIndex}
                                                className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg border border-blue-200/30 dark:border-blue-800/30"
                                            >
                                                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {exampleIndex + 1}
                                                </span>
                                                <div
                                                    className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 flex-1"
                                                    onDoubleClick={onTextDoubleClick}
                                                    dangerouslySetInnerHTML={{ __html: example }}
                                                />

                                                {/* Audio button for example sentence */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAudioPlay(example.replace(/<[^>]*>/g, ''), '')}
                                                    className="h-6 w-6 p-0 hover:bg-blue-400/10 transition-colors opacity-60 hover:opacity-100"
                                                    title="Listen to example"
                                                >
                                                    <Play className="w-3 h-3 text-blue-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Removed example count indicator */}
                                </div>

                                {/* Separator between vocabulary items */}
                                {index < vocabularyItems.length - 1 && (
                                    <Separator className="mt-6" />
                                )}
                            </div>
                        );
                    })}
                </div>


            </CardContent>
        </Card>
    );
}