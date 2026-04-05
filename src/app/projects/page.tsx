import BuilderBackLink from '@/app/components/BuilderBackLink';
import ProjectsLibraryClient from '@/app/components/ProjectsLibraryClient';
import { getCurrentSessionUser } from '@/lib/services/session.service';
import { ProjectService } from '@/lib/services/project.service';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Projects | ShipStack',
  description: 'Browse and reopen the projects you have generated with ShipStack.',
};

export default async function ProjectsPage() {
  const user = await getCurrentSessionUser();
  const { projects } = await ProjectService.listForUser(user.id, 1, 24, {
    includeTotal: false,
  });
  const serializedProjects = projects.map((project) => ({
    id: project.id,
    displayName: project.displayName,
    description: project.description,
    userPrompt: project.userPrompt,
    status: project.status,
    totalFiles: project.totalFiles,
    totalSizeBytes: project.totalSizeBytes,
    generationTimeMs: project.generationTimeMs,
    updatedAt: project.updatedAt.toISOString(),
    blueprint: project.blueprint
      ? {
          featureCount: project.blueprint.featureCount,
          modelCount: project.blueprint.modelCount,
          pageCount: project.blueprint.pageCount,
        }
      : null,
  }));

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-0 top-0 -z-10 h-64 w-64 rounded-full bg-[rgba(185,130,77,0.18)] blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-20 -z-10 h-64 w-64 rounded-full bg-[rgba(83,119,153,0.18)] blur-3xl" />

      <BuilderBackLink
        title="Back to builder"
        description="Jump back into the main workspace to generate a new product or continue refining one."
      />

      <ProjectsLibraryClient initialProjects={serializedProjects} />
    </div>
  );
}
