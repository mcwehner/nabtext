/*  Nabtext - an implementation of the GNU Gettext API
*/

//:m4_ifdef(`MO_PARSER', `m4_include(`binaryfile.js')')

// TODO - Handle the selective inclusion of binaryfile.js better (ideally by
// somehow making it a requirement specified by the .mo parser)
var XHR = (function ()
{
    function createRequest ()
    {
        var requestConstructors = [
            function () { return new ActiveXObject("Microsoft.XMLHTTP"); },
            function () { return new XMLHttpRequest(); }
        ];

        for (var i = 0; i < requestConstructors.length; ++i) {
            try {
                return requestConstructors[i]();
            }
            catch (ex) {
                // noop
            }
        }

        throw "Unable to create request object.";
    }

    function sendRequest (options)
    {
        if ("undefined" == typeof(options.async)) {
            options.async = false;
        }
        
        var request = createRequest();

        var requestCallback = function (responseData)
        {
            if (request.status == "200" || request.status == "206" || request.status == "0") {
                options.success({
                    data   : (options.binary ? new BinaryFile(responseData) : responseData),
                    status : request.status,
                    length : request.getResponseHeader("Content-Length")
                });
            }
            else {
                if (options.error) { options.error(); }
            }
        };
        
        if (typeof(request.onload) != "undefined") {
            request.onload = function () { requestCallback(request.responseText); };
        }
        else {
            request.onreadystatechange = function ()
            {
                if (request.readyState == 4) { requestCallback(request.responseBody); }
            };
        }
        
        request.open("GET", options.url, options.async);

        if (request.overrideMimeType) {
            request.overrideMimeType("text/plain; charset=x-user-defined");
        }

        request.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 1970 00:00:00 GMT");
        request.send(null);
    }

    return sendRequest;
}());


/*  Gettext
*/

// constructor

var Gettext = function ()
{
    // TODO - Make the locale strings case-insensitive throughout the
    // library (as they're supposed to be, according to BCP 47).
    this.strings         = { "en-US" : {} };
    this.meta            = { "en-US" : {} };
    this.pluralFunctions = { "en-US" : {} };
    this.locale          = "en-US";
};


// class methods
var parsers = {};

Gettext.addParser = function (mimeType, parser, binary)
{
    parsers[mimeType] = { parser: parser, binary: binary };
};


// public interface

Gettext.prototype.setlocale = function (locale)
{
    if (locale) {
        this.locale          = locale;
        this.strings[locale] = this.strings[locale] || {};
        this.meta[locale]    = this.meta[locale]    || {};
    }

    return this.locale;
};

Gettext.prototype.sprintf = function ()
{
    var RE_CONVERSION = /(?:%(?:(\d+)\$)?([0\- ]*)(\d+|\*(?:\d+\$)?)?(?:\.(\d+|\*(?:\d+\$)?))?([diouxXeEfFcs%]))/g;
    
    // There must at least be a format string.
    if ("undefined" == typeof(arguments) || "string" != typeof(arguments[0])) {
        throw new TypeError("first argument to `sprintf' must be a string.");
    }
    
    var formatString  = arguments[0];
    var formatArgs    = Array.prototype.slice.call(arguments);
    var lastFormatArg = 0;
    
    return formatString.replace(RE_CONVERSION, function (str, position, flagString, width, precision, specifier)
    {
        position      = Number(position) || lastFormatArg + 1;
        lastFormatArg = position;
        
        var arg = formatArgs[position];
        
        var flags = {
            alternate           : (flagString.indexOf("#") != -1),
            zeroPadding         : (flagString.indexOf("0") != -1),
            negativeWidth       : (flagString.indexOf("-") != -1),
            signedPositiveSpace : (flagString.indexOf(" ") != -1),
            alwaysSign          : (flagString.indexOf("+") != -1),
            localeGrouping      : (flagString.indexOf("'") != -1)
        };
        
        // Allows for a specified argument to be the width or precision
        var getVariableWidth = function (widthString)
        {
            return Number(widthString.replace(/\*(?:(\d+)\$)?/, function (s, i)
            {
                return formatArgs[ ("undefined" == typeof(i)) ? (position + 1) : i ];
            }));
        };
        
        if ("undefined" != typeof(width) && width)         width     = getVariableWidth(width);
        if ("undefined" != typeof(precision) && precision) precision = getVariableWidth(precision);
        
        var replacement = (function ()
        {
            switch (specifier) {
                case "d":
                case "i": return parseInt(arg).toString();
                
                // TODO - Add alternate behavior.
                case "o": return Math.abs(Number(arg)).toString(8);
                
                case "u": return Math.abs(Number(arg)).toString();
                
                case "x":
                case "X": return (flags.alternate ? "0x" : "" ) + Number(arg).toString(16);
                
                // TODO - Add alternate behavior.
                case "e":
                case "E": return Number(arg);
                
                // TODO - Add alternate behavior.
                case "f":
                case "F": return Number(arg);
                
                case "%": return "%";
                
                case "s": return String(arg);
                
                case "c": return String.fromCharCode(arg);
                
                default: return str;
            }
        })();
        
        // FF treats things like `str.substr(0, undefined)' as the same thing
        // as `str.substr(0, 0)', which produces the empty string. I need a
        // better way to do this.
        if (precision || precision === 0) {
            if (specifier.match(/^[diouxXs]$/)) replacement = replacement.substr(0, precision);
            else if (specifier.match(/^[eE]$/)) replacement = replacement.toExponential(precision);
            else if (specifier.match(/^[fF]$/)) replacement = replacement.toPrecision(precision);
        }
        
        // Handles case like xX, eE, and fF which differ only by case
        if (specifier.toUpperCase() == specifier) {
            replacement = replacement.toUpperCase();
        }
        
        // padding
        if ("undefined" != typeof(width) && width > replacement.length) {
            var padStr   = new Array(width - replacement.length + 1).join(
                (flags.negativeWidth || !flags.zeroPadding) ? " " : "0"
            );
            
            replacement = flags.negativeWidth ? (replacement + padStr) : (padStr + replacement);
        }
        
        return replacement;
    });
};

Gettext.prototype.load = function (options)
{
    var self = this;
    
    if (!(options.mimeType in parsers)) {
        throw this.sprintf('MIME type "%s" is not supported.', options.mimeType);
    }
    
    XHR({
        url     : options.url,
        binary  : parsers[options.mimeType].binary,
        success : function (response)
        {
            self.setlocale(options.locale || self.locale);
            
            self.strings[self.locale]
                = parsers[options.mimeType].parser.call(self, response.data);
            
            var metaParts = self.strings[self.locale][""].split("\n");
            delete self.strings[self.locale][""];
            
            for (var part; part = metaParts.pop(), metaParts.length > 0; ) {
                var m = part.match(/^([^:]+):\s*(.*)$/);
                
                if (m) self.meta[self.locale][ m[1] ] = m[2];
            }
            
            self.pluralFunctions[self.locale] = (function ()
            {
                var pluralExpression
                    = self.meta[self.locale]["Plural-Forms"].match(/plural=([^;]+)/)[1];
                    
                var pluralFunc = new Function("n", "return " + pluralExpression + ";");
                
                return function (n) {
                    var plural = pluralFunc(n);
                    
                    if (plural === true || plural === false)
                        return plural ? 1 : 0;
                    else
                        return plural;
                };
            })();
        },
        error   : function ()
        {
            throw self.sprintf('Failed to load "%s"', url);
        }
    });
};

Gettext.prototype.gettext = function (messageId)
{
    // TODO - If the current locale (somehow) doesn't exist in the
    // `strings' object, this will probably break.
    return this.strings[this.locale][messageId] || messageId;
};

Gettext.prototype.ngettext = function (messageId, messageIdPlural, count)
{
    var key = messageId + "\0" + messageIdPlural;

    if (key in this.strings[this.locale]) {
        var parts = this.strings[this.locale][key].split("\0");
    
        return parts[ this.pluralFunctions[this.locale](count) ];
    }
    else {
        return arguments[ this.pluralFunctions[this.locale](count) ];
    }
};

Gettext.prototype.dgettext = function (domain, messageId)
{
    // TODO - Implement domains?
    return this.gettext(messageId);
};

Gettext.prototype.dcgettext = function (domain, messageId, category)
{
    // TODO - Implement domains, categories?
    return this.gettext(messageId);
};

Gettext.prototype.dngettext = function (domain, messageId, messageIdPlural, count)
{
    // TODO - Implement domains?
    return this.ngettext(messageId, messageIdPlural, count);
};

Gettext.prototype.dcngettext = function (domain, messageId, messageIdPlural, count, category)
{
    // TODO - Implement domains, categories?
    return this.ngettext(messageId, messageIdPlural, count);
};

Gettext.prototype.pgettext = function (context, messageId)
{
    // TODO - Implement contexts?
    return this.gettext(messageId);
};

Gettext.prototype.dpgettext = function (domain, context, messageId)
{
    // TODO - Implement domains, contexts?
    return this.gettext(messageId);
};

Gettext.prototype.dcpgettext = function (domain, context, messageId, category)
{
    // TODO - Implement domains, contexts, categories?
    return this.gettext(messageId);
};

Gettext.prototype.npgettext = function (context, messageId, messageIdPlural, count)
{
    // TODO - Implement contexts?
    return this.ngettext(messageId, messageIdPlural, count);
};

Gettext.prototype.dnpgettext = function (domain, context, messageId, messageIdPlural, count)
{
    // TODO - Implement domains, contexts?
    return this.ngettext(messageId, messageIdPlural, count);
};

Gettext.prototype.dcnpgettext = function (domain, context, messageId, messageIdPlural, count, category)
{
    // TODO - Implement domains, contexts, categories?
    return this.ngettext(messageId, messageIdPlural, count);
};


//:m4_ifdef(`MO_PARSER', `m4_include(`parsers/mo.js')')
//:m4_ifdef(`PO_PARSER', `m4_include(`parsers/po.js')')
