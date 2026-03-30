"use client";

import Image from "next/image";
import { useT } from "@/lib/i18n";

export default function Footer() {
  const { t } = useT();
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        position: "relative",
        zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        {/* Left: brand */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "1.5px",
              color: "rgba(255,255,255,0.6)",
              marginBottom: 6,
            }}
          >
            <Image
              src="/Kura.png"
              alt="Kura"
              width={18}
              height={18}
              style={{ borderRadius: 4, opacity: 0.7 }}
            />
            KURA
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.20)" }}>
            {t.footer_tagline}
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.14)", marginTop: 4 }}>
            © {year} Kura · {t.footer_rights}
          </p>
        </div>

        {/* Right: links */}
        <nav
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {[
            { label: t.footer_chrome, href: "#chrome-store-placeholder" },
            { label: t.footer_firefox, href: "#firefox-store-placeholder" },
            { label: t.footer_github, href: "#github-placeholder" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.30)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.65)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.30)")
              }
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
