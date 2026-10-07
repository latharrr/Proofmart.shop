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

// The case, in the order a buyer asks it: what is it and why believe it
// (hero, then the live scan), how does it work, what does it catch, what do
// I get back, how do I wire it in, what does it cost, and is it safe.
export default function Home() {
  return (
    <div className="pm-page pm-mk">
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
