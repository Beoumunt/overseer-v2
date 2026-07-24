import { Schema, model, Document } from 'mongoose';

// 1. Interfejs dla TypeScript (podpowiadanie składni)
export interface IMember extends Document {
    discordId: string;
    username: string;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
    // Tablica nazw ról z RoleDefinition (np. ["officer", "darkStar"])
    mainRoles: string[]; 
    memberships: Map<string, {
        isPresent: boolean;
        joinedAt: Date | null;
        leftAt: Date | null;
        lastSyncedAt: Date;
    }>;
}

// 2. Schemat dla MongoDB (walidacja danych na poziomie bazy)
const memberSchema = new Schema<IMember>({
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    displayName: { type: String },
    mainRoles: [{ type: String }], // Tablica stringów
    memberships: {
        type: Map,
        of: new Schema({
            isPresent: { type: Boolean, default: false },
            joinedAt: { type: Date, default: null },
            leftAt: { type: Date, default: null },
            lastSyncedAt: { type: Date, default: Date.now }
        }, { _id: false })
    }
}, { 
    timestamps: true // Automatycznie tworzy i aktualizuje createdAt oraz updatedAt
});

// 3. Model (eksportujemy go, by używać w innych plikach)
export const MemberModel = model<IMember>('Member', memberSchema);