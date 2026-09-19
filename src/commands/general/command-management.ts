import {
  MessageFlags,
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction
} from 'discord.js';
import { CommandConfigModel } from '../../db/models/CommandConfig';
import { GuildConfigModel } from '../../db/models/GuildConfig';
import { RoleDefinitionModel } from '../../db/models/RoleDefinition';
import { registerGuildCommandsForGuild } from '../commandRegistrar';
import {
  autocompleteCommandNames,
  autocompleteGuilds,
  autocompleteRoleNames
} from '../commandOptions';

export const definition = new SlashCommandBuilder()
  .setName('command-management')
  .setDescription('Zarzadza dostepem komend do rol i serwerow')
  .addStringOption(option =>
    option
      .setName('command')
      .setDescription('Komenda, ktorej konfiguracje zmieniasz')
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addStringOption(option =>
    option
      .setName('action')
      .setDescription('Operacja do wykonania')
      .setRequired(true)
      .addChoices(
        { name: 'add', value: 'add' },
        { name: 'remove', value: 'remove' }
      )
  )
  .addStringOption(option =>
    option
      .setName('target')
      .setDescription('Rodzaj zmienianego dostepu')
      .setRequired(true)
      .addChoices(
        { name: 'role', value: 'role' },
        { name: 'server', value: 'server' }
      )
  )
  .addStringOption(option =>
    option
      .setName('value')
      .setDescription('Rola albo serwer')
      .setRequired(true)
      .setAutocomplete(true)
  );

export const name = definition.name;

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'command') {
    await autocompleteCommandNames(interaction);
    return;
  }

  if (focusedOption.name !== 'value') {
    await interaction.respond([]);
    return;
  }

  const target = interaction.options.getString('target');
  if (target === 'role') {
    await autocompleteRoleNames(interaction);
    return;
  }

  if (target === 'server') {
    await autocompleteGuilds(interaction);
    return;
  }

  await interaction.respond([]);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const commandName = interaction.options.getString('command', true);
  const action = interaction.options.getString('action', true);
  const target = interaction.options.getString('target', true);
  const value = interaction.options.getString('value', true);

  const commandConfig = await CommandConfigModel.findOne({
    name: commandName,
    isActive: true
  });

  if (!commandConfig) {
    await interaction.reply({
      content: 'Nie znaleziono aktywnej komendy.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (target === 'role') {
    await updateRoleAccess(interaction, commandConfig, action, value);
    return;
  }

  if (target === 'server') {
    await updateServerAccess(interaction, commandConfig.name, action, value);
    return;
  }

  await interaction.reply({
    content: 'Nieprawidlowy rodzaj dostepu.',
    flags: MessageFlags.Ephemeral
  });
}

async function updateRoleAccess(
  interaction: ChatInputCommandInteraction,
  commandConfig: { name: string; allowedRoles: string[]; save: () => Promise<unknown> },
  action: string,
  roleName: string
) {
  const roleDefinition = await RoleDefinitionModel.findOne({
    name: roleName,
    isActive: true
  }).lean();

  if (!roleDefinition) {
    await interaction.reply({
      content: 'Nie znaleziono aktywnej roli systemowej.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const hasRole = commandConfig.allowedRoles.includes(roleDefinition.name);
  if (action === 'add' && hasRole) {
    await interaction.reply({
      content: `Rola ${roleDefinition.displayName} ma juz dostep do komendy ${commandConfig.name}.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (action === 'remove' && !hasRole) {
    await interaction.reply({
      content: `Rola ${roleDefinition.displayName} nie ma dostepu do komendy ${commandConfig.name}.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  commandConfig.allowedRoles = action === 'add'
    ? [...commandConfig.allowedRoles, roleDefinition.name]
    : commandConfig.allowedRoles.filter(role => role !== roleDefinition.name);
  await commandConfig.save();

  await interaction.reply({
    content: `${action === 'add' ? 'Dodano' : 'Usunieto'} role ${roleDefinition.displayName} ${action === 'add' ? 'do' : 'z'} komendy ${commandConfig.name}.`,
    flags: MessageFlags.Ephemeral
  });
}

async function updateServerAccess(
  interaction: ChatInputCommandInteraction,
  commandName: string,
  action: string,
  guildId: string
) {
  const guildConfig = await GuildConfigModel.findOne({ guildId });
  if (!guildConfig) {
    await interaction.reply({
      content: 'Nie znaleziono skonfigurowanego serwera.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const isEnabled = guildConfig.enabledCommands.includes(commandName);
  if (action === 'add' && isEnabled) {
    await interaction.reply({
      content: `Komenda ${commandName} jest juz wlaczona na serwerze ${guildConfig.guildName}.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (action === 'remove' && !isEnabled) {
    await interaction.reply({
      content: `Komenda ${commandName} nie jest wlaczona na serwerze ${guildConfig.guildName}.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  guildConfig.enabledCommands = action === 'add'
    ? [...guildConfig.enabledCommands, commandName]
    : guildConfig.enabledCommands.filter(command => command !== commandName);
  await guildConfig.save();
  await registerGuildCommandsForGuild(guildConfig.guildId);

  await interaction.reply({
    content: `${action === 'add' ? 'Wlaczono' : 'Wylaczono'} komende ${commandName} na serwerze ${guildConfig.guildName}.`,
    flags: MessageFlags.Ephemeral
  });
}