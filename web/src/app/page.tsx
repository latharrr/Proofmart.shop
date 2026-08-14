import Topbar from "@/components/home/topbar";
import Hero from "@/components/home/hero";
import PipelineSection from "@/components/home/pipeline-section";
import MarkersSection from "@/components/home/markers-section";
import RunSection from "@/components/home/run-section";
import OutputsSection from "@/components/home/outputs-section";
import IntegrateSection from "@/components/home/integrate-section";
import PricingSection from "@/components/home/pricing-section";
import SiteFooter from "@/components/home/site-footer";

export default function Home() {
  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF", color: "#0E1216" }}>
      <Topbar />
      <Hero />
      <PipelineSection />
      <MarkersSection />
      <RunSection />
      <OutputsSection />
      <IntegrateSection />
      <PricingSection />
      <SiteFooter />
    </div>
  );
}
