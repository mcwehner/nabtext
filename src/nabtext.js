(function (window)
{
    //:include(`nabtext.core.js')
    
    Gettext.prototype.initAliases = function (context)
    {
        // TODO - This blows away any existing top-level functions with these
        // names. We should store any originals, and provide a `noconflict()'
        // method (a la jQuery) for restoring them.
        
        // TODO - There's got to be a better way to wrap the functions to
        // work in the proper scope.
        function amap (args) { return Array.prototype.slice.call(args); }
        
        var gt = this;
        
        context.sprintf     = function () { return gt.sprintf.apply(gt, amap(arguments)); };
        context.gettext     = function () { return gt.gettext.apply(gt, amap(arguments)); };
        context.ngettext    = function () { return gt.ngettext.apply(gt, amap(arguments)); };
        context.dgettext    = function () { return gt.dgettext.apply(gt, amap(arguments)); };
        context.dcgettext   = function () { return gt.dcgettext.apply(gt, amap(arguments)); };
        context.dngettext   = function () { return gt.dngettext.apply(gt, amap(arguments)); };
        context.dcngettext  = function () { return gt.dcngettext.apply(gt, amap(arguments)); };
        context.pgettext    = function () { return gt.pgettext.apply(gt, amap(arguments)); };
        context.dpgettext   = function () { return gt.dpgettext.apply(gt, amap(arguments)); };
        context.dcpgettext  = function () { return gt.dcpgettext.apply(gt, amap(arguments)); };
        context.npgettext   = function () { return gt.npgettext.apply(gt, amap(arguments)); };
        context.dnpgettext  = function () { return gt.dnpgettext.apply(gt, amap(arguments)); };
        context.dcnpgettext = function () { return gt.dcnpgettext.apply(gt, amap(arguments)); };
        
        // Convenience aliases.
        context.Gettext = gt;
        context._       = context.gettext;
    };
    
    // Initializes a global Gettext object using any files specified in
    // <link> tags.
    (function ()
    {
        // Sets up the global Gettext object, and global aliases to the
        // Gettext API.
        var gt = new Gettext();
        
        gt.initAliases(window);
        
        // Gets all gettext link tags and loads the specified resources.
        var links = document.getElementsByTagName("LINK");
        
        for (var i = 0; i < links.length; ++i) {
            var link = links[i];
            
            if ("gettext" == link.getAttribute("rel")) {
                gt.load({
                    url      : link.getAttribute("href"),
                    mimeType : link.getAttribute("type"),
                    locale   : link.getAttribute("hreflang")
                });
            }
        }
    })();
    
})(window);