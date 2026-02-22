import { Plus, Tag } from "lucide-react";

interface FoodCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
  quantity?: number;
  onAddToCart: (id: string) => void;
  description?: string;
  // Promo props
  hasPromo?: boolean;
  originalPrice?: number;
  discountedPrice?: number;
  formattedDiscount?: string;
}

const FoodCard = ({
  id,
  name,
  price,
  image,
  available,
  quantity = 0,
  onAddToCart,
  description,
  hasPromo = false,
  originalPrice,
  discountedPrice,
  formattedDiscount,
}: FoodCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const displayPrice = hasPromo && discountedPrice ? discountedPrice : price;

  return (
    <div className={`food-card ${!available ? "opacity-60 grayscale" : ""}`}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <span className={`${available ? "badge-available" : "badge-unavailable"} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5`}>
            {available ? "Tersedia" : "Tidak Tersedia"}
          </span>
          {hasPromo && available && formattedDiscount && (
            <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow-lg flex items-center gap-1">
              <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {formattedDiscount}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-2 sm:p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-1 sm:gap-2 mb-2 sm:mb-3 min-h-[2rem] sm:min-h-[2.5rem]">
          <h3 className="font-semibold text-card-foreground line-clamp-2 text-xs sm:text-sm leading-tight">{name}</h3>
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            {hasPromo && originalPrice ? (
              <>
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through whitespace-nowrap">
                  {formatPrice(originalPrice)}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-red-600 whitespace-nowrap">
                  {formatPrice(displayPrice)}
                </span>
              </>
            ) : (
              <span className="text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">
                {formatPrice(displayPrice)}
              </span>
            )}
          </div>
        </div>

        {description && (
          <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mb-2 sm:mb-3 leading-relaxed">{description}</p>
        )}

        <div className="mt-auto">
        {available ? (
          <button
            onClick={() => onAddToCart(id)}
            className="w-full flex items-center justify-center gap-1 sm:gap-2 bg-primary text-primary-foreground py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            {quantity > 0 ? `${quantity}` : "Tambah"}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2 sm:py-2.5 bg-muted text-muted-foreground rounded-lg font-medium text-xs sm:text-sm cursor-not-allowed"
          >
            Tidak Tersedia
          </button>
        )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
