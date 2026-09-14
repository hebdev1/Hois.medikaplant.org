"use client";

import { motion } from "motion/react";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";

// Real member testimonials — WhatsApp screenshots the shop received, stored in
// public/temwayaj/1.jpeg .. 21.jpeg. Split across three columns that scroll at
// slightly different speeds for a living "wall of love".
const testimonials = Array.from({ length: 21 }, (_, i) => ({
  image: `/temwayaj/${i + 1}.jpeg`,
}));

const firstColumn = testimonials.slice(0, 7);
const secondColumn = testimonials.slice(7, 14);
const thirdColumn = testimonials.slice(14, 21);

export default function TestimonialsSection() {
  return (
    <section className="relative w-full pt-4 md:pt-6 pb-24 md:pb-32 -mt-8 md:-mt-14 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 lg:px-20 xl:px-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center max-w-[620px] mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-ink">
            Sa manm yo <span className="text-brand-600">di</span> sou Hoïs
          </h2>
          <p className="mt-5 text-ink/70 md:text-lg leading-relaxed">
            Mesaj reyèl manm nou yo voye ban nou sou WhatsApp.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-14 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] max-h-[760px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={40} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={50}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={44}
          />
        </div>
      </div>
    </section>
  );
}
