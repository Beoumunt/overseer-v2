import { Client, GatewayIntentBits } from 'discord.js';
import { syncAllMembersOnStartup } from './sync/syncAllMembersOnStartup';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { connectDatabase } from './db/dbConnection';
import { registerEvents } from './events/eventsHandler';
import { registerCommandEvents } from './commands/commandsHandler';
import { registerGuildCommands } from './commands/registerCommands';
import { syncCommandConfigs } from './commands/syncCommandConfigs';

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

  // Rejestrujemy definicje komend w bazie, ale nie nadajemy im dostępu.
  await syncCommandConfigs();

  // 2. Obsługa gotowości bota
  client.once('clientReady', async () => {
    logger.info(`✅ Overseer v2.0 zalogowany jako ${client.user?.tag}`);

    void registerGuildCommands().catch((error) => {
      logger.error('Błąd podczas synchronizacji komend: %o', error);
    });

    await syncAllMembersOnStartup(client);
  });

  // 3. Zarejestruj eventy
  registerEvents(client);
  registerCommandEvents(client);

  // 4. Logowanie
  await client.login(env.DISCORD_TOKEN);
}

bootstrap().catch((err) => {
  logger.error('🔥 Fatalny błąd podczas startu: %o', err);
});
