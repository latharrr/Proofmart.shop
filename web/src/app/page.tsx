import Topbar from "@/components/home/topbar";
import Hero from "@/components/home/hero";
import PipelineSection from "@/components/home/pipeline-section";
import MarkersSection from "@/components/home/markers-section";
import OutputsSection from "@/components/home/outputs-section";
import IntegrateSection from "@/components/home/integrate-section";
import PricingSection from "@/components/home/pricing-section";
import ClosingSection from "@/components/home/closing-section";
import SiteFooter from "@/components/home/site-footer";

// The case, in the order a buyer asks it: what is it (hero), how does it
// work, what does it catch, what do I get back, how do I wire it in, what
// does it cost, and is it safe to send it our documents.
export default function Home() {
  return (
    <div className="pm-page">
      <Topbar />
      <main id="main">
        <Hero />
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
