/**
 * Centralna konfiguracja kolorów dla embedów
 * Wszystkie kolory w formacie hex
 */

export const COLORS = {
    // Welcome/Leave System
    JOIN_SUCCESS: '#2ECC71',        // Zielony - przejście rekrutacji
    JOIN_STANDARD: '#3498DB',       // Niebieski - standardowe dołączenie
    LEAVE: '#E74C3C',               // Czerwony - opuszczenie
    BAN: '#8E44AD',                 // Fioletowy - ban
    RECRUITMENT_FAIL: '#E67E22',    // Pomarańczowy - nieprzejście rekrutacji
    
    // Moderation System
    WARN_LOW: '#F1C40F',             // Żółty - 1 warn
    WARN_MEDIUM: '#FF7800',          // Pomarańczowy - 2 warny
    WARN_HIGH: '#E74C3C',             // Czerwony - 3+ warny
    
    // Misc System
    INFO: '#3498DB',                // Niebieski - informacje
    SUCCESS: '#2ECC71',             // Zielony - sukces
    ERROR: '#E74C3C',               // Czerwony - błąd
    WARNING: '#F39C12',             // Pomarańczowy - ostrzeżenie
    
    // Status System
    STATUS_TABLE: '#2ECC71',        // Zielony - tabela statusu
    
    // Compatibility (stare wartości)
    LEGACY_GREEN: '#2ECC71',
    LEGACY_BLUE: '#202225',
    LEGACY_RED: '#4F545C',
    LEGACY_ORANGE: '#E67E22',

    EMBASSY: '#FFD700',         // Złoty kolor dla ambasady
    DIPLOMAT: '#4169E1',        // Niebieski dla dyplomatów

} as const;