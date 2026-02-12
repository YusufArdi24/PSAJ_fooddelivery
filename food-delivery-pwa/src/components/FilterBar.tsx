import { Search } from "lucide-react";

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const FilterBar = ({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: FilterBarProps) => {
  const filters = [
    { id: "all", label: "All", count: null },
    { id: "makanan", label: "Makanan", count: 8 },
    { id: "minuman", label: "Minuman", count: 2 },
    { id: "kebutuhan-rumah-tangga", label: "Rumah Tangga", count: 3 },
  ];

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border py-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Dish Menu</span>
          <div className="flex items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={`filter-chip ${
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

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Menu..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-48 pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
