import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Filter, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useCart } from "../context/CartContext";
import { apiClient } from "../lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const DIETARY_TAGS = [
  {
    key: "veg",
    label: "Veg",
    color: "bg-green-100 text-green-800 border-green-300",
    activeColor: "bg-green-600 text-white border-green-600",
    test: (ingredients) => {
      const animal = ["milk", "cream", "butter", "egg", "eggs", "honey", "cheese", "yogurt", "meat", "chicken", "beef", "fish"];
      const lower = ingredients.map((item) => item.toLowerCase());
      return !animal.some((entry) => lower.some((value) => value.includes(entry)));
    },
  },
  {
    key: "non-veg",
    label: "Non-Veg",
    color: "bg-red-100 text-red-800 border-red-300",
    activeColor: "bg-red-600 text-white border-red-600",
    test: (ingredients) => {
      const animal = ["milk", "cream", "butter", "egg", "eggs", "honey", "cheese", "yogurt", "meat", "chicken", "beef", "fish"];
      const lower = ingredients.map((item) => item.toLowerCase());
      return animal.some((entry) => lower.some((value) => value.includes(entry)));
    },
  },
  {
    key: "vegan",
    label: "Vegan",
    color: "bg-green-100 text-green-800 border-green-300",
    activeColor: "bg-green-600 text-white border-green-600",
    test: (ingredients) => {
      const animal = ["milk", "cream", "butter", "egg", "eggs", "honey", "cheese", "yogurt", "meat", "chicken", "beef", "fish"];
      const lower = ingredients.map((item) => item.toLowerCase());
      return !animal.some((entry) => lower.some((value) => value.includes(entry)));
    },
  },
  {
    key: "gluten-free",
    label: "Gluten-Free",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    activeColor: "bg-yellow-500 text-white border-yellow-500",
    test: (ingredients) => {
      const gluten = ["flour", "wheat", "barley", "rye", "oat", "bread", "sourdough", "yeast"];
      const lower = ingredients.map((item) => item.toLowerCase());
      return !gluten.some((entry) => lower.some((value) => value.includes(entry)));
    },
  },
  {
    key: "nut-free",
    label: "Nut-Free",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    activeColor: "bg-orange-500 text-white border-orange-500",
    test: (ingredients) => {
      const nuts = ["almond", "walnut", "cashew", "pecan", "hazelnut", "peanut", "nut", "pistachio"];
      const lower = ingredients.map((item) => item.toLowerCase());
      return !nuts.some((entry) => lower.some((value) => value.includes(entry)));
    },
  },
  {
    key: "caffeine-free",
    label: "Caffeine-Free",
    color: "bg-sky-100 text-sky-800 border-sky-300",
    activeColor: "bg-sky-600 text-white border-sky-600",
    test: (ingredients) => {
      const caffeinated = ["espresso", "coffee", "matcha", "tea", "caffeine"];
      const lower = ingredients.map((item) => item.toLowerCase());
      return !caffeinated.some((entry) => lower.some((value) => value.includes(entry)));
    },
  },
];

const getItemTags = (item) => {
  let tags = [];
  if (item.tags && item.tags.length > 0) {
    tags = item.tags;
  } else {
    tags = DIETARY_TAGS.filter((tag) => tag.test(item.ingredients || [])).map((tag) => tag.key);
  }
  return tags.filter(t => !t.toLowerCase().includes("bestseller"));
};

const formatPrice = (price) => `Rs ${Number(price || 0).toFixed(2)}`;

const getCategoryGroups = (items, categoriesList) => {
  const grouped = {};
  categoriesList.forEach((cat) => {
    grouped[cat] = [];
  });

  items.forEach((item) => {
    const itemCats = (item.category || "").split(",").map((c) => c.trim());
    itemCats.forEach((c) => {
      // Find proper cased category name from categoriesList or use as is
      const canonical = categoriesList.find((cal) => cal.toLowerCase() === c.toLowerCase()) || c;
      if (!grouped[canonical]) grouped[canonical] = [];
      grouped[canonical].push(item);
    });
  });

  return Object.keys(grouped)
    .filter((cat) => grouped[cat].length > 0)
    .sort((left, right) => {
      const leftIndex = categoriesList.indexOf(left);
      const rightIndex = categoriesList.indexOf(right);
      const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
      return normalizedLeft - normalizedRight || left.localeCompare(right);
    })
    .map((category) => ({
      category,
      items: grouped[category].sort(
        (left, right) => Number(left.available === false) - Number(right.available === false)
      ),
    }));
};

export const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, setTableNumber, getTotal, getItemCount, cart, updateQuantity, removeFromCart } = useCart();
  const cartCount = getItemCount();
  const cartTotal = getTotal();
  const [searchParams] = useSearchParams();
  const refreshTimerRef = useRef(null);

  const tableParam = searchParams.get("table");

  useEffect(() => {
    if (tableParam) {
      setTableNumber(tableParam);
    }
  }, [setTableNumber, tableParam]);

  const fetchMenu = useCallback(async () => {
    try {
      const response = await apiClient.get("/menu/items");
      setMenuItems(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get("/menu/categories");
      setCategories(response.data.categories || []);
    } catch {
      console.error("Failed to load categories");
    }
  }, []);

  const fetchTopItems = useCallback(async () => {
    try {
      const response = await apiClient.get("/menu/top-items");
      setTopItems(response.data.top_items || []);
    } catch {
      console.error("Failed to load top items");
    }
  }, []);

  const filterItems = useCallback(() => {
    let filtered = [...menuItems];

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => {
        const itemCats = (item.category || "").split(",").map(c => c.trim().toLowerCase());
        return itemCats.includes(selectedCategory.toLowerCase());
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      );
    }

    if (activeTags.length > 0) {
      filtered = filtered.filter((item) => {
        const itemTags = getItemTags(item);
        return activeTags.every((tag) => itemTags.includes(tag));
      });
    }

    setFilteredItems(filtered);
  }, [activeTags, menuItems, searchQuery, selectedCategory, topItems]);

  useEffect(() => {
    fetchMenu();
    fetchCategories();
    fetchTopItems();
  }, [fetchCategories, fetchMenu, fetchTopItems]);

  useEffect(() => {
    let isActive = true;

    const pollMenu = async () => {
      if (!isActive) return;
      await fetchMenu();
      if (isActive) {
        refreshTimerRef.current = setTimeout(pollMenu, 5000);
      }
    };

    // Start polling
    refreshTimerRef.current = setTimeout(pollMenu, 5000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMenu();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchMenu]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  const toggleTag = (tagKey) => {
    setActiveTags((currentTags) =>
      currentTags.includes(tagKey)
        ? currentTags.filter((tag) => tag !== tagKey)
        : [...currentTags, tagKey],
    );
  };

  const handleAddToCart = (item) => {
    if (!item.available) {
      toast.error(`${item.name} is currently out of stock`);
      return;
    }

    addToCart(item);
    toast.success(`${item.name} added to cart`);
  };

  const groupedItems = getCategoryGroups(filteredItems, categories);
  
  const mobileGroupedItems = [...groupedItems];

  const displayCategories = categories;

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#f5f3ec_100%)] pt-[64px] pb-16 md:pt-20 md:px-8">
      <div className="mx-auto max-w-7xl">
        {tableParam && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-4 mt-2 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary md:mx-0 md:mb-6"
          >
            <MapPin className="h-4 w-4 shrink-0" />
            Ordering for <span className="font-bold">Table {tableParam}</span>. Your order will be brought to your table.
          </motion.div>
        )}

        <div className="md:hidden">
          <div className="sticky top-[55px] z-20 border-b border-black/5 bg-[#fffdf8] px-3 pb-2 pt-2 shadow-sm">
            
            {/* Search and Filter Inline */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-10 rounded-[10px] border-slate-200 bg-white pl-8 text-[13px] shadow-sm focus-visible:ring-0"
                />
              </div>
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center justify-center shrink-0 w-10 h-10 rounded-[10px] border border-slate-200 bg-white text-slate-700 shadow-sm relative transition active:scale-95"
              >
                <Filter className="h-4 w-4" />
                {activeTags.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                    {activeTags.length}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  selectedCategory === "all"
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                All
              </button>
              {displayCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                    selectedCategory === category
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {mobileGroupedItems.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">No items found</p>
            </div>
          ) : (
            <div className="px-3 pb-24">
              {mobileGroupedItems.map((group, groupIndex) => (
                <section key={group.category} className="mb-4">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.04 }}
                    className="pt-4 pb-1"
                  >
                    <h2 className="inline-block px-4 py-1.5 bg-rose-100 text-rose-900 rounded-xl text-[16px] font-black tracking-tight mb-2">
                      {group.category}
                    </h2>
                  </motion.div>

                  <div className="flex flex-col">
                    {group.items.map((item, index) => {
                      const itemTags = getItemTags(item);
                      const isUnavailable = item.available === false;
                      const cartItem = cart.find(i => i.id === item.id);
                      const quantity = cartItem ? cartItem.quantity : 0;
                      return (
                        <motion.div
                          key={`${group.category}-${item.id}`}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ delay: index * 0.03, type: "spring", stiffness: 400, damping: 25 }}
                          className="py-4 border-b border-slate-100 last:border-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 pr-1">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                {isUnavailable && (
                                  <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                                    Out of Stock
                                  </span>
                                )}
                              </div>

                              <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
                                {item.name}
                              </h3>
                              <p className="mt-0.5 text-[13px] font-semibold text-slate-700">
                                {formatPrice(item.price)}
                              </p>
                              <p className="mt-1 text-[11px] leading-[1.35] text-slate-500 line-clamp-2 pr-2">
                                {item.description}
                              </p>
                              
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {itemTags.map((tagKey) => {
                                  const tag = DIETARY_TAGS.find((entry) => entry.key === tagKey);
                                  // For mobile, make tags visually smaller
                                  return (
                                    <span
                                      key={tagKey}
                                      className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${tag?.color || "bg-slate-50 text-slate-600 border-slate-200"}`}
                                    >
                                      {tag?.label || tagKey}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="w-[100px] shrink-0">
                              <div className="relative w-full aspect-square">
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className={`h-full w-full rounded-[10px] object-cover shadow-sm ${
                                    isUnavailable ? "grayscale opacity-60" : ""
                                  }`}
                                />
                                <div className="absolute -bottom-3 left-1/2 w-max -translate-x-1/2">
                                  {quantity === 0 ? (
                                    <motion.div whileTap={{ scale: 0.9 }}>
                                      <Button
                                        onClick={() => handleAddToCart(item)}
                                        disabled={isUnavailable}
                                        className={`h-8 px-5 rounded-[8px] text-[12px] font-bold uppercase shadow-sm transition-all ${
                                          isUnavailable
                                            ? "bg-slate-200 text-slate-500"
                                            : "bg-white text-rose-600 border border-slate-200 hover:bg-slate-50"
                                        }`}
                                      >
                                        {isUnavailable ? "WAIT" : "ADD"}
                                      </Button>
                                    </motion.div>
                                  ) : (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="flex items-center justify-between h-8 px-1 rounded-[8px] bg-rose-50 border border-rose-200 shadow-sm w-[80px]"
                                    >
                                      <motion.button 
                                        whileTap={{ scale: 0.8 }} 
                                        onClick={() => updateQuantity(item.id, quantity - 1)} 
                                        className="text-rose-600 font-bold w-7 h-full flex items-center justify-center text-base"
                                      >
                                        −
                                      </motion.button>
                                      <span className="text-rose-700 font-bold text-xs">{quantity}</span>
                                      <motion.button 
                                        whileTap={{ scale: 0.8 }} 
                                        onClick={() => updateQuantity(item.id, quantity + 1)} 
                                        className="text-rose-600 font-bold w-7 h-full flex items-center justify-center text-base"
                                      >
                                        +
                                      </motion.button>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block px-0">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/60">
              Handcrafted Selection
            </p>
            <h1 className="mt-3 text-5xl font-heading font-bold text-primary">
              Our Menu
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
              Handcrafted beverages and freshly baked goods, curated for slow cafe moments and quick cravings alike.
            </p>
          </div>

          <div className="mb-5 flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 rounded-xl bg-white pl-10 text-base"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-12 w-full rounded-xl bg-white text-base lg:w-56">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {displayCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-10 flex flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => {
              const isActive = activeTags.includes(tag.key);
              return (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() => toggleTag(tag.key)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? tag.activeColor : tag.color
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
            {activeTags.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTags([])}
                className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100"
              >
                Clear
              </button>
            )}
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg text-muted-foreground">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item, index) => {
                const itemTags = getItemTags(item);
                const isUnavailable = item.available === false;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.4 }}
                    className="group overflow-hidden rounded-[30px] border border-border/50 bg-white shadow-[0_22px_60px_rgba(46,31,13,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25"
                  >
                    <div className="relative h-60 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className={`h-full w-full object-cover transition-transform duration-500 ${
                          isUnavailable ? "grayscale opacity-75" : "group-hover:scale-105"
                        }`}
                      />
                      <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                        {formatPrice(item.price)}
                      </div>
                      {isUnavailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <span className="rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-amber-700">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        {item.category}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-primary">
                        {item.name}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {itemTags.map((tagKey) => {
                          const tag = DIETARY_TAGS.find((entry) => entry.key === tagKey);
                          return (
                            <span
                              key={tagKey}
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tag?.color || "bg-muted text-slate-600 border-border"}`}
                            >
                              {tag?.label || tagKey}
                            </span>
                          );
                        })}
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                          <p>{item.calories} cal</p>
                          <p className="mt-1 line-clamp-1">{(item.ingredients || []).join(", ")}</p>
                        </div>
                        <Button
                          onClick={() => handleAddToCart(item)}
                          disabled={isUnavailable}
                          className="h-11 rounded-full px-6 text-sm font-semibold"
                        >
                          {isUnavailable ? "Currently Unavailable" : "Add to Cart"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Zomato-style sticky cart bottom bar for mobile */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white px-4 py-4 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] border-t border-slate-100">
          <div 
            onClick={() => window.location.href='/cart'}
            className="bg-[#E23744] hover:bg-[#D42B38] rounded-xl px-5 py-3.5 flex items-center justify-between text-white shadow-xl cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/90 mb-0.5">
                {cartCount} ITEM{cartCount > 1 ? 'S' : ''} ADDED
              </span>
              <span className="text-[15px] font-bold tracking-tight">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-[15px] tracking-wide">
              Next <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsFilterModalOpen(false)}
          />
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white px-5 pb-8 pt-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight text-slate-900">Filters</h2>
              <button 
                onClick={() => setIsFilterModalOpen(false)} 
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition active:scale-90"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Dietary Preferences</h3>
              {DIETARY_TAGS.map((tag) => {
                const isActive = activeTags.includes(tag.key);
                return (
                  <label 
                    key={tag.key} 
                    onClick={() => toggleTag(tag.key)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3.5 transition active:scale-[0.98] cursor-pointer ${
                      isActive ? "border-rose-500 bg-rose-50" : "border-slate-100 bg-white"
                    }`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                      isActive ? "border-rose-500 bg-rose-500 text-white" : "border-slate-300 bg-white"
                    }`}>
                      {isActive && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-[15px] font-bold ${isActive ? "text-rose-700" : "text-slate-700"}`}>
                      {tag.label}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl h-12 text-[15px] font-bold border-2 border-slate-200"
                onClick={() => { setActiveTags([]); setIsFilterModalOpen(false); }}
              >
                Clear All
              </Button>
              <Button 
                className="flex-[2] rounded-xl bg-primary text-primary-foreground h-12 text-[15px] font-bold shadow-md shadow-primary/20"
                onClick={() => setIsFilterModalOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
