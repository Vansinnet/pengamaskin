// ============================================================
//  calc/utils.js — Validerings- och formateringsfunktioner
//  Rena funktioner, noll DOM-referenser.
// ============================================================

/**
 * Validerar att ett värde är ett giltigt, ändligt tal.
 */
function isValidNumber(value) {
    if (typeof value === 'number') return !isNaN(value) && isFinite(value);
    if (typeof value === 'string' && value.trim() === '') return false;
    var n = parseFloat(value);
    return !isNaN(n) && isFinite(n) && String(n) === String(value).trim();
}

/**
 * Returnerar valutasymbol för en valutakod.
 * Används av formatCurrency och formatAmountHint.
 */
function getCurrencySymbol(currency) {
    var symbols = { 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'EUR': '\u20AC', 'ISK': 'kr', 'GBP': '\u00A3', 'USD': '$', 'CAD': '$', 'CHF': 'CHF', 'PLN': 'z\u0142', 'CZK': 'K\u010D', 'RON': 'lei', 'BGN': '\u043B\u0432', 'HUF': 'Ft' };
    return symbols[currency] || '?';
}

/**
 * Formaterar ett tal som valuta med angiven locale och valutakod.
 * Default: sv-SE / SEK.
 */
var _currencyFmtCache = {};

var _numberFmtCache = {};

function formatCurrency(value, locale, currency) {
    locale = locale || 'sv-SE';
    currency = currency || 'SEK';
    var key = locale + '|' + currency;
    var fmt = _currencyFmtCache[key];
    if (!fmt) {
        fmt = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        _currencyFmtCache[key] = fmt;
    }
    return fmt.format(value);
}

/**
 * Formaterar ett inmatningsvärde som en läsbar summa.
 * T.ex. "1000000" → "1 000 000 kr (1 miljon)"
 */
function fmtDecimal(v, locale) {
    var s = parseFloat(v.toFixed(2)).toString();
    return (locale === 'en-US' || locale === 'en-GB' || locale === 'en-CA') ? s : s.replace('.', ',');
}

function formatAmountHint(value, locale, currency) {
    locale = locale || 'sv-SE';
    currency = currency || 'SEK';
    var n = parseFloat(value);
    if (isNaN(n)) return '';
    if (n === 0) return '0 ' + getCurrencySymbol(currency);
    var fmtKey = 'num|' + locale;
    var nfmt = _numberFmtCache[fmtKey];
    if (!nfmt) { nfmt = new Intl.NumberFormat(locale); _numberFmtCache[fmtKey] = nfmt; }
    var grouped = nfmt.format(Math.round(n));
    var sym = getCurrencySymbol(currency);
    if (n >= 1e9) {
        return grouped + ' ' + sym + ' (' + fmtDecimal(n / 1e9, locale) + ' ' +
            (locale === 'sv-SE' ? 'miljarder' : 'billion') + ')';
    }
    if (n >= 1e6) {
        var m = n / 1e6;
        return grouped + ' ' + sym + ' (' + fmtDecimal(m, locale) +
            (m === 1 ? ' ' + (locale === 'sv-SE' ? 'miljon' : 'million') : ' ' + (locale === 'sv-SE' ? 'miljoner' : 'million')) + ')';
    }
    if (n >= 1e3) return grouped + ' ' + sym;
    return grouped + ' ' + sym;
}
