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
    var stringMap = {};
    var pluralRe  = /\0/;

    for (var i = 0; i < numberOfStrings; ++i) {
        var translation = data.getStringAt(
            translationOffsets[i].offset, translationOffsets[i].length
        );
    
        stringMap[ strings[i] ] = translation;
    
        // TODO - See if there's a better way of handling the singular
        // being packed into plurals.
        var pluralParts = strings[i].split(pluralRe);
    
        if (pluralParts.length > 1) {
            stringMap[ pluralParts[0] ] = translation.split(pluralRe)[0];
        }
    }

    // TODO - Cleanup the other unused data structures (e.g., strings).

    return stringMap;
}
