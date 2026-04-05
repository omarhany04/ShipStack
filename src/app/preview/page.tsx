import StandalonePreview from '@/app/components/StandalonePreview';

export const metadata = {
  title: 'Standalone Preview | ShipStack',
  description: 'Open the generated project preview in a full-page ShipStack view.',
};

interface PreviewPageProps {
  searchParams?: {
    src?: string;
  };
}

export default function PreviewPage({ searchParams }: PreviewPageProps) {
  const src = typeof searchParams?.src === 'string' ? searchParams.src : null;

  return <StandalonePreview url={src} />;
}
