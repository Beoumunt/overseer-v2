import { GuildMember } from 'discord.js';
import { MemberModel } from '../db/models/Member';

/**
 * Sprawdza po DB czy użytkownik ma wymagane role zapisane w memberDoc.mainRoles.
 *
 * - member: GuildMember | { id: string } | discordId (string)
 * - requiredRoles: array systemowych nazw ról (np. ['candidate','officer'])
 * - mode: 'all' (domyślnie) => musi mieć wszystkie, 'any' => wystarczy jedna
 *
 * Zwraca boolean.
 */
export async function memberHasRole(
  member: GuildMember | { id: string } | string,
  requiredRoles: string[],
  mode: 'all' | 'any' = 'all'
): Promise<boolean> {
  if (!member) return false;

  // wyciągnij discordId z różnych możliwych typów argumentu
  const discordId =
    typeof member === 'string'
      ? member
      : (member as any).id ?? (member as any).user?.id ?? (member as any).discordId;

  if (!discordId) return false;
  if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) return true;

  // pobierz dokument z DB
  const memberDoc = await MemberModel.findOne({ discordId }).lean();
  if (!memberDoc) {
    return false;
  }

  const mainRoles = (memberDoc as any).mainRoles ?? {};
  const rolesToCheck = requiredRoles.filter(Boolean);
  if (rolesToCheck.length === 0) return true;

  let matched = 0;
  for (const r of rolesToCheck) {
    if (mainRoles[r]) {
      matched++;
      if (mode === 'any') return true;
    }
  }

  return mode === 'all' ? matched === rolesToCheck.length : matched > 0;
}