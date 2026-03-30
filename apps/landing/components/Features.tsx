"use client";

import { useT } from "@/lib/i18n";
import { useScrollReveal, useScrollRevealChildren } from "@/hooks/useScrollReveal";

const icons = ["🔖", "🏷️", "📤", "☁️"];

export default function Features() {
  const { t } = useT();
  const headerRef = useScrollReveal();
  const gridRef = useScrollRevealChildren<HTMLDivElement>(110);

  const cards = [
    { icon: icons[0], title: t.feat1_title, desc: t.feat1_desc },
    { icon: icons[1], title: t.feat2_title, desc: t.feat2_desc },
    { icon: icons[2], title: t.feat3_title, desc: t.feat3_desc },
    { icon: icons[3], title: t.feat4_title, desc: t.feat4_desc, soon: true },
  ];

  return (
    <section id="features" className="section">
      <div className="section-inner">
        {/* Header */}
        <div ref={headerRef} className="reveal" style={{ textAlign: "center", marginBottom: 64 }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "rgba(255,255,255,0.90)",
              marginBottom: 14,
            }}
          >
            {t.features_title}
          </h2>
          <p style={{ fontSize: 16, color: "var(--muted)" }}>{t.features_sub}</p>
        </div>

        {/* Grid */}
        <div
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {cards.map((card) => (
            <div
              key={card.title}
              className="glass reveal feature-card"
              style={{
                borderRadius: 16,
                padding: 28,
                transition: "background 0.2s, border-color 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.09)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.20)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "";
                (e.currentTarget as HTMLElement).style.borderColor = "";
              }}
            >
              <div className="feature-icon">{card.icon}</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  {card.title}
                </h3>
                {card.soon && (
                  <span className="chip" style={{ fontSize: 10 }}>
                    soon
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  lineHeight: 1.65,
                }}
              >
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
