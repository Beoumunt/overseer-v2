import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type Client } from 'discord.js';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { syncMember } from '../../sync/syncMembers';
import { getMemberFromGuild, getRoleFromClient } from '../../utils/discord';
import { getServerId } from '../../utils/membership';
import { memberHasRole } from '../../utils/dbRoles';
import { logger } from '../../lib/logger';

export const definition = new SlashCommandBuilder()
  .setName('recruit')
  .setDescription('Akceptuje użytkownika po rekrutacji')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Użytkownik do zaakceptowania')
      .setRequired(true)
  );

export const name = definition.name;

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  // Punkt wejścia: komenda akceptuje użytkownika po rekrutacji i nadaje mu rangę recruit.
  const recruitmentGuildId = getServerId('recruitment');
  if (!recruitmentGuildId) {
    await interaction.reply({
      content: 'Brak konfiguracji serwera rekrutacyjnego.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Sprawdzamy, czy wskazany użytkownik jest obecny na serwerze rekrutacyjnym.
  const targetUser = interaction.options.getUser('user', true);
  const recruitmentGuild = await client.guilds.fetch(recruitmentGuildId);
  const targetMember = await getMemberFromGuild(recruitmentGuild, targetUser.id);

  if (!targetMember) {
    await interaction.reply({
      content: 'Ten użytkownik nie znajduje się na serwerze rekrutacyjnym.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Pobieramy role konfiguracyjne dla rekrutacji: candidate i recruit.
  const guildConfig = await GuildConfigModel.findOne({
    guildId: recruitmentGuildId
  }).lean();
  const candidateRoleId = guildConfig?.roles?.candidate;
  const recruitRoleId = guildConfig?.roles?.recruit;

  if (!recruitRoleId) {
    await interaction.reply({
      content: 'Brak skonfigurowanej rangi recruit.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const recruitRole = await getRoleFromClient(
    client,
    recruitmentGuildId,
    recruitRoleId
  );

  if (!recruitRole) {
    await interaction.reply({
      content: 'Nie znaleziono rangi recruit na serwerze rekrutacyjnym.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Idempotentność: użytkownik nie może zostać ponownie zaakceptowany jako recruit.
  const alreadyHasRecruit = await memberHasRole(
    targetUser.id,
    ['recruit'],
    'any'
  );

  if (alreadyHasRecruit) {
    await interaction.reply({
      content: `Użytkownik ${targetUser.tag} ma już rangę recruit.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Nadanie rangi recruit i usunięcie roli kandydata, jeśli była przypisana.
  await targetMember.roles.add(
    recruitRole,
    `Rekrutacja zaakceptowana przez ${interaction.user.tag}`
  );

  if (candidateRoleId) {
    const candidateRole = await getRoleFromClient(
      client,
      recruitmentGuildId,
      candidateRoleId
    );

    if (candidateRole) {
      await targetMember.roles.remove(
        candidateRole,
        `Rekrutacja zaakceptowana przez ${interaction.user.tag}`
      );
    }
  }

  // Po udanym awansie zapisujemy zdarzenie i synchronizujemy bazę danych z Discordem.
  logger.info(`command_recruit: Użytkownik ${targetUser.tag} został zaakceptowany jako recruit przez ${interaction.user.tag}`);

  // Po zakończeniu rekrutacji synchronizujemy stan członka z bazą danych.
  await syncMember(targetMember);

  await interaction.reply(
    `✅ **Użytkownik ${targetUser.username} przeszedł rekrutacje!**\n` +
    `👤 **Nadano przez:** ${interaction.user.username}\n`
  );
}
