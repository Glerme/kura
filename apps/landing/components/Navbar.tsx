"use client";

import { useT } from "@/lib/i18n";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { t, locale, toggle } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 24px",
        transition: "background 0.3s, border-color 0.3s",
        background: scrolled
          ? "rgba(8,8,8,0.85)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.07)"
          : "1px solid transparent",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          height: 60,
          gap: 32,
        }}
      >
        {/* Logo */}
        <a
          href="#"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: "var(--text)",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "1.5px",
            marginRight: "auto",
          }}
        >
          <img
            src="/Kura.png"
            alt="Kura"
            style={{ width: 24, height: 24, borderRadius: 6, objectFit: "contain" }}
          />
          KURA
        </a>

        {/* Desktop nav */}
        <div
          className="desktop-nav"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          <a
            href="#features"
            style={{
              color: "var(--muted)",
              textDecoration: "none",
              fontSize: 14,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "var(--text)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "var(--muted)")
            }
          >
            {t.nav_features}
          </a>
          <a
            href="#faq"
            style={{
              color: "var(--muted)",
              textDecoration: "none",
              fontSize: 14,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "var(--text)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "var(--muted)")
            }
          >
            {t.nav_faq}
          </a>
          <a href="#hero" className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
            {t.nav_install}
          </a>
          <button
            onClick={toggle}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 8,
              color: "var(--muted)",
              fontSize: 11,
              fontFamily: "inherit",
              fontWeight: 600,
              letterSpacing: "0.5px",
              padding: "5px 10px",
              cursor: "pointer",
              transition: "color 0.15s, background 0.15s",
            }}
            aria-label="Toggle language"
          >
            {locale === "en" ? "PT-BR" : "EN"}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
