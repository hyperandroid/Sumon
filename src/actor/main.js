function __CAAT__loadingScene(director) {

    var scene= new CAAT.Scene();
    scene.create();

    var TIME= 3000;
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

    var percent= new CAAT.TextActor().create().setFont('15px sans-serif');
    scene.addChild(percent);

    var starsImage= new CAAT.SpriteImage().initialize(director.getImage('stars'), 24,6 );

    var T= 600;

    background.mouseMove= function(mouseEvent) {

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
                        /*
                        new CAAT.AlphaBehavior().
                            setFrameTime(scene.time, T).
                            setValues( 1, .1 ).
                            setInterpolator(
                                new CAAT.Interpolator().createExponentialInInterpolator(
                                    3,
                                    false)
                            )*/
                        new CAAT.GenericBehavior().
                            setFrameTime(scene.time, T).
                            setValues( 1, .1, null, null, function(value,target,actor) {
                                actor.backgroundImage.setAnimationImageIndex( [
                                        actor.__imageIndex+(23-((23*value)>>0))*actor.backgroundImage.getColumns()
                                    ] );
                            })
                    ).
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

            background.addChild(actorStar);
        }
    };

    scene.loadedImage = function(count, total) {
        percent.setText( parseInt((count/total*100)>>0)+' %' );
        percent.calcTextSize(director);
        percent.setFillStyle('white');
        percent.setLocation( 10+lading.x + (lading.width-percent.width)/2, lading.y+lading.height-10 );

        if ( count==total ) {

            var difftime= new Date().getTime()-time;
            if ( difftime<TIME ){
                difftime= Math.abs(TIME-difftime);
                if ( difftime>TIME ) {
                    difftime= TIME;
                }
                
                setTimeout(function() {
                    lading.setOutOfFrameTime();
                    rueda.setOutOfFrameTime();
                    percent.setOutOfFrameTime();

                    __end_loading(director);
                },
                difftime );
            } else {
                __end_loading(director);
            }

        }
    };

    return scene;
}

function __end_loading(director) {

    /**
     * build an image of numbers over background.
     * @param numbers
     * @param bgnumbers
     */
    function buildNumbersImage(bricks,bricksbg) {

        var numbers= new CAAT.CompoundImage().initialize(bricks,1,10 );
        var bgnumbers= new CAAT.CompoundImage().initialize(bricksbg,1,9 );

        var nw= bgnumbers.singleWidth*10;
        var nh= bgnumbers.singleHeight*bgnumbers.cols;

        var cx= (bgnumbers.singleWidth-numbers.singleWidth)/2;
        var cy= (bgnumbers.singleHeight-numbers.singleHeight)/2;

        var img= document.createElement('canvas');
        img.width= nw;
        img.height= nh;
        var ctx= img.getContext('2d');

        for( var i=0; i<bgnumbers.cols; i++ ) {
            for( var j=0; j<10; j++ ) {
                bgnumbers.paint( ctx, i, j*bgnumbers.singleWidth, i*bgnumbers.singleHeight );
                numbers.paint( ctx, j, j*bgnumbers.singleWidth+cx, i*bgnumbers.singleHeight+cy );
            }
        }

        return img;
    }

    director.__next_images.push( {
        id:'bricks',
        image: buildNumbersImage( director.__next_images[2].image, director.__next_images[3].image ) } );
    director.__next_images.splice(2,1);
    director.__next_images.splice(2,1);

    
    director.emptyScenes();

    // BUGBUG artifact
    director.setImagesCache(director.__next_images);
    delete director.__next_images;
    
    var gardenScene= new HN.GardenScene().create(director, 120);
    var gameScene= new HN.GameScene().create(director, HN.GameModes.respawn );
    gardenScene.gameScene= gameScene;
    //gameScene.gardenScene= gardenScene;
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

    var canvascontainer= document.getElementById('game');
    var director = new CAAT.Director().initialize(700,500).setClear(false);
    HN.director= director;
    canvascontainer.appendChild( director.canvas );

    new CAAT.ImagePreloader().loadImages(
        [
            {id:'stars',    url:'res/img/stars.png'},
            {id:'splash',   url:'res/splash/splash.jpg'},
            {id:'lading',   url:'res/splash/lading.png'},
            {id:'rueda',    url:'res/splash/rueda.png'},
            {id:'start',    url:'res/splash/start.png'}
        ],
        function( counter, images ) {

            if ( counter==images.length ) {

                images[0].image= CAAT.modules.ImageUtil.prototype.createAlphaSpriteSheet(1,0,24,images[0].image);
                director.setImagesCache(images);
                
                var scene_loading= __CAAT__loadingScene(director);
                director.addScene( scene_loading );
                director.setScene(0);

                new CAAT.ImagePreloader().loadImages(
                    [
                        {id:'smoke',            url:'res/img/humo.png'},
                        {id:'stars',            url:'res/img/stars.png'},
                        {id:'bricks',           url:'res/img/nums.png'},
                        {id:'bricks-bg',        url:'res/img/nums-bg.png'},
                        {id:'buttons',          url:'res/img/botones.png'},
                        {id:'numbers',          url:'res/img/numbers.png'},
                        {id:'numberssmall',     url:'res/img/numbers_s.png'},
                        {id:'madewith',         url:'res/img/madewith.png'},
                        {id:'background',       url:'res/img/fondo.jpg'},
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
                        {id:'rclock-arrow',     url:'res/img/rclock_arrow.png'}
                    ],

                    function( counter, images ) {

                        if ( counter==images.length ) {
                            images[0].image= CAAT.modules.ImageUtil.prototype.createAlphaSpriteSheet(0,1,32,images[0].image);
                            images[1].image= CAAT.modules.ImageUtil.prototype.createAlphaSpriteSheet(1,0,24,images[1].image);
                            images[41].image= CAAT.modules.ImageUtil.prototype.createAlphaSpriteSheet(1,0,16,images[41].image);

                            director.__next_images= images;
                            
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

                        scene_loading.loadedImage(counter, images.length);
                    }
                );

            }
        }
    );

    CAAT.loop(60);
}

function __enterCSS( domElement, x0,y0, x1,y1, scene ) {

    domElement.style['display']='block';
    domElement.style['top']=y0+'px';
    domElement.style['left']=x0+'px';

    var enterBehavior= new CAAT.GenericBehavior().
            setFrameTime( scene.time, 1000 ).
            setInterpolator(
                new CAAT.Interpolator().createBounceOutInterpolator(false)
            ).
            setValues(
                x0,
                x1,
                domElement,
                null,
                function( currentValue, target ) {
                    target.style['left']= currentValue+'px';
                }
            );

    scene.createTimer(
            scene.time,
            1000,
            function( time, ttime, timertask ) {
                domElement.style['top']=x1+'px';
                domElement.style['left']=y1+'px';
            },
            function( time,ttime,timertask) {
                enterBehavior.apply(time);
            },
            null);
}

window.addEventListener('load', __Hypernumbers_init, false);