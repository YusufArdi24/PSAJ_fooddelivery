import { Plus } from "lucide-react";

interface FoodCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
  quantity?: number;
  onAddToCart: (id: string) => void;
}

const FoodCard = ({
  id,
  name,
  price,
  image,
  available,
  quantity = 0,
  onAddToCart,
}: FoodCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={`food-card ${!available ? "opacity-60 grayscale" : ""}`}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className={available ? "badge-available" : "badge-unavailable"}>
            {available ? "Available" : "Not Available"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-medium text-card-foreground line-clamp-1">{name}</h3>
          <span className="text-sm font-semibold text-primary whitespace-nowrap">
            {formatPrice(price)}
          </span>
        </div>

        {available ? (
          <button
            onClick={() => onAddToCart(id)}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {quantity > 0 ? `Add more (${quantity})` : "Add to cart"}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2.5 bg-muted text-muted-foreground rounded-lg font-medium text-sm cursor-not-allowed"
          >
            Not Available
          </button>
        )}
      </div>
    </div>
  );
};

export default FoodCard;
