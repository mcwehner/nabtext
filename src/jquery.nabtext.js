(function ($)
{
    //:include(`nabtext.core.js')
    
    (function ()
    {
        // Sets up the global Gettext object, and global aliases to the
        // Gettext API.
        var gt = new Gettext();
        
        // TODO - There's got to be a better way to wrap the functions to
        // work in the proper scope.
        function amap (args) { return Array.prototype.slice.call(args); }
        
        $.extend({
            sprintf     : function () { return gt.sprintf.apply(gt, amap(arguments)); },
            gettext     : function () { return gt.gettext.apply(gt, amap(arguments)); },
            ngettext    : function () { return gt.ngettext.apply(gt, amap(arguments)); },
            dgettext    : function () { return gt.dgettext.apply(gt, amap(arguments)); },
            dcgettext   : function () { return gt.dcgettext.apply(gt, amap(arguments)); },
            dngettext   : function () { return gt.dngettext.apply(gt, amap(arguments)); },
            dcngettext  : function () { return gt.dcngettext.apply(gt, amap(arguments)); },
            pgettext    : function () { return gt.pgettext.apply(gt, amap(arguments)); },
            dpgettext   : function () { return gt.dpgettext.apply(gt, amap(arguments)); },
            dcpgettext  : function () { return gt.dcpgettext.apply(gt, amap(arguments)); },
            npgettext   : function () { return gt.npgettext.apply(gt, amap(arguments)); },
            dnpgettext  : function () { return gt.dnpgettext.apply(gt, amap(arguments)); },
            dcnpgettext : function () { return gt.dcnpgettext.apply(gt, amap(arguments)); },
            
            // convenience aliases
            _           : function () { return gt.gettext.apply(gt, amap(arguments)); }
        });
        
        // Gets all gettext link tags and loads the specified resources.
        $("link[rel='gettext']").each(function (i, link)
        {
            gt.load(
                $(link).attr("href"), $(link).attr("type"), $(link).attr("hreflang")
            );
        });
    })();
    
})(jQuery);
