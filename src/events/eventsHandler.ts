import { Client } from 'discord.js';
import * as memberAddEvent from './guildMemberAdd';

export function registerEvents(client: Client) {
  // Nasłuchujemy nazwy eventu (GuildMemberAdd) i odsyłamy do funkcji execute
    client.on(memberAddEvent.name, (member) => memberAddEvent.execute(member));
  
  /* Tutaj później: 
    client.on(memberRemoveEvent.name, ...)


    
  */
}