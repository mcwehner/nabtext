/* Parts of this library have come from:
 *
 * Binary Ajax 0.1.7
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 * Licensed under the MPL License [http://www.nihilogic.dk/licenses/mpl-license.txt]
 */
 
var BinaryFile = function (strData)
{
    var data       = strData;
    var dataLength = 0;

    if ("string" == typeof strData) {
        dataLength = data.length;

        this.getByteAt = function (iOffset)
        {
            return data.charCodeAt(iOffset) & 0xFF;
        };
    }
    else if ("unknown" == typeof strData) {
        dataLength = IEBinary_getLength(data);

        this.getByteAt = function (iOffset)
        {
            return IEBinary_getByteAt(data, iOffset);
        };
    }

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

    this.getStringAt = function (iOffset, iLength)
    {
        var str = "";
        
        for (var i = iOffset; i < iOffset + iLength; ++i) {
            var nextByte = this.getByteAt(i);
            
            str += "%" + (nextByte <= 0xf ? "0" : "") + nextByte.toString(16);
        }
        
        return decodeURIComponent(str);
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
