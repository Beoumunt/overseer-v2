import { Schema, model, Document, Types } from 'mongoose';

export interface IWarn extends Document {
    warnedMemberId: string;
    moderatorId: string;
    description: string;
    createdAt: Date;
}

const warnSchema = new Schema<IWarn>({
    warnedMemberId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}); 

export const WarnModel = model<IWarn>('Warn', warnSchema);