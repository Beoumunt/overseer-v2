import { Events } from 'discord.js';
import type { Client, GuildMember, PartialGuildMember } from 'discord.js';
import { scheduleMemberCounterUpdate } from '../services/memberCounters/memberCounterScheduler';
import { syncMember } from '../sync/syncMembers';

export const name = Events.GuildMemberUpdate;

function roleSnapshot(member: GuildMember | PartialGuildMember) {
  return Array.from(member.roles.cache.keys()).sort().join(',');
}

export async function execute(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember,
  client: Client
) {
  // Aktualizacja licznika jest potrzebna tylko wtedy, gdy zmienił się zestaw ról.
  if (roleSnapshot(oldMember) === roleSnapshot(newMember)) return;

  await syncMember(newMember);
  scheduleMemberCounterUpdate(client, newMember.guild.id);
}
