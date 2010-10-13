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
