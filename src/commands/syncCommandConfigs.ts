import { CommandConfigModel } from '../db/models/CommandConfig';
import { commandDefinitions } from './commandDefinitions';

export async function syncCommandConfigs() {
  for (const [name, definition] of commandDefinitions) {
    await CommandConfigModel.updateOne(
      { name },
      {
        $set: { description: definition.description },
        $setOnInsert: {
          name,
          allowedRoles: [],
          isActive: true
        }
      },
      { upsert: true }
    ).exec();
  }
}
