import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Coffee, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';

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
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // auto-close on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // click-outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`
          fixed z-50 top-0 left-1/2 -translate-x-1/2
          flex items-center justify-between
          transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
          px-6 md:px-16 bg-white backdrop-blur-md
          ${scrolled
            ? 'w-[94%] lg:w-[900px] h-[56px] md:h-[70px] top-3 md:top-6 rounded-full bg-white/90 backdrop-blur-md shadow-xl'
            : 'w-full h-[60px] md:h-[80px]'}
        `}
      >
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3">
          <Coffee className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          <span className="text-xl md:text-2xl font-bold text-primary">
            CoCoa
          </span>
        </Link>

        {/* DESKTOP ACTIONS */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/menu"
            className="font-medium text-foreground hover:text-primary transition"
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

          {/* USER ICON + DROPDOWN */}
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
                  absolute top-full right-0 mt-8 z-50
                  transition-all duration-200 ease-out
                  ${menuOpen
                    ? 'opacity-100 scale-100 pointer-events-auto'
                    : 'opacity-0 scale-95 pointer-events-none'}
                `}
              >
                <div className="bg-white backdrop-blur-md rounded-2xl shadow-xl w-56 p-4">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {user.email}
                  </p>

                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setMenuOpen(false);
                    }}
                    className="w-full text-left py-2 hover:text-primary"
                  >
                    My Orders
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        navigate('/admin');
                        setMenuOpen(false);
                      }}
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
              onClick={() => navigate('/login')}
              className="rounded-full bg-primary text-white"
            >
              Sign In
            </Button>
          )}
        </div>

        {/* MOBILE HAMBURGER */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden relative w-10 h-10 flex items-center justify-center"
        >
          <span
            className={`absolute h-[2px] w-6 bg-black transition-all duration-300 ${
              menuOpen ? 'rotate-45 top-1/2' : 'top-3'
            }`}
          />
          <span
            className={`absolute h-[2px] w-4 bg-black transition-all duration-300 ${
              menuOpen ? 'opacity-0' : 'top-1/2.5'
            }`}
          />
          <span
            className={`absolute h-[2px] w-6 bg-black transition-all duration-300 ${
              menuOpen ? '-rotate-45 top-1/2' : 'bottom-3'
            }`}
          />
        </button>
      </nav>

      {/* MOBILE SLIDE MENU */}
      <div
        className={`
          fixed top-0 right-0 h-screen w-full z-40 bg-white/90 backdrop-blur-sm
          transform transition-transform duration-300 ease-in-out
          md:hidden shadow-xl
          ${menuOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8 text-xl font-semibold">
          <Link to="/menu" onClick={() => setMenuOpen(false)}>Menu</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart</Link>

          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>My Orders</Link>
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
              )}
              <button onClick={handleLogout} className="text-red-500">
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </>
  );
};
