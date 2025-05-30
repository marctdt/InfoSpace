import { useState } from "react";
import { Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-xl font-semibold">InfoHub</h1>
          </div>
          
          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search files, notes, contacts..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-muted border-border"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-4 animate-in">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search files, notes, contacts..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
