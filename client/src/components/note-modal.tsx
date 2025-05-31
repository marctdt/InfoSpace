import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Item } from "@/lib/types";

interface NoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Item;
}

export function NoteModal({ open, onOpenChange, editItem }: NoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editItem;

  useEffect(() => {
    if (editItem && open) {
      setTitle(editItem.title);
      setContent(editItem.content || "");
      setTags(editItem.tags ? editItem.tags.join(", ") : "");
    }
  }, [editItem, open]);

  const saveNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        const response = await fetch(`/api/items/${editItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update note");
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/items/note", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: isEdit ? "Note updated successfully!" : "Note created successfully!",
        description: isEdit ? "Your note has been updated." : "Your note has been saved to your hub.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: isEdit ? "Failed to update note" : "Failed to create note",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    saveNoteMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
    });
  };

  const handleClose = () => {
    if (!isEdit) {
      setTitle("");
      setContent("");
      setTags("");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Note" : "Create Note"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              rows={6}
              required
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="meeting, important, ideas"
            />
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || !content.trim() || saveNoteMutation.isPending}
              className="flex-1 bg-secondary hover:bg-secondary/90"
            >
              {saveNoteMutation.isPending ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Note" : "Create Note")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
