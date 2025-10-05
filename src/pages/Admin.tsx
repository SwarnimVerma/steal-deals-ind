import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Pencil, Trash2, Plus } from "lucide-react";
import { z } from "zod";

const categories = ["Mobiles", "Electronics", "Fashion", "Home", "Beauty", "Sports", "Books"];

const dealSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  image_url: z.string().url("Must be a valid URL"),
  original_price: z.number().positive("Price must be positive"),
  discounted_price: z.number().positive("Price must be positive"),
  affiliate_url: z.string().url("Must be a valid URL"),
  category: z.string().min(1, "Category is required"),
});

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<any[]>([]);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    original_price: "",
    discounted_price: "",
    affiliate_url: "",
    category: "",
    is_trending: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchDeals();
    }
  }, [isAdmin]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check if user is admin
    const { data: roleData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const fetchDeals = async () => {
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
      return;
    }

    setDeals(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse and validate form data
      const original_price = parseFloat(formData.original_price);
      const discounted_price = parseFloat(formData.discounted_price);

      const validated = dealSchema.parse({
        title: formData.title,
        image_url: formData.image_url,
        original_price,
        discounted_price,
        affiliate_url: formData.affiliate_url,
        category: formData.category,
      });

      if (validated.discounted_price >= validated.original_price) {
        throw new Error("Discounted price must be less than original price");
      }

      const dealData = {
        title: validated.title,
        image_url: validated.image_url,
        original_price: validated.original_price,
        discounted_price: validated.discounted_price,
        affiliate_url: validated.affiliate_url,
        category: validated.category,
        is_trending: formData.is_trending,
      };

      if (editingDeal) {
        // Update
        const { error } = await supabase
          .from("deals")
          .update(dealData)
          .eq("id", editingDeal.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Deal updated successfully",
        });
      } else {
        // Create
        const { error } = await supabase
          .from("deals")
          .insert([dealData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Deal created successfully",
        });
      }

      // Reset form
      setFormData({
        title: "",
        image_url: "",
        original_price: "",
        discounted_price: "",
        affiliate_url: "",
        category: "",
        is_trending: false,
      });
      setEditingDeal(null);
      fetchDeals();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save deal",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (deal: any) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      image_url: deal.image_url,
      original_price: deal.original_price.toString(),
      discounted_price: deal.discounted_price.toString(),
      affiliate_url: deal.affiliate_url,
      category: deal.category,
      is_trending: deal.is_trending,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;

    const { error } = await supabase
      .from("deals")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete deal",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Deal deleted successfully",
    });
    fetchDeals();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} isAdmin={isAdmin} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingDeal ? "Edit Deal" : "Add New Deal"}
              </CardTitle>
              <CardDescription>
                {editingDeal ? "Update the deal details" : "Fill in the details to create a new deal"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Amazing Product Name"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="original_price">Original Price (₹)</Label>
                    <Input
                      id="original_price"
                      type="number"
                      step="0.01"
                      value={formData.original_price}
                      onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                      placeholder="999"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discounted_price">Discounted Price (₹)</Label>
                    <Input
                      id="discounted_price"
                      type="number"
                      step="0.01"
                      value={formData.discounted_price}
                      onChange={(e) => setFormData({ ...formData, discounted_price: e.target.value })}
                      placeholder="499"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliate_url">Affiliate URL</Label>
                  <Input
                    id="affiliate_url"
                    type="url"
                    value={formData.affiliate_url}
                    onChange={(e) => setFormData({ ...formData, affiliate_url: e.target.value })}
                    placeholder="https://affiliate-link.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_trending">Mark as Trending</Label>
                  <Switch
                    id="is_trending"
                    checked={formData.is_trending}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_trending: checked })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Saving..." : editingDeal ? "Update Deal" : "Add Deal"}
                  </Button>
                  {editingDeal && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingDeal(null);
                        setFormData({
                          title: "",
                          image_url: "",
                          original_price: "",
                          discounted_price: "",
                          affiliate_url: "",
                          category: "",
                          is_trending: false,
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Deals List */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Deals ({deals.length})</CardTitle>
              <CardDescription>Manage your product deals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No deals yet. Add your first deal!
                        </TableCell>
                      </TableRow>
                    ) : (
                      deals.map((deal) => (
                        <TableRow key={deal.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {deal.title}
                          </TableCell>
                          <TableCell>{deal.category}</TableCell>
                          <TableCell>₹{deal.discounted_price}</TableCell>
                          <TableCell>{deal.clicks}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(deal)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(deal.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
