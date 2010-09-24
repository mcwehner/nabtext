(function ()
{
    /* MCW - The Binary Ajax Library here has been modified to make the
       options passed into `BinaryAjax' easier, as well as adding an
       option for making the requests synchronous.
     */

    /*
     * Binary Ajax 0.1.7
     * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
     * Licensed under the MPL License [http://www.nihilogic.dk/licenses/mpl-license.txt]
     */


    var BinaryFile = function (strData, iDataOffset, iDataLength)
    {
        var data = strData;
        var dataOffset = iDataOffset || 0;
        var dataLength = 0;

        this.getRawData = function() {
            return data;
        }

        if (typeof strData == "string") {
            dataLength = iDataLength || data.length;

            this.getByteAt = function(iOffset) {
                return data.charCodeAt(iOffset + dataOffset) & 0xFF;
            }
        } else if (typeof strData == "unknown") {
            dataLength = iDataLength || IEBinary_getLength(data);

            this.getByteAt = function(iOffset) {
                return IEBinary_getByteAt(data, iOffset + dataOffset);
            }
        }

        this.getLength = function() {
            return dataLength;
        }

        this.getSByteAt = function(iOffset) {
            var iByte = this.getByteAt(iOffset);
            if (iByte > 127)
                return iByte - 256;
            else
                return iByte;
        }

        this.getShortAt = function(iOffset, bBigEndian) {
            var iShort = bBigEndian ? 
                (this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1)
                : (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset)
            if (iShort < 0) iShort += 65536;
            return iShort;
        }
        this.getSShortAt = function(iOffset, bBigEndian) {
            var iUShort = this.getShortAt(iOffset, bBigEndian);
            if (iUShort > 32767)
                return iUShort - 65536;
            else
                return iUShort;
        }
        this.getLongAt = function(iOffset, bBigEndian) {
            var iByte1 = this.getByteAt(iOffset),
                iByte2 = this.getByteAt(iOffset + 1),
                iByte3 = this.getByteAt(iOffset + 2),
                iByte4 = this.getByteAt(iOffset + 3);

            var iLong = bBigEndian ? 
                (((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4
                : (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
            if (iLong < 0) iLong += 4294967296;
            return iLong;
        }
        this.getSLongAt = function(iOffset, bBigEndian) {
            var iULong = this.getLongAt(iOffset, bBigEndian);
            if (iULong > 2147483647)
                return iULong - 4294967296;
            else
                return iULong;
        }
        this.getStringAt = function(iOffset, iLength) {
            var aStr = [];
            for (var i=iOffset,j=0;i<iOffset+iLength;i++,j++) {
                aStr[j] = String.fromCharCode(this.getByteAt(i));
            }
            return aStr.join("");
        }

        this.getCharAt = function(iOffset) {
            return String.fromCharCode(this.getByteAt(iOffset));
        }
        this.toBase64 = function() {
            return window.btoa(data);
        }
        this.fromBase64 = function(strBase64) {
            data = window.atob(strBase64);
        }
    };

    var BinaryAjax = (function ()
    {
        function createRequest ()
        {
            var oHTTP = null;
            if (window.XMLHttpRequest) {
                oHTTP = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                oHTTP = new ActiveXObject("Microsoft.XMLHTTP");
            }
            return oHTTP;
        }

        function getHead (strURL, fncCallback, fncError)
        {
            var oHTTP = createRequest();
            if (oHTTP) {
                if (fncCallback) {
                    if (typeof(oHTTP.onload) != "undefined") {
                        oHTTP.onload = function() {
                            if (oHTTP.status == "200") {
                                fncCallback(this);
                            } else {
                                if (fncError) fncError();
                            }
                            oHTTP = null;
                        };
                    } else {
                        oHTTP.onreadystatechange = function() {
                            if (oHTTP.readyState == 4) {
                                if (oHTTP.status == "200") {
                                    fncCallback(this);
                                } else {
                                    if (fncError) fncError();
                                }
                                oHTTP = null;
                            }
                        };
                    }
                }
                oHTTP.open("HEAD", strURL, true);
                oHTTP.send(null);
            } else {
                if (fncError) fncError();
            }
        }

        function sendRequest (strURL, fncCallback, fncError, aRange, bAcceptRanges, iFileSize, aSync)
        {
            if ("undefined" == typeof(aSync)) { aSync = true; }
            
            var oHTTP = createRequest();
            
            if (oHTTP) {
                var iDataOffset = 0;
                if (aRange && !bAcceptRanges) {
                    iDataOffset = aRange[0];
                }
                var iDataLen = 0;
                if (aRange) {
                    iDataLen = aRange[1]-aRange[0]+1;
                }

                if (fncCallback) {
                    if (typeof(oHTTP.onload) != "undefined") {
                        oHTTP.onload = function() {

                            if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
                                oHTTP.binaryResponse = new BinaryFile(oHTTP.responseText, iDataOffset, iDataLen);
                                oHTTP.fileSize = iFileSize || oHTTP.getResponseHeader("Content-Length");
                                fncCallback(oHTTP);
                            } else {
                                if (fncError) fncError();
                            }
                            oHTTP = null;
                        };
                    } else {
                        oHTTP.onreadystatechange = function() {
                            if (oHTTP.readyState == 4) {
                                if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
                                    // IE6 craps if we try to extend the XHR object
                                    var oRes = {
                                        status : oHTTP.status,
                                        binaryResponse : new BinaryFile(oHTTP.responseBody, iDataOffset, iDataLen),
                                        fileSize : iFileSize || oHTTP.getResponseHeader("Content-Length")
                                    };
                                    fncCallback(oRes);
                                } else {
                                    if (fncError) fncError();
                                }
                                oHTTP = null;
                            }
                        };
                    }
                }
                oHTTP.open("GET", strURL, aSync);

                if (oHTTP.overrideMimeType) oHTTP.overrideMimeType('text/plain; charset=x-user-defined');

                if (aRange && bAcceptRanges) {
                    oHTTP.setRequestHeader("Range", "bytes=" + aRange[0] + "-" + aRange[1]);
                }

                oHTTP.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 1970 00:00:00 GMT");

                oHTTP.send(null);
            } else {
                if (fncError) fncError();
            }
        }

        return function (options)
        {
            var strURL      = options["url"];
            var fncCallback = options["success"];
            var fncError    = options["error"];
            var aRange      = options["range"];
            var aSync       = options["async"];
            
            if ("undefined" == typeof(aSync)) { aSync = true; }
            
            if (!strURL) { throw "Call to `BinaryAjax()' must include a valid URL."; }
            
            if (aRange) {
                getHead(
                    strURL, 
                    function (oHTTP)
                    {
                        var iStart, iEnd;
                        var iLength         = parseInt(oHTTP.getResponseHeader("Content-Length"),10);
                        var strAcceptRanges = oHTTP.getResponseHeader("Accept-Ranges");
                        
                        iStart = aRange[0];
                        
                        if (aRange[0] < 0) { iStart += iLength; }
                        
                        iEnd = iStart + aRange[1] - 1;

                        sendRequest(strURL, fncCallback, fncError, [iStart, iEnd], (strAcceptRanges == "bytes"), iLength, aSync);
                    }
                );
            }
            else {
                // TODO - Pack this into an object for simplicity
                sendRequest(strURL, fncCallback, fncError, undefined, undefined, undefined, aSync);
            }
        };
    }());

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
    
    
    /* MCW - Yola's javascript gettext implementation */
    
    var PARSER_FOR_MIME_TYPE = {
        "application/x-mo"  : parseMO
    };
    
    var TRANSLATION_FOR_STRING = {};
    
    function init ()
    {
        var links = document.getElementsByTagName("LINK");
        
        for (var i = 0; i < links.length; ++i) {
            var link = links[i];
            
            if ("gettext" == link.getAttribute("rel")) {
                loadData(
                    link.getAttribute("href"),
                    link.getAttribute("type")
                );
            }
        }
    }
    
    function loadData (url, mimeType)
    {
        if (!(mimeType in PARSER_FOR_MIME_TYPE)) {
            throw 'MIME type "' + mimeType + '" not supported.';
        }
        
        var successCallback = function (oHTTP)
        {
            PARSER_FOR_MIME_TYPE[mimeType](oHTTP.binaryResponse);
        };
        
        var errorCallback = function (oHTTP)
        {
            throw "Failed to load";
        };
        
        BinaryAjax({
            url : url,
            success : successCallback,
            error   : errorCallback,
            async   : false
        });
    }
    
    function parseMO (data)
    {
        var numberOfStrings        = data.getLongAt(8);
        var stringTableOffset      = data.getLongAt(12);
        var translationTableOffset = data.getLongAt(16);
        
        // builds a list of string lengths and offsets
        var stringOffsets = [];
        
        for (var i = 0; i < numberOfStrings; ++i) {
            stringOffsets.push({
                length  : data.getLongAt(stringTableOffset + (i * 8)),
                offset  : data.getLongAt(stringTableOffset + 4 + (i * 8))
            });
        }
        
        // builds a list of string translations and offsets
        var translationOffsets = [];
        
        for (var i = 0; i < numberOfStrings; ++i) {
            translationOffsets.push({
                length  : data.getLongAt(translationTableOffset + (i * 8)),
                offset  : data.getLongAt(translationTableOffset + 4 + (i * 8))
            });
        }
        
        // reads in strings
        var strings = [];
        
        for (var i = 0; i < numberOfStrings; ++i) {
            strings.push( data.getStringAt(
                stringOffsets[i].offset, stringOffsets[i].length
            ));
        }
        
        // reads in translations, builds string map
        for (var i = 0; i < numberOfStrings; ++i) {
            var translation = data.getStringAt(
                translationOffsets[i].offset, translationOffsets[i].length
            );
            
            TRANSLATION_FOR_STRING[ strings[i] ] = translation;
        }
    }
    
    window.gettext = function (key)
    {
        return TRANSLATION_FOR_STRING[key] || key;
    };
    
    window._ = window.gettext;
    
    window.ngettext = function (singular, plural, count)
    {
        
    };
    
    init();
    
})();