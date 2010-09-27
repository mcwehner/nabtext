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
        
        window.sprintf  = function () { return gt.sprintf.apply(gt, amap(arguments)); };
        window.gettext  = function () { return gt.gettext.apply(gt, amap(arguments)); };
        window.ngettext = function () { return gt.ngettext.apply(gt, amap(arguments)); };
        
        // Convenience aliases.
        window._       = window.gettext;
        
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