import { useState, useRef } from "react";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function QuickNote() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/items/note", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Note created!",
        description: "Your note has been saved.",
      });
      setContent("");
      setIsExpanded(false);
    },
    onError: () => {
      toast({
        title: "Failed to create note",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleSave = () => {
    if (!content.trim()) return;

    const lines = content.trim().split('\n');
    const title = lines[0];
    const noteContent = lines.length > 1 ? lines.slice(1).join('\n').trim() : lines[0];

    createNoteMutation.mutate({
      title: title.substring(0, 100), // Limit title length
      content: noteContent,
      tags: [],
    });
  };

  const handleCancel = () => {
    setContent("");
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        className="w-full p-4 h-auto justify-start text-muted-foreground hover:text-foreground transition-colors"
        onClick={handleExpand}
      >
        <Plus className="w-4 h-4 mr-2" />
        Take a quick note...
      </Button>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card animate-in">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing... First line becomes the title.&#10;&#10;Press Ctrl+Enter to save or Escape to cancel."
        rows={4}
        className="resize-none border-0 p-0 focus:ring-0 focus:border-0"
        onKeyDown={handleKeyDown}
      />
      
      <div className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={createNoteMutation.isPending}
        >
          <X className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!content.trim() || createNoteMutation.isPending}
          className="bg-secondary hover:bg-secondary/90"
        >
          <Check className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}