import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Search, Filter, MapPin } from "lucide-react";
import { Input } from "../components/ui/input";
import { apiClient } from "../lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

/* ── Dietary tag definitions ─────────────────────────── */
const DIETARY_TAGS = [
  {
    key: "vegan",
    label: "🌱 Vegan",
    color: "bg-green-100 text-green-800 border-green-300",
    activeColor: "bg-green-600 text-white border-green-600",
    // an item is vegan if it has NO animal-sourced ingredients
    test: (ingredients) => {
      const animal = ["milk", "cream", "butter", "egg", "eggs", "honey", "cheese", "yogurt", "meat", "chicken", "beef", "fish"];
      const lower = ingredients.map((i) => i.toLowerCase());
      return !animal.some((a) => lower.some((l) => l.includes(a)));
    },
  },
  {
    key: "gluten-free",
    label: "🌾 Gluten-Free",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    activeColor: "bg-yellow-500 text-white border-yellow-500",
    test: (ingredients) => {
      const gluten = ["flour", "wheat", "barley", "rye", "oat", "bread", "sourdough", "yeast"];
      const lower = ingredients.map((i) => i.toLowerCase());
      return !gluten.some((g) => lower.some((l) => l.includes(g)));
    },
  },
  {
    key: "nut-free",
    label: "🥜 Nut-Free",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    activeColor: "bg-orange-500 text-white border-orange-500",
    test: (ingredients) => {
      const nuts = ["almond", "walnut", "cashew", "pecan", "hazelnut", "peanut", "nut", "pistachio"];
      const lower = ingredients.map((i) => i.toLowerCase());
      return !nuts.some((n) => lower.some((l) => l.includes(n)));
    },
  },
  {
    key: "caffeine-free",
    label: "☕ Caffeine-Free",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    activeColor: "bg-purple-600 text-white border-purple-600",
    test: (ingredients) => {
      const caffeinated = ["espresso", "coffee", "matcha", "tea", "caffeine"];
      const lower = ingredients.map((i) => i.toLowerCase());
      return !caffeinated.some((c) => lower.some((l) => l.includes(c)));
    },
  },
];

/* Get list of tag keys that apply to an item — prefers stored tags, falls back to ingredient inference */
const getItemTags = (item) => {
  // If the item has explicitly stored tags (set by admin), use those
  if (item.tags && item.tags.length > 0) return item.tags;
  // Legacy fallback: infer from ingredients
  return DIETARY_TAGS.filter((t) => t.test(item.ingredients || [])).map((t) => t.key);
};

export const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, setTableNumber } = useCart();
  const [searchParams] = useSearchParams();
  const refreshTimerRef = useRef(null);

  /* ── Read ?table=N from URL ─────────────────────────── */
  const tableParam = searchParams.get("table");
  useEffect(() => {
    if (tableParam) {
      setTableNumber(tableParam);
    }
  }, [tableParam, setTableNumber]);

  const fetchMenu = useCallback(async () => {
    try {
      const response = await apiClient.get("/menu/items");
      setMenuItems(response.data);
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get("/menu/categories");
      setCategories(response.data.categories);
    } catch {
      console.error("Failed to load categories");
    }
  }, []);

  const filterItems = useCallback(() => {
    let filtered = menuItems;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (activeTags.length > 0) {
      filtered = filtered.filter((item) => {
        const itemTags = getItemTags(item);
        return activeTags.every((tag) => itemTags.includes(tag));
      });
    }

    setFilteredItems(filtered);
  }, [menuItems, searchQuery, selectedCategory, activeTags]);

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, [fetchMenu, fetchCategories]);

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      fetchMenu();
    }, 5000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMenu();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchMenu]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  const toggleTag = (tagKey) => {
    setActiveTags((prev) =>
      prev.includes(tagKey) ? prev.filter((t) => t !== tagKey) : [...prev, tagKey],
    );
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    toast.success(`${item.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 md:px-12">
      <div className="max-w-7xl mx-auto">

        {/* ── Table Banner (QR scan) ── */}
        {tableParam && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-primary font-medium text-sm"
          >
            <MapPin className="w-4 h-4 shrink-0" />
            Ordering for <span className="font-bold">Table {tableParam}</span> — your order will be brought to your table.
          </motion.div>
        )}

        {/* ── Hero ── */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-primary mb-3">
            Our Menu
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Handcrafted beverages and freshly baked goods
          </p>
        </div>

        {/* ── Search + Category ── */}
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 h-11 sm:h-12 rounded-lg text-sm sm:text-base"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48 h-11 sm:h-12 rounded-lg text-sm sm:text-base">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Dietary Filter Pills ── */}
        <div className="flex flex-wrap gap-2 mb-8 sm:mb-10">
          {DIETARY_TAGS.map((tag) => {
            const isActive = activeTags.includes(tag.key);
            return (
              <button
                key={tag.key}
                onClick={() => toggleTag(tag.key)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-200 ${
                  isActive ? tag.activeColor : tag.color
                }`}
              >
                {tag.label}
              </button>
            );
          })}
          {activeTags.length > 0 && (
            <button
              onClick={() => setActiveTags([])}
              className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-gray-300 text-gray-500 hover:bg-gray-100 transition-all duration-200"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* ── Grid ── */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm sm:text-lg text-muted-foreground">
              No items found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {filteredItems.map((item, idx) => {
              const itemTags = getItemTags(item);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                  className="
                    group relative overflow-hidden rounded-xl
                    bg-white border border-border/50
                    hover:border-primary/20 hover:shadow-lg
                    transition-all duration-300
                  "
                >
                  {/* IMAGE */}
                  <div className="relative h-36 sm:h-56 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-primary text-primary-foreground px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-sm font-medium">
                      ₹{item.price.toFixed(2)}
                    </div>

                    {/* Dietary badge pills on image */}
                    {itemTags.length > 0 && (
                      <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                        {itemTags.map((key) => {
                          const tag = DIETARY_TAGS.find((t) => t.key === key);
                          return (
                            <span
                              key={key}
                              className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full border backdrop-blur-sm ${tag.color}`}
                            >
                              {tag.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-3 sm:p-6">
                    <span className="text-[10px] sm:text-xs uppercase tracking-wider text-accent font-medium">
                      {item.category}
                    </span>

                    <h3 className="text-base sm:text-xl font-heading font-semibold text-primary mt-1">
                      {item.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-2 sm:mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-4">
                      <span>{item.calories} cal</span>
                      <span>•</span>
                      <span className="line-clamp-1">{(item.ingredients || []).join(", ")}</span>
                    </div>

                    <Button
                      onClick={() => handleAddToCart(item)}
                      className="
                        w-full rounded-full
                        h-9 sm:h-11
                        text-xs sm:text-base
                        bg-primary text-primary-foreground
                        hover:bg-primary/90
                        transition-all
                        active:scale-95
                      "
                    >
                      Add to Cart
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
