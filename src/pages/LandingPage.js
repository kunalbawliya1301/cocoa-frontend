import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Coffee, Clock, Award, Heart } from "lucide-react";
import { Button } from "../components/ui/button";
const isDesktop = () => window.innerWidth >= 768;

export const LandingPage = () => {
  const navigate = useNavigate();

  const testimonials = [
    {
      name: "Keshav Shah",
      rating: 5,
      comment:
        "Best coffee in town! The atmosphere is amazing and the staff is incredibly friendly.",
    },
    {
      name: "Sumit Jha",
      rating: 5,
      comment:
        "Their pastries are to die for. I come here every morning before work.",
    },
    {
      name: "Parshwa Doshi",
      rating: 5,
      comment:
        "A cozy spot perfect for catching up with friends or getting work done.",
    },
  ];

  const galleryImages = [
    {
      url: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
      alt: "Latte art",
    },
    {
      url: "https://images.pexels.com/photos/33188123/pexels-photo-33188123.jpeg",
      alt: "Fresh pastries",
    },
    {
      url: "https://images.pexels.com/photos/15408927/pexels-photo-15408927.jpeg",
      alt: "Coffee beans",
    },
    {
      url: "https://images.pexels.com/photos/5047019/pexels-photo-5047019.jpeg",
      alt: "Friends enjoying coffee",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative min-h-[100vh] md:h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.pexels.com/photos/35340703/pexels-photo-35340703.jpeg)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-primary/80" />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-7xl font-heading font-bold text-white mb-4 md:mb-6 leading-tight">
              Where Every Sip
              <br />
              Tells a Story
            </h1>

            <p className="text-sm sm:text-base md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto">
              Discover handcrafted coffee and freshly baked pastries in a warm,
              inviting atmosphere.
            </p>

            <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
              <Button
                onClick={() => navigate("/menu")}
                className="bg-white text-primary h-10 sm:h-12 px-6 sm:px-8 rounded-full text-sm sm:text-base hover:scale-105"
              >
                Order Now
              </Button>

              <Button
                onClick={() => navigate("/menu")}
                className="border-2 border-white text-white bg-transparent h-10 sm:h-12 px-6 sm:px-8 rounded-full text-sm sm:text-base"
              >
                View Menu
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="py-14 sm:py-20 md:py-32 px-4 sm:px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-semibold text-primary mb-3">
              Why Choose CoCoa?
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              We're passionate about delivering exceptional coffee experiences
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                icon: Coffee,
                title: "Premium Beans",
                desc: "Ethically sourced from the finest coffee regions",
              },
              {
                icon: Clock,
                title: "Quick Service",
                desc: "Order ahead and skip the line",
              },
              {
                icon: Award,
                title: "Award Winning",
                desc: "Recognized for excellence in craft coffee",
              },
              {
                icon: Heart,
                title: "Made with Love",
                desc: "Every cup is crafted with care and passion",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 md:p-8 rounded-3xl bg-muted/50 text-center"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-base md:text-xl font-heading font-medium text-primary mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- GALLERY ---------------- */}
      <section className="py-14 sm:py-20 md:py-32 px-4 sm:px-6 md:px-12 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-semibold text-primary mb-3">
              Gallery
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground">
              A glimpse into our cozy café
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {galleryImages.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                {...(isDesktop()
                  ? {
                      whileInView: { opacity: 1, scale: 1 },
                      viewport: { once: true },
                      transition: { delay: idx * 0.1, duration: 0.5 },
                    }
                  : {
                      animate: { opacity: 1, scale: 1 },
                      transition: { delay: idx * 0.05, duration: 0.3 },
                    })}
                whileHover={{ y: -5 }}
                className="relative h-36 sm:h-48 md:h-64 rounded-2xl overflow-hidden shadow-lg"
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="py-14 sm:py-20 md:py-32 px-4 sm:px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-semibold text-primary mb-3">
              What Our Customers Say
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground">
              Don't just take our word for it
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                {...(isDesktop()
                  ? {
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true },
                      transition: { delay: idx * 0.1, duration: 0.5 },
                    }
                  : {
                      animate: { opacity: 1, y: 0 },
                      transition: { delay: idx * 0.05, duration: 0.3 },
                    })}
                className="p-6 md:p-8 rounded-2xl bg-white border border-border/50 shadow-md"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="text-accent text-lg">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm md:text-base mb-3">"{t.comment}"</p>
                <p className="font-medium text-primary">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-semibold mb-4">
            Ready to Experience CoCoa?
          </h2>
          <p className="text-sm sm:text-lg mb-6 opacity-90">
            Visit us today or order online for pickup
          </p>
          <Button
            onClick={() => navigate("/menu")}
            className="bg-white text-primary h-10 sm:h-12 px-6 sm:px-8 rounded-full text-sm sm:text-base hover:scale-105"
          >
            Start Your Order
          </Button>
        </div>
      </section>
    </div>
  );
};
