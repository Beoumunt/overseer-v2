# Rzeczy do poprawy i dokończenia

Notatki z przeglądu projektu z 2026-09-13. Wrócić do nich przed dalszą rozbudową bota.

## Problemy techniczne

- [x] Zweryfikowano, że `memberships` są celowo zapisywane pod ID gildii, a nie pod nazwami (`recruitment`, `main`, `embassy`, `market`). Sposób użyty w `src/sync/syncMembers.ts` jest zgodny z aktualnym formatem danych w MongoDB.
- [ ] Użytkownicy, którzy faktycznie dołączyli tylko do gildii `1289877668526952469`, mają mimo tego ustawione `leftAt` oraz `isPresent: false` również dla pozostałych gildii. Sprawdzić, dlaczego synchronizacja zapisuje datę opuszczenia dla gildii, do których użytkownik nigdy nie należał, zamiast pozostawić `leftAt: null`.
- [ ] W `src/events/ds_main/addMain.ts` usunięcie użytkownika z Recruitment następuje dopiero po obsłudze kanału powitalnego. Brak kanału lub jego konfiguracji powoduje wcześniejsze `return`, więc użytkownik może pozostać na Recruitment.
- [ ] Wywołania `sendEmbed(...)` bez `await` mogą ukrywać błędy wysyłania wiadomości. Ujednolicić obsługę błędów w tych miejscach.
- [ ] Synchronizacja startowa nie wykrywa osób, które opuściły wszystkie serwery klastra. Dodać obsługę `GuildMemberRemove` albo mechanizm porównujący użytkowników zapisanych w bazie z aktualnym stanem serwerów.
- [ ] `src/db/seed.ts`: sprawdzić, dlaczego `runAll()` nie jest wywoływane na końcu pliku i czy seedowanie uruchamia się w sposób przewidziany dla projektu.
- [ ] `RoleDefinition` nie zawiera wszystkich ról używanych w mapach ID. Sprawdzić brakujące role, między innymi `guest` i `ambassador`.
- [ ] ID serwerów w `src/lib/env.ts` są opcjonalne, mimo że są wymagane do poprawnego działania bota. Rozważyć uczynienie ich wymaganymi albo dodać walidację zależną od uruchamianego trybu.
- [ ] Zweryfikować, czy agregowanie `mainRoles` z ról na wszystkich serwerach nie nadaje uprawnień wskutek błędnego mapowania ról lub konfiguracji.
- [ ] Uzupełnić `README.md` o instalację, konfigurację `.env`, seedowanie bazy, wymagane uprawnienia Discorda i sposób uruchamiania.

## Brakujące funkcje

- [ ] Obsługa `GuildMemberRemove` dla Recruitment, Main, Market i Embassy.
- [ ] Implementacja `removeRecru`.
- [ ] Implementacja `removeMarket`.
- [ ] Implementacja `addEmbassy`.
- [ ] Implementacja `removeEmbassy`.
- [ ] Implementacja `removeMain`.
- [ ] Tworzenie prywatnych sekcji dla uprawnionych osób na Embassy oraz nadawanie rangi `ambassador`.
- [ ] Usuwanie osoby ze wszystkich serwerów klastra po opuszczeniu Main, zgodnie z regułami biznesowymi.
- [ ] Ustalenie, jak odróżniać członka Dark Star, który opuścił serwer, od osoby próbującej wejść bez uprawnień.
- [ ] Dokończenie komend `warn`, `recruit` i `promote`, wraz ze sprawdzaniem `CommandConfig` i uprawnień ról.

## Uwagi projektowe

- [ ] Przed obsługą opuszczeń ustalić, czy MongoDB ma być źródłem prawdy o członkostwie, czy tylko bieżącym indeksem stanu Discorda.
- [ ] Zdefiniować reguły przejść między statusami `candidate`, `recruit` i `darkStar`, aby eventy wejścia i wyjścia nie wykonywały sprzecznych operacji.
- [ ] Dodać testy dla synchronizacji, autoryzacji wejścia na Main/Market oraz przypadków awansu Recruitment -> Main.
