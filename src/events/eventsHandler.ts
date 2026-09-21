import { Client } from 'discord.js';
import * as memberAddEvent from './guildMemberAdd';
import * as memberRemoveEvent from './guildMemberRemove';
import * as memberUpdateEvent from './guildMemberUpdate';
import { scheduleMemberCounterUpdate } from '../services/memberCounters/memberCounterScheduler';

export function registerEvents(client: Client) {
  // Nasłuchujemy nazwy eventu (GuildMemberAdd) i odsyłamy do funkcji execute
    client.on(memberAddEvent.name, async (member) => {
      await memberAddEvent.execute(member, client);
      scheduleMemberCounterUpdate(client, member.guild.id);
    });


    client.on(memberRemoveEvent.name, async (member) => {
      await memberRemoveEvent.execute(member, client);
      scheduleMemberCounterUpdate(client, member.guild.id);
    });

    client.on(memberUpdateEvent.name, (oldMember, newMember) =>
      memberUpdateEvent.execute(oldMember, newMember, client)
    );
  
}