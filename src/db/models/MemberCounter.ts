import { Schema, model, Document } from 'mongoose';

export interface IMemberCounter extends Document {
  guildId: string;
  roleId: string;
  roleName: string;
  channelId: string;
  createdBy: string;
  isActive: boolean;
  lastCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const memberCounterSchema = new Schema<IMemberCounter>({
  guildId: { type: String, required: true },
  roleId: { type: String, required: true },
  roleName: { type: String, required: true },
  channelId: { type: String, required: true },
  createdBy: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastCount: { type: Number, default: null }
}, {
  timestamps: true
});

memberCounterSchema.index({ guildId: 1, roleId: 1 }, { unique: true });

export const MemberCounterModel = model<IMemberCounter>(
  'MemberCounter',
  memberCounterSchema
);
