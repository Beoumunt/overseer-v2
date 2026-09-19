import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';
import { CommandConfigModel } from '../db/models/CommandConfig';
import { GuildConfigModel } from '../db/models/GuildConfig';
import { memberHasRole } from '../utils/dbRoles';

export async function canUseCommand(
  interaction: ChatInputCommandInteraction
): Promise<boolean> {
  // Komenda może być uruchomiona tylko w kontekście serwera Discord.
  if (!interaction.guildId) {
    await interaction.reply({
      content: 'Ta komenda może być używana tylko na serwerze Discord.',
      flags: MessageFlags.Ephemeral
    });
    return false;
  }

  // Najpierw sprawdzamy konfigurację gildii i aktywność komendy.
  const [guildConfig, commandConfig] = await Promise.all([
    GuildConfigModel.findOne({ guildId: interaction.guildId }).lean(),
    CommandConfigModel.findOne({
      name: interaction.commandName,
      isActive: true
    }).lean()
  ]);

  // Jeśli brak konfiguracji lub komenda nie jest aktywna, blokujemy dostęp.
  if (!guildConfig || !commandConfig) {
    await interaction.reply({
      content: 'Ta komenda nie jest dostępna.',
      flags: MessageFlags.Ephemeral
    });
    return false;
  }

  // Weryfikacja, czy dana komenda jest włączona na tej gildii.
  if (!guildConfig.enabledCommands.includes(interaction.commandName)) {
    await interaction.reply({
      content: 'Ta komenda nie jest dostępna na tym serwerze.',
      flags: MessageFlags.Ephemeral
    });
    return false;
  }

  // Ostatni warunek: użytkownik musi mieć co najmniej jedną z dozwolonych ról.
  if (!await memberHasRole(interaction.user.id, commandConfig.allowedRoles, 'any')) {
    await interaction.reply({
      content: 'Nie masz uprawnień do użycia tej komendy.',
      flags: MessageFlags.Ephemeral
    });
    return false;
  }

  return true;
}
