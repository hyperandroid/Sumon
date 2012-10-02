/**
 * See LICENSE file.
 *
 * Entry point.
 */
(function() {

    var WW= 700;
    var HH= 500;
    var SPLASH_TIME= 5000;

    function __CAAT__loadingScene(director) {

        var scene= director.createScene();

        var TIME= SPLASH_TIME;
        var time= new Date().getTime();

        var background= new CAAT.ActorContainer().
                setBackgroundImage( director.getImage('splash0'), false).
                setBounds(0,0,director.width, director.height).
                setImageTransformation( CAAT.SpriteImage.prototype.TR_FIXED_TO_SIZE );
        /*
        background.
            addBehavior(
                new CAAT.GenericBehavior().
                    setFrameTime(TIME/2, 0).
                    setValues( 1, 0, null, null, function(value,target,actor) {
                        actor.setBackgroundImage( director.getImage('splash1'), true );
                    })
            );
            */
        scene.addChild(background);

        var lading= new CAAT.Actor().
            setBackgroundImage( director.getImage('lading'), true).
            enableEvents(false);
        lading.setLocation( director.width-lading.width-10, director.height-lading.height-30 );
        scene.addChild(lading);

        var rueda=  new CAAT.Actor().
            setBackgroundImage( director.getImage('rueda'), true).
            setLocation( lading.x+20, lading.y+10 ).
            enableEvents(false);
        scene.addChild(rueda);


        var rrb= new CAAT.RotateBehavior().
                        setValues(0,2*Math.PI).
                        setFrameTime(0,1000);

        rueda.addBehavior( rrb.setCycle(true) );

        var starsImage= null;
        starsImage= new CAAT.SpriteImage().initialize(director.getImage('stars'), 24,6 );

        var T= 600;

        var kfc_i= new CAAT.Interpolator().createExponentialInInterpolator(2,false);

        var mouseStars= function(mouseEvent) {

            for( var i=0; i<3; i++ ) {
                var offset0= Math.random()*10*(Math.random()<.5?1:-1) + mouseEvent.point.x;
                var offset1= Math.random()*10*(Math.random()<.5?1:-1) +mouseEvent.point.y;

                var iindex= (Math.random()*6)>>0;
                var actorStar= new CAAT.Actor();
                actorStar.__imageIndex= iindex;

                actorStar.
                        setBackgroundImage(
                            starsImage.getRef().setAnimationImageIndex( [(Math.random()*6)>>0] ), true ).
                        setLocation( offset0, offset1 ).
                        setDiscardable(true).
                        enableEvents(false).
                        setFrameTime(scene.time, T).
                        addBehavior(
                            new CAAT.ScaleBehavior().
                                setFrameTime(scene.time, T).
                                setValues( 1,5, 1,5 ).
                                setInterpolator( kfc_i )
                        );

                if ( director.getRenderType()==='CSS' ) {
                    actorStar.addBehavior(
                        new CAAT.AlphaBehavior().
                            setFrameTime(scene.time, T).
                            setValues( 1, .1 ).
                            setInterpolator( kfc_i ));
                } else {
                    actorStar.addBehavior(
                        new CAAT.GenericBehavior().
                            setFrameTime(scene.time, T).
                            setValues( 1, .1, null, null, function(value,target,actor) {
                                actor.backgroundImage.setAnimationImageIndex( [
                                        actor.__imageIndex+(23-((23*value)>>0))*actor.backgroundImage.getColumns()
                                    ] );
                            }));
                }

                background.addChild(actorStar);
            }
        };
        background.mouseMove= mouseStars;
        background.mouseDrag= mouseStars;

        scene.loadedImage = function(count, images) {

            if ( count==images.length ) {

                var difftime= new Date().getTime()-time;
                if ( difftime<TIME ){
                    difftime= Math.abs(TIME-difftime);
                    if ( difftime>TIME ) {
                        difftime= TIME;
                    }

                    scene.createTimer(
                        scene.time,
                        difftime,
                        function() {
                            lading.setOutOfFrameTime();
                            rueda.setOutOfFrameTime();
                            __end_loading(director, images);
                        }
                    );

                } else {
                    __end_loading(director, images);
                }

            }
        };

        return scene;
    }

    function __end_loading(director, images) {

        director.emptyScenes();
        director.setImagesCache(images);

        var gardenScene= new HN.GardenScene().create(
            director,
            CocoonJS.available ? 0 : 120 );

        var gameScene= new HN.GameScene().create(director, HN.GameModes.respawn );
        gardenScene.gameScene= gameScene;

        gameScene.addGameListener( gardenScene );

        if ( CocoonJS.available ) {

            var req= 60*2*1000;

            CocoonJS.AdController.init( {
                preloadFullScreen : true,
                preloadBanner     : true
            });
            CocoonJS.AdController.setBannerLayout( CocoonJS.AdController.Layout.TOP_CENTER );
            CocoonJS.AdController.showBanner();

            CocoonJS.AdController.addEventListener( "onfullscreenshow", function() {
                CAAT.endLoop();
            });
            CocoonJS.AdController.addEventListener( "onfullscreenhide", function() {
                CAAT.loop(60);
                HN.INTERSTITIAL= false;
                director.createTimer( director.time, req, function( time, ttime, ttask ) {
                    HN.INTERSTITIAL= true;
                });
            });

            director.createTimer( director.time, req, function() {
                HN.INTERSTITIAL= true;
            });

        }

        director.easeIn(
                0,
                CAAT.Scene.prototype.EASE_TRANSLATE,
                1000,
                false,
                CAAT.Actor.prototype.ANCHOR_TOP,
                new CAAT.Interpolator().createExponentialInOutInterpolator(5,false) );
    }

    function createCSS() {
        return new CAAT.Director().initialize(WW,HH,document.getElementById('game')).setClear( false );
    }

    function createCanvas() {
        return new CAAT.Director().initialize(WW,HH).setClear( false );
    }

    function createGL() {
        return new CAAT.Director().initializeGL(WW,HH).setClear( false );
    }


    function __Hypernumbers_init()   {

        if ( true /*CocoonJS.available*/ ) {
            WW= window.innerWidth;
            HH= window.innerHeight;

            if ( WW>HH ) {
                if ( WW<700 ) {
                    WW=700;
                    HH=500;
                }
            } else {
                if ( HH<700 ) {
                    WW=500;
                    HH=700;
                }
            }
        }

        // uncomment to avoid decimal point coordinates.
        // Runs faster on anything but latest chrome.
        CAAT.setCoordinateClamping(false);

        // uncomment to show CAAT's debug bar
        CAAT.DEBUG=1;

        var director= createCanvas();

        // Uncomment to make the game conform to window's size.
        director.enableResizeEvents(CAAT.Director.prototype.RESIZE_PROPORTIONAL);

        HN.director= director;

        var ni= director.width>director.height;

        var prefix= typeof __RESOURCE_URL!=='undefined' ? __RESOURCE_URL : '';

        new CAAT.ImagePreloader().loadImages(
            [
                {id:'stars',    url: prefix + 'res/img/stars.png'},
                {id:'splash0',  url: prefix + (ni ? 'res/splash/splash0.png' : 'res/splash/splash0-i.png')},
                {id:'splash1',  url: prefix + (ni ? 'res/splash/splash1.png' : 'res/splash/splash1-i.png')},
                {id:'lading',   url: prefix + 'res/splash/lading.png'},
                {id:'rueda',    url: prefix + 'res/splash/rueda.png'}
            ],
            function( counter, images ) {

                if ( counter==images.length ) {
                    director.setImagesCache(images);
                    var scene_loading= __CAAT__loadingScene(director);

                    new CAAT.ImagePreloader().loadImages(
                        [
                            {id:'smoke',            url: prefix + 'res/img/humo.png'},
                            {id:'stars',            url: prefix + 'res/img/stars.png'},
                            {id:'bricks',           url: prefix + 'res/img/bricks.png'},
                            {id:'buttons',          url: prefix + 'res/img/botones.png'},
                            {id:'numbers',          url: prefix + 'res/img/numbers.png'},
                            {id:'numberssmall',     url: prefix + 'res/img/numbers_s.png'},
                            {id:'madewith',         url: prefix + 'res/img/madewith.png'},
                            {id:'background-1',     url: prefix + 'res/img/fondo1.png'},
                            {id:'background-2',     url:  prefix + (ni ? 'res/img/fondo2.png' : 'res/img/fondo2inv.png')},
                            {id:'background_op',    url: prefix + 'res/img/gameover.png'},
                            {id:'cloud0',           url: prefix + 'res/img/nube1.png'},
                            {id:'cloud1',           url: prefix + 'res/img/nube2.png'},
                            {id:'cloud2',           url: prefix + 'res/img/nube3.png'},
                            {id:'cloud3',           url: prefix + 'res/img/nube4.png'},
                            {id:'cloudb0',          url: prefix + 'res/img/nubefondo1.png'},
                            {id:'cloudb1',          url: prefix + 'res/img/nubefondo2.png'},
                            {id:'cloudb2',          url: prefix + 'res/img/nubefondo3.png'},
                            {id:'cloudb3',          url: prefix + 'res/img/nubefondo4.png'},
                            {id:'level',            url: prefix + 'res/img/level.png'},
                            {id:'level-small',      url: prefix + 'res/img/levelsmall.png'},
                            {id:'boton-salir',      url: prefix + 'res/img/boton_salir.png'},
                            {id:'points',           url: prefix + 'res/img/score.png'},
                            {id:'time',             url: prefix + 'res/img/time.png'},
                            {id:'timeprogress',     url: prefix + 'res/img/time_progress.png'},
                            {id:'multiplier',       url: prefix + (ni ? 'res/img/x.png' : 'res/img/xsmall.png')},
                            {id:'multiplier-star',  url: prefix + 'res/img/multiplicador.png'},
                            {id:'tweet',            url: prefix + 'res/img/tweet.png'},
                            {id:'ovni',             url: prefix + 'res/img/ovni.png'},
                            {id:'logo',             url: prefix + 'res/img/logo_menu.png'},
                            {id:'levelclear',       url: prefix + 'res/img/levelcleared.png'},
                            {id:'msg1',             url: prefix + 'res/img/7.png'},
                            {id:'msg2',             url: prefix + 'res/img/6.png'},
                            {id:'msg3',             url: prefix + 'res/img/5.png'},
                            {id:'msg4',             url: prefix + 'res/img/4.png'},
                            {id:'msg5',             url: prefix + 'res/img/3.png'},
                            {id:'msg6',             url: prefix + 'res/img/2.png'},
                            {id:'msg7',             url: prefix + 'res/img/1.png'},
                            {id:'info_howto',       url: prefix + 'res/img/info.png'},
                            {id:'sound',            url: prefix + 'res/img/sound.png'},
                            {id:'mode-respawn',     url: prefix + 'res/img/respawn.png'},
                            {id:'mode-progressive', url: prefix + 'res/img/progresive.png'},
                            {id:'mode-classic',     url: prefix + 'res/img/normal_mode.png'},
                            {id:'mode-text',        url: prefix + 'res/img/textos.png'},
                            {id:'rclock-bg',        url: prefix + 'res/img/rclock_bg.png'},
                            {id:'rclock-tick',      url: prefix + 'res/img/rclock_tick.png'},
                            {id:'rclock-arrow',     url: prefix + 'res/img/rclock_arrow.png'},
                            {id:'bolas',            url: prefix + 'res/img/bolas.png'},
                            {id:'info',             url: prefix + (ni ? 'res/big/about.png' : 'res/big/about-i.png')},
                            {id:'howto',            url: prefix + (ni ? 'res/big/tutorial.png' : 'res/big/tutorial-i.png')},
                            {id:'target-number',    url: prefix + 'res/img/target.png'}
                        ],


                        function( counter, images ) {

                            if ( counter===images.length ) {
                                director.
                                    addAudio("01",              prefix+"res/sound/01.mp3").
                                    addAudio("10",              prefix+"res/sound/10.mp3").
                                    addAudio("11",              prefix+"res/sound/11.mp3").
                                    addAudio("12",              prefix+"res/sound/12.mp3").
                                    addAudio("sumamal",         prefix+"res/sound/suma_mal.mp3").
                                    addAudio("mostrarpanel",    prefix+"res/sound/mostrarpanel.mp3").
                                    addAudio("deseleccionar",   prefix+"res/sound/deseleccionar.mp3").
                                    addAudio("music",           prefix+"res/sound/music.mp3");
                            }

                            scene_loading.loadedImage(counter, images);

                        }
                    );

                }
            }
        );

        CAAT.loop(60);
    }

    window.addEventListener('load', __Hypernumbers_init, false);

}());