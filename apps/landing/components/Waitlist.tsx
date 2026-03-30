"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Waitlist() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const cardRef = useScrollReveal();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="section">
      <div className="section-inner">
        <div
          ref={cardRef}
          className="glass reveal"
          style={{
            borderRadius: 24,
            padding: "clamp(40px, 6vw, 72px)",
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Tag */}
            <div style={{ marginBottom: 16 }}>
              <span
                className="chip"
                style={{
                  fontSize: 11,
                  padding: "4px 12px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {t.waitlist_tag}
              </span>
            </div>

            {/* Content row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 48,
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "clamp(32px, 4vw, 48px)",
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                    color: "rgba(255,255,255,0.92)",
                    marginBottom: 16,
                    lineHeight: 1.1,
                  }}
                >
                  {t.waitlist_title}
                </h2>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--muted)",
                    lineHeight: 1.7,
                    marginBottom: 24,
                  }}
                >
                  {t.waitlist_sub}
                </p>

                {/* Feature list */}
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {(t.waitlist_features as unknown as string[]).map((feat) => (
                    <li
                      key={feat}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 14,
                        color: "rgba(255,255,255,0.55)",
                      }}
                    >
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form */}
              <div>
                {submitted ? (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      padding: "24px 20px",
                      textAlign: "center",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 15,
                      lineHeight: 1.6,
                      animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
                    }}
                  >
                    🎉
                    <br />
                    <br />
                    {t.waitlist_success}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.waitlist_placeholder}
                      required
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.055)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: 10,
                        color: "rgba(255,255,255,0.8)",
                        padding: "12px 14px",
                        fontSize: 14,
                        fontFamily: "inherit",
                        outline: "none",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,0.22)";
                        e.target.style.background = "rgba(255,255,255,0.08)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,0.09)";
                        e.target.style.background = "rgba(255,255,255,0.055)";
                      }}
                    />
                    <button type="submit" className="btn-primary" style={{ justifyContent: "center" }}>
                      {t.waitlist_btn}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .waitlist-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
