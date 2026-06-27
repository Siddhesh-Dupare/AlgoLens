"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { steps } from "./work.data";

gsap.registerPlugin(ScrollTrigger);

export default function Work() {
  const [currentStep, setCurrentStep] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const scrollContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = document.querySelectorAll("[data-step]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-step"));
            setCurrentStep(index);
          }
        });
      },
      {
        threshold: 0.5,
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!container.current || !scrollContainer.current) return;

    gsap.fromTo(
      container.current,
      {
        opacity: 0,
        y: 20,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: "back.out",
        scrollTrigger: {
          trigger: `[data-step="${currentStep}"]`,
          scroller: scrollContainer.current,
          start: "top center",
          end: "bottom center",
          onEnter: () => {
            gsap.killTweensOf(container.current);
            gsap.fromTo(
              container.current,
              { opacity: 0, y: 20, scale: 0.95 },
              { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out" }
            );
          },
          once: true, // animate only once
        },
      },
    );

    return () => ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }, [currentStep]);

  return (
    <div
      ref={scrollContainer}
      className="flex-1 overflow-y-auto scroll-smooth"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="sticky top-0 h-screen p-5">
        <p className="text-2xl font-semibold">How it works</p>
        <div ref={container} className="mt-10">
          <p className="text-2xl font-bold">{steps[currentStep].id}</p>
          <p className="text-4xl font-semibold">{steps[currentStep].title}</p>
          <p className="text-muted-foreground">
            {steps[currentStep].description}
          </p>
        </div>
      </div>
      <div>
        {steps.map((_, index) => (
          <section key={index} data-step={index} className="h-screen" />
        ))}
      </div>
    </div>
  );
}
