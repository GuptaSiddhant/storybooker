import { Card, CardGrid } from "../../components/card";
import { LatestBuild } from "../../components/latest-build";
import { Time } from "../../components/time";
import { urlBuilder } from "../../urls";
import type { ProjectType } from "../schema";

export function ProjectsGrid({
  projects,
}: {
  projects: ProjectType[];
}): JSX.Element {
  return (
    <CardGrid>
      {projects.map((project) => (
        <ProjectCard project={project} />
      ))}
    </CardGrid>
  );
}

function ProjectCard({ project }: { project: ProjectType }): JSX.Element {
  return (
    <Card>
      <a
        href={urlBuilder.projectId(project.id)}
        style={{ fontSize: "1.5em", fontWeight: "bold" }}
      >
        {project.name}
      </a>
      {project.latestBuildSHA ? (
        <div>
          <LatestBuild projectId={project.id} sha={project.latestBuildSHA} />
          <Time datetime={project.updatedAt} />
        </div>
      ) : null}
    </Card>
  );
}
