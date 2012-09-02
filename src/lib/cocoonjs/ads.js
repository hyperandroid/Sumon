(function() {

    if ( typeof CocoonJS==='undefined' ) {
        CocoonJS= {};
    }

    CocoonJS.available= typeof ext!=='undefined';

    CocoonJS.AdController= {};

    CocoonJS.AdController.Layout= {
        TOP_CENTER      : "TOP_CENTER",
        BOTTOM_CENTER   : "BOTTOM_CENTER"
    };

    /**
     *
     * @param params Object< {preloadFullScreen<boolean>, preloadBanner<boolean> }
     */
    CocoonJS.AdController.init= function( params ) {

        if ( !CocoonJS.available ) {
            return;
        }

        if ( typeof params==='undefined' ) {
            return;
        }

        if ( typeof params.preloadFullScreen!=='undefined' ) {
            ext.IDTK_SRV_AD.makeCall("preloadFullScreen");
        }

        if ( typeof params.preloadBanner!=='undefined' ) {
            ext.IDTK_SRV_AD.makeCall("preloadBanner");
        }

        return CocoonJS.AdController;
    };

    /**
     * Set an event trigger callback function.
     *
     * @param fn "onbannershow" | "onfullscreenshow" | "onfullscreenhide" | "onbannerchange"
     * @param callback function()
     */
    CocoonJS.AdController.addEventListener= function( fn, callback ) {
        if ( !CocoonJS.available ) {
            return this;
        }

        ext.IDTK_SRV_AD.addEventListener( fn, callback );

        return CocoonJS.AdController;
    };

    /**
     * Remove a callback function listener.
     *
     * @param callback function()
     */
    CocoonJS.AdController.removeEventListener= function( callback ) {
        if ( !CocoonJS.available ) {
            return this;
        }

        ext.IDTK_SRV_AD.removeEventListener( callback );

        return CocoonJS.AdController;
    };

    /**
     * Set the banner layout.
     *
     * @param layout CocoonJS.AdController.Layout
     */
    CocoonJS.AdController.setBannerLayout= function( layout ) {
        if ( !CocoonJS.available ) {
            return this;
        }

        ext.IDTK_SRV_AD.makeCall("setBannerLayout", layout);

        return CocoonJS.AdController;
    };

    /**
     * Show the banner. If the AdController was preloaded, it will faster.
     */
    CocoonJS.AdController.showBanner= function() {
        if ( !CocoonJS.available ) {
            return this;
        }

        ext.IDTK_SRV_AD.makeCall("showBanner");

        return CocoonJS.AdController;
    }

    /**
     * Hide the banner.
     */
    CocoonJS.AdController.hideBanner= function() {
        if ( !CocoonJS.available ) {
            return this;
        }

        ext.IDTK_SRV_AD.makeCall("hideBanner");

        return CocoonJS.AdController;
    }

    /**
     * Hide the banner.
     */
    CocoonJS.AdController.showFullscreen= function() {
        if ( !CocoonJS.available ) {
            return this;
        }

        ext.IDTK_SRV_AD.makeCall("showFullScreen");

        return CocoonJS.AdController;
    }

}());
