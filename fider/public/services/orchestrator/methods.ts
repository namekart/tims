import { http } from "@fider/services/http"
import { orchestratorEndpoints } from "./endpoint"

export interface ProjectMapping {
  id: string
  productTag: string
  planeProjectId: string
  projectName: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export async function fetchProjectMappings(): Promise<ProjectMapping[]> {
  const res = await http.get<ApiResponse<ProjectMapping[]>>(orchestratorEndpoints.projects)
  return res.ok ? res.data.data : []
}


