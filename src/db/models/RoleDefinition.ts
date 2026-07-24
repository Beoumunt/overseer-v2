import { Schema, model, Document, Types } from 'mongoose';

export interface IRoleDefinition extends Document {
    name: string;
    displayName: string; // czytelna nazwa, np. "Dark Star", "Dyplomata"
    description: string;
    isActive: boolean; // czy rola jest aktywna w systemie
    createdAt: Date;
}

const RoleDefinitionSchema = new Schema<IRoleDefinition>({
    name: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export const RoleDefinitionModel = model<IRoleDefinition>('RoleDefinition', RoleDefinitionSchema);