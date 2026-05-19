import { memo, useMemo } from "react";
import { projectPoint } from "../../../services/mapMath";
import type { Point, QueueProject } from "../../../types";

interface Props {
  projects: QueueProject[];
  viewport: { width: number; height: number };
  zoom: number;
  center: Point;
  opacity: number;
  onHover: (project: QueueProject, screen: { x: number; y: number }) => void;
  onHoverEnd: () => void;
}

export const ProjectLayer = memo(({ projects, viewport, zoom, center, opacity, onHover, onHoverEnd }: Props) => {
  const projectedProjects = useMemo(
    () =>
      projects.map((project) => ({
        project,
        point: projectPoint(project.coordinates[0], project.coordinates[1], viewport, zoom, center),
      })),
    [center, projects, viewport, zoom],
  );

  return (
    <g className="project-layer" opacity={opacity}>
      {projectedProjects.map(({ project, point }) => {
        return (
          <g
            key={project.id}
            transform={`translate(${point.x} ${point.y})`}
            className="project-hitgroup"
            onPointerEnter={() => onHover(project, point)}
            onPointerMove={() => onHover(project, point)}
            onPointerLeave={onHoverEnd}
          >
            <circle r={26} className="project-hitbox" />
            <circle r={project.type === "BESS" ? 12 : 9} className={`project-node project-node--${project.type.toLowerCase().replace(" ", "-")}`} />
            <circle r={22} className="project-node-pulse" />
            {zoom > 5.8 ? (
              <text x={16} y={5} className="project-label">
                {project.name} · {project.mw} MW
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
});
