import type { Client } from 'discord.js';
import { MemberCounterModel } from '../../db/models/MemberCounter';
import { logger } from '../../lib/logger';
import { fetchGuildMembersWithRetry } from '../../utils/discord';
import { memberCounterChannelName } from '../../utils/memberCounter';

export interface MemberCounterUpdateResult {
  updated: number;
  skipped: number;
  failed: number;
}

const emptyResult = (): MemberCounterUpdateResult => ({
  updated: 0,
  skipped: 0,
  failed: 0
});

/**
 * Aktualizuje wszystkie liczniki jednej gildii po jednym pobraniu jej członków.
 * Grupowanie po guildId jest ważne: wiele liczników nie może powodować wielu
 * kosztownych żądań Gateway dla tego samego serwera.
 */
export async function updateMemberCountersForGuild(
  client: Client,
  guildId: string
): Promise<MemberCounterUpdateResult> {
  const counters = await MemberCounterModel.find({ guildId, isActive: true });
  const result = emptyResult();

  if (counters.length === 0) return result;

  const guild = client.guilds.cache.get(guildId)
    ?? await client.guilds.fetch(guildId).catch(() => null);

  if (!guild) {
    result.skipped = counters.length;
    logger.warn(`memberCounterService: bot nie jest dostępny na gildii ${guildId}`);
    return result;
  }

  try {
    await fetchGuildMembersWithRetry(guild);
  } catch (error) {
    result.skipped = counters.length;
    logger.error(`memberCounterService: nie udało się pobrać członków gildii ${guildId}: ${String(error)}`);
    return result;
  }

  for (const counter of counters) {
    try {
      const role = await guild.roles.fetch(counter.roleId).catch(() => null);
      const channel = await guild.channels.fetch(counter.channelId).catch(() => null);

      if (!role) {
        counter.isActive = false;
        await counter.save();
        result.skipped++;
        logger.warn(`memberCounterService: licznik ${counter.id} nie ma już roli ${counter.roleId}`);
        continue;
      }

      if (!channel || !('setName' in channel) || typeof channel.setName !== 'function') {
        counter.isActive = false;
        await counter.save();
        result.skipped++;
        logger.warn(`memberCounterService: licznik ${counter.id} nie ma już kanału ${counter.channelId}`);
        continue;
      }

      const memberCount = guild.members.cache
        .filter(member => member.roles.cache.has(role.id))
        .size;
      const channelName = memberCounterChannelName(role.name, memberCount);

      if (channel.name !== channelName) {
        await channel.setName(channelName, 'Aktualizacja licznika członków');
      }

      if (
        counter.lastCount !== memberCount
        || counter.roleName !== role.name
      ) {
        counter.lastCount = memberCount;
        counter.roleName = role.name;
        await counter.save();
      }

      result.updated++;
    } catch (error) {
      result.failed++;
      logger.error(
        `memberCounterService: błąd licznika ${counter.id} na gildii ${guildId}: ${String(error)}`
      );
    }
  }

  return result;
}

/** Aktualizuje liczniki ze wszystkich gildii zapisanych w kolekcji. */
export async function updateAllMemberCounters(
  client: Client
): Promise<MemberCounterUpdateResult> {
  const guildIds = await MemberCounterModel.distinct('guildId', { isActive: true });
  const total = emptyResult();

  for (const guildId of guildIds) {
    const result = await updateMemberCountersForGuild(client, guildId);
    total.updated += result.updated;
    total.skipped += result.skipped;
    total.failed += result.failed;
  }

  return total;
}
