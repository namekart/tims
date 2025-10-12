// Orchestrator API endpoints

export interface OrchestratorEndpoints {
  projects: string
}

// Default to same-origin path. Configure your reverse-proxy to map this to the orchestrator service.
export const orchestratorEndpoints: OrchestratorEndpoints = {
  projects: "/orchestrator/api/projects",
}


