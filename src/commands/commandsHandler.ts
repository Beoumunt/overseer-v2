import { MessageFlags, type Client, type Interaction } from 'discord.js';
import { canUseCommand } from './commandAccess';
import * as promoteCommand from './admin/promote';
import * as recruitCommand from './admin/recruit';
import * as warnCommand from './admin/warn';
import * as warnMultipleCommand from './admin/warn-multiple';
import * as warnRemoveCommand from './admin/warn-remove';
import * as warnsClearCommand from './admin/warns-clear';
import * as warnsShowCommand from './admin/warns-show';
import * as commandManagement from './general/command-management';
import * as pingCommand from './general/ping';
import * as embedTestCommand from './misc/embed-test';
import * as testCommand from './misc/testCommand';

const commands = new Map([
  [recruitCommand.name, recruitCommand],
  [promoteCommand.name, promoteCommand],
  [warnCommand.name, warnCommand],
  [warnMultipleCommand.name, warnMultipleCommand],
  [warnRemoveCommand.name, warnRemoveCommand],
  [warnsClearCommand.name, warnsClearCommand],
  [warnsShowCommand.name, warnsShowCommand],
  [commandManagement.name, commandManagement],
  [pingCommand.name, pingCommand],
  [embedTestCommand.name, embedTestCommand],
  [testCommand.name, testCommand]
]);

export function registerCommandEvents(client: Client) {
  // Rejestrujemy jeden punkt wejścia dla wszystkich slash commandów.
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isAutocomplete()) {
      const command = commands.get(interaction.commandName);
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
    const command = commands.get(interaction.commandName);
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
