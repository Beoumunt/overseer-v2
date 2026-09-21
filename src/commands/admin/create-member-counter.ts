import {
  ChannelType,
  MessageFlags,
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type Client
} from 'discord.js';
import { MemberCounterModel } from '../../db/models/MemberCounter';
import { logger } from '../../lib/logger';
import { fetchGuildMembersWithRetry } from '../../utils/discord';
import { memberCounterChannelName } from '../../utils/memberCounter';

export const definition = new SlashCommandBuilder()
  .setName('create-member-counter')
  .setDescription('Tworzy kanał pokazujący liczbę członków z wybraną rangą')
  .addStringOption(option =>
    option
      .setName('role')
      .setDescription('Ranga, której członkowie będą liczeni')
      .setRequired(true)
      .setAutocomplete(true)
  );

export const name = definition.name;

export async function autocomplete(interaction: AutocompleteInteraction) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.respond([]);
    return;
  }

  const query = interaction.options.getString('role')?.toLowerCase() ?? '';
  const roles = await guild.roles.fetch();
  const choices = roles
    .filter(role => !role.managed && role.id !== guild.id)
    .filter(role => role.name.toLowerCase().includes(query))
    .sort((left, right) => left.name.localeCompare(right.name))
    .first(25)
    .map(role => ({ name: role.name.slice(0, 100), value: role.id }));

  await interaction.respond(choices);
}

export async function execute(
  interaction: ChatInputCommandInteraction,
  _client: Client
) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({
      content: 'Ta komenda może być używana tylko na serwerze Discord.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const roleId = interaction.options.getString('role', true);
  const role = await guild.roles.fetch(roleId).catch(() => null);
  if (!role || role.managed || role.id === guild.id) {
    await interaction.reply({
      content: 'Nie znaleziono prawidłowej rangi na tym serwerze.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const existingCounter = await MemberCounterModel.findOne({
    guildId: guild.id,
    roleId
  });

  if (existingCounter?.isActive) {
    const existingChannel = await guild.channels.fetch(existingCounter.channelId).catch(() => null);
    if (existingChannel) {
      await interaction.reply({
        content: `Licznik dla rangi ${role.name} już istnieje: <#${existingChannel.id}>.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }
  }

  await fetchGuildMembersWithRetry(guild);
  const memberCount = role.members.size;
  const channelName = memberCounterChannelName(role.name, memberCount);
  let channel;

  try {
    channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      reason: `Licznik członków rangi ${role.name} utworzony przez ${interaction.user.tag}`
    });

    if (existingCounter) {
      existingCounter.channelId = channel.id;
      existingCounter.roleName = role.name;
      existingCounter.createdBy = interaction.user.id;
      existingCounter.isActive = true;
      existingCounter.lastCount = memberCount;
      await existingCounter.save();
    } else {
      await MemberCounterModel.create({
        guildId: guild.id,
        roleId: role.id,
        roleName: role.name,
        channelId: channel.id,
        createdBy: interaction.user.id,
        isActive: true,
        lastCount: memberCount
      });
    }
  } catch (error) {
    if (channel) await channel.delete('Nie udało się zapisać konfiguracji licznika').catch(() => undefined);

    logger.error(
      `create-member-counter: błąd dla gildii ${guild.id}, roli ${role.id}: ${String(error)}`
    );
    await interaction.reply({
      content: 'Nie udało się utworzyć licznika. Sprawdź uprawnienia bota i spróbuj ponownie.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await interaction.reply({
    content: `Utworzono licznik dla rangi ${role.name}: <#${channel.id}>.`,
    flags: MessageFlags.Ephemeral
  });
}
