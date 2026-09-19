import type { AutocompleteInteraction } from 'discord.js';
import { CommandConfigModel } from '../db/models/CommandConfig';
import { GuildConfigModel } from '../db/models/GuildConfig';
import { RoleDefinitionModel } from '../db/models/RoleDefinition';

export async function autocompleteCommandNames(
  interaction: AutocompleteInteraction
) {
  const query = interaction.options.getFocused().toLowerCase();
  const commands = await CommandConfigModel.find({
    isActive: true,
    name: { $regex: query, $options: 'i' }
  })
    .sort({ name: 1 })
    .limit(25)
    .lean();

  await interaction.respond(
    commands.map(command => ({ name: command.name, value: command.name }))
  );
}

export async function autocompleteRoleNames(
  interaction: AutocompleteInteraction
) {
  const query = interaction.options.getFocused().toLowerCase();
  const roles = await RoleDefinitionModel.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { displayName: { $regex: query, $options: 'i' } }
    ]
  })
    .sort({ name: 1 })
    .limit(25)
    .lean();

  await interaction.respond(
    roles.map(role => ({ name: role.displayName, value: role.name }))
  );
}

export async function autocompleteGuilds(
  interaction: AutocompleteInteraction
) {
  const query = interaction.options.getFocused().toLowerCase();
  const guilds = await GuildConfigModel.find({
    $or: [
      { guildName: { $regex: query, $options: 'i' } },
      { guildId: { $regex: query, $options: 'i' } }
    ]
  })
    .sort({ guildName: 1 })
    .limit(25)
    .lean();

  await interaction.respond(
    guilds.map(guild => ({ name: guild.guildName, value: guild.guildId }))
  );
}