"use client";
import React from "react";
import { motion } from "motion/react";

export type Temwayaj = { image: string };

// A single vertically-scrolling column of testimonial cards. The list is
// rendered twice and the track is animated by -50% (one full list height) on
// an infinite linear loop, so the scroll reads as seamless. Each card is a
// customer's WhatsApp testimonial image.
export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Temwayaj[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2).fill(0)].map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ image }, i) => (
              <div
                className="rounded-2xl overflow-hidden shadow-card max-w-xs w-full bg-white"
                key={i}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Temwayaj yon manm Hoïs sou WhatsApp"
                  loading="lazy"
                  className="w-full h-auto block select-none"
                  draggable={false}
                />
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
