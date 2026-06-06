import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { LogoBar } from "@/components/landing/LogoBar";
import { Problem } from "@/components/landing/Problem";
import { Stats } from "@/components/landing/Stats";
import { Platform } from "@/components/landing/Platform";
import { Agents } from "@/components/landing/Agents";
import { Portals } from "@/components/landing/Portals";
import { Security } from "@/components/landing/Security";
import { UseCases } from "@/components/landing/UseCases";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="bg-black">
      <Nav />
      <Hero />
      <LogoBar />
      <Problem />
      <Stats />
      <Platform />
      <Agents />
      <Portals />
      <Security />
      <UseCases />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
