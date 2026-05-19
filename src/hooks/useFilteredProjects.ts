import { useMemo } from "react";
import type { AppFilters } from "../types";
import { filterProjects, summaryStats } from "../services/opportunityService";

export function useFilteredProjects(filters: AppFilters) {
  const projects = useMemo(() => filterProjects(filters), [filters]);
  const stats = useMemo(() => summaryStats(projects), [projects]);
  return { projects, stats };
}
