import Experience from '@/components/Experience';
import Nav from '@/components/ui/Nav';
import Arrival from '@/components/sections/Arrival';
import Mission from '@/components/sections/Mission';
import Vessel from '@/components/sections/Vessel';
import Explore from '@/components/sections/Explore';
import Crew from '@/components/sections/Crew';
import Timeline from '@/components/sections/Timeline';
import Archive from '@/components/sections/Archive';
import Pioneer from '@/components/sections/Pioneer';
import Footer from '@/components/sections/Footer';
import { SITE, VESPER_LY } from '@/lib/mission';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ORBITAL — Beyond the Known',
  url: SITE.url,
  description: SITE.description,
  about: { '@type': 'CreativeWork', name: 'Expedition Vesper (design fiction)', abstract: `A speculative crewed mission concept to a fictional star system ${VESPER_LY} light-years away.` },
};

export default function Home() {
  return (
    <Experience>
      <Nav />
      <main id="main">
        <Arrival />
        <Mission />
        <Vessel />
        <Explore />
        <Crew />
        <Timeline />
        <Archive />
        <Pioneer />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </Experience>
  );
}
