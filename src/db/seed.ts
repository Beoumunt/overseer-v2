import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { connectDatabase } from './dbConnection';

// Importujemy modele
import { RoleDefinitionModel } from './models/RoleDefinition';
import { GuildConfigModel } from './models/GuildConfig';
import { CommandConfigModel } from './models/CommandConfig';

async function seed() {
  try {
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
      { name: 'warn',    description: 'Nakłada warna',                                                  allowedRoles: [ 'officer', 'liche', 'emperor' ]},
      { name: 'warn-multiple', description: 'Nakłada warna wielu użytkownikom',                         allowedRoles: [ 'officer', 'liche', 'emperor' ]},
      { name: 'warn-remove', description: 'Usuwa wybranego warna użytkownika',                           allowedRoles: [ 'officer', 'liche', 'emperor' ]},
      { name: 'warns-clear', description: 'Usuwa wszystkie warny użytkownika',                          allowedRoles: [ 'officer', 'liche', 'emperor' ]},
      { name: 'warns-show', description: 'Wyświetla wszystkie warny użytkownika',                       allowedRoles: [ 'officer', 'liche', 'emperor' ]},
      { name: 'recruit', description: 'Akceptuje użytkownika po rekrutacji',                            allowedRoles: [ 'enlister', 'officer', 'liche', 'emperor' ]},
      { name: 'promote', description: 'Promocja użytkownika po głosowym wprowadzeniu do Dark Star',     allowedRoles: [ 'enlister', 'officer', 'liche', 'emperor' ]},
      { name: 'command-management', description: 'Zarządza dostępem komend do ról i serwerów',          allowedRoles: [ 'emperor' ]}
    ];
    await CommandConfigModel.insertMany(commands);
    logger.info(`✅ Wstawiono ${commands.length} definicji komend.`);

    // 4. Wstawiamy GuildConfig dla 4 serwerów (dane z .env)
    // Uwaga: role oraz channels w GuildConfig są puste, zostaną uzupełnione w seedRanksId() oraz seedChannelsId()
    const guilds = [
      { guildId: env.GUILD_RECRUITMENT_ID, guildName: 'DS Recruitment',   enabledCommands: ['recruit'],         roles: new Map(), channels: new Map(), },
      { guildId: env.GUILD_MAIN_ID, guildName: 'DS Main',                 enabledCommands: ['warn', 'warn-multiple', 'warn-remove', 'warns-clear', 'warns-show', 'promote', 'command-management'], roles: new Map(), channels: new Map(), },
      { guildId: env.GUILD_EMBASSY_ID, guildName: 'DS Embassy',           enabledCommands: [],                  roles: new Map(), channels: new Map(), },
      { guildId: env.GUILD_MARKET_ID, guildName: 'DS Market',             enabledCommands: [],                  roles: new Map(), channels: new Map(), }
    ];
    await GuildConfigModel.insertMany(guilds);
    logger.info(`✅ Skonfigurowano ${guilds.length} serwerów klastra.`);

    logger.info('✨ Seedowanie zakończone sukcesem!');
  } catch (error) {
    logger.error('❌ Błąd podczas seedowania: %o', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function seedRanksIds(): Promise<number> {
  const GUILD_ROLE_MAP: Record<string, Record<string, string>> = {
    [String(env.GUILD_MAIN_ID)]: { // main
      candidate:  '',
      recruit:    '1289877668539400198',
      guest:      '1289877668539400199',
      darkStar:   '1289877668539400201',
      enlister:   '1289877668548051011',
      diplomat:   '1289877668548051013',
      ambassador: '1289877668539400200',
      officer:    '1289877668560506903',
      liche:      '1289877668560506904',
      emperor:    '1289877668560506905'
    },
    [String(env.GUILD_RECRUITMENT_ID)]: { // recru
      candidate:  '1530508653537263686',
      recruit:    '1530508688828403762',
      guest:      '',
      darkStar:   '',
      enlister:   '1530508517629235250',
      diplomat:   '',
      ambassador: '',
      officer:    '',
      liche:      '',
      emperor:    ''
    },
    [String(env.GUILD_MARKET_ID)]: { // market
      candidate:  '',
      recruit:    '',
      guest:      '',
      darkStar:   '',
      enlister:   '',
      diplomat:   '',
      ambassador: '',
      officer:    '',
      liche:      '',
      emperor:    ''
    },
    [String(env.GUILD_EMBASSY_ID)]: { // embassy
      candidate:  '',
      recruit:    '',
      guest:      '',
      darkStar:   '',
      enlister:   '',
      diplomat:   '',
      ambassador: '',
      officer:    '',
      liche:      '',
      emperor:    ''
    },
  };

  const entries = Object.entries(GUILD_ROLE_MAP);
  if (entries.length === 0) {
    return 0;
  }

  let updatedCount = 0;
  for (const [guildId, rolesMap] of entries) {
    try {
      if (!guildId) {
        continue;
      }

      logger.debug('seedRanksIds: updating %o', { guildId, rolesCount: Object.keys(rolesMap).length });

      await GuildConfigModel.findOneAndUpdate(
        { guildId },
        {
          $set: { roles: rolesMap },
          $setOnInsert: { guildName: '', enabledCommands: [] }
        },
        { upsert: true }
      ).exec();
      logger.info(`seedRanksIds: zaktualizowano/utworzono GuildConfig dla ${guildId}`);
      updatedCount++;
    } catch (error) {
      logger.error(`seedRanksIds: błąd przy aktualizacji GuildConfig ${guildId}: %o`, error instanceof Error ? error.message : String(error));
    }
  }

  logger.info(`seedRanksIds: zakończono — zaktualizowano ${updatedCount} wpisów.`);
  return updatedCount;
}

export async function seedChannelsId(): Promise<number> {
  const GUILD_CHANNEL_MAP: Record<string, Record<string, string>> = {
    [String(env.GUILD_MAIN_ID)]: {
      welcome:        '1289877668812296264',
      note:           '1289877668812296267',
      news:           '1289877668812296268'
    },
    [String(env.GUILD_RECRUITMENT_ID)]: {
      welcome:        '1529732575684329554'
    },
    [String(env.GUILD_MARKET_ID)]: {
      announcements:  '1529784832115216516'
    },
    [String(env.GUILD_EMBASSY_ID)]: {
      welcome:        '1529732829330804779',
      botRaport:      '1530650084075765831'
    }
  };

  const entries = Object.entries(GUILD_CHANNEL_MAP);
  if (entries.length === 0) return 0;

  let updatedCount = 0;

  for (const [guildId, channelsMap] of entries) {
    try {
      if (!guildId) continue;

      await GuildConfigModel.findOneAndUpdate(
        { guildId },
        {
          $set: { channels: channelsMap },
          $setOnInsert: { guildName: '', enabledCommands: [] }
        },
        { upsert: true, new: true }
      ).exec();

      logger.info(`seedChannelsId: zaktualizowano/utworzono GuildConfig.channels dla ${guildId}`);
      updatedCount++;
    } catch (error) {
      logger.error(
        `seedChannelsId: błąd przy aktualizacji GuildConfig ${guildId}: %o`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  logger.info(`seedChannelsId: zakończono — zaktualizowano ${updatedCount} wpisów.`);
  return updatedCount;
}

async function runAll() {
  try {
    logger.info('runAll: łączenie z bazą danych...');
    await connectDatabase();
    logger.info('runAll: połączono z bazą.');

    logger.info('runAll: uruchamiam seed()...');
    await seed();
    logger.info('runAll: seed() zakończony.');

    logger.info('runAll: uruchamiam seedRanksIds()...');
    const updated = await seedRanksIds();
    logger.info(`runAll: seedRanksIds() zakończone, zaktualizowano ${updated} wpisów.`);

    logger.info('runAll: uruchamiam seedChannelsId()...');
    const updatedChannels = await seedChannelsId();
    logger.info(`runAll: seedChannelsId() zakończone, zaktualizowano ${updatedChannels} wpisów.`);

    logger.info('runAll: wszystkie operacje zakończone pomyślnie.');
    process.exit(0);
  } catch (err) {
    logger.error('runAll: błąd: %o', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

runAll();