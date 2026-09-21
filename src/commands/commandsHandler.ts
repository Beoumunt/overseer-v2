import { MessageFlags, type Client, type Interaction } from 'discord.js';
import { canUseCommand } from './commandAccess';
import { commandMap } from './commandRegistry';

export function registerCommandEvents(client: Client) {
  // Rejestrujemy jeden punkt wejścia dla wszystkich slash commandów.
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isAutocomplete()) {
      const command = commandMap.get(interaction.commandName);
      const autocomplete = command && 'autocomplete' in command
        ? command.autocomplete
        : undefined;

      if (typeof autocomplete !== 'function') return;

      try {
        await autocomplete(interaction);
      } catch {
        await interaction.respond([]).catch(() => undefined);
      }
      return;
    }

    // Ignorujemy wszystkie interakcje, które nie są komendami tekstowymi.
    if (!interaction.isChatInputCommand()) return;

    // Wybieramy konkretną implementację komendy po nazwie.
    const command = commandMap.get(interaction.commandName);
    if (!command) return;

    try {
      // Najpierw weryfikacja dostępu i ról, potem wykonanie biznesowe.
      if (!await canUseCommand(interaction)) return;
      await command.execute(interaction, client);
    } catch (error) {
      // Zabezpieczenie, żeby użytkownik dostał czytelny komunikat o błędzie.
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Wystąpił błąd podczas wykonywania komendy.',
          flags: MessageFlags.Ephemeral
        });
      } else {
        await interaction.reply({
          content: 'Wystąpił błąd podczas wykonywania komendy.',
          flags: MessageFlags.Ephemeral
        });
      }
    }
  });
}
