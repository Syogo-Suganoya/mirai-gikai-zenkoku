import "server-only";

import { findMembersByAssembly } from "../repositories/assembly-member-repository";

export function loadAssemblyMembers(assemblyId: string) {
  return findMembersByAssembly(assemblyId);
}
