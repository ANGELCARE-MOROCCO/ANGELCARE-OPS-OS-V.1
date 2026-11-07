import data from "./sources.json";
export type World = "angelcare" | "kidflix" | "jobkix";
export interface Source {
  id: string;
  table: string;
  world: string;
  family: string;
  workspace: string;
  permission: string;
  route: string;
  label: string;
  globalRecord: boolean;
  idFields: string[];
  parentFields: string[];
  grouped?: boolean;
  audit?: boolean;
  evidence: string;
}
export const SOURCES: readonly Source[] = data;
export const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));
export const CENTER_PATH = "/angelcare-marketplace/admin/notifications";
export const API_PATH = "/api/angelcare-marketplace/admin/notifications";
export const REVISION = "AC-NOTIFY-PROMAX-R1";
