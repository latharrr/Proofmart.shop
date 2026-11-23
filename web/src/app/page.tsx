import Topbar from "@/components/home/topbar";
import Hero from "@/components/home/hero";
import LiveScanSection from "@/components/home/live-scan-section";
import PipelineSection from "@/components/home/pipeline-section";
import MarkersSection from "@/components/home/markers-section";
import OutputsSection from "@/components/home/outputs-section";
import IntegrateSection from "@/components/home/integrate-section";
import PricingSection from "@/components/home/pricing-section";
import ClosingSection from "@/components/home/closing-section";
import SiteFooter from "@/components/home/site-footer";
import HeroFly from "@/components/home/hero-fly";
import HomeMotion from "@/components/motion/home-motion";
import GridLines from "@/components/home/grid-lines";

// The developer's path, in order (the index rows' numbers): the claim [01],
// the evidence live [02], how it works [03], what it checks [04], what the
// API returns [05], how to wire it in [06], what it costs [07], the close [08].
export default function Home() {
  return (
    <div className="pm-page">
      <GridLines />
      <Topbar />
      <main id="main">
        <Hero />
        <LiveScanSection />
        <PipelineSection />
        <MarkersSection />
        <OutputsSection />
        <IntegrateSection />
        <PricingSection />
        <ClosingSection />
      </main>
      <SiteFooter />
      <HeroFly />
      <HomeMotion />
    </div>
  );
}
