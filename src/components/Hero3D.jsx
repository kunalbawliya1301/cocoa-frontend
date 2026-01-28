'use client';

import Spline from '@splinetool/react-spline';

export default function Hero3D() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Spline scene="https://prod.spline.design/5gIZtIbJZAPfGad8/scene.splinecode" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">
            Brew Your Ideas ☕
          </h1>
          <p className="text-lg opacity-90">
            Where design meets coffee
          </p>
        </div>
      </div>

    </section>
  );
}
