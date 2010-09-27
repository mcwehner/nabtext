(function (window)
{
    include(`nabtext.core.js')
    
    // Initializes a global Gettext object using any files specified in
    // <link> tags.
    (function ()
    {
        // Sets up the global Gettext object, and global aliases to the
        // Gettext API.
        var gt         = new Gettext();
        window.Gettext = gt;
        
        // TODO - This blows away any existing top-level functions with these
        // names. We should store any originals, and provide a `noconflict()'
        // method (a la jQuery) for restoring them.
        
        // TODO - There's got to be a better way to wrap the functions to
        // work in the proper scope.
        function amap (args) { return Array.prototype.slice.call(args); }
        
        window.sprintf     = function () { return gt.sprintf.apply(gt, amap(arguments)); };
        window.gettext     = function () { return gt.gettext.apply(gt, amap(arguments)); };
        window.ngettext    = function () { return gt.ngettext.apply(gt, amap(arguments)); };
        window.dgettext    = function () { return gt.dgettext.apply(gt, amap(arguments)); };
        window.dcgettext   = function () { return gt.dcgettext.apply(gt, amap(arguments)); };
        window.dngettext   = function () { return gt.dngettext.apply(gt, amap(arguments)); };
        window.dcngettext  = function () { return gt.dcngettext.apply(gt, amap(arguments)); };
        window.pgettext    = function () { return gt.pgettext.apply(gt, amap(arguments)); };
        window.dpgettext   = function () { return gt.dpgettext.apply(gt, amap(arguments)); };
        window.dcpgettext  = function () { return gt.dcpgettext.apply(gt, amap(arguments)); };
        window.npgettext   = function () { return gt.npgettext.apply(gt, amap(arguments)); };
        window.dnpgettext  = function () { return gt.dnpgettext.apply(gt, amap(arguments)); };
        window.dcnpgettext = function () { return gt.dcnpgettext.apply(gt, amap(arguments)); };
        
        // Convenience aliases.
        window._ = window.gettext;
        
        // Gets all gettext link tags and loads the specified resources.
        var links = document.getElementsByTagName("LINK");
        
        for (var i = 0; i < links.length; ++i) {
            var link = links[i];
            
            if ("gettext" == link.getAttribute("rel")) {
                gt.setlocale(link.getAttribute("hreflang"));
                
                gt.load(
                    link.getAttribute("href"),
                    link.getAttribute("type"),
                    link.getAttribute("hreflang")
                );
            }
        }
    })();
    
})(window);