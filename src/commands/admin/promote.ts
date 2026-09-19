import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type Client } from 'discord.js';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { MemberModel } from '../../db/models/Member';
import { syncMember } from '../../sync/syncMembers';
import { getMemberFromGuild, getRoleFromClient } from '../../utils/discord';
import { getServerId } from '../../utils/membership';
import { memberHasRole } from '../../utils/dbRoles';
import { logger } from '../../lib/logger';

export const definition = new SlashCommandBuilder()
  .setName('promote')
  .setDescription('Promuje rekruta do Dark Star')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Użytkownik do awansowania')
      .setRequired(true)
  );

export const name = definition.name;

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  // Punkt wejścia: komenda awansuje użytkownika z recruit do darkStar.
  const mainGuildId = getServerId('main');
  if (!mainGuildId) {
    await interaction.reply({
      content: 'Brak konfiguracji serwera głównego.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Pobieramy wskazanego użytkownika i sprawdzamy, czy istnieje na głównej gildii.
  const targetUser = interaction.options.getUser('user', true);
  const mainGuild = await client.guilds.fetch(mainGuildId);
  const targetMember = await getMemberFromGuild(mainGuild, targetUser.id);

  if (!targetMember) {
    await interaction.reply({
      content: 'Ten użytkownik nie znajduje się na serwerze głównym.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Awans jest dozwolony tylko dla użytkownika, który ma w bazie rolę recruit.
  const memberRecord = await MemberModel.findOne({
    discordId: targetUser.id
  }).lean();

  if (!memberRecord?.mainRoles?.includes('recruit')) {
    await interaction.reply({
      content: 'Ten użytkownik nie ma rangi recruit w bazie danych.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Pobieramy konfig ról dla serwera głównego: darkStar i ewentualnie recruit.
  const guildConfig = await GuildConfigModel.findOne({
    guildId: mainGuildId
  }).lean();
  const darkStarRoleId = guildConfig?.roles?.darkStar;
  const recruitRoleId = guildConfig?.roles?.recruit;

  if (!darkStarRoleId) {
    await interaction.reply({
      content: 'Brak skonfigurowanej rangi darkStar.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const darkStarRole = await getRoleFromClient(
    client,
    mainGuildId,
    darkStarRoleId
  );

  if (!darkStarRole) {
    await interaction.reply({
      content: 'Nie znaleziono rangi darkStar na serwerze głównym.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Idempotentność: nie awansujemy użytkownika, który już ma rangę darkStar.
  const alreadyHasDarkStar = await memberHasRole(
    targetUser.id,
    ['darkStar'],
    'any'
  );

  if (alreadyHasDarkStar) {
    await interaction.reply({
      content: `Użytkownik ${targetUser.tag} ma już rangę darkStar.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Nadanie nowej rangi i usunięcie starej, jeśli rola recruit jest jeszcze przypisana.
  await targetMember.roles.add(
    darkStarRole,
    `Awans przez ${interaction.user.tag}`
  );

  if (recruitRoleId) {
    const recruitRole = await getRoleFromClient(
      client,
      mainGuildId,
      recruitRoleId
    );

    if (recruitRole) {
      await targetMember.roles.remove(
        recruitRole,
        `Awans do Dark Star przez ${interaction.user.tag}`
      );
    }
  }

  // Po udanym awansie zapisujemy zdarzenie i synchronizujemy bazę danych z Discordem.
  logger.info(`command_promote: Użytkownik ${targetUser.tag} został awansowany do Dark Star przez ${interaction.user.tag}`);

  await syncMember(targetMember);

  await interaction.reply(
    `✅ **Użytkownik ${targetUser.username} otrzymał niezbędne rangi!**\n` +
    `👤 **Nadano przez:** ${interaction.user.username}\n`
  );
}
