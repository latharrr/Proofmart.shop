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

// The developer's path, in order: see a document re-footed (hero), inspect
// the evidence live (W/P A), how it works (B), what it checks (C), what the
// API returns (D), how to wire it in (E), what it costs (F), and the close.
export default function Home() {
  return (
    <div className="pm-page">
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
    </div>
  );
}
