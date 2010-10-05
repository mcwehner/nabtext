    // TODO - This whole parsing method is currently nasty. This needs to be
    // changed to be an honest parser.
    function parsePO (data)
    {
        var RE_MSGID         = /^msgid\s+"(.*)"$/;
        var RE_MSGID_PLURAL  = /^msgid_plural\s+"(.*)"$/;
        var RE_MSGSTR        = /^msgstr\s+"(.*)"$/;
        var RE_MSGSTR_PLURAL = /^msgstr\[\d+\]\s+"(.*)"$/;
        var RE_NULL          = /\0/;
    
        // TODO - Work out a way to do this that doesn't involve splitting on
        // and iterating over lines.
        var lines = data.split(/\r?\n/);
    
        var stringMap    = {};
        var currentEntry = null;
    
        for (var i = 0; i < lines.length; ++i) {
            var line      = lines[i];
            var lineMatch = null;
        
            if (lineMatch = line.match(RE_MSGID)) {
                if (currentEntry) {
                    stringMap[currentEntry.msgid] = currentEntry.msgstr;
                
                    var pluralParts = currentEntry.msgid.split(RE_NULL);
                
                    if (pluralParts.length > 1) {
                        stringMap[ pluralParts[0] ]
                            = currentEntry.msgstr.split(RE_NULL)[0];
                    }
                }
            
                currentEntry       = {};
                currentEntry.msgid = lineMatch[1];
            }
            else if (lineMatch = line.match(RE_MSGID_PLURAL)) {
                currentEntry.msgid += "\0" + lineMatch[1];
            }
            else if (lineMatch = line.match(RE_MSGSTR)) {
                currentEntry.msgstr = lineMatch[1];
            }
            else if (lineMatch = line.match(RE_MSGSTR_PLURAL)) {
                currentEntry.msgstr
                    = currentEntry.msgstr
                    ? currentEntry.msgstr + "\0" + lineMatch[1]
                    : lineMatch[1]
                    ;
            }
        }
    
        // TODO - Eww, duplicate code...
        stringMap[currentEntry.msgid] = currentEntry.msgstr;
    
        return stringMap;
    }
