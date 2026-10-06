"use client";

import { useEffect, useRef } from "react";
import "./ukm-atmosphere.css";

const COLORS = ["#4FC3F7", "#FFEB3B", "#FF7043", "#F06292", "#FFFFFF"];
const BUBBLE_COLORS = [
  "rgba(255,255,255,0.28)",
  "rgba(255,241,118,0.28)",
  "rgba(128,222,234,0.32)",
  "rgba(244,143,177,0.25)",
  "rgba(174,213,129,0.28)",
];

export default function Atmosphere() {
  const bubblesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bubbleContainer = bubblesRef.current;
    if (!bubbleContainer) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const bubblePool: HTMLDivElement[] = [];
    const confettiPool: HTMLDivElement[] = [];
    const poolSize = 28;

    const launchBubble = (el: HTMLDivElement, isInitial: boolean) => {
      if (document.hidden) {
        el.dataset.idle = "1";
        return;
      }
      el.dataset.idle = "0";
      el.style.transition = "";
      el.style.opacity = "";
      el.style.transform = "";
      const size = Math.random() * 22 + 12;
      const duration = Math.random() * 6 + 6;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${Math.random() * 82 + 8}%`;
      el.style.background = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
      el.style.setProperty("--drift", `${(Math.random() * 24 - 12).toFixed(1)}px`);
      el.style.setProperty("--dur", `${duration}s`);
      el.style.setProperty("--delay", isInitial ? `${-(Math.random() * duration)}s` : "0s");
      el.classList.remove("is-up");
      requestAnimationFrame(() => el.classList.add("is-up"));
    };

    const createConfetti = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const piece = confettiPool.pop() || document.createElement("div");
        piece.className = "confetti";
        piece.style.backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        piece.style.left = `${x}px`;
        piece.style.top = `${y}px`;
        piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 60 + 20;
        piece.style.setProperty("--move-x", `${Math.cos(angle) * velocity}px`);
        piece.style.setProperty("--move-y", `${Math.sin(angle) * velocity}px`);
        piece.style.animation = "none";
        const done = () => {
          piece.removeEventListener("animationend", done);
          piece.remove();
          if (confettiPool.length < 24) confettiPool.push(piece);
        };
        piece.addEventListener("animationend", done);
        document.body.appendChild(piece);
        requestAnimationFrame(() => {
          piece.style.animation = "confetti-blast 0.6s ease-out forwards";
        });
      }
    };

    const popBubble = (el: HTMLDivElement) => {
      if (el.dataset.popping === "1") return;
      el.dataset.popping = "1";
      const rect = el.getBoundingClientRect();
      el.classList.remove("is-up");
      el.style.transform = "scale(1.5)";
      el.style.opacity = "0";
      el.style.transition = "transform 0.1s ease-out, opacity 0.1s ease-out";
      createConfetti(rect.left, rect.top, 5);
      window.setTimeout(() => {
        el.dataset.popping = "0";
        launchBubble(el, false);
      }, 120);
    };

    for (let i = 0; i < poolSize; i++) {
      const bubble = document.createElement("div");
      bubble.className = "pop-bubble";
      bubble.addEventListener("click", (event) => {
        event.stopPropagation();
        popBubble(bubble);
      });
      bubble.addEventListener("animationend", (event) => {
        if (event.animationName !== "floatUp") return;
        if (bubble.dataset.popping === "1") return;
        launchBubble(bubble, false);
      });
      bubbleContainer.appendChild(bubble);
      bubblePool.push(bubble);
      launchBubble(bubble, true);
    }

    return () => {
      bubblePool.forEach((bubble) => bubble.remove());
    };
  }, []);

  return (
    <>
      <div className="sunny-bg" aria-hidden>
        <div className="grid-pattern" />
        <div className="sky-glow" />
        <div className="sun-wrap">
          <div className="sun-rays" />
          <div className="sun-core" />
        </div>
        <div className="bg-sparkles">
          {Array.from({ length: 12 }, (_, i) => <i key={i} />)}
        </div>
        <div className="bg-confetti">
          {Array.from({ length: 8 }, (_, i) => <b key={i} />)}
        </div>
        <div className="swimmers">
          <span className="swim s1">🐠</span>
          <span className="swim s2">🐟</span>
          <span className="swim s3">🐬</span>
          <span className="swim s4">🐡</span>
          <span className="swim s5">🦑</span>
        </div>
        <div className="ocean-scene">
          <span className="kelp k1" />
          <span className="kelp k2" />
          <span className="kelp k3" />
          <div className="wave-band wave-a"><i /></div>
          <div className="wave-band wave-b"><i /></div>
          <div className="wave-band wave-c"><i /></div>
          <div className="wave-band wave-d"><i /></div>
          <div className="wave-foam" />
        </div>
        <div className="sun-glare" />
        <div id="bubbles-container" ref={bubblesRef} />
      </div>
      <div className="deco-layer" aria-hidden>
        <i className="fas fa-trophy floating-item item-trophy" />
        <i className="fas fa-ruler-combined floating-item item-ruler" />
        <i className="fas fa-star floating-item item-star" />
        <i className="fas fa-heart floating-item item-heart" />
        <i className="fas fa-fish floating-item item-fish" />
        <i className="fas fa-book floating-item item-book" />
        <span className="float-cloud cloud-1" />
        <span className="float-cloud cloud-2" />
        <span className="float-cloud cloud-3" />
        <div className="floating-blob blob-1" />
        <div className="floating-blob blob-2" />
        <div className="floating-blob blob-3" />
      </div>
    </>
  );
}
