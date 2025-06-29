"use client";

import { useState, useEffect } from "react";
import { Pencil, Save, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EditablePlanSectionProps {
  title: string;
  content: string[];
  onSave: (title: string, newContent: string[]) => Promise<void>;
  className?: string;
}

export default function EditablePlanSection({
  title,
  content,
  onSave,
  className,
}: EditablePlanSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string[]>([...content]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Reset edited content when original content changes
  useEffect(() => {
    setEditedContent([...content]);
  }, [content]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedContent([...content]);
    setIsEditing(false);
  };

  const handleContentChange = (index: number, value: string) => {
    const newContent = [...editedContent];
    newContent[index] = value;
    setEditedContent(newContent);
  };

  const handleAddItem = () => {
    setEditedContent([...editedContent, ""]);
  };

  const handleRemoveItem = (index: number) => {
    const newContent = [...editedContent];
    newContent.splice(index, 1);
    setEditedContent(newContent);
  };

  const handleSave = async () => {
    // Filter out empty items
    const filteredContent = editedContent.filter(item => item.trim() !== "");
    
    setIsSaving(true);
    try {
      await onSave(title, filteredContent);
      setIsEditing(false);
      setShowSaveSuccess(true);
      
      // Hide success indicator after 2 seconds
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 2000);
      
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        
        {!isEditing ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleEdit}
            className="h-7 w-7 p-0 rounded-full hover:bg-cyber-400/10 hover:text-cyber-400 transition-colors duration-300"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">Edit {title}</span>
          </Button>
        ) : (
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
              className="h-7 w-7 p-0 rounded-full hover:bg-red-400/10 hover:text-red-400 transition-colors duration-300"
              disabled={isSaving}
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Cancel</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSave}
              className="h-7 w-7 p-0 rounded-full hover:bg-green-400/10 hover:text-green-400 transition-colors duration-300"
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="h-3.5 w-3.5 border-2 border-t-transparent border-green-400 rounded-full animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">Save</span>
            </Button>
          </div>
        )}
        
        {showSaveSuccess && (
          <div className="absolute right-0 mr-8 flex items-center text-green-500 text-xs animate-fade-in">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            <span>Saved</span>
          </div>
        )}
      </div>

      {!isEditing ? (
        <ul className="space-y-1 text-sm">
          {content.map((item, index) => (
            <li key={index} className="flex items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-cyber-400 mt-1.5 mr-2 flex-shrink-0"></div>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2">
          {editedContent.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <Textarea
                value={item}
                onChange={(e) => handleContentChange(index, e.target.value)}
                className="min-h-[60px] text-sm resize-none input-cyber focus-cyber flex-1"
                placeholder={`Enter ${title.toLowerCase()} item...`}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveItem(index)}
                className="h-7 w-7 p-0 rounded-full hover:bg-red-400/10 hover:text-red-400 transition-colors duration-300 flex-shrink-0 mt-1"
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Remove item</span>
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="w-full mt-2 text-xs h-7 border-dashed border-cyber-400/30 hover:border-cyber-400 hover:bg-cyber-400/10 transition-colors duration-300"
          >
            + Add Item
          </Button>
        </div>
      )}
    </div>
  );
}