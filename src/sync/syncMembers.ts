import { Client, GuildMember } from 'discord.js';
import { GuildConfigModel } from '../db/models/GuildConfig';
import { getMembershipKey } from '../utils/membership';
import { upsertMember, type MembershipsIncoming } from '../services/memberService';
import { logger } from '../lib/logger';

/**
 * Zbiera dla pojedynczego GuildMember wszystkie memberships i mainRoles
 * (iteruje przez GuildConfig i fetchnie stanu w każdym guild) i zwraca
 * payload gotowy do przekazania do memberService.upsertMember.
 */
export async function buildSyncPayloadForMember(member: GuildMember) {
  const client = member.client;
  const guildConfigs = await GuildConfigModel.find().lean();
  const membershipsIncoming: MembershipsIncoming = {};
  const aggregatedMainRoles = new Set<string>();

  await Promise.all(guildConfigs.map(async (cfg) => {
    const guildId: string = cfg.guildId;
    const membershipKey = getMembershipKey(guildId);
    const incomingTs = new Date();

    try {
      let guild = client.guilds.cache.get(guildId);
      if (!guild) guild = await client.guilds.fetch(guildId).catch(() => undefined);
      if (!guild) {
        membershipsIncoming[membershipKey] = {
          isPresent: false,
          joinedAt: null,
          leftAt: null,
          lastSyncedAt: incomingTs
        };
        return;
      }

      const gm = await guild.members.fetch({ user: member.id, force: true }).catch(() => null);
      if (!gm) {
        membershipsIncoming[membershipKey] = {
          isPresent: false,
          joinedAt: null,
          leftAt: incomingTs,
          lastSyncedAt: incomingTs
        };
        return;
      }

      membershipsIncoming[membershipKey] = {
        isPresent: true,
        joinedAt: gm.joinedAt ?? null,
        leftAt: null,
        lastSyncedAt: incomingTs
      };

      const rolesMap: Record<string, string> = (cfg.roles instanceof Map)
        ? Object.fromEntries(Array.from(cfg.roles.entries()))
        : (cfg.roles ?? {});

      for (const [roleName, discordRoleId] of Object.entries(rolesMap)) {
        if (!discordRoleId) continue;
        if (gm.roles?.cache?.has(discordRoleId)) aggregatedMainRoles.add(roleName);
      }
    } catch (err) {
      logger.warn(`buildSyncPayloadForMember: błąd przy sprawdzaniu guild ${guildId} dla ${member.id}: ${String(err)}`);
      membershipsIncoming[membershipKey] = {
        isPresent: false,
        joinedAt: null,
        leftAt: new Date(),
        lastSyncedAt: new Date()
      };
    }
  }));

  const mainRolesArray = Array.from(aggregatedMainRoles);

  return { member, memberships: membershipsIncoming, mainRoles: mainRolesArray };
}

export async function syncMember(member: GuildMember) {
  const payload = await buildSyncPayloadForMember(member);
  return upsertMember(payload);
}