import type { Client } from 'discord.js';
import { MemberCounterModel } from '../../db/models/MemberCounter';
import { logger } from '../../lib/logger';
import { updateMemberCountersForGuild } from './memberCounterService';

const EVENT_DEBOUNCE_MS = 30_000;
const FULL_SYNC_INTERVAL_MS = 10 * 60 * 1000;
const STARTUP_SYNC_DELAY_MS = 60_000;
const BETWEEN_GUILDS_DELAY_MS = 1_000;

const scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>();
const queuedGuilds = new Set<string>();
const guildQueue: string[] = [];
let queueRunning = false;
let schedulerStarted = false;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Wstawia gildię do kolejki bez uruchamiania równoległych fetchów Gateway. */
function enqueueGuild(client: Client, guildId: string) {
  if (queuedGuilds.has(guildId)) return;

  queuedGuilds.add(guildId);
  guildQueue.push(guildId);
  void processQueue(client);
}

async function processQueue(client: Client) {
  if (queueRunning) return;
  queueRunning = true;

  try {
    while (guildQueue.length > 0) {
      const guildId = guildQueue.shift();
      if (!guildId) continue;

      queuedGuilds.delete(guildId);
      const result = await updateMemberCountersForGuild(client, guildId);
      const guildName = client.guilds.cache.get(guildId)?.name ?? 'nieznana gildia';
      logger.info(
        `memberCounterScheduler: ${guildId} (${guildName}): zaktualizowano ${result.updated}, pominięto ${result.skipped}, błędy ${result.failed}`
      );

      // Krótka przerwa chroni Gateway, gdy kolejka obejmuje kilka gildii.
      if (guildQueue.length > 0) await sleep(BETWEEN_GUILDS_DELAY_MS);
    }
  } catch (error) {
    logger.error(`memberCounterScheduler: błąd kolejki: ${String(error)}`);
  } finally {
    queueRunning = false;
    if (guildQueue.length > 0) void processQueue(client);
  }
}

/** Debounce: wiele zmian członków w krótkim czasie daje jedną aktualizację gildii. */
export function scheduleMemberCounterUpdate(client: Client, guildId: string) {
  const currentTimer = scheduledTimers.get(guildId);
  if (currentTimer) clearTimeout(currentTimer);

  const timer = setTimeout(() => {
    scheduledTimers.delete(guildId);
    enqueueGuild(client, guildId);
  }, EVENT_DEBOUNCE_MS);

  scheduledTimers.set(guildId, timer);
}

async function enqueueAllMemberCounterGuilds(client: Client) {
  const guildIds = await MemberCounterModel.distinct('guildId', { isActive: true });
  for (const guildId of guildIds) enqueueGuild(client, guildId);
}

/**
 * Uruchamia automatyczne odświeżanie. Funkcja jest idempotentna, aby bootstrap
 * nie utworzył dwóch timerów po ponownym podłączeniu klienta.
 */
export function startMemberCounterScheduler(client: Client) {
  if (schedulerStarted) return;
  schedulerStarted = true;

  const startupTimer = setTimeout(() => {
    void enqueueAllMemberCounterGuilds(client);
  }, STARTUP_SYNC_DELAY_MS);

  const periodicTimer = setInterval(() => {
    void enqueueAllMemberCounterGuilds(client);
  }, FULL_SYNC_INTERVAL_MS);

  logger.info('memberCounterScheduler: uruchomiono, pełna synchronizacja co 10 minut');

  return () => {
    clearTimeout(startupTimer);
    clearInterval(periodicTimer);
    for (const timer of scheduledTimers.values()) clearTimeout(timer);
    scheduledTimers.clear();
    guildQueue.length = 0;
    queuedGuilds.clear();
    schedulerStarted = false;
  };
}
