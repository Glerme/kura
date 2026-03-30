"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useScrollReveal, useScrollRevealChildren } from "@/hooks/useScrollReveal";

export default function Faq() {
  const { t } = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const titleRef = useScrollReveal();
  const listRef = useScrollRevealChildren<HTMLDivElement>(90);

  return (
    <section id="faq" className="section">
      <div className="section-inner">
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2
            ref={titleRef}
            className="reveal"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "rgba(255,255,255,0.90)",
              marginBottom: 48,
              textAlign: "center",
            }}
          >
            {t.faq_title}
          </h2>

          <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(t.faq as unknown as { q: string; a: string }[]).map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className="glass reveal"
                  style={{
                    borderRadius: 14,
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                    borderColor: isOpen
                      ? "rgba(255,255,255,0.20)"
                      : "rgba(255,255,255,0.10)",
                  }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "18px 20px",
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.85)",
                      fontSize: 15,
                      fontWeight: 500,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>{item.q}</span>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.25)",
                        fontSize: 18,
                        lineHeight: 1,
                        flexShrink: 0,
                        transform: isOpen ? "rotate(45deg)" : "none",
                        transition: "transform 0.2s, color 0.15s",
                        display: "inline-block",
                      }}
                    >
                      +
                    </span>
                  </button>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      transition: "grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <div style={{ overflow: "hidden" }}>
                      <p
                        style={{
                          padding: "0 20px 18px",
                          fontSize: 14,
                          color: "var(--muted)",
                          lineHeight: 1.7,
                        }}
                      >
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
