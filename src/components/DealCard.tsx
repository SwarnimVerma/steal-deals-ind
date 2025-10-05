import { ExternalLink, TrendingUp, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Deal {
  id: string;
  title: string;
  image_url: string;
  original_price: number;
  discounted_price: number;
  affiliate_url: string;
  category: string;
  is_trending: boolean;
  clicks: number;
}

interface DealCardProps {
  deal: Deal;
}

export const DealCard = ({ deal }: DealCardProps) => {
  const { toast } = useToast();
  const [clicks, setClicks] = useState<number>(deal.clicks);

  const discountPercentage = Math.round(
    ((deal.original_price - deal.discounted_price) / deal.original_price) * 100
  );

  const handleBuyNow = async () => {
    try {
      // Call RPC to increment clicks in Supabase
      const { error } = await supabase
        .rpc<any>("increment_deal_clicks", { deal_id: deal.id });

      if (error) throw error;

      // Update local state immediately
      setClicks(prev => prev + 1);

      // Open affiliate link
      window.open(deal.affiliate_url, "_blank", "noopener,noreferrer");

      toast({
        title: "Redirecting...",
        description: "Opening deal in new tab",
      });
    } catch (err) {
      console.error("Failed to update click count:", err);
      toast({
        title: "Error",
        description: "Could not update click count",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="deal-card bg-card rounded-lg overflow-hidden border group">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={deal.image_url}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {deal.is_trending && (
            <Badge variant="destructive" className="badge-pulse bg-deal text-deal-foreground border-0">
              <Flame className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          )}
          {discountPercentage >= 50 && (
            <Badge variant="default" className="bg-primary text-primary-foreground">
              {discountPercentage}% OFF
            </Badge>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-card/90 backdrop-blur">
            {deal.category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold line-clamp-2 text-card-foreground min-h-[3rem]">
          {deal.title}
        </h3>

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-deal">
            ₹{deal.discounted_price.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground line-through">
            ₹{deal.original_price.toLocaleString()}
          </span>
          <span className="text-sm font-semibold text-primary ml-auto">
            {discountPercentage}% off
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3 mr-1" />
          {clicks} people grabbed this deal
        </div>

        {/* Buy Button */}
        <Button 
          onClick={handleBuyNow}
          variant="deal" 
          className="w-full"
          size="lg"
        >
          Buy Now
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
