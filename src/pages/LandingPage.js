import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Coffee, Clock, Award, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';

export const LandingPage = () => {
  const navigate = useNavigate();

  const testimonials = [
    { name: 'Sarah Johnson', rating: 5, comment: 'Best coffee in town! The atmosphere is amazing and the staff is incredibly friendly.' },
    { name: 'Michael Chen', rating: 5, comment: 'Their pastries are to die for. I come here every morning before work.' },
    { name: 'Emma Williams', rating: 5, comment: 'A cozy spot perfect for catching up with friends or getting work done.' },
  ];

  const galleryImages = [
    { url: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg', alt: 'Latte art' },
    { url: 'https://images.pexels.com/photos/33188123/pexels-photo-33188123.jpeg', alt: 'Fresh pastries' },
    { url: 'https://images.pexels.com/photos/15408927/pexels-photo-15408927.jpeg', alt: 'Coffee beans' },
    { url: 'https://images.pexels.com/photos/5047019/pexels-photo-5047019.jpeg', alt: 'Friends enjoying coffee' },
  ];

  return (
    <div className="min-h-screen" data-testid="landing-page">
      <section className="relative h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/35340703/pexels-photo-35340703.jpeg)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-primary/80" />
        
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tight leading-none" data-testid="hero-title">
              Where Every Sip
              <br />
              Tells a Story
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto" data-testid="hero-description">
              Discover handcrafted coffee and freshly baked pastries in a warm, inviting atmosphere.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={() => navigate('/menu')}
                className="bg-white text-primary hover:bg-white/90 h-12 px-8 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-lg text-base"
                data-testid="order-now-button"
              >
                Order Now
              </Button>
              <Button
                onClick={() => navigate('/menu')}
                className="border-2 border-white text-white hover:bg-white hover:text-primary h-12 px-8 rounded-full font-medium transition-all bg-transparent text-base"
                data-testid="view-menu-button"
              >
                View Menu
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-32 px-6 md:px-12" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-primary mb-4">Why Choose CoCoa?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">We're passionate about delivering exceptional coffee experiences</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Coffee, title: 'Premium Beans', desc: 'Ethically sourced from the finest coffee regions' },
              { icon: Clock, title: 'Quick Service', desc: 'Order ahead and skip the line' },
              { icon: Award, title: 'Award Winning', desc: 'Recognized for excellence in craft coffee' },
              { icon: Heart, title: 'Made with Love', desc: 'Every cup is crafted with care and passion' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-muted/50 border border-transparent hover:border-border transition-all text-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-medium text-primary mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 px-6 md:px-12 bg-muted/30" data-testid="gallery-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-primary mb-4">Gallery</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A glimpse into our cozy café</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleryImages.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="relative h-64 rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
              >
                <img src={img.url} alt={img.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 px-6 md:px-12" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-primary mb-4">What Our Customers Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Don't just take our word for it</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl bg-white border border-border/50 shadow-md"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-accent text-xl">★</span>
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">"{testimonial.comment}"</p>
                <p className="font-medium text-primary">{testimonial.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-primary text-primary-foreground" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-semibold mb-6">Ready to Experience CoCoa?</h2>
          <p className="text-lg mb-8 opacity-90">Visit us today or order online for pickup</p>
          <Button
            onClick={() => navigate('/menu')}
            className="bg-white text-primary hover:bg-white/90 h-12 px-8 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-lg text-base"
            data-testid="cta-order-button"
          >
            Start Your Order
          </Button>
        </div>
      </section>
    </div>
  );
};