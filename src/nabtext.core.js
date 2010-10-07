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
    if (typeof arguments == "undefined")    { return null; }
    if (arguments.length < 1)               { return null; }
    if (typeof arguments[0] != "string")    { return null; }
    if (typeof RegExp == "undefined")       { return null; }

    var string         = arguments[0];
    var exp            = new RegExp(/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdfosxX])))/g);
    var matches        = new Array();
    var strings        = new Array();
    var convCount      = 0;
    var stringPosStart = 0;
    var stringPosEnd   = 0;
    var matchPosEnd    = 0;
    var newString      = "";
    var match          = null;

    while (match = exp.exec(string)) {
        if (match[9]) { convCount += 1; }

        stringPosStart          = matchPosEnd;
        stringPosEnd            = exp.lastIndex - match[0].length;
        strings[strings.length] = string.substring(stringPosStart, stringPosEnd);

        matchPosEnd = exp.lastIndex;
        matches[matches.length] = {
            match       : match[0],
            left        : match[3] ? true : false,
            sign        : match[4] || '',
            pad         : match[5] || ' ',
            min         : match[6] || 0,
            precision   : match[8],
            code        : match[9] || '%',
            negative    : parseInt(arguments[convCount]) < 0 ? true : false,
            argument    : String(arguments[convCount])
        };
    }

    strings[strings.length] = string.substring(matchPosEnd);

    if (matches.length == 0)                { return string; }
    if ((arguments.length - 1) < convCount) { return null; }

    var code  = null;
    var match = null;
    var i     = null;

    function sprintfConvert (match, nosign)
    {
        match.sign = nosign ? "" : (match.negative ? "-" : match.sign);

        var l   = match.min - match.argument.length + 1 - match.sign.length;
        var pad = new Array(l < 0 ? 0 : l).join(match.pad);

        if (!match.left) {
            if (match.pad == "0" || nosign) {
                return match.sign + pad + match.argument;
            } else {
                return pad + match.sign + match.argument;
            }
        }
        else {
            if (match.pad == "0" || nosign) {
                return match.sign + match.argument + pad.replace(/0/g, ' ');
            } else {
                return match.sign + match.argument + pad;
            }
        }
    }

    for (var i = 0; i < matches.length; ++i) {
        switch (matches[i].code) {
            case "%":
                substitution = '%';
                break;
            
            case "b":
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(2));
                substitution        = sprintfConvert(matches[i], true);
                break;
            
            case "c":
                matches[i].argument = String(String.fromCharCode(parseInt(Math.abs(parseInt(matches[i].argument)))));
                substitution = sprintfConvert(matches[i], true);
                break;
            
            case "d":
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)));
                substitution = sprintfConvert(matches[i]);
                break;
            
            case "f":
                matches[i].argument = String(Math.abs(parseFloat(matches[i].argument)).toFixed(matches[i].precision ? matches[i].precision : 6));
                substitution = sprintfConvert(matches[i]);
                break;
            
            case "o":
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(8));
                substitution = sprintfConvert(matches[i]);
                break;
            
            case "s":
                matches[i].argument = matches[i].argument.substring(0, matches[i].precision ? matches[i].precision : matches[i].argument.length)
                substitution = sprintfConvert(matches[i], true);
                break;
            
            case "x":
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                substitution = sprintfConvert(matches[i]);
                break;
            
            case "X":
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                substitution = sprintfConvert(matches[i]).toUpperCase();
                break;
            
            case "i":
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString());
                substitution = sprintfConvert(matches[i], true);
                break;
            
            default:
                substitution = matches[i].match;
                break;
        }

        newString += strings[i];
        newString += substitution;
    }

    newString += strings[i];

    return newString;
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

//:include(`parsers/mo.js')
//:include(`parsers/po.js')