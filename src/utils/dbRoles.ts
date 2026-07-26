// src/services/memberHasRole.ts
import { GuildMember } from 'discord.js';
import { MemberModel } from '../db/models/Member';

export async function memberHasRole(
  member: GuildMember | { id: string } | string,
  requiredRoles: string[],
  mode: 'all' | 'any' = 'all'
): Promise<boolean> {
  if (!member) return false;

  const discordId =
    typeof member === 'string'
      ? member
      : (member as any).id ?? (member as any).user?.id ?? (member as any).discordId;

  if (!discordId) return false;
  if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) return true;

  const memberDoc = await MemberModel.findOne({ discordId }).lean();
  if (!memberDoc) return false;

  const mainRoles = (memberDoc as any).mainRoles;

  // Akceptujemy tylko format tablicy stringów
  if (!Array.isArray(mainRoles)) {
    return false;
  }

  const roleSet = new Set(mainRoles.filter(Boolean).map(String));
  const rolesToCheck = requiredRoles.filter(Boolean);
  if (rolesToCheck.length === 0) return true;

  if (mode === 'any') {
    return rolesToCheck.some(r => roleSet.has(r));
  } else {
    return rolesToCheck.every(r => roleSet.has(r));
  }
}