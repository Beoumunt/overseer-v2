import { GuildConfigModel } from '../db/models/GuildConfig';
import { registerGuildCommandsForGuild } from './commandRegistrar';

export { registerGuildCommandsForGuild } from './commandRegistrar';

export async function registerGuildCommands() {
  const guildConfigs = await GuildConfigModel.find().lean();

  // Rejestracja startowa używa tej samej logiki co odświeżenie pojedynczej gildii.
  for (const guildConfig of guildConfigs) {
    await registerGuildCommandsForGuild(guildConfig.guildId);
  }
}
