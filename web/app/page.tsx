import Header from "@/components/header/Header";
import Hero from "@/components/hero/Hero";
import Features from "@/components/features/Features";
import HowItWorks from "@/components/how/HowItWorks";
import Demo from "@/components/demo/Demo";
import Download from "@/components/download/Download";
import ResearchCta from "@/components/research/ResearchCta";
import Footer from "@/components/footer/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-[#0a0b0d]">
        <Hero />
        <Features />
        <HowItWorks />
        <Demo />
        <ResearchCta />
        <Download />
      </main>
      <Footer />
    </>
  );
}
