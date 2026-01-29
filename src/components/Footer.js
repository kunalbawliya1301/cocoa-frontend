import { Coffee, Instagram, Twitter, Facebook } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border mt-16">

      {/* ================= TOP CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-16">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-start">

          {/* BRAND */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Coffee className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold text-primary">
                CoCoa Cafe
              </span>
            </div>

            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              CoCoa Cafe is a modern coffee experience.  
              We believe in slowing down, sipping mindfully, and creating
              moments worth remembering.
            </p>

            {/* <div className="flex gap-6 mt-6 text-sm">
              <a href="#" className="hover:text-primary transition">Instagram</a>
              <a href="#" className="hover:text-primary transition">LinkedIn</a>
              <a href="#" className="hover:text-primary transition">Facebook</a>
            </div> */}
          </div>

          {/* NAVIGATION */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-6">
              Navigation
            </h3>

            <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
              <Link to="/" className="hover:text-primary transition">Home</Link>
              <Link to="/menu" className="hover:text-primary transition">Menu</Link>
              <Link to="/cart" className="hover:text-primary transition">Cart</Link>
              <Link to="/dashboard" className="hover:text-primary transition">Orders</Link>
              <Link to="/login" className="hover:text-primary transition">Sign In</Link>
              <Link to="/signup" className="hover:text-primary transition">Create Account</Link>
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-6">
              New Business
            </h3>

            <p className="text-lg font-medium text-foreground">
              hello@cocoacafe.com
            </p>

            <div className="flex gap-4 mt-6">
              <Instagram className="w-5 h-5 cursor-pointer hover:text-primary transition" />
              <Twitter className="w-5 h-5 cursor-pointer hover:text-primary transition" />
              <Facebook className="w-5 h-5 cursor-pointer hover:text-primary transition" />
            </div>
          </div>

        </div>

        {/* META */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-20 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} CoCoa Cafe. All Rights Reserved.
          </p>

          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-primary transition">
              Terms of Service
            </span>
            <span className="cursor-pointer hover:text-primary transition">
              Privacy Policy
            </span>
          </div>
        </div>
      </div>

      {/* ================= HUGE BRAND TEXT (SAFE) ================= */}
      <div className="w-full text-center pb-12">
        <h1 className="
          font-heading font-extrabold tracking-tight
          text-[12vw] md:text-[12vw]
          text-primary
          leading-none
          select-none
        ">
          COCOA&nbsp;CAFE
        </h1>
      </div>

    </footer>
  );
};

export default Footer;
