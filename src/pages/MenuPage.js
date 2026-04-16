import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Filter, MapPin, Search, ShoppingCart, Plus, Minus, X, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useCart } from "../context/CartContext";
import { apiClient } from "../lib/api";

const DIETARY_TAGS = [
  {
    key: "veg",
    label: "Veg",
    emoji: "🟢",
    color: "bg-green-50 text-green-800 border-green-200",
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
    emoji: "🔴",
    color: "bg-red-50 text-red-800 border-red-200",
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
    emoji: "🌱",
    color: "bg-green-50 text-green-800 border-green-200",
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
    emoji: "🌾",
    color: "bg-yellow-50 text-yellow-800 border-yellow-200",
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
    emoji: "🥜",
    color: "bg-orange-50 text-orange-800 border-orange-200",
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
    emoji: "☕",
    color: "bg-sky-50 text-sky-800 border-sky-200",
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

// ─── Desktop Item Row Card ────────────────────────────────────────────────────
const DesktopItemRow = ({ item, onAdd, onUpdateQty, quantity }) => {
  const isUnavailable = item.available === false;
  const itemTags = getItemTags(item);

  return (
    <div
      className={`group flex items-center gap-5 rounded-2xl border bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20 ${
        isUnavailable ? "opacity-60" : ""
      }`}
    >
      {/* Image */}
      <div className="relative shrink-0 w-[110px] h-[110px] rounded-xl overflow-hidden">
        <img
          src={item.image_url}
          alt={item.name}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isUnavailable ? "grayscale" : ""
          }`}
        />
        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-slate-900 leading-snug">{item.name}</h3>
            <p className="mt-0.5 text-[13px] font-semibold text-accent">{formatPrice(item.price)}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500 line-clamp-2">{item.description}</p>
            {item.calories && (
              <p className="mt-1 text-[11px] text-slate-400">{item.calories} cal</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {itemTags.map((tagKey) => {
                const tag = DIETARY_TAGS.find((entry) => entry.key === tagKey);
                return (
                  <span
                    key={tagKey}
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tag?.color || "bg-slate-50 text-slate-600 border-slate-200"}`}
                  >
                    {tag?.emoji} {tag?.label || tagKey}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Cart Controls */}
          <div className="shrink-0">
            {quantity === 0 ? (
              <button
                onClick={() => onAdd(item)}
                disabled={isUnavailable}
                className={`flex items-center gap-1.5 rounded-xl border-2 px-4 h-10 text-[13px] font-bold transition-colors ${
                  isUnavailable
                    ? "border-slate-200 text-slate-400 cursor-not-allowed"
                    : "border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-md"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                ADD
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 px-2 h-10">
                <button
                  onClick={() => onUpdateQty(item.id, quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-primary hover:bg-primary hover:text-white transition-colors shadow-sm font-bold"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-[14px] font-bold text-primary">{quantity}</span>
                <button
                  onClick={() => onUpdateQty(item.id, quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm font-bold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Desktop Cart Panel ───────────────────────────────────────────────────────
const DesktopCartPanel = ({ cart, getTotal, getItemCount, updateQuantity, removeFromCart, tableNumber }) => {
  const navigate = useNavigate();
  const cartCount = getItemCount();
  const cartTotal = getTotal();

  if (cartCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <ShoppingCart className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Your cart is empty</p>
        <p className="text-xs text-slate-400 mt-1">Add items from the menu to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[calc(100vh-360px)] scrollbar-hide">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-slate-800 leading-tight line-clamp-1">{item.name}</p>
              <p className="text-[11px] text-accent font-semibold mt-0.5">{formatPrice(item.price * item.quantity)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-primary hover:text-primary transition-colors"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="w-5 text-center text-[12px] font-bold text-slate-800">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
        <div className="flex justify-between text-[12px] text-slate-500">
          <span>Subtotal ({cartCount} item{cartCount > 1 ? "s" : ""})</span>
          <span className="font-semibold text-slate-700">{formatPrice(cartTotal)}</span>
        </div>
        {tableNumber && (
          <div className="flex items-center gap-1.5 text-[11px] text-primary bg-primary/8 rounded-lg px-2.5 py-1.5">
            <MapPin className="w-3 h-3" />
            <span className="font-semibold">Table {tableNumber}</span>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate("/cart")}
        className="mt-4 w-full rounded-xl bg-primary py-3 text-[13px] font-bold text-white flex items-center justify-between px-4 hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
      >
        <span>View Full Cart</span>
        <div className="flex items-center gap-1.5">
          <span>{formatPrice(cartTotal)}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
};

// ─── Main MenuPage ────────────────────────────────────────────────────────────
export const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const { addToCart, setTableNumber, getTotal, getItemCount, cart, updateQuantity, removeFromCart } = useCart();
  const cartCount = getItemCount();
  const cartTotal = getTotal();
  const [searchParams] = useSearchParams();
  const refreshTimerRef = useRef(null);
  const sectionRefs = useRef({});
  const contentRef = useRef(null);

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
  }, [activeTags, menuItems, searchQuery, selectedCategory]);

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, [fetchCategories, fetchMenu]);

  useEffect(() => {
    let isActive = true;
    const pollMenu = async () => {
      if (!isActive) return;
      await fetchMenu();
      if (isActive) {
        refreshTimerRef.current = setTimeout(pollMenu, 5000);
      }
    };
    refreshTimerRef.current = setTimeout(pollMenu, 5000);
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchMenu();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      isActive = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchMenu]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  // Track active section while scrolling (desktop)
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollTop = container.scrollTop + 120;
      let currentSection = null;
      Object.entries(sectionRefs.current).forEach(([cat, el]) => {
        if (el && el.offsetTop <= scrollTop) {
          currentSection = cat;
        }
      });
      if (currentSection) setActiveSection(currentSection);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [filteredItems]);

  const scrollToCategory = (category) => {
    if (category === "all") {
      const container = contentRef.current;
      if (container) container.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSection(null);
      setSelectedCategory("all");
      return;
    }
    setSelectedCategory(category);
    setActiveSection(category);
    const el = sectionRefs.current[category];
    const container = contentRef.current;
    if (el && container) {
      container.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
    }
  };

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

  const groupedItems = useMemo(
    () => getCategoryGroups(filteredItems, categories),
    [filteredItems, categories]
  );
  const mobileGroupedItems = groupedItems;
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#f5f3ec_100%)] pt-[64px] md:pt-[80px]">

      {/* ═══ MOBILE LAYOUT ═══════════════════════════════════════════════════ */}
      <div className="md:hidden">
        <div className="sticky top-[55px] z-20 border-b border-black/5 bg-[#fffdf8] px-3 pb-2 pt-2 shadow-sm">
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

        {tableParam && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-3 mb-2 mt-2 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
          >
            <MapPin className="h-4 w-4 shrink-0" />
            Ordering for <span className="font-bold">Table {tableParam}</span>. Your order will be brought to your table.
          </motion.div>
        )}

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
                            <h3 className="text-[15px] font-bold text-slate-900 leading-tight">{item.name}</h3>
                            <p className="mt-0.5 text-[13px] font-semibold text-slate-700">{formatPrice(item.price)}</p>
                            <p className="mt-1 text-[11px] leading-[1.35] text-slate-500 line-clamp-2 pr-2">{item.description}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {itemTags.map((tagKey) => {
                                const tag = DIETARY_TAGS.find((entry) => entry.key === tagKey);
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

        {/* Mobile sticky cart bar */}
        {cartCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white px-4 py-4 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] border-t border-slate-100">
            <div
              onClick={() => window.location.href = '/cart'}
              className="bg-[#E23744] hover:bg-[#D42B38] rounded-xl px-5 py-3.5 flex items-center justify-between text-white shadow-xl cursor-pointer transition-all active:scale-[0.98]"
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/90 mb-0.5">
                  {cartCount} ITEM{cartCount > 1 ? 'S' : ''} ADDED
                </span>
                <span className="text-[15px] font-bold tracking-tight">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-[15px] tracking-wide">
                Next <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Filter Modal */}
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[100]">
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
                  <X className="h-4 w-4" />
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
                        {tag.emoji} {tag.label}
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

      {/* ═══ DESKTOP LAYOUT ══════════════════════════════════════════════════ */}
      <div className="hidden md:flex h-[calc(100vh-80px)] overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-[220px] xl:w-[240px] shrink-0 flex flex-col border-r border-slate-100 bg-white/80 backdrop-blur-sm overflow-y-auto scrollbar-hide py-6">
          {/* Brand header */}
          <div className="px-5 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-1">CoCoa Café</p>
            <h1 className="text-[22px] font-black text-primary leading-tight">Our Menu</h1>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Handcrafted for every craving</p>
          </div>

          {/* Category nav */}
          <nav className="flex-1 px-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 px-2 mb-2">Categories</p>
            <button
              onClick={() => scrollToCategory("all")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-1 text-left transition-all text-[13px] font-semibold ${
                !activeSection && selectedCategory === "all"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="text-[16px]">🍽️</span>
              All Items
              {!activeSection && selectedCategory === "all" && (
                <span className="ml-auto text-[10px] bg-white/25 rounded-full px-1.5 py-0.5 font-bold">
                  {filteredItems.length}
                </span>
              )}
            </button>

            {displayCategories.map((category) => {
              const isActive = activeSection === category || (selectedCategory === category && activeSection === null);
              const count = groupedItems.find(g => g.category === category)?.items.length || 0;
              return (
                <button
                  key={category}
                  onClick={() => scrollToCategory(category)}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-1 text-left transition-all text-[13px] font-semibold ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="text-[14px] leading-none">☕</span>
                  <span className="flex-1 leading-snug">{category}</span>
                  {count > 0 && (
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold shrink-0 ${
                      isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Dietary filters in sidebar — renders list ABOVE button via flex-col-reverse */}
          <div className="px-3 mt-auto border-t border-slate-100 pt-3 flex flex-col-reverse">
            {/* Toggle button — visually at bottom because of flex-col-reverse */}
            <button
              onClick={() => setIsDesktopFilterOpen(!isDesktopFilterOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Dietary Filters</span>
              </div>
              <div className="flex items-center gap-1.5">
                {activeTags.length > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                    {activeTags.length}
                  </span>
                )}
                <span className={`text-slate-400 transition-transform duration-200 inline-block ${isDesktopFilterOpen ? "rotate-180" : ""}`}>▲</span>
              </div>
            </button>

            {/* Filter list — appears visually ABOVE the button (flex-col-reverse reverses DOM order) */}
            <AnimatePresence>
              {isDesktopFilterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="pb-2 flex flex-col gap-1">
                    {DIETARY_TAGS.map((tag) => {
                      const isActive = activeTags.includes(tag.key);
                      return (
                        <button
                          key={tag.key}
                          onClick={() => toggleTag(tag.key)}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-semibold transition-colors text-left ${
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span>{tag.emoji}</span>
                          <span>{tag.label}</span>
                          {isActive && <span className="ml-auto text-primary text-[10px] font-black">✓</span>}
                        </button>
                      );
                    })}
                    {activeTags.length > 0 && (
                      <button
                        onClick={() => setActiveTags([])}
                        className="mt-0.5 text-[11px] font-bold text-rose-500 hover:text-rose-700 text-center py-1 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* ── CENTER CONTENT ── */}
        <main className="flex-1 overflow-y-auto" ref={contentRef}>
          {/* Sticky search bar */}
          <div className="sticky top-0 z-20 bg-[#fffdf8]/95 backdrop-blur-sm border-b border-slate-100 px-6 py-3">
            <div className="flex items-center gap-3 max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for dishes, beverages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 rounded-xl bg-white border border-slate-200 pl-9 pr-4 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {activeTags.length > 0 && (
                <div className="flex items-center gap-1.5 text-[12px] text-primary font-semibold bg-primary/10 rounded-xl px-3 py-2 border border-primary/20">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {activeTags.length} filter{activeTags.length > 1 ? "s" : ""}
                </div>
              )}
            </div>

            {tableParam && (
              <div className="flex items-center gap-2 mt-2 text-[12px] font-semibold text-primary">
                <MapPin className="h-3.5 w-3.5" />
                Ordering for <span className="font-black">Table {tableParam}</span>
              </div>
            )}
          </div>

          {/* Menu Content */}
          <div className="px-6 py-5 pb-16">
            {groupedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-lg font-bold text-slate-700">No items found</p>
                <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                {(searchQuery || activeTags.length > 0) && (
                  <button
                    onClick={() => { setSearchQuery(""); setActiveTags([]); }}
                    className="mt-4 text-sm font-semibold text-primary hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                {groupedItems.map((group, groupIndex) => (
                  <section
                    key={group.category}
                    ref={(el) => { sectionRefs.current[group.category] = el; }}
                  >
                    {/* Category header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <h2 className="text-[20px] font-black text-slate-900 tracking-tight">
                          {group.category}
                        </h2>
                        <span className="text-[12px] font-semibold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">
                          {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Items list */}
                    <div className="space-y-3">
                      {group.items.map((item, index) => {
                        const cartItem = cart.find(i => i.id === item.id);
                        const quantity = cartItem ? cartItem.quantity : 0;
                        return (
                          <DesktopItemRow
                            key={`${group.category}-${item.id}`}
                            item={item}
                            onAdd={handleAddToCart}
                            onUpdateQty={updateQuantity}
                            quantity={quantity}
                          />
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT CART PANEL ── */}
        <aside className="w-[280px] xl:w-[300px] shrink-0 flex flex-col border-l border-slate-100 bg-white/80 backdrop-blur-sm py-5 px-4 overflow-hidden">
          {/* Cart header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-black text-slate-900">Your Order</h2>
            {cartCount > 0 && (
              <span className="text-[11px] font-bold bg-primary text-white rounded-full px-2.5 py-0.5">
                {cartCount} item{cartCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <DesktopCartPanel
            cart={cart}
            getTotal={getTotal}
            getItemCount={getItemCount}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            tableNumber={tableParam}
          />
        </aside>
      </div>
    </div>
  );
};
