import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Kura",
  description: "Kura does not collect, transmit, or share any personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />
      <div className="blob blob-3" aria-hidden="true" />

      <Navbar />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 720,
          margin: "0 auto",
          padding: "120px 24px 96px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.5px",
            color: "rgba(255,255,255,0.90)",
            marginBottom: 8,
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginBottom: 48 }}>
          Last updated: March 30, 2026
        </p>

        <div
          className="glass"
          style={{
            borderRadius: 16,
            padding: "40px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          <Section title="Overview">
            Kura does not collect, transmit, or share any personal data. All
            information you save through the extension stays on your device.
          </Section>

          <Divider />

          <Section title="Data storage">
            All data saved by the user — URLs, page titles, comments, and tags —
            is stored exclusively in the browser's local storage (IndexedDB) on
            your device. This data never leaves your device and is not accessible
            to the Kura developers or any third party.
          </Section>

          <Divider />

          <Section title="External requests">
            The only external network request made by the extension is an image
            fetch to{" "}
            <code
              style={{
                background: "rgba(255,255,255,0.07)",
                padding: "2px 6px",
                borderRadius: 5,
                fontSize: 13,
                fontFamily: "monospace",
              }}
            >
              https://www.google.com/s2/favicons
            </code>{" "}
            to display website favicons next to your saved links. Only the domain
            of the saved URL is sent as part of this request. No personal data is
            included.
          </Section>

          <Divider />

          <Section title="Analytics &amp; tracking">
            Kura uses no analytics, tracking pixels, crash reporters, or
            third-party SDKs of any kind.
          </Section>

          <Divider />

          <Section title="Contact">
            If you have any questions about this policy, open an issue on{" "}
            <a
              href="https://github.com/guigaribalde/kura"
              style={{ color: "rgba(255,255,255,0.55)", textDecoration: "underline" }}
            >
              GitHub
            </a>
            .
          </Section>
        </div>
      </main>

      <Footer />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "rgba(255,255,255,0.80)",
          marginBottom: 10,
          letterSpacing: "0.2px",
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,0.45)" }}>
        {children}
      </p>
    </div>
  );
}

function Divider() {
  return (
    <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)" }} />
  );
}
