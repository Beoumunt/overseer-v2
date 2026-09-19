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

export const commandDefinitions = new Map([
  [recruitCommand.name, recruitCommand.definition],
  [promoteCommand.name, promoteCommand.definition],
  [warnCommand.name, warnCommand.definition],
  [warnMultipleCommand.name, warnMultipleCommand.definition],
  [warnRemoveCommand.name, warnRemoveCommand.definition],
  [warnsClearCommand.name, warnsClearCommand.definition],
  [warnsShowCommand.name, warnsShowCommand.definition],
  [commandManagement.name, commandManagement.definition],
  [pingCommand.name, pingCommand.definition],
  [embedTestCommand.name, embedTestCommand.definition],
  [testCommand.name, testCommand.definition]
]);