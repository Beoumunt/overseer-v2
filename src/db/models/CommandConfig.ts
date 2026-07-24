import { Schema, model, Document, Types } from 'mongoose';

export interface ICommandConfig extends Document {
    name: string;
    description: string;

    allowedRoles: string[];
    isActive: boolean;
}

const CommandConfigSchema = new Schema<ICommandConfig>({
    name: { type: String, unique: true, required: true },
    description: { type: String, required: true },
    allowedRoles: [{ type: String }],
    isActive: { type: Boolean, default: true }
});

export const CommandConfigModel = model<ICommandConfig>('CommandConfig', CommandConfigSchema);