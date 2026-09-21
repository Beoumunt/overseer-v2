import * as promoteCommand from './admin/promote';
import * as banCommand from './admin/ban';
import * as recruitCommand from './admin/recruit';
import * as warnCommand from './admin/warn';
import * as warnMultipleCommand from './admin/warn-multiple';
import * as warnRemoveCommand from './admin/warn-remove';
import * as warnsClearCommand from './admin/warns-clear';
import * as warnsShowCommand from './admin/warns-show';
import * as createMemberCounterCommand from './admin/create-member-counter';
import * as updateMemberCountersCommand from './admin/update-member-counters';
import * as commandManagement from './general/command-management';
import * as pingCommand from './general/ping';
import * as embedTestCommand from './misc/embed-test';
import * as hailDarkStarCommand from './misc/hail-dark-star';
import * as testCommand from './misc/testCommand';

/**
 * Jedyna lista modułów komend w aplikacji.
 * Dodając nową komendę, dopisujemy import i jeden wpis tutaj.
 */
export const commandModules = [
  recruitCommand,
  promoteCommand,
  banCommand,
  warnCommand,
  warnMultipleCommand,
  warnRemoveCommand,
  warnsClearCommand,
  warnsShowCommand,
  createMemberCounterCommand,
  updateMemberCountersCommand,
  commandManagement,
  pingCommand,
  embedTestCommand,
  hailDarkStarCommand,
  testCommand
] as const;

/** Mapa używana do uruchamiania execute() i obsługi autocomplete. */
export const commandMap = new Map(
  commandModules.map(command => [command.name, command])
);

/** Mapa definicji używana podczas rejestracji komend przez Discord REST API. */
export const commandDefinitions = new Map(
  commandModules.map(command => [command.name, command.definition])
);
