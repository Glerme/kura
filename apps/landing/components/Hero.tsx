"use client";

import { useT } from "@/lib/i18n";

export default function Hero() {
  const { t } = useT();

  return (
    <section
      id="hero"
      className="section"
      style={{ paddingTop: 160, paddingBottom: 120, minHeight: "100vh", display: "flex", alignItems: "center" }}
    >
      <div className="section-inner" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 20,
            padding: "5px 14px",
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 40,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.4)",
              boxShadow: "0 0 6px rgba(255,255,255,0.3)",
              display: "inline-block",
            }}
          />
          {t.hero_badge}
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(40px, 7vw, 72px)",
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-1.5px",
            color: "rgba(255,255,255,0.92)",
            marginBottom: 24,
          }}
        >
          {t.hero_headline}
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: "var(--muted)",
            lineHeight: 1.65,
            marginBottom: 48,
            maxWidth: 560,
            margin: "0 auto 48px",
          }}
        >
          {t.hero_sub}
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <a
            href="#chrome-store-placeholder"
            className="btn-primary"
            style={{ fontSize: 15, padding: "14px 28px" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="8.5" stroke="rgba(255,255,255,0.5)" />
              <circle cx="9" cy="9" r="4" fill="rgba(255,255,255,0.8)" />
            </svg>
            {t.hero_cta_chrome}
          </a>
          <a
            href="#firefox-store-placeholder"
            className="btn-ghost"
            style={{ fontSize: 15, padding: "14px 28px" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="8.5" stroke="rgba(255,255,255,0.25)" />
              <path d="M9 4.5C6.5 4.5 4.5 6.5 4.5 9S6.5 13.5 9 13.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {t.hero_cta_firefox}
          </a>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.20)" }}>
          {t.hero_cta_note}
        </p>

        {/* Scroll hint */}
        <div
          style={{
            marginTop: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: 0.25,
          }}
        >
          <div
            style={{
              width: 1,
              height: 48,
              background: "rgba(255,255,255,0.4)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.2; transform: scaleY(1); }
            50%       { opacity: 0.6; transform: scaleY(1.15); }
          }
        `}</style>
      </div>
    </section>
  );
}
