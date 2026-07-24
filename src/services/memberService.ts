import { GuildMember } from 'discord.js';
import { MemberModel } from '../db/models/Member';
import { GuildConfigModel } from '../db/models/GuildConfig';
import { logger } from '../lib/logger';
import { env } from '../lib/env';

/**
 * Prosty, omnipotentny upsert: zbiera stan użytkownika w całym klastrze
 * i zapisuje go jednym atomicznym upsertem (last-writer-wins).
 *
 * Zalety: prostota, czytelność, wystarczające przy klastrze <= 5 serwerów.
 * Wady: jeśli dwa zdarzenia równocześnie zapiszą sprzeczne stany,
 *        wygrywa ostatnie (typowe last-writer-wins).
 */
export async function upsertMember(member: GuildMember) {
  const client = member.client;
  const now = new Date();

  // 1) Pobierz konfiguracje wszystkich serwerów klastra
  const guildConfigs = await GuildConfigModel.find().lean();

  // 2) Zbierz informacje o obecności i rolach na każdym serwerze
  const membershipsIncoming: Record<string, {
    isPresent: boolean;
    joinedAt: Date | null;
    leftAt: Date | null;
    lastSyncedAt: Date;
  }> = {};
  const aggregatedMainRoles = new Set<string>();

  await Promise.all(guildConfigs.map(async (cfg) => {
    const guildId: string = cfg.guildId;
    // zamień guildId na czytelny klucz w memberships (możesz dopasować jeśli chcesz inne klucze)
    const membershipKey = (() => {
      if (guildId === env.GUILD_RECRUITMENT_ID) return 'recruitment';
      if (guildId === env.GUILD_MAIN_ID) return 'main';
      if (guildId === env.GUILD_EMBASSY_ID) return 'embassy';
      if (guildId === env.GUILD_MARKET_ID) return 'market';
      return guildId;
    })();

    const incomingTs = new Date();

    try {
      // fetch or get from cache
      let guild = client.guilds.cache.get(guildId);
      if (!guild) guild = (await client.guilds.fetch(guildId).catch(() => null)) ?? undefined;
      if (!guild) {
        // Bot nie jest w tym guildzie lub fetch nie powiódł się
        membershipsIncoming[membershipKey] = {
          isPresent: false,
          joinedAt: null,
          leftAt: null,
          lastSyncedAt: incomingTs
        };
        return;
      }

      // fetch członka (jeśli nie ma, fetch rzuci)
      const gm = await guild.members.fetch({ user: member.id, force: true }).catch(() => null);
      if (!gm) {
        membershipsIncoming[membershipKey] = {
          isPresent: false,
          joinedAt: null,
          leftAt: incomingTs, // traktujemy jako niedawne opuszczenie
          lastSyncedAt: incomingTs
        };
        return;
      }

      // członek jest obecny na tym guildzie
      membershipsIncoming[membershipKey] = {
        isPresent: true,
        joinedAt: gm.joinedAt ?? null,
        leftAt: null,
        lastSyncedAt: incomingTs
      };

      // zbierz mainRoles na podstawie mapowania w cfg.roles
      // cfg.roles może być Map lub zwykłym obiektem (lean())
      const rolesMap: Record<string, string> = (cfg.roles instanceof Map)
        ? Object.fromEntries(Array.from(cfg.roles.entries()))
        : (cfg.roles ?? {});

      for (const [roleName, discordRoleId] of Object.entries(rolesMap)) {
        if (!discordRoleId) continue;
        if (gm.roles?.cache?.has(discordRoleId)) aggregatedMainRoles.add(roleName);
      }
    } catch (err) {
      logger.warn(`upsertMember: błąd sprawdzania guild ${guildId} dla ${member.id}: ${String(err)}`);
      membershipsIncoming[membershipKey] = {
        isPresent: false,
        joinedAt: null,
        leftAt: new Date(),
        lastSyncedAt: new Date()
      };
    }
  }));

  // 3) Przygotuj tablicę ról
  const mainRolesArray = Array.from(aggregatedMainRoles);

  // 4) Przygotuj update (prosty $set + $setOnInsert)
  const setObj: any = {
    username: member.user.username,
    displayName: member.displayName,
    updatedAt: now,
    mainRoles: mainRolesArray,
    // memberships - wstawiamy cały obiekt membershipsIncoming (nadpisujemy)
    memberships: membershipsIncoming
  };

  const doc = await MemberModel.findOneAndUpdate(
    { discordId: member.id },
    {
      $set: setObj,
      $setOnInsert: { createdAt: now }
    },
    { upsert: true, new: true }
  ).exec();

  logger.info(`upsertMember: zsynchronizowano ${member.user.tag} — serwery: ${Object.keys(membershipsIncoming).join(', ')}, roleCount: ${mainRolesArray.length}`);

  return doc;
}