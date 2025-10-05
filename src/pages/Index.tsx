import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { DealCard } from "@/components/DealCard";
import { Button } from "@/components/ui/button";
import { Flame, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroBanner from "@/assets/hero-banner.jpg";

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deals, setDeals] = useState<any[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    checkUser();
    fetchDeals();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    filterDeals();
  }, [deals, searchQuery, selectedCategory]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      await checkAdminStatus(session.user.id);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const fetchDeals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch deals",
        variant: "destructive",
      });
    } else {
      setDeals(data || []);
    }
    setLoading(false);
  };

  const filterDeals = () => {
    let filtered = [...deals];

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((deal) => deal.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((deal) =>
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by discount percentage
    filtered.sort((a, b) => {
      const discountA = ((a.original_price - a.discounted_price) / a.original_price) * 100;
      const discountB = ((b.original_price - b.discounted_price) / b.original_price) * 100;
      return discountB - discountA;
    });

    setFilteredDeals(filtered);
  };

  const trendingDeals = deals
    .filter((deal) => deal.is_trending)
    .sort((a, b) => {
      const discountA = ((a.original_price - a.discounted_price) / a.original_price) * 100;
      const discountB = ((b.original_price - b.discounted_price) / b.original_price) * 100;
      return discountB - discountA;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        isAdmin={isAdmin}
        onSearch={setSearchQuery}
        onCategoryChange={setSelectedCategory}
      />

      {/* Hero Banner */}
      <section className="relative h-[300px] overflow-hidden">
        <img
          src={heroBanner}
          alt="Steal Deals India - Best Deals"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/50 flex items-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Steal the Best Deals
            </h1>
            <p className="text-xl text-white/90 mb-6">
              Handpicked deals from Amazon, Flipkart, Myntra & more
            </p>
            <Button variant="deal" size="lg">
              <Sparkles className="mr-2 h-5 w-5" />
              Explore Deals
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Trending Deals */}
        {trendingDeals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Flame className="h-6 w-6 text-deal" />
              <h2 className="text-3xl font-bold">🔥 Trending Deals</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {trendingDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}

        {/* All Deals */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">
              {selectedCategory === "All" ? "All Deals" : `${selectedCategory} Deals`}
            </h2>
            <span className="text-muted-foreground">
              {filteredDeals.length} {filteredDeals.length === 1 ? "deal" : "deals"} found
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading amazing deals...</p>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                No deals found. Try adjusting your filters!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 Steal Deals India. All deals are handpicked and updated regularly.</p>
          <p className="text-sm mt-2">Affiliate links help us keep this service free for everyone.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
