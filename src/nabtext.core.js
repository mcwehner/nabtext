/* Parts of this library have come from:
 *
 * Binary Ajax 0.1.7
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 * Licensed under the MPL License [http://www.nihilogic.dk/licenses/mpl-license.txt]
 */
 
// TODO - Break this out into a separate file.
var BinaryFile = function (strData)
{
    var data       = strData;
    var dataLength = 0;

    this.getRawData = function ()
    {
        return data;
    };

    if (typeof strData == "string") {
        dataLength = data.length;

        this.getByteAt = function (iOffset)
        {
            return data.charCodeAt(iOffset) & 0xFF;
        };
    }
    else if (typeof strData == "unknown") {
        dataLength = IEBinary_getLength(data);

        this.getByteAt = function (iOffset)
        {
            return IEBinary_getByteAt(data, iOffset);
        };
    }

    this.getLength = function ()
    {
        return dataLength;
    };

    this.getSByteAt = function (iOffset)
    {
        var iByte = this.getByteAt(iOffset);
        
        return (iByte > 127) ? (iByte - 256) : iByte;
    };

    this.getShortAt = function (iOffset, bBigEndian)
    {
        var iShort
            = bBigEndian
            ? (this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1)
            : (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset)
            ;
        
        return (iShort < 0) ? (iShort + 65536) : iShort;
    };
    
    this.getSShortAt = function (iOffset, bBigEndian)
    {
        var iUShort = this.getShortAt(iOffset, bBigEndian);
        
        return (iUShort > 32767) ? (iUShort - 65536) : iUShort;
    };
    
    this.getLongAt = function (iOffset, bBigEndian)
    {
        var iByte1 = this.getByteAt(iOffset);
        var iByte2 = this.getByteAt(iOffset + 1);
        var iByte3 = this.getByteAt(iOffset + 2);
        var iByte4 = this.getByteAt(iOffset + 3);

        var iLong
            = bBigEndian
            ? (((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4
            : (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1
            ;
            
        return (iLong < 0) ? (iLong += 4294967296) : iLong;
    };
    
    this.getSLongAt = function (iOffset, bBigEndian)
    {
        var iULong = this.getLongAt(iOffset, bBigEndian);
        
        return (iULong > 2147483647) ? (iULong - 4294967296) : iULong;
    };
    
    this.getStringAt = function (iOffset, iLength)
    {
        var str = "";
        
        for (var i = iOffset; i < iOffset + iLength; ++i) {
            str += String.fromCharCode(this.getByteAt(i));
        }
        
        return str;
    };

    this.getCharAt = function (iOffset)
    {
        return String.fromCharCode(this.getByteAt(iOffset));
    };
    
    this.toBase64 = function ()
    {
        return window.btoa(data);
    };
    
    this.fromBase64 = function (strBase64)
    {
        data = window.atob(strBase64);
    };
};

// Initializes some IE-specific functions.
(function ()
{
    document.write(
        "<script type='text/vbscript'>\r\n"
        + "Function IEBinary_getByteAt(strBinary, iOffset)\r\n"
        + " IEBinary_getByteAt = AscB(MidB(strBinary,iOffset+1,1))\r\n"
        + "End Function\r\n"
        + "Function IEBinary_getLength(strBinary)\r\n"
        + " IEBinary_getLength = LenB(strBinary)\r\n"
        + "End Function\r\n"
        + "</script>\r\n"
    );
})();

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
    this.strings      = { "en-US" : {} };
    this.locale       = "en-US";

    // TODO - Make this setting actually have an effect.
    // When true, this will `console.warn' for missing message ids.
    this.emitWarnings = true;
};

// public interface

Gettext.prototype.setlocale = function (locale)
{
    if (locale) { this.locale = locale; }

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
        
        if ("undefined" != typeof(width))     width     = getVariableWidth(width);
        if ("undefined" != typeof(precision)) precision = getVariableWidth(precision);
        
        var replacement = (function ()
        {
            switch (specifier) {
                case "d":
                case "i": return parseInt(arg).toString().substr(0, precision);
                
                // TODO - Add alternate behavior.
                case "o": return Math.abs(Number(arg)).toString(8).substr(0, precision);
                
                case "u": return Math.abs(Number(arg)).toString().substr(0, precision);
                
                case "x":
                case "X": return (flags.alternate ? "0x" : "" ) + Number(arg).toString(16).substr(0, precision);
                
                // TODO - Add alternate behavior.
                case "e":
                case "E": return Number(arg).toExponential(precision);
                
                // TODO - Add alternate behavior.
                case "f":
                case "F": return Number(arg).toPrecision(precision);
                
                case "%": return "%";
                
                case "s": return String(arg).substr(0, precision);
                
                case "c": return String.fromCharCode(arg);
                
                default: return str;
            }
        })();
        
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

// TODO - Break these parsing/loading methods out into separate files.
Gettext.prototype.load = function (options)
{
    var self = this;
    
    // This list of MIME types is probably unofficial (and subject to
    // change).
    var parseCallbacks = {
        "application/x-mo" : parseMO,
        "application/x-po" : parsePO
    };
    
    if (!(options.mimeType in parseCallbacks)) {
        throw this.sprintf('MIME type "%s" is not supported.', options.mimeType);
    }
    
    XHR({
        url     : options.url,
        binary  : ("application/x-mo" == options.mimeType),
        success : function (response)
        {
            self.strings[ (options.locale || self.locale) ]
                = parseCallbacks[options.mimeType].call(self, response.data);

            self.setlocale(options.locale || self.locale);
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
    
        return count > 1 ? parts[1] : parts[0];
    }
    else {
        return count > 1 ? messageId : messageIdPlural;
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

// private interface

//:m4_include(`parsers/mo.js')
//:m4_include(`parsers/po.js')