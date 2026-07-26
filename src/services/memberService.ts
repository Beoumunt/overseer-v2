import { GuildMember } from 'discord.js';
import { MemberModel } from '../db/models/Member';
import { logger } from '../lib/logger';

export type MembershipState = {
  isPresent: boolean;
  joinedAt: Date | null;
  leftAt: Date | null;
  lastSyncedAt: Date;
};

export type MembershipsIncoming = Record<string, MembershipState>;

export type SyncMemberPayload = {
  member: GuildMember;
  memberships: MembershipsIncoming;
  mainRoles: string[];
};

export async function upsertMember(payload: SyncMemberPayload) {
  const { member, memberships, mainRoles } = payload;
  const now = new Date();

  const doc = await MemberModel.findOneAndUpdate(
    { discordId: member.id },
    {
      $set: {
        username: member.user.username,
        displayName: member.displayName,
        updatedAt: now,
        mainRoles,
        memberships,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, new: true }
  ).exec();

  logger.info(
    `upsertMember: zsynchronizowano ${member.user.tag}, roleCount: ${mainRoles.length}`
  );

  return doc;
}