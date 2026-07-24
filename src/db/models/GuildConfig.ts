import { Schema, model, Document, Types } from 'mongoose';

export interface IGuildConfig extends Document {
    guildId: string;         // ID serwera Discord
    guildName: string;      // Nazwa serwera Discord

    enabledCommands: string[];

    roles: Map<string, string>;
}

const GuildConfigSchema = new Schema<IGuildConfig>({
    guildId: { type: String, required: true, unique: true },
    guildName: { type: String, required: true },
    enabledCommands: [{ type: String }],
    roles: {
        type: Map,
        of: { type: String }
    }
}); 

export const GuildConfigModel = model<IGuildConfig>('GuildConfig', GuildConfigSchema);