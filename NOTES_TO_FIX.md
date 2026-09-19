# Rzeczy do poprawy i dokończenia

Notatki z przeglądu projektu z 2026-09-13. Wrócić do nich przed dalszą rozbudową bota.

## Zrobione 2026-09-13

- Zaimplementowano `removeRecru`, w tym pomijanie komunikatu przy awansie Recruitment -> Main oraz zawsze wykonywaną synchronizację.
- Zaimplementowano `removeMarket` jako synchronizację po opuszczeniu Marketu.
- Zaimplementowano `removeMain`: komunikat tylko dla użytkownika z rolą `darkStar`, usuwanie z pozostałych gildii i synchronizację.
- Podłączono event `GuildMemberRemove` dla Recruitment, Main i Market.
- Dodano `/recruit` i `/promote` wraz z definicjami slash commandów i logiką w tych samych plikach.
- Dodano kontrolę `GuildConfig.enabledCommands`, `CommandConfig.isActive` i `CommandConfig.allowedRoles`.
- Dodano rejestrację komend per guild oraz porównywanie definicji z komendami istniejącymi na Discordzie.
- Zasoby gildii, role i kanały są pobierane przez klienta bota (`getRoleFromClient`, `getChannelFromClient`).
- Synchronizacja komend nie blokuje logowania bota.

## Problemy techniczne

- [x] Zweryfikowano, że `memberships` są celowo zapisywane pod ID gildii, a nie pod nazwami (`recruitment`, `main`, `embassy`, `market`). Sposób użyty w `src/sync/syncMembers.ts` jest zgodny z aktualnym formatem danych w MongoDB.
- [ ] Użytkownicy, którzy faktycznie dołączyli tylko do gildii `1289877668526952469`, mają mimo tego ustawione `leftAt` oraz `isPresent: false` również dla pozostałych gildii. Sprawdzić, dlaczego synchronizacja zapisuje datę opuszczenia dla gildii, do których użytkownik nigdy nie należał, zamiast pozostawić `leftAt: null`.
- [ ] W `src/events/ds_main/addMain.ts` usunięcie użytkownika z Recruitment następuje dopiero po obsłudze kanału powitalnego. Brak kanału lub jego konfiguracji powoduje wcześniejsze `return`, więc użytkownik może pozostać na Recruitment.
- [ ] Wywołania `sendEmbed(...)` bez `await` mogą ukrywać błędy wysyłania wiadomości. Ujednolicić obsługę błędów w tych miejscach.
- [ ] Synchronizacja startowa nie wykrywa osób, które opuściły wszystkie serwery klastra. Dodać obsługę `GuildMemberRemove` albo mechanizm porównujący użytkowników zapisanych w bazie z aktualnym stanem serwerów.
- [ ] `getGuildFromMember` nadal pobiera gildię przez obiekt członka. Ujednolicić helpery gildii tak, aby przyjmowały `Client`, `guildId` i nie zależały od użytkownika.
- [ ] Rejestracja komend wykonuje kontrolne `GET` dla każdej gildii przy starcie. Jest nieblokująca, ale nadal może być opóźniana przez rate limit Discord REST.
- [ ] `src/db/seed.ts`: sprawdzić, dlaczego `runAll()` nie jest wywoływane na końcu pliku i czy seedowanie uruchamia się w sposób przewidziany dla projektu.
- [ ] `RoleDefinition` nie zawiera wszystkich ról używanych w mapach ID. Sprawdzić brakujące role, między innymi `guest` i `ambassador`.
- [ ] ID serwerów w `src/lib/env.ts` są opcjonalne, mimo że są wymagane do poprawnego działania bota. Rozważyć uczynienie ich wymaganymi albo dodać walidację zależną od uruchamianego trybu.
- [ ] Zweryfikować, czy agregowanie `mainRoles` z ról na wszystkich serwerach nie nadaje uprawnień wskutek błędnego mapowania ról lub konfiguracji.
- [ ] Uzupełnić `README.md` o instalację, konfigurację `.env`, seedowanie bazy, wymagane uprawnienia Discorda i sposób uruchamiania.

## Brakujące funkcje

- [x] Obsługa `GuildMemberRemove` dla Recruitment, Main i Market.
- [x] Implementacja `removeRecru`.
- [x] Implementacja `removeMarket`.
- [ ] Implementacja `addEmbassy`.
- [ ] Implementacja `removeEmbassy`.
- [x] Implementacja `removeMain`.
- [ ] Tworzenie prywatnych sekcji dla uprawnionych osób na Embassy oraz nadawanie rangi `ambassador`.
- [x] Usuwanie osoby ze wszystkich pozostałych serwerów klastra po opuszczeniu Main.
- [ ] Ustalenie, jak odróżniać członka Dark Star, który opuścił serwer, od osoby próbującej wejść bez uprawnień.
- [x] Implementacja komend `recruit` i `promote`, wraz ze sprawdzaniem `CommandConfig` i uprawnień ról.
- [ ] Implementacja komendy `warn`.

## Uwagi projektowe

- [ ] Przed obsługą opuszczeń ustalić, czy MongoDB ma być źródłem prawdy o członkostwie, czy tylko bieżącym indeksem stanu Discorda.
- [ ] Zdefiniować reguły przejść między statusami `candidate`, `recruit` i `darkStar`, aby eventy wejścia i wyjścia nie wykonywały sprzecznych operacji.
- [ ] Dodać testy dla synchronizacji, autoryzacji wejścia na Main/Market, eventów opuszczenia oraz komend `recruit`/`promote`.
