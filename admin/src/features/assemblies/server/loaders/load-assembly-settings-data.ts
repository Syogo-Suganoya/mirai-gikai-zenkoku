import "server-only";

import { countSettingsData } from "../repositories/assembly-settings-repository";

export function loadAssemblySettingsData(assemblyId: string) {
  return countSettingsData(assemblyId);
}
