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

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Item;
}

export function ContactModal({ open, onOpenChange, editItem }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!editItem;

  useEffect(() => {
    if (editItem && open) {
      setName(editItem.title);
      setNotes(editItem.content || "");
      setTags(editItem.tags ? editItem.tags.join(", ") : "");
      if (editItem.metadata) {
        try {
          const metadata = JSON.parse(editItem.metadata);
          setEmail(metadata.email || "");
          setPhone(metadata.phone || "");
          setCompany(metadata.company || "");
          setRole(metadata.role || "");
        } catch (e) {
          // Handle invalid JSON metadata
        }
      }
    }
  }, [editItem, open]);

  const saveContactMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        const response = await fetch(`/api/items/${editItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update contact");
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/items/contact", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: isEdit ? "Contact updated successfully!" : "Contact created successfully!",
        description: isEdit ? "Your contact has been updated." : "Your contact has been saved to your hub.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: isEdit ? "Failed to update contact" : "Failed to create contact",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveContactMutation.mutate({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      role: role.trim() || undefined,
      notes: notes.trim() || undefined,
      tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
    });
  };

  const handleClose = () => {
    if (!isEdit) {
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setRole("");
      setNotes("");
      setTags("");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Job title"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this contact"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="client, work, friend"
            />
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || saveContactMutation.isPending}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              {saveContactMutation.isPending ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Contact" : "Add Contact")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
