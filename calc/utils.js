// ============================================================
//  calc/utils.js — Validerings- och formateringsfunktioner
//  Rena funktioner, noll DOM-referenser.
// ============================================================

/**
 * Validerar att ett värde är ett giltigt, ändligt tal.
 */
function isValidNumber(value) {
    var n = parseFloat(value);
    return !Number.isNaN(n) && Number.isFinite(n);
}

/**
 * Returnerar valutasymbol för en valutakod.
 * Används av formatCurrency och formatAmountHint.
 */
function getCurrencySymbol(currency) {
    var symbols = { 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'EUR': '\u20AC', 'ISK': 'kr', 'GBP': '\u00A3', 'USD': '$', 'CAD': '$', 'CHF': 'CHF', 'PLN': 'z\u0142', 'CZK': 'K\u010D', 'HUF': 'Ft', 'RON': 'lei', 'BGN': '\u043B\u0432' };
    return symbols[currency] || currency;
}

/**
 * Formaterar ett tal som valuta med angiven locale och valutakod.
 * Default: sv-SE / SEK.
 */
function formatCurrency(value, locale, currency) {
    locale = locale || 'sv-SE';
    currency = currency || 'SEK';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Formaterar ett inmatningsvärde som en läsbar summa.
 * T.ex. "1000000" → "1 000 000 kr (1 miljon)"
 */
function formatAmountHint(value, locale, currency) {
    locale = locale || 'sv-SE';
    currency = currency || 'SEK';
    var n = parseFloat(value);
    if (isNaN(n)) return '';
    if (n === 0) return '0 ' + getCurrencySymbol(currency);
    var grouped = new Intl.NumberFormat(locale).format(Math.round(n));
    var sym = getCurrencySymbol(currency);
    var fmtDec = function(v) {
        var s = parseFloat(v.toFixed(2)).toString();
        return (locale === 'en-US' || locale === 'en-GB' || locale === 'en-CA') ? s : s.replace('.', ',');
    };
    if (n >= 1e9) {
        return grouped + ' ' + sym + ' (' + fmtDec(n / 1e9) + ' ' +
            (locale === 'sv-SE' ? 'miljarder' : 'billion') + ')';
    }
    if (n >= 1e6) {
        var m = n / 1e6;
        return grouped + ' ' + sym + ' (' + fmtDec(m) +
            (m === 1 ? ' ' + (locale === 'sv-SE' ? 'miljon' : 'million') : ' ' + (locale === 'sv-SE' ? 'miljoner' : 'million')) + ')';
    }
    if (n >= 1e3) return grouped + ' ' + sym;
    return grouped + ' ' + sym;
}
