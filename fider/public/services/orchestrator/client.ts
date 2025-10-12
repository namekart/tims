import { fetchProjectMappings, ProjectMapping } from "./methods"

export const orchestratorClient = {
  listProjects: async (): Promise<ProjectMapping[]> => {
    return await fetchProjectMappings()
  },
}


