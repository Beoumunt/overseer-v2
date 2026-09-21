import { REST, Routes, type APIApplicationCommand } from 'discord.js';
import { GuildConfigModel } from '../db/models/GuildConfig';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { commandDefinitions } from './commandRegistry';

type CommandDefinition = {
  name: string;
  description: string;
  type?: number;
  options?: unknown[];
};

const comparableOptionFields = [
  'type',
  'name',
  'description',
  'required',
  'autocomplete',
  'channel_types',
  'min_value',
  'max_value',
  'min_length',
  'max_length'
] as const;

function comparableOption(option: unknown): Record<string, unknown> {
  const source = option as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const field of comparableOptionFields) {
    if (source[field] !== undefined) result[field] = source[field];
  }

  if (Array.isArray(source.options)) {
    result.options = source.options.map(comparableOption);
  }

  if (Array.isArray(source.choices)) {
    result.choices = source.choices.map((choice) => {
      const value = choice as Record<string, unknown>;
      return { name: value.name, value: value.value };
    });
  }

  return result;
}

function comparableCommand(command: APIApplicationCommand | CommandDefinition) {
  return {
    name: command.name,
    description: command.description,
    type: command.type,
    options: (command.options ?? []).map(comparableOption)
  };
}

function commandsMatch(
  currentCommands: APIApplicationCommand[],
  desiredCommands: CommandDefinition[]
) {
  if (currentCommands.length !== desiredCommands.length) return false;

  const current = currentCommands
    .map(comparableCommand)
    .sort((left, right) => String(left.name).localeCompare(String(right.name)));
  const desired = desiredCommands
    .map(comparableCommand)
    .sort((left, right) => String(left.name).localeCompare(String(right.name)));

  return JSON.stringify(current) === JSON.stringify(desired);
}

export async function registerGuildCommandsForGuild(guildId: string) {
  const guildConfig = await GuildConfigModel.findOne({ guildId }).lean();
  if (!guildConfig) {
    throw new Error(`Brak konfiguracji gildii ${guildId}`);
  }

  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  const commands = guildConfig.enabledCommands
    .map(commandName => commandDefinitions.get(commandName))
    .filter((command): command is NonNullable<typeof command> => Boolean(command))
    .map(command => command.toJSON());

  const route = Routes.applicationGuildCommands(env.CLIENT_ID, guildId);
  const registeredCommands = await rest.get(route) as APIApplicationCommand[];

  if (commandsMatch(registeredCommands, commands)) {
    logger.info(`Komendy dla gildii ${guildId} są aktualne, pomijam rejestrację`);
    return;
  }

  await rest.put(route, { body: commands });
  logger.info(`Zarejestrowano ${commands.length} komend dla gildii ${guildId}`);
}