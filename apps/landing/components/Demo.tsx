"use client";

import { useT } from "@/lib/i18n";

export default function Demo() {
  const { t } = useT();

  return (
    <section className="section" style={{ paddingTop: 0, paddingBottom: 120 }}>
      <div className="section-inner">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "rgba(255,255,255,0.90)",
              marginBottom: 14,
            }}
          >
            {t.demo_title}
          </h2>
          <p style={{ fontSize: 16, color: "var(--muted)" }}>{t.demo_sub}</p>
        </div>

        {/* Glass demo frame */}
        <div
          className="glass"
          style={{
            borderRadius: 20,
            overflow: "hidden",
            maxWidth: 860,
            margin: "0 auto",
            minHeight: 480,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Fake browser chrome */}
          <div style={{ width: "100%" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                {["rgba(255,80,80,0.5)", "rgba(255,180,0,0.4)", "rgba(60,200,80,0.4)"].map(
                  (c, i) => (
                    <div
                      key={i}
                      style={{ width: 10, height: 10, borderRadius: "50%", background: c }}
                    />
                  )
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 6,
                  height: 24,
                  maxWidth: 320,
                  margin: "0 auto",
                }}
              />
            </div>

            {/* Demo content area */}
            <div
              style={{
                minHeight: 420,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: 40,
              }}
            >
              {/* Popup mockup */}
              <div
                style={{
                  width: 280,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.03)",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.5)",
                    }}
                  />
                  KURA
                </div>
                {/* Tabs */}
                <div
                  style={{
                    display: "flex",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {["Links", "Salvar"].map((tab, i) => (
                    <div
                      key={tab}
                      style={{
                        flex: 1,
                        padding: "9px 0",
                        textAlign: "center",
                        fontSize: 11,
                        color: i === 1 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)",
                        borderBottom: i === 1 ? "1.5px solid rgba(255,255,255,0.6)" : "none",
                        marginBottom: i === 1 ? -1 : 0,
                      }}
                    >
                      {tab}
                    </div>
                  ))}
                </div>
                {/* Save form skeleton */}
                <div style={{ padding: 12 }}>
                  {[60, 90, 44].map((w, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          height: 7,
                          width: "30%",
                          background: "rgba(255,255,255,0.08)",
                          borderRadius: 4,
                          marginBottom: 5,
                        }}
                      />
                      <div
                        style={{
                          height: i === 1 ? 52 : 28,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: 8,
                        }}
                      />
                    </div>
                  ))}
                  <div
                    style={{
                      height: 34,
                      background: "rgba(255,255,255,0.10)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      borderRadius: 8,
                      marginTop: 4,
                    }}
                  />
                </div>
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.18)",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                {t.demo_placeholder} · {t.demo_placeholder_sub}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
