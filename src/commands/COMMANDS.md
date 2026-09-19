# Rejestracja i konfiguracja komend Discord

## Najwazniejsza zasada

Dodanie komendy do kodu nie oznacza automatycznego udostepnienia jej uzytkownikom.

System wykonuje trzy oddzielne kroki:

1. Kod zawiera implementacje i definicje komendy.
2. Bot synchronizuje definicje z kolekcja `CommandConfig`.
3. `CommandConfig.allowedRoles` i `GuildConfig.enabledCommands` decyduja, kto i gdzie moze jej uzyc.

Nowa komenda pojawia sie wiec w bazie automatycznie, ale domyslnie nie ma rol dostepu ani nie jest wlaczona na zadnym serwerze.

## Przeplyw uruchomienia bota

Glowny przeplyw znajduje sie w `src/index.ts`:

1. `connectDatabase()` laczy aplikacje z MongoDB.
2. `syncCommandConfigs()` synchronizuje definicje komend z kodu z `CommandConfig`.
3. Po evencie `clientReady` `registerGuildCommands()` synchronizuje komendy Discorda dla wszystkich skonfigurowanych guildow.
4. `registerEvents()` rejestruje eventy serwera.
5. `registerCommandEvents()` rejestruje obsluge interakcji i wykonania komend.

Jesli nowa komenda nie jest w `GuildConfig.enabledCommands`, nie zostanie opublikowana na tym serwerze przez Discord REST API.

## Pliki spoza katalogu commands

### `src/index.ts`

Punkt startowy aplikacji. Odpowiada za kolejnosc laczenia z baza, synchronizacji konfiguracji, rejestracji eventow i logowania klienta Discord.

### `src/db/models/CommandConfig.ts`

Model konfiguracji komendy:

- `name` - unikalna nazwa slash command.
- `description` - opis komendy.
- `allowedRoles` - systemowe nazwy rol, ktore moga uzywac komendy.
- `isActive` - globalny przelacznik aktywnosci komendy.

### `src/db/models/GuildConfig.ts`

Model konfiguracji serwera:

- `guildId` - ID serwera Discord.
- `guildName` - nazwa serwera.
- `enabledCommands` - nazwy komend opublikowanych na tym serwerze.
- `roles` - mapowanie nazw rol systemowych na ID rol Discorda.
- `channels` - mapowanie nazw kanalow na ID kanalow Discorda.

### `src/db/models/RoleDefinition.ts`

Definiuje role systemowe, np. `emperor`, `officer` albo `recruit`. W `allowedRoles` zapisuje sie pole `name`, a nie ID roli Discorda.

### `src/db/seed.ts`

Glowny seed przygotowujacy swieza baze danych. Usuwa i odtwarza dane `RoleDefinition`, `CommandConfig` oraz `GuildConfig`, dlatego nie nalezy uruchamiac go na produkcyjnej bazie bez swiadomej decyzji.

Seed ustawia poczatkowo `command-management` tylko na DS Main i daje do niej dostep roli `emperor`.

### `src/commands/syncCommandConfigs.ts`

Przy kazdym starcie sprawdza `commandDefinitions.ts` i tworzy brakujace rekordy `CommandConfig`. Aktualizuje opis komendy, ale nie zmienia istniejacych `allowedRoles` i nie wlacza komendy na guildach.

### `src/utils/dbRoles.ts`

`memberHasRole()` sprawdza role uzytkownika na podstawie zsynchronizowanych danych `Member.mainRoles`. Jest wykorzystywane przez autoryzacje komend.

### `src/lib/env.ts` i `src/db/dbConnection.ts`

`env.ts` waliduje wymagane zmienne srodowiskowe, m.in. `DISCORD_TOKEN`, `CLIENT_ID` i `MONGO_URI`. `dbConnection.ts` nawiazuje polaczenie z MongoDB.

## Pliki systemu komend

Rejestracja komend jest rozdzielona na kilka plikow:

- `commandDefinitions.ts` - centralna mapa nazw komend i ich `SlashCommandBuilder`; jest uzywana przez synchronizacje i rejestracje Discorda.
- `commandsHandler.ts` - odbiera interakcje Discorda, obsluguje autocomplete i uruchamia `execute()`.
- `commandAccess.ts` - sprawdza kontekst serwera, `isActive`, `enabledCommands` i role uzytkownika.
- `commandRegistrar.ts` - synchronizuje komendy jednego serwera z Discord REST API.
- `registerCommands.ts` - przechodzi po wszystkich `GuildConfig` i deleguje prace do `commandRegistrar.ts`.
- `commandOptions.ts` - wspolne autocomplete pobierajace komendy, role i serwery z MongoDB.
- `general/command-management.ts` - zmienia `allowedRoles` i `enabledCommands` bez recznej edycji bazy.

Komenda jest dostepna dopiero wtedy, gdy:

- ma rekord w `CommandConfig`,
- `isActive` ma wartosc `true`,
- jej nazwa znajduje sie w `GuildConfig.enabledCommands`,
- uzytkownik ma role znajdujaca sie w `allowedRoles`.

## Procedura dodawania nowej komendy

### 1. Utworz plik komendy

Umiesc plik w odpowiedniej kategorii:

- `admin/` - komendy administracyjne.
- `general/` - komendy ogolne i zarzadzajace konfiguracja.
- `misc/` - pozostale, pomocnicze komendy.

Minimalna komenda powinna eksportowac:

```ts
export const definition = new SlashCommandBuilder()
  .setName('example')
  .setDescription('Opis komendy');

export const name = definition.name;

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply('Odpowiedz');
}
```

Nazwa w `setName()` musi byc mala, bez spacji i zgodna z nazwa uzywana w bazie danych.

### 2. Dodaj implementacje do `commandsHandler.ts`

Dodaj import modułu i wpis do mapy wykonywanych komend:

```ts
import * as exampleCommand from './misc/example';

[exampleCommand.name, exampleCommand]
```

Bez tego Discord moze pokazac zarejestrowana komende, ale bot nie bedzie mial implementacji do wykonania.

### 3. Dodaj definicje do `commandDefinitions.ts`

Dodaj import oraz wpis do mapy:

```ts
import * as exampleCommand from './misc/example';

[exampleCommand.name, exampleCommand.definition]
```

Bez tego komenda nie bedzie znana rejestratorowi i nie trafi na Discorda.

### 4. Synchronizacja z `CommandConfig`

Po restarcie `syncCommandConfigs()` porownuje definicje z `commandDefinitions.ts` z kolekcja `CommandConfig` i tworzy brakujace rekordy.

Nowa komenda jest tworzona z:

```ts
allowedRoles: []
isActive: true
```

Synchronizacja nie wlacza komendy na zadnym serwerze i nie zmienia istniejacych rol dostepu. Dostep nadaje sie dopiero przez `command-management`.

### 5. Nadaj role dostepu

Nie edytuj recznie MongoDB. Uzyj:

```text
/command-management command:example action:add target:role value:officer
```

Komenda zapisze `officer` w `CommandConfig.allowedRoles`.

### 6. Wlacz komende na serwerze

Uzyj:

```text
/command-management command:example action:add target:server value:DS Main
```

Komenda zapisze nazwe w `GuildConfig.enabledCommands` i wywola:

```ts
await registerGuildCommandsForGuild(guildId);
```

## Odswiezanie komend

Po zmianie `GuildConfig.enabledCommands` nalezy odswiezyc tylko zmieniony serwer:

```ts
await registerGuildCommandsForGuild(guildId);
```

Funkcja:

1. pobiera konfiguracje guilda z MongoDB,
2. wybiera definicje z `commandDefinitions`,
3. pobiera aktualne komendy z Discorda,
4. porownuje oba zestawy,
5. wykonuje `PUT` tylko przy zmianie.

Przy starcie bota `registerGuildCommands()` wykonuje ten sam proces dla wszystkich skonfigurowanych serwerow.

## Autocomplete

Jesli komenda ma wybierane wartosci z bazy, uzyj:

```ts
.setAutocomplete(true)
```

Komenda musi wtedy eksportowac funkcje:

```ts
export async function autocomplete(interaction: AutocompleteInteraction) {
  // odpowiedz maksymalnie 25 opcjami
}
```

`commandsHandler.ts` automatycznie przekazuje interakcje autocomplete do tej funkcji.

## Zmiana lub usuwanie komendy

Zmiana opisu albo opcji wymaga aktualizacji pliku komendy. Po restarcie `commandDefinitions` i `commandRegistrar` odswiezaja definicje na Discordzie dla guildow, na ktorych komenda jest wlaczona.

Usuniecie implementacji z kodu nie usuwa automatycznie nazwy z `GuildConfig.enabledCommands` ani starej komendy z Discorda. Najpierw usun dostep przez `command-management`, potem usun modul i jego wpisy z map. W razie potrzeby wykonaj dodatkowa migracje danych.

## Najczestsze problemy

- Komenda nie pojawia sie na serwerze: brakuje jej w `GuildConfig.enabledCommands` albo nie wykonano synchronizacji.
- Komenda jest widoczna, ale odmawia dostepu: uzytkownik nie ma roli z `CommandConfig.allowedRoles` albo nie ma zsynchronizowanej roli w `Member.mainRoles`.
- Autocomplete jest puste: wartosc nie istnieje w odpowiednim modelu MongoDB albo opcja nie ma `.setAutocomplete(true)`.
- Bot nie startuje po dodaniu komendy: sprawdz importy w `commandDefinitions.ts` i `commandsHandler.ts` oraz diagnostyke TypeScript.
- `test` lub inna nowa komenda aktywuje sie sama: sprawdz, czy nie zostala dopisana do `GuildConfig.enabledCommands` w `seed.ts`.

## Checklista przed uruchomieniem

- [ ] Plik komendy znajduje sie w poprawnej kategorii.
- [ ] Komenda eksportuje `definition`, `name` i `execute`.
- [ ] Komenda jest dodana do mapy w `commandsHandler.ts`.
- [ ] Komenda jest dodana do mapy w `commandDefinitions.ts`.
- [ ] Po restarcie definicja pojawila sie w `CommandConfig`.
- [ ] Role dostepu nadano przez `command-management`.
- [ ] Serwery dostepu ustawiono przez `command-management`.
- [ ] Po zmianie serwera wykonano `registerGuildCommandsForGuild(guildId)`.
- [ ] Kod przechodzi diagnostyke TypeScript.
