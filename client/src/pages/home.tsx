import { useState } from "react";
import { Plus, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/header";
import { QuickActions } from "@/components/quick-actions";
import { QuickNote } from "@/components/quick-note";
import { FilterTabs } from "@/components/filter-tabs";
import { ItemCard } from "@/components/item-card";
import { UploadModal } from "@/components/upload-modal";
import { NoteModal } from "@/components/note-modal";
import { ContactModal } from "@/components/contact-modal";
import { LinkModal } from "@/components/link-modal";
import { FilterType, Item } from "@/lib/types";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items", searchQuery, activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (activeFilter !== "all") params.append("type", activeFilter);
      
      const response = await fetch(`/api/items?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }
      
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuickActions
          onFileUpload={() => setIsUploadModalOpen(true)}
          onAddNote={() => setIsNoteModalOpen(true)}
          onAddContact={() => setIsContactModalOpen(true)}
          onAddLink={() => setIsLinkModalOpen(true)}
        />

        <div className="mb-6">
          <QuickNote />
        </div>

        <FilterTabs 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? "Try adjusting your search or filters"
                : "Start by uploading a file, creating a note, or adding a contact"
              }
            </p>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
            
            {items.length >= 12 && (
              <div className="text-center">
                <Button variant="outline">Load More Items</Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
        onClick={() => setIsUploadModalOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Modals */}
      <UploadModal 
        open={isUploadModalOpen} 
        onOpenChange={setIsUploadModalOpen} 
      />
      <NoteModal 
        open={isNoteModalOpen} 
        onOpenChange={setIsNoteModalOpen} 
      />
      <ContactModal 
        open={isContactModalOpen} 
        onOpenChange={setIsContactModalOpen} 
      />
      <LinkModal 
        open={isLinkModalOpen} 
        onOpenChange={setIsLinkModalOpen} 
      />
    </div>
  );
}
