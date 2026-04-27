import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Preview from "@/components/Preview";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden lp-page font-sans selection:bg-indigo-500/20">
      <Navbar />
      <Hero />
      <Features />
      <Preview />
      <Footer />
    </main>
  );
}
