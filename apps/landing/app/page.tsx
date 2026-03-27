import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Demo from "@/components/Demo";
import Features from "@/components/Features";
import Waitlist from "@/components/Waitlist";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <>
      {/* Ambient blobs — fixed, behind everything */}
      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />
      <div className="blob blob-3" aria-hidden="true" />

      <Navbar />
      <main>
        <Hero />
        <Demo />
        <Features />
        <Waitlist />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
