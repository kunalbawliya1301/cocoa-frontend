import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Coffee, Clock, Award, Heart } from "lucide-react";
import { Button } from "../components/ui/button";

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

      {/* ================= HERO ================= */}
      <section className="relative min-h-screen px-6 md:px-16 flex items-center overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-7xl mt-8 md:my-auto mx-auto w-full">

          {/* HERO IMAGE */}
          <div className="order-1 md:order-2 flex justify-center">
            <CoffeeScroller />
          </div>

          {/* TEXT CONTENT */}
          <div className="order-2 md:order-1 flex flex-col justify-center z-10">
            <h1 className="font-heading font-extrabold leading-[1.05] text-primary">
              <div className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl">
                IT’S A BREAK
              </div>
              <div className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl">
                WITH <span className="text-accent">COFFEE</span>
              </div>
            </h1>

            <p className="mt:3 md:mt-6 max-w-md text-muted-foreground text-sm sm:text-base md:text-lg">
              Indulge in the rich aroma of freshly brewed coffee. A sensory
              delight for true coffee lovers.
            </p>

            <div className="flex gap-2 mt-4 md:mt-8 flex-wrap">
              <Button
                onClick={() => navigate("/menu")}
                className="rounded-full px-4 md:px-8 h-8 md:h-12 bg-primary text-primary-foreground"
              >
                Order Now
              </Button>
              <Button
                onClick={() => navigate("/menu")}
                variant="outline"
                className="rounded-full px-4 md:px-8 h-8 md:h-12"
              >
                View Menu
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-16 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-heading font-semibold text-primary">
              Why Choose CoCoa?
            </h2>
            <p className="text-muted-foreground mt-2">
              We're passionate about delivering exceptional coffee experiences
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Coffee, title: "Premium Beans", desc: "Ethically sourced from the finest regions" },
              { icon: Clock, title: "Quick Service", desc: "Order ahead and skip the line" },
              { icon: Award, title: "Award Winning", desc: "Recognized for excellence" },
              { icon: Heart, title: "Made with Love", desc: "Every cup crafted with care" },
            ].map((f, i) => (
              <motion.div
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                className="bg-muted/50 p-8 rounded-3xl text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <f.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg text-primary">{f.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= GALLERY ================= */}
      <section className="py-16 md:py-32 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-3xl md:text-5xl font-heading text-primary mb-12">
            Gallery
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {galleryImages.map((img, i) => (
              <motion.div
                key={i}
                whileInView={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.9 }}
                viewport={{ once: true }}
                className="h-40 md:h-64 rounded-2xl overflow-hidden shadow-lg"
              >
                <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-16 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-3xl md:text-5xl font-heading text-primary mb-12">
            What Our Customers Say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-2xl shadow-md"
              >
                <div className="text-accent mb-2">★★★★★</div>
                <p className="text-sm mb-3">"{t.comment}"</p>
                <p className="font-medium text-primary">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

/* ================= COFFEE IMAGE + BEANS ================= */

const CoffeeScroller = () => {
  const beans = [...Array(8)].map((_, i) => ({
    id: i,
    size: Math.random() * 14 + 26,
    top: Math.random() * 70 + 5,
    left: Math.random() * 70 + 5,
    rotate: Math.random() * 360,
    duration: Math.random() * 4 + 6,
  }));

  return (
    <div className="relative h-[280px] sm:h-[360px] md:h-[520px] flex items-center justify-center">
      {beans.map((b) => (
        <motion.img
          key={b.id}
          src="/coffee-bean.png"
          drag
          className="absolute z-40 cursor-grab"
          style={{
            width: b.size,
            top: `${b.top}%`,
            left: `${b.left}%`,
            rotate: b.rotate,
          }}
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: b.duration, repeat: Infinity }}
        />
      ))}

      <img
        src="/hero.png"
        alt="Coffee Splash"
        className="w-[200px] sm:w-[300px] md:w-[400px] lg:w-[400px] z-20"
      />

      <div className="absolute w-72 h-72 md:w-96 md:h-96 bg-accent/20 blur-3xl rounded-full -z-10" />
    </div>
  );
};
