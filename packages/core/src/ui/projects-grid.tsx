import type { ProjectType } from "../models/projects-schema";
import { urlBuilder } from "../urls";
import { Card, CardGrid } from "./components/card";
import { LatestBuild } from "./components/latest-build";
import { Time } from "./components/time";

export function ProjectsGrid({
  projects,
}: {
  projects: ProjectType[];
}): JSXElement {
  return (
    <CardGrid>
      {projects.map((project) => (
        <ProjectCard project={project} />
      ))}
    </CardGrid>
  );
}

function ProjectCard({ project }: { project: ProjectType }): JSXElement {
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
