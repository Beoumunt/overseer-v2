import { Client } from 'discord.js';
import { GuildConfigModel } from '../db/models/GuildConfig';
import { logger } from '../lib/logger';
import { syncMember } from './syncMembers';

function sleep(ms: number) { return new Promise((res) => setTimeout(res, ms)); }

export async function syncAllMembersOnStartup(client: Client) {
  const cfgs = await GuildConfigModel.find().lean();
  if (!cfgs?.length) {
    logger.info('syncAllMembersOnStartup: brak GuildConfig');
    return;
  }

  // map userId -> array of guildIds (we'll use to avoid duplicate work when possible)
  const usersSet = new Set<string>();

  for (const cfg of cfgs) {
    const guildId = cfg.guildId;
    let guild = client.guilds.cache.get(guildId);
    if (!guild) guild = await client.guilds.fetch(guildId).catch(() => undefined);
    if (!guild) {
      logger.warn(`syncAllMembersOnStartup: bot nie jest w guild ${guildId}, pomijam`);
      continue;
    }

    const members = await guild.members.fetch().catch((err) => {
      logger.warn(`syncAllMembersOnStartup: fetch members failed for ${guildId}: ${String(err)}`);
      return null;
    });
    if (!members) continue;

    for (const gm of members.values()) usersSet.add(gm.id);

    await sleep(200); // throttle między guildami
  }

  logger.info(`syncAllMembersOnStartup: zebrano ${usersSet.size} unikalnych użytkowników`);

  const allUserIds = Array.from(usersSet);
  const batchSize = 50;
  for (let i = 0; i < allUserIds.length; i += batchSize) {
    const batch = allUserIds.slice(i, i + batchSize);
    await Promise.all(batch.map(async (userId) => {
      try {
       
        for (const cfg of cfgs) {
          const guildId = cfg.guildId;
          const guild = client.guilds.cache.get(guildId);
          if (!guild) continue;
          const gm = await guild.members.fetch({ user: userId, force: true }).catch(() => null);
          if (gm) {
            await syncMember(gm).catch((err) => logger.warn(`syncAllMembersOnStartup: błąd syncMember dla ${userId}: ${String(err)}`));
            break;
          }
        }
      } catch (err) {
        logger.warn(`syncAllMembersOnStartup: błąd dla ${userId}: ${String(err)}`);
      }
    }));

    await sleep(300);
  }

  logger.info('syncAllMembersOnStartup: synchronizacja zakończona');
}