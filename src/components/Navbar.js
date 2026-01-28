import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Coffee, ShoppingCart, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Button } from "./ui/button";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const cartCount = getItemCount();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`
          fixed z-50 top-0 left-0 md:left-1/2 md:-translate-x-1/2
          flex items-center justify-between
          transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
          px-4 sm:px-6 md:px-16 bg-white backdrop-blur-md
          w-full
          ${
            scrolled
              ? "md:w-[94%] lg:w-[900px] h-[55px] md:h-[70px] md:top-6 md:rounded-full md:bg-white/90 md:shadow-xl"
              : "h-[55px] md:h-[80px]"
          }
        `}
      >
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <Coffee className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          <span className="text-lg md:text-2xl font-bold text-primary">
            CoCoa
          </span>
        </Link>

        {/* MOBILE + DESKTOP MAIN LINKS */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link
            to="/menu"
            className="font-medium text-sm md:text-base hover:text-primary"
          >
            Menu
          </Link>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {/* USER ICON */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <User className="w-5 h-5" />
              </Button>

              {/* DROPDOWN */}
              <div
                className={`
                  absolute top-full right-0 mt-3 z-50
                  transition-all duration-200
                  ${
                    menuOpen
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }
                `}
              >
                <div className="bg-white rounded-2xl shadow-xl w-56 p-4">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {user.email}
                  </p>

                  <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full text-left py-2 hover:text-primary"
                  >
                    My Orders
                  </button>

                  {user.role === "admin" && (
                    <button
                      onClick={() => navigate("/admin")}
                      className="w-full text-left py-2 hover:text-primary"
                    >
                      Admin Panel
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2 text-red-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => navigate("/login")}
              className="rounded-full bg-primary text-white text-sm md:text-base"
            >
              Sign In
            </Button>
          )}
        </div>
      </nav>
    </>
  );
};
