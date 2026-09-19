import { Client } from 'discord.js';
import * as memberAddEvent from './guildMemberAdd';
import * as memberRemoveEvent from './guildMemberRemove';

export function registerEvents(client: Client) {
  // Nasłuchujemy nazwy eventu (GuildMemberAdd) i odsyłamy do funkcji execute
    client.on(memberAddEvent.name, (member) => memberAddEvent.execute(member, client));


    client.on(memberRemoveEvent.name, (member) => memberRemoveEvent.execute(member, client));
  
}