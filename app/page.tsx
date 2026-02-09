import { Hero } from '@/components/main';

export default function Home() {
  return (
    <main>
      <Hero
        title={<>AI-Powered<br />Youtube Thumbnails</>}
        subtitle={<>Create click-worthy thumbnails in seconds.<br />Let AI design professional visuals for your videos.</>}
        ctaLabel="Start for Free"
        ctaHref="/get-started"
        secondaryCtaLabel="View Examples"
        secondaryCtaHref="/examples"
      />
    </main>
  );
}