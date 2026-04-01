import Link from 'next/link';
import { notFound } from 'next/navigation';
import SavedProjectWorkspace from '@/app/components/SavedProjectWorkspace';
import { ProjectService } from '@/lib/services/project.service';
import { getCurrentUser } from '@/lib/services/session.service';
import { Blueprint } from '@/validators/blueprint.validator';

export const metadata = {
  title: 'Project Workspace | ShipStack',
  description: 'Open a saved ShipStack project with its preview, files, and blueprint.',
};

interface ProjectDetailPageProps {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const user = await getCurrentUser();
  const result = await ProjectService.loadWithDetails(params.id);

  if (!result || result.project.userId !== user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/projects"
          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          ← Back to my projects
        </Link>
        <Link
          href="/"
          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Builder home
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
