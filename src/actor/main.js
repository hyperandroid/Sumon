function __CAAT__loadingScene(director) {

    var scene= director.createScene();

    var TIME= 5000;
    var time= new Date().getTime();

    var background= new CAAT.ActorContainer().
            setBackgroundImage( director.getImage('splash'), true);
    scene.addChild(background);

    var lading= new CAAT.Actor().
            setBackgroundImage( director.getImage('lading'), true);
    lading.setLocation( director.width-lading.width-10, director.height-lading.height-30 );
    scene.addChild(lading);

    var rueda=  new CAAT.Actor().
            setBackgroundImage( director.getImage('rueda'), true).
            setLocation( lading.x+20, lading.y+10 );
    scene.addChild(rueda);
    rueda.addBehavior(
            new CAAT.RotateBehavior().
                    setValues(0,2*Math.PI).
                    setFrameTime(0,1000).
                    setCycle(true)
            );
    var starsImage= null;
    starsImage= new CAAT.SpriteImage().initialize(director.getImage('stars'), 24,6 );

    var T= 600;

    var mouseStars= function(mouseEvent) {

        for( var i=0; i<3; i++ ) {
            var offset0= Math.random()*10*(Math.random()<.5?1:-1);
            var offset1= Math.random()*10*(Math.random()<.5?1:-1);

            var iindex= (Math.random()*6)>>0;
            var actorStar= new CAAT.Actor();
            actorStar.__imageIndex= iindex;

            actorStar.
                    setBackgroundImage(
                        starsImage.getRef().setAnimationImageIndex( [(Math.random()*6)>>0] ), true ).
                    setLocation( offset0+mouseEvent.point.x, offset1+mouseEvent.point.y).
                    setDiscardable(true).
                    enableEvents(false).
                    setFrameTime(scene.time, T).
                    addBehavior(
                        new CAAT.ScaleBehavior().
                            setFrameTime(scene.time, T).
                            setValues( 1,5, 1,5 ).
                            setInterpolator(
                                new CAAT.Interpolator().createExponentialInInterpolator(
                                    3,
                                    false)
                            )
                    );

            if ( director.getRenderType()==='CSS' ) {
                actorStar.addBehavior(
                    new CAAT.AlphaBehavior().
                        setFrameTime(scene.time, T).
                        setValues( 1, .1 ).
                        setInterpolator(
                            new CAAT.Interpolator().createExponentialInInterpolator(
                                3,
                                false)
                        ));
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

    scene.loadedImage = function(count, total) {

        if ( count==total ) {

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
                        __end_loading(director);
                    }
                );

            } else {
                __end_loading(director);
            }

        }
    };

    return scene;
}

function __end_loading(director) {

    director.emptyScenes();

    // BUGBUG artifact
    director.setImagesCache(director.__next_images);
    delete director.__next_images;

    var gardenScene= new HN.GardenScene().create(director, (director.getRenderType()==='CANVAS') ?
        (( navigator.browser!=='iOS' )  ? 120 : 0) :
        0);
    var gameScene= new HN.GameScene().create(director, HN.GameModes.respawn );
    gardenScene.gameScene= gameScene;
    gameScene.addGameListener( gardenScene );

    director.easeIn(
            0,
            CAAT.Scene.prototype.EASE_TRANSLATE,
            1000,
            false,
            CAAT.Actor.prototype.ANCHOR_TOP,
            new CAAT.Interpolator().createExponentialInOutInterpolator(5,false) );
}

function __Hypernumbers_init()   {

//CAAT.DEBUG=1;


    var director = new CAAT.Director().initialize(700,500,document.getElementById('game')).setClear(false);
    director.enableResizeEvents(CAAT.Director.prototype.RESIZE_PROPORTIONAL);

/*
    var director = new CAAT.Director().initialize(700,500).setClear(false);
    document.getElementById('game').appendChild(director.canvas);
*/
    CAAT.browser= navigator.browser;
    HN.director= director;

    new CAAT.ImagePreloader().loadImages(
        [
            {id:'stars',    url:'res/img/stars.png'},
            {id:'splash',   url:'res/splash/splash.png'},
            {id:'lading',   url:'res/splash/lading.png'},
            {id:'rueda',    url:'res/splash/rueda.png'},
            {id:'start',    url:'res/splash/start.png'}
        ],
        function( counter, images ) {

            if ( counter==images.length ) {
/*
                if ( director.getRenderType()!='CSS') {
                    images[0].image= CAAT.modules.ImageUtil.prototype.createAlphaSpriteSheet(1,0,24,images[0].image);
                }
*/
                director.setImagesCache(images);
                var scene_loading= __CAAT__loadingScene(director);

                new CAAT.ImagePreloader().loadImages(
                    [
                        {id:'smoke',            url:'res/img/humo.png'},
                        {id:'stars',            url:'res/img/stars.png'},
                        {id:'bricks',           url:'res/img/bricks.png'},
                        {id:'buttons',          url:'res/img/botones.png'},
                        {id:'numbers',          url:'res/img/numbers.png'},
                        {id:'numberssmall',     url:'res/img/numbers_s.png'},
                        {id:'madewith',         url:'res/img/madewith.png'},
                        {id:'background-1',     url:'res/img/fondo1.png'},
                        {id:'background-2',     url:'res/img/fondo2.png'},
                        {id:'background_op',    url:'res/img/gameover.png'},
                        {id:'cloud0',           url:'res/img/nube1.png'},
                        {id:'cloud1',           url:'res/img/nube2.png'},
                        {id:'cloud2',           url:'res/img/nube3.png'},
                        {id:'cloud3',           url:'res/img/nube4.png'},
                        {id:'cloudb0',          url:'res/img/nubefondo1.png'},
                        {id:'cloudb1',          url:'res/img/nubefondo2.png'},
                        {id:'cloudb2',          url:'res/img/nubefondo3.png'},
                        {id:'cloudb3',          url:'res/img/nubefondo4.png'},
                        {id:'level',            url:'res/img/level.png'},
                        {id:'points',           url:'res/img/score.png'},
                        {id:'time',             url:'res/img/time.png'},
                        {id:'timeprogress',     url:'res/img/time_progress.png'},
                        {id:'multiplier',       url:'res/img/x.png'},
                        {id:'tweet',            url:'res/img/tweet.png'},
                        {id:'ovni',             url:'res/img/ovni.png'},
                        {id:'logo',             url:'res/img/logo_menu.png'},
                        {id:'levelclear',       url:'res/img/levelcleared.png'},
                        {id:'msg1',             url:'res/img/7.png'},
                        {id:'msg2',             url:'res/img/6.png'},
                        {id:'msg3',             url:'res/img/5.png'},
                        {id:'msg4',             url:'res/img/4.png'},
                        {id:'msg5',             url:'res/img/3.png'},
                        {id:'msg6',             url:'res/img/2.png'},
                        {id:'msg7',             url:'res/img/1.png'},
                        {id:'info_howto',       url:'res/img/info.png'},
                        {id:'sound',            url:'res/img/sound.png'},
                        {id:'mode-respawn',     url:'res/img/respawn.png'},
                        {id:'mode-progressive', url:'res/img/progresive.png'},
                        {id:'mode-classic',     url:'res/img/normal_mode.png'},
                        {id:'mode-text',        url:'res/img/textos.png'},
                        {id:'rclock-bg',        url:'res/img/rclock_bg.png'},
                        {id:'rclock-tick',      url:'res/img/rclock_tick.png'},
                        {id:'rclock-arrow',     url:'res/img/rclock_arrow.png'},
                        {id:'bolas',            url:'res/img/bolas.png'},
                        {id:'info',             url:'res/big/about.png'},
                        {id:'howto',            url:'res/big/tutorial.png'}
                    ],

                    function( counter, images ) {

                        if ( counter==images.length ) {

/*
var im= CAAT.modules.ImageUtil.prototype.createAlphaSpriteSheet(0,1,32,images[0].image);
var str= "image/png";
var strData= im.toDataURL(str);
document.location.href= strData.replace( str, "image/octet-stream" );

/*
                            if ( director.getRenderType()!=='CSS') {
                                images[0].image= CAAT.modules.ImageUtil.prototype.createAlphaSpriteSheet(0,1,32,images[0].image);
                                images[1].image= CAAT.modules.ImageUtil.prototype.createAlphaSpriteSheet(1,0,24,images[1].image);
                                images[40].image= CAAT.modules.ImageUtil.prototype.createAlphaSpriteSheet(1,0,16,images[40].image);
                            }
*/
                            director.__next_images= images;

                            if ( navigator.browser==='iOS' ) {
                                director.
                                    addAudio("01",              "res/sound/01.mp3").
                                    addAudio("10",              "res/sound/10.mp3").
                                    addAudio("11",              "res/sound/11.mp3").
                                    addAudio("12",              "res/sound/12.mp3").
                                    addAudio("sumamal",         "res/sound/suma_mal.mp3").
                                    addAudio("mostrarpanel",    "res/sound/mostrarpanel.mp3").
                                    addAudio("deseleccionar",   "res/sound/deseleccionar.mp3").
                                    addAudio("music",           "res/sound/music.mp3");
                            } else {
                                director.
                                    addAudio('01',              document.getElementById('audio_01')).
                                    addAudio('10',              document.getElementById('audio_10')).
                                    addAudio('11',              document.getElementById('audio_11')).
                                    addAudio('12',              document.getElementById('audio_12')).
                                    addAudio('sumamal',         document.getElementById('sumamal')).
                                    addAudio('mostrarpanel',    document.getElementById('mostrarpanel')).
                                    addAudio('deseleccionar',   document.getElementById('deseleccionar')).
                                    addAudio('music',           document.getElementById('music'));
                            }

                        }

                        scene_loading.loadedImage(counter, images.length);

                    }
                );

            }
        }
    );

    CAAT.loop(60);
}

window.addEventListener('load', __Hypernumbers_init, false);
//__Hypernumbers_init();