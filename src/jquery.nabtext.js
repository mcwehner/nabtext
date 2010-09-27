(function ($)
{
    include(`nabtext.core.js')
    
    (function ()
    {
        // Sets up the global Gettext object, and global aliases to the
        // Gettext API.
        var gt = new Gettext();
        
        // TODO - There's got to be a better way to wrap the functions to
        // work in the proper scope.
        function amap (args) { return Array.prototype.slice.call(args); }
        
        $.extend({
            sprintf  : function () { return gt.sprintf.apply(gt, amap(arguments)); },
            gettext  : function () { return gt.gettext.apply(gt, amap(arguments)); },
            _        : function () { return gt.gettext.apply(gt, amap(arguments)); },
            ngettext : function () { return gt.ngettext.apply(gt, amap(arguments)); }
        });
        
        // Gets all gettext link tags and loads the specified resources.
        $("link[rel='gettext']").each(function (i, link)
        {
            if ($(link).attr("hreflang")) {
                gt.setlocale($(link).attr("hreflang"));
            }
            
            gt.load(
                $(link).attr("href"), $(link).attr("type"), $(link).attr("hreflang")
            );
        });
    })();
    
})(jQuery);
