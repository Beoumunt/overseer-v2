import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { connectDatabase } from './dbConnection';

// Importujemy modele
import { RoleDefinitionModel } from './models/RoleDefinition';
import { GuildConfigModel } from './models/GuildConfig';
import { CommandConfigModel } from './models/CommandConfig';

async function seed() {
  try {
    await connectDatabase();
    logger.info('🌱 Rozpoczynam proces seedowania bazy danych...');

    // 1. Czyścimy stare dane (opcjonalnie, ale dobre przy testach)
    await RoleDefinitionModel.deleteMany({});
    await GuildConfigModel.deleteMany({});
    await CommandConfigModel.deleteMany({});

    // 2. Wstawiamy RoleDefinition (Nazwy systemowe zgodne z Member.ts)
    const roles = [
      { name: 'candidate', displayName: 'Kandydat', description: 'Nowa osoba, która musi przejść rekrutacje' },
      { name: 'recruit', displayName: 'Rekrut', description: 'Przeszedł rekrutację i oczekuje na wprowadzenie do Dark Star' },
      { name: 'darkStar', displayName: 'Dark Star', description: 'Pełnoprawny członek' },
      { name: 'diplomat', displayName: 'Dyplomata', description: 'Dyplomata Dark Star' },
      { name: 'officer', displayName: 'Oficer', description: 'Oficer gildii' },
      { name: 'liche', displayName: 'Liche', description: 'Zastępca Emperora' },
      { name: 'emperor', displayName: 'Imperator', description: 'Guild Master' },
      { name: 'enlister', displayName: 'Rekruter', description: 'Osoba zajmująca się naborem, rekruter.' }
    ];
    await RoleDefinitionModel.insertMany(roles);
    logger.info(`✅ Wstawiono ${roles.length} definicji ról.`);

    // 3. Wstawiamy CommandConfig
    const commands = [
      { name: 'warn', description: 'Nakłada warna', allowedRoles: ['officer', 'liche', 'emperor'] },
      { name: 'recruit', description: 'Akceptuje użytkownika po rekrutacji', allowedRoles: ['enlister', 'officer', 'liche', 'emperor'] },
      { name: 'promote', description: 'Promocja użytkownika po głosowym wprowadzeniu do Dark Star', allowedRoles: [ 'enlister', 'officer', 'liche', 'emperor'] }
    ];
    await CommandConfigModel.insertMany(commands);
    logger.info(`✅ Wstawiono ${commands.length} definicji komend.`);

    // 4. Wstawiamy GuildConfig dla 4 serwerów (dane z .env)
    const guilds = [
      { guildId: env.GUILD_RECRUITMENT_ID, guildName: 'DS Recruitment', enabledCommands: ['recruit'], roles: new Map() },
      { guildId: env.GUILD_MAIN_ID, guildName: 'DS Main', enabledCommands: ['warn', 'promote'], roles: new Map() },
      { guildId: env.GUILD_EMBASSY_ID, guildName: 'DS Embassy', enabledCommands: [], roles: new Map() },
      { guildId: env.GUILD_MARKET_ID, guildName: 'DS Market', enabledCommands: [], roles: new Map() }
    ];
    await GuildConfigModel.insertMany(guilds);
    logger.info(`✅ Skonfigurowano ${guilds.length} serwerów klastra.`);

    logger.info('✨ Seedowanie zakończone sukcesem!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Błąd podczas seedowania: %o', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

seed();