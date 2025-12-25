import type { ProjectType } from "storybooker/types";
import { getUIStore } from "../utils/ui-store.ts";
import { Card, CardGrid } from "./card.tsx";
import { LatestBuild } from "./latest-build.tsx";
import { Time } from "./time.tsx";

export function ProjectsGrid({ projects }: { projects: ProjectType[] }): JSXElement {
  return (
    <CardGrid>
      {projects.map((project) => (
        <ProjectCard project={project} />
      ))}
    </CardGrid>
  );
}

function ProjectCard({ project }: { project: ProjectType }): JSXElement {
  const { urlBuilder } = getUIStore();

  return (
    <Card>
      <a
        href={urlBuilder.projectDetails(project.id)}
        style={{ fontSize: "1.5em", fontWeight: "bold" }}
      >
        {project.name}
      </a>
      {project.latestBuildId ? (
        <div>
          <LatestBuild projectId={project.id} buildId={project.latestBuildId} />
          <Time datetime={project.updatedAt} />
        </div>
      ) : null}
    </Card>
  );
}
