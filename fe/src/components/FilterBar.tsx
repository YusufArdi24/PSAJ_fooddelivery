import { Search } from "lucide-react";

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories?: string[];
}

const FilterBar = ({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  categories = ["all"],
}: FilterBarProps) => {
  // Convert categories to filter format
  const filters = categories.map((category) => {
    if (category === "all") {
      return { id: "all", label: "Semua", count: null };
    }
    
    // Map category names to display labels
    const labelMap: { [key: string]: string } = {
      "makanan": "Makanan",
      "minuman": "Minuman", 
      "lainnya": "Lainnya",
      "snack": "Snack",
      "dessert": "Dessert",
    };
    
    return {
      id: category,
      label: labelMap[category] || category.charAt(0).toUpperCase() + category.slice(1),
      count: null, // We can add count logic later if needed
    };
  });

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border py-3 sm:py-4 mb-3 sm:mb-6">
      <div className="flex flex-col gap-3 px-3 sm:px-6">
        {/* Search bar - full width on mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
          />
        </div>

        {/* Category filters - scrollable */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`filter-chip whitespace-nowrap flex-shrink-0 text-xs sm:text-sm ${
                activeFilter === filter.id
                  ? "filter-chip-active"
                  : "filter-chip-inactive"
              }`}
            >
              {filter.label}
              {filter.count && (
                <span className="ml-1.5 text-xs opacity-70">{filter.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
