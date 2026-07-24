import { Client, GatewayIntentBits } from 'discord.js';
import { syncAllMembersOnStartup } from './services/syncMembers';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { connectDatabase } from './db/dbConnection';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

async function bootstrap() {
  // 1. Połącz z bazą
  await connectDatabase();

  // 2. Obsługa gotowości bota
  client.once('clientReady', async () => {
    logger.info(`✅ Overseer v2.0 zalogowany jako ${client.user?.tag}`);

    await syncAllMembersOnStartup(client);
  });

  // 3. Logowanie
  await client.login(env.DISCORD_TOKEN);
}

bootstrap().catch((err) => {
  logger.error('🔥 Fatalny błąd podczas startu: %o', err);
});