import { LatestBuild } from "../../components/latest-build";
import { urlBuilder } from "../../urls";
import type { ProjectType } from "../schema";

export function ProjectsGrid({
  projects,
}: {
  projects: ProjectType[];
}): JSX.Element {
  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        padding: "1rem",
      }}
    >
      {projects.map((project) => (
        <ProjectCard project={project} />
      ))}
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectType }): JSX.Element {
  return (
    <article
      style={{
        border: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        justifyContent: "space-between",
        maxWidth: "500px",
        minHeight: "12rem",
        padding: "1rem",
        width: "100%",
      }}
    >
      <a
        href={urlBuilder.projectId(project.id)}
        style={{
          fontSize: "1.5em",
          fontWeight: "bold",
        }}
      >
        {project.name}
      </a>
      <LatestBuild projectId={project.id} sha={project.latestBuildSHA} />
    </article>
  );
}
