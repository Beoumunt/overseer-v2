// imports (dostosuj ścieżki)
import { Client } from 'discord.js';
import { GuildConfigModel } from '../db/models/GuildConfig';
import { MemberModel } from '../db/models/Member';
import { logger } from '../lib/logger';

// helper
function sleep(ms: number) { return new Promise((res) => setTimeout(res, ms)); }

type PerGuildMembership = {
  guildKey: string; // np. 'main', 'recruitment' albo guildId
  isPresent: boolean;
  joinedAt: Date | null;
  leftAt: Date | null;
  lastSyncedAt: Date;
  rolesOnThisGuild: string[]; // discord role ids
};

async function syncAllMembersOnStartup(client: Client) {
  const cfgs = await GuildConfigModel.find().lean();
  if (!cfgs?.length) {
    logger.info('syncAllMembersOnStartup: brak GuildConfig');
    return;
  }

  // map userId -> array of PerGuildMembership
  const usersMap = new Map<string, PerGuildMembership[]>();

  // 1) Zbierz członków per-guild i wypełnij usersMap
  for (const cfg of cfgs) {
    const guildId = cfg.guildId;
    const membershipKey = (() => {
      if (guildId === process.env.GUILD_RECRUITMENT_ID) return 'recruitment';
      if (guildId === process.env.GUILD_MAIN_ID) return 'main';
      if (guildId === process.env.GUILD_EMBASSY_ID) return 'embassy';
      if (guildId === process.env.GUILD_MARKET_ID) return 'market';
      return guildId;
    })();

    let guild = client.guilds.cache.get(guildId);
    if (!guild) guild = await client.guilds.fetch(guildId).catch(() => undefined);
    if (!guild) {
      logger.warn(`syncAllMembersOnStartup: bot nie jest w guild ${guildId}, pomijam`);
      continue;
    }

    // fetch wszystkich członków (może być duże, ale masz <=5 serwerów)
    const members = await guild.members.fetch().catch((err) => {
      logger.warn(`syncAllMembersOnStartup: fetch members failed for ${guildId}: ${String(err)}`);
      return null;
    });
    if (!members) continue;

    const ts = new Date();
    for (const gm of members.values()) {
      const arr = usersMap.get(gm.id) ?? [];
      arr.push({
        guildKey: membershipKey,
        isPresent: true,
        joinedAt: gm.joinedAt ?? null,
        leftAt: null,
        lastSyncedAt: ts,
        rolesOnThisGuild: Array.from(gm.roles.cache.keys()), // discord role ids
      });
      usersMap.set(gm.id, arr);
    }

    // Opcjonalnie: jeżeli chcesz też oznaczać None-members (tych, którzy są w GuildConfig, ale nie w fetch() result)
    // to trzeba zebrać listę known userIds i dodać dla nich isPresent=false; zwykle niepotrzebne.
    await sleep(200); // throttle między guildami
  }

  logger.info(`syncAllMembersOnStartup: zebrano ${usersMap.size} unikalnych użytkowników`);

  // 2) Teraz przetwarzaj po użytkowniku w batchach
  const allUserIds = Array.from(usersMap.keys());
  const batchSize = 50;
  for (let i = 0; i < allUserIds.length; i += batchSize) {
    const batchIds = allUserIds.slice(i, i + batchSize);

    await Promise.all(batchIds.map(async (userId) => {
      try {
        const perGuildArr = usersMap.get(userId)!;

        // zbuduj memberships obiekt: memberships[guildKey] = { isPresent, joinedAt, leftAt, lastSyncedAt }
        const memberships: Record<string, any> = {};
        const aggregatedRoleNames = new Set<string>();

        // Potrzebujemy mapowania discordRoleId -> roleName (roleName to RoleDefinition key) z każdego GuildConfig
        // Najprościej: dla każdego perGuildMembership sprawdź cfg.roles i przekonwertuj discordRoleId na roleName
        for (const pg of perGuildArr) {
          memberships[pg.guildKey] = {
            isPresent: pg.isPresent,
            joinedAt: pg.joinedAt,
            leftAt: pg.leftAt,
            lastSyncedAt: pg.lastSyncedAt
          };

          // mapuj role ids -> roleNames na podstawie guild config
          const cfg = cfgs.find(c => {
            const key = (c.guildId === process.env.GUILD_RECRUITMENT_ID) ? 'recruitment' :
                        (c.guildId === process.env.GUILD_MAIN_ID) ? 'main' :
                        (c.guildId === process.env.GUILD_EMBASSY_ID) ? 'embassy' :
                        (c.guildId === process.env.GUILD_MARKET_ID) ? 'market' :
                        c.guildId;
            return key === pg.guildKey;
          });
          if (cfg?.roles) {
            // cfg.roles: { roleName: discordRoleId }
            for (const [roleName, discordRoleId] of Object.entries(cfg.roles as Record<string,string>)) {
              if (pg.rolesOnThisGuild.includes(discordRoleId)) aggregatedRoleNames.add(roleName);
            }
          }
        }

        const mainRolesArray = Array.from(aggregatedRoleNames);

        // 3) Jeden upsert na użytkownika (last-writer-wins)
        const now = new Date();
        const setObj: any = {
          username: undefined, // możesz chcieć fetchnąć username/displayName z cache albo z first perGuildArr; albo fetch user
          displayName: undefined,
          memberships,
          mainRoles: mainRolesArray,
          updatedAt: now
        };

        // Możesz próbować pobrać username/displayName z cache: client.users.cache.get(userId) lub z pierwszego gm
        const firstGuildEntry = perGuildArr[0];
        // jeśli chcesz username/displayName dokładnie: fetch user from client.users.fetch(userId)
        const user = await client.users.fetch(userId).catch(() => null);
        if (user) {
          setObj.username = user.username;
          setObj.displayName = user.username; // lub stosownie inna logika
        }

        await MemberModel.findOneAndUpdate(
          { discordId: userId },
          { $set: setObj, $setOnInsert: { createdAt: now } },
          { upsert: true, new: true }
        ).exec();
      } catch (err) {
        logger.warn(`syncAllMembersOnStartup: błąd dla ${userId}: ${String(err)}`);
      }
    }));

    // throttle między batchami
    await sleep(300);
  }

  logger.info('syncAllMembersOnStartup: synchronizacja zakończona');
}

export { syncAllMembersOnStartup };