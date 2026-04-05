import Link from 'next/link';
import { notFound } from 'next/navigation';
import BuilderBackLink from '@/app/components/BuilderBackLink';
import SavedProjectWorkspace from '@/app/components/SavedProjectWorkspace';
import { ProjectService } from '@/lib/services/project.service';
import { getCurrentSessionUser } from '@/lib/services/session.service';
import { Blueprint } from '@/validators/blueprint.validator';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project Workspace | ShipStack',
  description: 'Open a saved ShipStack project with its preview, files, and blueprint.',
};

interface ProjectDetailPageProps {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const user = await getCurrentSessionUser();
  const result = await ProjectService.loadWithDetails(params.id);

  if (!result || result.project.userId !== user.id) {
    notFound();
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-0 top-0 -z-10 h-64 w-64 rounded-full bg-orange-200/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 -z-10 h-64 w-64 rounded-full bg-sky-200/25 blur-3xl" />

      <BuilderBackLink
        title="Back to builder"
        description="Return to the main builder workspace whenever you want to generate or refine another project."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/projects"
          className="glass-panel inline-flex rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5"
        >
          Back to my projects
        </Link>
      </div>

      <SavedProjectWorkspace
        projectId={result.project.id}
        projectName={result.project.name}
        displayName={result.project.displayName}
        description={result.project.description}
        files={result.files ?? []}
        blueprint={result.blueprint as SavedBlueprint | null}
        stats={{
          totalFiles: result.project.totalFiles,
          totalSizeBytes: result.project.totalSizeBytes,
          generationTimeMs: result.project.generationTimeMs,
        }}
        status={result.project.status}
        createdAt={result.project.createdAt.toISOString()}
        updatedAt={result.project.updatedAt.toISOString()}
      />
    </div>
  );
}

type SavedBlueprint = Blueprint;
