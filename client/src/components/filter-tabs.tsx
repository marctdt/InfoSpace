import { Button } from "@/components/ui/button";
import { FilterType } from "@/lib/types";

interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Items' },
  { value: 'file', label: 'Files' },
  { value: 'note', label: 'Notes' },
  { value: 'contact', label: 'Contacts' },
  { value: 'link', label: 'Links' },
];

export function FilterTabs({ activeFilter, onFilterChange }: FilterTabsProps) {
  return (
    <div className="mb-6">
      <div className="flex space-x-1 bg-card rounded-lg p-1 border border-border">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? "default" : "ghost"}
            className={`flex-1 text-sm font-medium ${
              activeFilter === filter.value 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted"
            }`}
            onClick={() => onFilterChange(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
