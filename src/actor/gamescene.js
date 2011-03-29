(function() {
    HN.BrickActor= function() {
        HN.BrickActor.superclass.constructor.call(this);
        return this;
    };

    HN.BrickActor.prototype= {

        brick:          null,
        compoundImage:  null,

        /**
         *
         * @param compoundImage
         * @param brick a HN.Brick instance.
         */
        initialize : function( compoundImage, brick ) {
            this.setSpriteImage( compoundImage );
            this.brick= brick;

            var me= this;
            brick.delegate =  function() {
                me.spriteIndex=(me.brick.value-1) + 9*me.brick.color;
            }
            this.setSize(
                    compoundImage.singleWidth,
                    compoundImage.singleHeight);

            return this;
        },
        mouseEnter : function(mouseEvent) {

            if ( this.brick.selected ) {
                return;
            }

            this.emptyBehaviorList();

            this.parent.setZOrder( this, Number.MAX_VALUE );

            var sb= new CAAT.ScaleBehavior().
                    setFrameTime( mouseEvent.source.time, 250 ).
                    setValues( 1, 1.2, 1, 1.2 ).
                    setPingPong();

            this.addBehavior( sb );

            document.body.style.cursor = 'pointer';
        },
        mouseExit : function(mouseEvent) {
            document.body.style.cursor = 'default';
        },
        mouseDown : function(mouseEvent) {
            this.brick.changeSelection();
        },
        reset : function() {
            this.resetTransform();
            this.emptyBehaviorList();
            this.alpha=1;
        },
        toString : function() {
            return 'HN.Brick '+this.brick.row+','+this.brick.column;
        }

    };

    extend( HN.BrickActor, CAAT.SpriteActor, null);
})();

(function() {
    HN.GuessNumberActor= function() {
        HN.GuessNumberActor.superclass.constructor.call(this);
        this.actors= [];
        this.setGlobalAlpha(true);
        return this;
    };

    HN.GuessNumberActor.prototype= {

        guessNumber:    0,
        numbersImage:   null,
        offsetX:        0,
        offsetY:        0,
        numbers:        null,
        tmpnumbers:     null,

        actors:         null,

        setNumbersImage : function( image ) {
            this.numbersImage= image;

            for( var i=0; i<2; i++ ) {
                var digit=
                        new CAAT.SpriteActor().
                                create().
                                setSpriteImage(image).
                                setAnimationImageIndex([-1]).
                                setLocation(
                                    0,
                                    this.offsetY);
                
                this.actors.push(digit);
                this.addChild(digit);
            }


            return this;
        },
        contextEvent : function( event ) {
            var i;

            if ( event.source=='context' ) {
                if ( event.event=='guessnumber' ) {

                    var me= this;
                    me.guessNumber=   event.params.guessNumber;
                    me.numbers= [];

                    var snumber= me.guessNumber.toString();
                    me.offsetX= 10;
                    me.offsetY= (me.height - me.numbersImage.singleHeight)/2;

                    var i;
                    for( i=0; i<snumber.length; i++ ) {
                        me.numbers[i]= parseInt(snumber.charAt(i));
                        this.actors[i].x= me.offsetX+i*(me.numbersImage.singleWidth-30);
                    }

                    if ( snumber.length==1 ) {
                        this.actors[1].setAnimationImageIndex([-1]);
                    }


                    if ( null==me.tmpnumbers ) {

                        for( i=0; i<snumber.length; i++ ) {
                            this.actors[i].setAnimationImageIndex([this.numbers[i]]);
                        }

                        this.emptyBehaviorList();
                        this.addBehavior(
                            new CAAT.AlphaBehavior().
                                setFrameTime( this.time, 250 ).
                                setValues(0,1)
                            );

                        me.tmpnumbers= me.numbers;

                    } else {
                        this.emptyBehaviorList();
                        this.addBehavior(
                            new CAAT.AlphaBehavior().
                                setFrameTime( this.time, 250 ).
                                setValues(1,0).
                                addListener( {
                                    behaviorExpired : function(behavior, time, actor) {

                                        for( i=0; i<snumber.length; i++ ) {
                                            me.actors[i].setAnimationImageIndex([me.numbers[i]]);
                                        }

                                        me.emptyBehaviorList();
                                        me.addBehavior(
                                            new CAAT.AlphaBehavior().
                                                setFrameTime( me.time, 250 ).
                                                setValues(0,1));

                                    },
                                    behaviorApplied : function(behavior, time, normalizedTime, actor, value) {}
                                })
                            );
                    }

                } else if ( event.event=='status') {
                    if ( event.params!=HN.Context.prototype.ST_RUNNNING ) {
                        this.numbers= null;
                        this.tmpnumbers= null;
                    }
                }
            }
        }
    };

    extend( HN.GuessNumberActor, CAAT.ActorContainer, null);

})();

(function() {
    HN.Chrono= function() {
        HN.Chrono.superclass.constructor.call(this);

        this.actorventana= new CAAT.ImageActor().
                create();
        this.actorcrono= new CAAT.ImageActor().
                create().
                setLocation(14,18);

        this.addChild( this.actorcrono );
        this.addChild( this.actorventana );

        return this;
    };

    HN.Chrono.prototype= {

        maxTime:    0,
        elapsedTime:0,


        actorventana:   null,
        actorcrono:     null,

        progressHole:  160,

        setImages : function( background, progress ){
            this.actorventana.setImage(background);
            this.actorcrono.setImage(progress);
            this.actorcrono.setClip( true );


            return this;
        },
        animate : function(director, time) {
            var size=
                    this.maxTime!=0 ?
                            this.elapsedTime/this.maxTime * this.progressHole :
                            0;
            this.actorcrono.width= this.progressHole-size;

            return HN.Chrono.superclass.animate.call(this,director,time);
        },
        tick : function( iElapsedTime, maxTime ) {
            this.maxTime= maxTime;
            this.elapsedTime= iElapsedTime;
        },
        contextEvent : function(event) {
            if ( event.source=='context' && event.event=='status') {
                if ( event.params==HN.Context.prototype.ST_ENDGAME ) {
                    this.maxTime=0;
                    this.elapsedTime= 1000;
                }
            }
        }
    };

    extend( HN.Chrono, CAAT.ActorContainer, null);
})();

(function() {
    HN.SelectionPath= function() {
        HN.SelectionPath.superclass.constructor.call(this);
        this.coords= [];
        this.particles= [];
        this.fillStyle= null;
        return this;
    };

    HN.SelectionPath.prototype= {

        coords:                 null,   // an array of 2D positions on screen.
        path:                   null,
        pathMeasure:            null,
        particles:              null,   // an array of random time to position on path.
        particlesPerSegment:    10,
        traversingPathTime:     3000,

        initialize : function() {
            this.coords= [];
            this.path=           null;
            this.pathMeasure=    null;
        },
        setup : function( context, numberWidth, numberHeight ) {

            this.coords= [];

            // no bricks, no path
            if ( 0==context.selectedList.length ) {
                this.initialize();
                return;
            }

            var i;

            // get selected bricks screen coords.
            for( i=0; i<context.selectedList.length; i++ )  {
                var brick= context.selectedList[i];
                this.coords.push(
                    {
                        x: brick.column*numberWidth + numberWidth/2,
                        y: brick.row*numberHeight + numberHeight/2
                    });
            }

            // setup a path for the coordinates.
            this.path= new CAAT.Path();
            this.path.beginPath( this.coords[0].x, this.coords[0].y );
            for( i=1; i<context.selectedList.length; i++ ) {
                this.path.addLineTo( this.coords[i].x, this.coords[i].y );
            }
            this.path.endPath();

            this.pathMeasure= new CAAT.PathBehavior().
                    setPath(this.path).
                    setFrameTime(0, this.traversingPathTime*context.selectedList.length).
                    setCycle(true);

            var expectedParticleCount= this.particlesPerSegment*(context.selectedList.length-1);
            if ( this.particles.length> expectedParticleCount ) {
                this.particles.splice( expectedParticleCount, this.particles.length-expectedParticleCount );
            } else {
                while( this.particles.length<expectedParticleCount ) {
                    this.particles.push( (context.selectedList.length)*this.traversingPathTime + this.traversingPathTime*Math.random() );
                }
            }
        },
        paint : function(director, time)    {
            if ( this.coords.length>0 ) {
                var ctx= director.ctx;

                ctx.beginPath();
                var i;
                for( i=0; i<this.coords.length; i++ ) {
                    ctx.lineTo( this.coords[i].x, this.coords[i].y );
                }

                ctx.strokeStyle=    '#ffff00';
                ctx.lineCap=        'round';
                ctx.lineJoin=       'round';

                for( i=2; i<=8; i+=2 ) {

                    ctx.lineWidth=  i;
                    ctx.globalAlpha= .5 - i/8/3;
                    ctx.stroke();
                }

                // draw particles.
                ctx.fillStyle= '#ffffff';
                var s= 8;
                var pos;

                for(i=0; i<this.particles.length; i++) {
                    pos= this.pathMeasure.positionOnTime( (this.particles[i]+time)*(1+(i%3)*.33) );
                    ctx.beginPath();
                    ctx.arc( pos.x, pos.y, s/2, 0, Math.PI*2, false );
                    ctx.fill();
                }
            }

        },
        contextEvent : function( event ) {
            if ( event.source=='context' && event.event=='multiplier' ) {
            }
        },
        paintActorGL : function(director,time) {

            if ( null==this.coords || 0==this.coords.length ) {
                return;
            }

            director.glFlush();

            var i,
                pos=0,
                z= -director.canvas.height/2,
                point= new CAAT.Point(),
                m= this.worldModelViewMatrix;

            for( i=0; i<this.coords.length; i++ ) {
                point.set(this.coords[i].x, this.coords[i].y,0);
                m.transformCoord(point);
                director.coords[pos++]= point.x;
                director.coords[pos++]= point.y;
                director.coords[pos++]= z;
            }
            for( i=2; i<=8; i+=2 ) {
                director.glTextureProgram.drawPolylines(director.coords, this.coords.length, 1,1,0,.5 - i/8/3, i);
            }


            //
            // setup particles
            //
            pos=0;
            for(i=0; i<this.particles.length; i++) {
                ppos= this.pathMeasure.positionOnTime( (this.particles[i]+time)*(1+(i%3)*.33) );
                point.set(ppos.x, ppos.y,0);
                m.transformCoord(point);
                director.coords[pos++]= point.x-3;
                director.coords[pos++]= point.y-3;
                director.coords[pos++]= z;

                director.coords[pos++]= point.x+3;
                director.coords[pos++]= point.y+3;
                director.coords[pos++]= z;
            }
            director.glTextureProgram.drawLines(director.coords, this.particles.length, 1,1,1,.3, 7);

        }
    };

    extend( HN.SelectionPath, CAAT.Actor, null);
})();

(function() {
    HN.ScoreActor= function() {
        HN.ScoreActor.superclass.constructor.call(this);

        this.interpolator= new CAAT.Interpolator().createExponentialInOutInterpolator(2,false);

        for( var i=0; i<this.numDigits; i++ ) {
            var actor= new CAAT.SpriteActor().
                    create().
                    setAnimationImageIndex([-1]).
                    setBounds(0,0,0,0).
                    setScale( this.FONT_CORRECTION, this.FONT_CORRECTION );

            this.addChild(actor);
        }

        return this;
    };

    HN.ScoreActor.prototype= {

        numDigits:      6,

        incrementScore: 0,
        maxScore:       0,
        minScore:       0,
        currentScore:   0,

        numbers:        null,

        startTime:      0,
        interpolator:   null,
        scoreDuration:  2000,

        font:           null,

        FONT_CORRECTION:    .6,


        reset : function() {
            this.currentScore= 0;
            this.maxScore= 0;
            this.minScore= 0;
            this.currentScore=0;
            this.setScore();
        },
        setBackground : function(background) {
            this.setImage(background);
            this.setSize( background.width, background.height );
            this.setNumbersImage(this.font);

            return this;
        },
        setNumbersImage : function(font) {
            this.font= font;

            for( var i=0; i<this.numDigits; i++ ) {
                this.childrenList[i].setSpriteImage(font).setLocation(
                            (this.width-this.numDigits*this.font.singleWidth*this.FONT_CORRECTION)/2 + 
                                (i*this.font.singleWidth*this.FONT_CORRECTION),
                            20
                        );
            }

            return this;
        },
        contextEvent : function( event ) {
            if ( event.source=='context' ) {
                if ( event.event=='score' ) {
                    this.maxScore= event.params.score;
                    this.minScore= this.currentScore;
                    this.incrementScore= this.maxScore- this.minScore;
                    this.startTime= this.time;
                } else if ( event.event=='status') {
                    if ( event.params==HN.Context.prototype.ST_STARTGAME ) {
                        this.reset();
                    }
                }
            }
        },
        setScore: function(director) {
            this.currentScore>>=0;
            var str= ''+this.currentScore;
            while( str.length<6 ) {
                str='0'+str;
            }

            this.numbers= [];
            var i=0;
            for( i=0; i<str.length; i++ ) {
                this.numbers[i]= parseInt(str.charAt(i));

                this.childrenList[i].setAnimationImageIndex([this.numbers[i]]);

            }

        },
        animate : function(director, time) {
            if ( time>= this.startTime && time<this.startTime+this.scoreDuration ) {
                this.currentScore=
                        this.minScore +
                            this.incrementScore *
                            this.interpolator.getPosition( (time-this.startTime)/this.scoreDuration ).y;
                this.setScore(director);
                
            } else {
                if ( this.currentScore!=this.maxScore ) {
                    this.currentScore= this.maxScore;
                    this.setScore(director);
                }
            }

            return HN.ScoreActor.superclass.animate.call(this,director,time);
        }
    };

    extend( HN.ScoreActor, CAAT.ImageActor, null);
})();

(function() {

    HN.AnimatedBackground= function() {
        HN.AnimatedBackground.superclass.constructor.call(this);
        return this;
    };

    HN.AnimatedBackground.prototype= {
        timer:                      null,
        context:                    null,
        scene:                      null,
        altitude:                   .2,
        altitudeMeterByIncrement:   2,
        initialOffset:              0,
        currentOffset:              0,

        setData : function(scene, gameContext) {
            this.context= gameContext;
            this.scene= scene;
            return this;
        },
        contextEvent : function( event ) {

            var me= this;

            if ( event.source=='context' ) {
                if ( event.event=='status') {
                    if ( event.params==HN.Context.prototype.ST_ENDGAME ) {
                        if ( this.timer!=null ) {
                            this.timer.cancel();
                            this.timer= null;

                            this.currentOffset= this.offsetY;
                            this.addBehavior(
                                    new CAAT.GenericBehavior().
                                            setFrameTime( this.scene.time, 1000 ).
                                            setValues(this.currentOffset, this.initialOffset, this, 'offsetY').
                                            setInterpolator( new CAAT.Interpolator().
                                                createBounceOutInterpolator(false) )
                                    );
                        }
                    } else if ( event.params==HN.Context.prototype.ST_LEVEL_RESULT ) {
                        this.timer.cancel();
                    }
                } else if ( event.event=='levelchange') {
                    this.startTimer();
                }
            }
        },
        startTimer : function() {
            var me= this;
            this.timer= this.scene.createTimer(
                me.scene.time,
                100,
                function timeout(sceneTime, time, timerTask) {
                    me.offsetY+= me.altitude;
                    if ( me.offsetY>0 ) {
                        me.offsetY=0;
                    }
                    timerTask.reset( me.scene.time );
                    me.context.incrementAltitude( me.altitudeMeterByIncrement );
                },
                null,
                null );
        },
        setInitialOffset : function( offset ) {
            this.setOffsetY( offset );
            this.initialOffset= offset;
            return this;
        },
        caer : function(time) {
            this.setOffsetY( this.currentOffset + (this.initialOffset-this.currentOffset)*time );
        }
    };

    extend( HN.AnimatedBackground, CAAT.ImageActor, null);

})();

(function() {

    HN.BackgroundImage= function() {
        HN.BackgroundImage.superclass.constructor.call(this);
        return this;
    };

    HN.BackgroundImage.prototype= {
        altitude :  0,
        scene:      null,

        setScene : function(scene) {
            this.scene= scene;
            return this;
        },
        animate : function( director, time ) {
            if ( this.behaviorList.length==0 ) {
                this.setupBehavior(director, true);
            }
            return HN.BackgroundImage.superclass.animate.call(this,director,time);
        },
        contextEvent : function( event ) {
            if ( event.source=='context' && event.event=='altitude') {
                this.altitude= event.params;
            }
        },
        setupBehavior : function(director, bFirstTime) {

            /*
            La imagen de fondo es de 2560, y el alto del canvas de 500.
            quedan 2060 pixels de altura. por pixels, se suben 20 metros.,
            por lo que la altura de la imagen es de 2060*20= 41200 metros.

            ahora, todos los graficos van a ser nubes.
             */

            var is_bg= Math.random()<.3 || this.only_bg;

            this.setImage( director.getImage('cloud'+(is_bg ? 'b' : '')+ ((4*Math.random())>>0) ) );
            
            var t= (30000*(is_bg?1.5:1) + 5000*Math.random()*2);
            var me= this;
            var ix0, ix1, iy0, iy1;
            var from= Math.random();
            var dw= director.canvas.width;
            var dh= director.canvas.height-200;

            var ih= this.image.height;
            var iw= this.image.width;

            if ( bFirstTime ) {
                ix0= this.x;
                iy0= this.y;
                t= (dw-ix0)/dw*t;
            } else {
                ix0= -iw-iw*Math.random();
                iy0= dh*Math.random();
            }
            ix1= dw+iw*Math.random();
            iy1= iy0 + Math.random()*30;

            this.emptyBehaviorList();
            this.addBehavior(
                    new CAAT.PathBehavior().
                            setFrameTime( this.scene.time, t ).
                            setPath(
                                new CAAT.Path().
                                        beginPath( ix0, iy0 ).
                                        addLineTo( ix1, iy1 ).
                                        endPath()
                            ).
                            addListener( {
                                behaviorExpired : function(behavior, time, actor) {
                                    me.setupBehavior(director, false);
                                },
                                behaviorApplied : function(actor,time,normalizedTime,value) {
                                    
                                }
                            })
                    );
        }
    };

    extend( HN.BackgroundImage, CAAT.ImageActor, null);
})();

(function() {
    HN.LevelActor= function() {
        HN.LevelActor.superclass.constructor.call(this);

        for( var i=0; i<2; i++ ) {
            var digit= new CAAT.SpriteActor().
                    create().
                    setAnimationImageIndex([-1]).
                    setBounds(0,0,0,0);

            this.addChild(digit);
        }
        return this;
    };

    HN.LevelActor.prototype= {
        font:       null,
        level:      0,
        numbers:    null,

        setFontImage : function(font) {
            this.font= font;

            for( var i=0; i<this.childrenList.length; i++ ) {
                this.childrenList[i].setSpriteImage(font);
            }
            return this;
        },
        setBackground : function(background) {
            this.setImage(background);
            this.setSize( background.width, background.height );

            return this;
        },
        contextEvent : function(event) {
            if ( event.source=='context' ) {
                if ( event.event=='levelchange') {
                    this.level=   event.params;
                    this.numbers= [];

                    var snumber= this.level.toString();
                    var i;

                    for( i=0; i<snumber.length; i++ ) {
                        this.numbers[i]= parseInt(snumber.charAt(i));
                        this.childrenList[i].setAnimationImageIndex([this.numbers[i]]);
                        this.childrenList[i].setLocation(
                                (this.width - this.numbers.length*(this.font.singleWidth))/2,
                                (this.height - this.font.singleHeight)/2
                                );
                    }

                    for( ;i<this.childrenList.length; i++ ) {
                        this.childrenList[i].setAnimationImageIndex([-1]);
                    }

                }
            }
        }
    };

    extend(HN.LevelActor, CAAT.ImageActor, null);
})();

(function() {
    HN.MultiplierActor= function() {
        HN.MultiplierActor.superclass.constructor.call(this);

        this.actorx=    new CAAT.ImageActor().create().setVisible(false);
        this.actornum=  new CAAT.SpriteActor().create();

        this.addChild(this.actorx);
        this.addChild(this.actornum);

        return this;
    };

    HN.MultiplierActor.prototype= {

        actorx:     null,
        actornum:   null,

        multiplier: 0,

        setImages : function( font, x ) {

            this.actorx.setImage(x);
            this.actornum.setSpriteImage(font).setAnimationImageIndex([-1]);

            var xoffset= (this.width-x.width-font.singleWidth)/2 + 10;

            this.actorx.setLocation( xoffset, this.height-x.height+5 );
            this.actornum.setLocation( xoffset+x.width, 0 );

            return this;
        },
        hideMultiplier : function() {
            this.multiplier=0;
            this.actornum.setAnimationImageIndex([-1]);
            this.actorx.setVisible(false);
        },
        b1 : function(actor) {
            actor.emptyBehaviorList();
            var cb= new CAAT.ContainerBehavior().
                    setFrameTime(this.time,1000).
                    setCycle(true);

            var ab= new CAAT.AlphaBehavior().
                    setFrameTime(0,1000).
                    setValues(.6,.8).
                    setPingPong();

            cb.addBehavior(ab);

            actor.addBehavior(cb);
        },
        b2 : function(actor) {
            var me= this;
            actor.emptyBehaviorList();
            var ab= new CAAT.AlphaBehavior().
                    setFrameTime(this.time,300).
                    setValues( this.alpha, 0 ).
                    addListener( {
                        behaviorExpired : function(behavior, time, actor) {
                            me.hideMultiplier();
                        },
                        behaviorApplied : function(actor,time,normalizedTime,value) {}
                    });
            actor.addBehavior(ab);            
        },
        contextEvent : function( event ) {
            if ( event.source == 'context' ) {
                if ( event.event=='multiplier' ) {

                    if ( event.params.multiplier>1 ) {
                        this.multiplier = event.params.multiplier;
                        this.actornum.setAnimationImageIndex([this.multiplier]);
                        this.actorx.setVisible(true);

                        this.emptyBehaviorList();
                        this.addBehavior(
                            new CAAT.ScaleBehavior().
                                setFrameTime(this.time,1000).
                                setValues(.9, 1.1, .9, 1.1 ).
                                setPingPong().
                                setCycle(true));

                        this.b1(this.actorx);
                        this.b1(this.actornum);

                    } else {
                        this.emptyBehaviorList();
                        this.b2(this.actorx);
                        this.b2(this.actornum);
                    }
                } else if ( event.event=='status') {
                    if ( event.params==HN.Context.prototype.ST_ENDGAME ) {
                        this.hideMultiplier();
                    }
                }
            }
        }
    };

    extend( HN.MultiplierActor, CAAT.ActorContainer, null );
})();

(function() {
    HN.GameScene= function() {
        return this;
    };

    HN.GameScene.prototype= {

        imageBricksW:               9,
        imageBricksH:               9,

        gameRows:                   15,
        gameColumns:                20,

        gap:                        2,

        context:                    null,
        directorScene:              null,

        selectionPath:              null,
        bricksContainer:            null,
        brickActors:                null,
        particleContainer:          null,

        bricksImage:                null,
        buttonImage:                null,
        starsImage:                 null,
        numbersImage:               null,
        numbersImageSmall:          null,

        levelActor:                 null,
        chronoActor:                null,
        timer:                      null,
        scrollTimer:                null,
        scoreActor:                 null,

        scoreActorEG:               null,
        levelActorEG:               null,        
        endGameActor:               null,
        endLevelActor:              null,
        endLevelMessage:            null,

        director:                   null,


        actorInitializationCount:   0,  // flag indicating how many actors have finished initializing.

        backgroundContainer:        null,

        music:                      null,
        sound:                      null,

        /**
         * Creates the main game Scene.
         * @param director a CAAT.Director instance.
         */
        create : function(director, rows, columns) {

            var me= this;
            var i,j;

            this.gameRows= rows;
            this.gameColumns= columns;

            this.director= director;

            this.bricksImage= new CAAT.CompoundImage().initialize(
                    director.getImage('bricks'),
                    this.imageBricksH,
                    this.imageBricksW );
            this.buttonImage= new CAAT.CompoundImage().initialize(
                    director.getImage('buttons'), 7,3 );
            this.starsImage= new CAAT.CompoundImage().initialize(
                    director.getImage('stars'), 24,6 );
            this.numbersImage= new CAAT.CompoundImage().initialize(
                    director.getImage('numbers'), 1,10 );
            this.numbersImageSmall= new CAAT.CompoundImage().initialize(
                    director.getImage('numberssmall'), 1,10 );


            this.context= new HN.Context().
                    create( this.gameRows, this.gameColumns, this.imageBricksH ).
                    addContextListener(this);

            this.directorScene= director.createScene();
            this.directorScene.activated= function() {
                // cada vez que la escena se prepare para empezar partida, inicializar el contexto.
                me.context.initialize();
                me.prepareSound();
            };

            var dw= director.canvas.width;
            var dh= director.canvas.height;

            //////////////////////// animated background
            this.backgroundContainer= new HN.AnimatedBackground().
                    create().
                    setBounds(0,0,dw,dh).
                    setImage( director.getImage('background') ).
                    setInitialOffset( -director.getImage('background').height+2*dh ).
                    setClip(true).
                    setData(this.directorScene, this.context);
            this.directorScene.addChild( this.backgroundContainer );
            this.context.addContextListener(this.backgroundContainer);

            this.brickActors= [];

            this.soundControls( director );

            ///////////// some clouds
            for( i=0; i<4; i++ ) {
                var cl= new HN.BackgroundImage().
                        create().
                        setScene( this.directorScene ).
                        setLocation( dw/4*i + (dw/4)*Math.random() , (dh-200)*Math.random() );
                this.directorScene.addChild(cl);
            }


            //////////////////////// Number Bricks
            this.bricksContainer= new CAAT.ActorContainer().
                    create().
                    setSize(
                        this.gameColumns*this.getBrickWidth(),
                        this.gameRows*this.getBrickHeight() );

            var bricksCY= (dh-this.bricksContainer.height)/2;
            var bricksCX= bricksCY;
            this.bricksContainer.setLocation( bricksCX, bricksCY );
            
            this.directorScene.addChild(this.bricksContainer);

            for( i=0; i<this.gameRows; i++ ) {
                this.brickActors.push([]);
                for( j=0; j<this.gameColumns; j++ ) {
                    var brick= new HN.BrickActor().
                            create().
                            initialize( this.bricksImage, this.context.getBrick(i,j) ).
                            setLocation(-100,-100);

                    this.brickActors[i].push( brick );

                    this.bricksContainer.addChild(brick);
                }
            }


            /////////////////////// game indicators.
            var controls= new CAAT.ActorContainer().
                    create().
                    setBounds(
                        this.bricksContainer.x + this.bricksContainer.width + bricksCX,
                        this.bricksContainer.x,
                        dw - bricksCX - (this.bricksContainer.x + this.bricksContainer.width) - bricksCX,
                        this.bricksContainer.height );
            this.directorScene.addChild( controls );

            /////////////////////// initialize button
            var restart= new CAAT.Button().
                    create().
                    initialize( this.buttonImage, 9,10,11,9 ).
                    setLocation(
                        (controls.width-this.buttonImage.singleWidth)/2,
                        controls.height - this.buttonImage.singleHeight );

            restart.mouseClick= function(mouseEvent) {
                me.context.timeUp();
            };
            restart.contextEvent= function(event) {
                if ( event.source=='context' ) {
                    if ( event.event=='levelchange') {
                        restart.enableEvents(true);
                    } else  if ( event.event=='status') {
                        if ( event.params==HN.Context.prototype.ST_STARTGAME ) {
                            restart.enableEvents(true);
                        } else if ( event.params==HN.Context.prototype.ST_ENDGAME || event.params==HN.Context.prototype.ST_LEVEL_RESULT ) {
                            restart.enableEvents(false);
                        }
                    }
                }
            };
            this.context.addContextListener(restart);
            controls.addChild(restart);

            ///////////////////// Level indicator
	        this.levelActor= new HN.LevelActor().
                    create().
	                setBounds( 0, 110, controls.width, 40 ).
                    setFontImage( this.numbersImageSmall ).
                    setBackground( director.getImage('level') );
            this.context.addContextListener(this.levelActor);

	        controls.addChild(this.levelActor);

            ///////////////////// Guess Number
            var guess= new HN.GuessNumberActor().
                    create().
                    setBounds( 0, 10, controls.width, 70 ).
                    setNumbersImage( this.numbersImage );
            this.context.addContextListener(guess);
            controls.addChild(guess);

            ///////////////////// chronometer
            this.chronoActor= new HN.Chrono().
                    create().
                    setBounds( 0, 230, controls.width, director.getImage('time').height ).
                    setImages( director.getImage('time'), director.getImage('timeprogress'));
            this.context.addContextListener(this.chronoActor);
            controls.addChild(this.chronoActor);

            ///////////////////// score
            this.scoreActor= new HN.ScoreActor().
                    create().
                    setBounds( 0, 180, controls.width, 30 ).
                    setNumbersImage( this.numbersImageSmall ).
                    setBackground( director.getImage('points') );
            controls.addChild( this.scoreActor );
            this.context.addContextListener(this.scoreActor);

            ////////////////////// Multiplier
            var multiplier= new HN.MultiplierActor().
                    create().
                    setBounds(0, 300, controls.width, 80 ).
                    setImages( this.numbersImage, director.getImage('multiplier') );
            controls.addChild( multiplier );
            this.context.addContextListener(multiplier);


            /////////////////////// particle container
            // just to accelerate events delivery
            this.particleContainer= new CAAT.ActorContainer().
                    create().
                    setBounds(0,0,dw,dh).
                    enableEvents(false);
            this.directorScene.addChild( this.particleContainer );

            /////////////////////// initialize selection path
            /// create this one as the last actor so when gl active, no extra drawtris call needed.
            this.selectionPath= new HN.SelectionPath().
                    create().
                    setBounds(
                        this.bricksContainer.x,
                        this.bricksContainer.y,
                        this.gameColumns*this.getBrickWidth(),
                        this.gameRows*this.getBrickHeight());
            this.selectionPath.enableEvents(false);
            this.directorScene.addChild(this.selectionPath);
            this.context.addContextListener(this.selectionPath);

            ////////////////////////////////////////////////
            this.create_EndGame(director);
            this.create_EndLevel(director);
            
            return this;
        },
        create_EndLevel : function( director ) {
            this.endLevelActor= new CAAT.ImageActor().
                    create().
                    setImage( director.getImage('levelclear'));

            var me= this;
            var me_endLevel= this.endLevelActor;
            var continueButton= new CAAT.Button().
                    create().
                    initialize( this.buttonImage, 12,13,14,12 );
            continueButton.setLocation( (this.endLevelActor.width-continueButton.width)/2, this.endLevelActor.height-continueButton.height-50 );

            continueButton.mouseClick= function(mouseEvent) {
                director.audioPlay('11');
                me.removeGameEvent( me.endLevelActor, function() {
                    me.context.nextLevel();
                });
            };

            this.endLevelMessage= new CAAT.ImageActor().
                    create().
                    setImage( director.getImage('msg1') );

            this.endLevelActor.addChild(continueButton);
            this.endLevelActor.addChild(this.endLevelMessage);
            this.endLevelActor.setOutOfFrameTime();
            this.directorScene.addChild(this.endLevelActor);
        },
        create_EndGame : function(director, go_to_menu_callback ) {
            var me= this;

            this.endGameActor= new CAAT.ImageActor().
                    create().
                    setImage( director.getImage('background_op') );

            var menu= new CAAT.Button().
                    create().
                    initialize( this.buttonImage, 15,16,17,15 );
            var me_endGame= this.endGameActor;
            menu.mouseClick= function(mouseEvent) {

                director.audioPlay('11');

                me.endGameActor.enableEvents(false);

                var a0;
                var a1;

                a0= CAAT.Actor.prototype.ANCHOR_BOTTOM;
                a1= CAAT.Actor.prototype.ANCHOR_TOP;

                director.easeInOut(
                    0,
                    CAAT.Scene.EASE_TRANSLATE,
                    a0,
                    1,
                    CAAT.Scene.EASE_TRANSLATE,
                    a1,
                    1000,
                    false,
                    new CAAT.Interpolator().createExponentialInOutInterpolator(3,false),
                    new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );
            };

            var restart= new CAAT.Button().
                    create().
                    initialize( this.buttonImage, 12,13,14,12 );
            restart.mouseClick= function(mouseEvent) {
                director.audioPlay('11');
                me.removeGameEvent( me.endGameActor, function() {
                    me.prepareSceneIn();
                    me.context.initialize();
                });
            };

            var tweetImage= new CAAT.CompoundImage().initialize( director.getImage('tweet'), 1, 3 );
            var tweet= new CAAT.Button().
                    create().
                    initialize( tweetImage, 0,1,2,0 );
            tweet.mouseClick = function(mouseEvent) {
                var url = "http://twitter.com/home/?status=Wow! I just scored "+me.context.score+" points (level "+me.context.level+") in Sumon. Beat that! http://ludei.com/sumon";
                window.open(url, 'blank', '');
            };

            var x= 45;
            //var x= (this.endGameActor.width-2*menu.width-30)/2;
            var y= this.endGameActor.height-35-menu.height;

            menu.setLocation( x, y );
            //restart.setLocation( x+menu.width+30, y );
            restart.setLocation( x+menu.width+10, y );
            tweet.setLocation( 375, this.endGameActor.height - 25 - tweetImage.height );

            this.endGameActor.addChild(menu);
            this.endGameActor.addChild(restart);
            this.endGameActor.addChild(tweet);



            //////////////////////// info de partida
            this.levelActorEG= new HN.LevelActor().
                    create().
                    setBounds(
                        (this.endGameActor.width-this.levelActor.width)/2,
                        265,
                        this.levelActor.width,
                        this.levelActor.height ).
                    setFontImage( this.numbersImageSmall ).
                    setBackground( director.getImage('level') );
            this.endGameActor.addChild(this.levelActorEG);
            this.context.addContextListener(this.levelActorEG);

            ///////////////////// score
            this.scoreActorEG= new HN.ScoreActor().
                    create().
                    setBounds(
                        (this.endGameActor.width-this.scoreActor.width)/2,
                        335,
                        this.scoreActor.width,
                        this.scoreActor.height ).
                    setNumbersImage( this.numbersImageSmall ).
                    setBackground( director.getImage('points') );
            this.endGameActor.addChild( this.scoreActorEG );
            this.context.addContextListener(this.scoreActorEG);

            this.endGameActor.setOutOfFrameTime();

            this.directorScene.addChild(this.endGameActor);
        },
        getBrickWidth : function() {
            return this.bricksImage.singleWidth + this.gap;
        },
        getBrickHeight : function() {
            return this.bricksImage.singleHeight + this.gap;
        },
        uninitializeActors : function() {
            this.selectionPath.initialize();

            var i, j;
            var radius= Math.max(this.director.canvas.width,this.director.canvas.height );
            var angle=  Math.PI*2*Math.random();
            var me=     this;

            var p0= Math.random()*this.director.canvas.width;
            var p1= Math.random()*this.director.canvas.height;
            var p2= Math.random()*this.director.canvas.width;
            var p3= Math.random()*this.director.canvas.height;

            for( i=0; i<this.gameRows; i++ ) {
                for( j=0; j<this.gameColumns; j++ ) {
                    var brickActor= this.brickActors[i][j];

                    if ( brickActor.brick.removed ) {
                        continue;
                    }

                    var random= Math.random()*1000;

                    var moveB= new CAAT.PathBehavior().
                            setFrameTime(this.directorScene.time, 1000+random).
                            setPath(
                                new CAAT.CurvePath().
                                        setCubic(
                                            brickActor.x, brickActor.y,
                                            p0, p1,
                                            p2, p3,
                                            radius/2 + Math.cos(angle)*radius,
                                            radius/2 + Math.sin(angle)*radius
                                         )
                                ).
                            setInterpolator(
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );
                    var sb= new CAAT.ScaleBehavior().
                            setFrameTime(this.directorScene.time , 1000+random).
                            setValues( 1, .1, 1 , .1).
                            setInterpolator(
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );

                    brickActor.emptyBehaviorList().
                        addBehavior(moveB).
                        addBehavior(sb).
                        enableEvents(false).
                        setAlpha(1).
                        resetTransform();

                }
            }

        },
        initializeActors : function() {

            this.selectionPath.initialize();

            var i, j;
            var radius= Math.max(this.director.canvas.width,this.director.canvas.height );
            var angle=  Math.PI*2*Math.random();
            var me=     this;

            var p0= Math.random()*this.director.canvas.width;
            var p1= Math.random()*this.director.canvas.height;
            var p2= Math.random()*this.director.canvas.width;
            var p3= Math.random()*this.director.canvas.height;

            for( i=0; i<this.gameRows; i++ ) {
                for( j=0; j<this.gameColumns; j++ ) {
                    var brickActor= this.brickActors[i][j];
                    brickActor.
                            setFrameTime( this.directorScene.time, Number.MAX_VALUE ).
                            setAlpha(1).
                            enableEvents(true).
                            resetTransform();

                    var random= Math.random()*1000;

                    var moveB= new CAAT.PathBehavior().
                            setFrameTime(this.directorScene.time, 1000+random).
                            setPath(
                                new CAAT.CurvePath().
                                        setCubic(
                                            radius/2 + Math.cos(angle)*radius,
                                            radius/2 + Math.sin(angle)*radius,
                                            p0, p1, p2, p3,
                                            j*this.bricksImage.singleWidth + j*2,
                                            i*this.bricksImage.singleHeight + i*2)
                                         ).

                            setInterpolator(
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );
                    var sb= new CAAT.ScaleBehavior().
                            setFrameTime(this.directorScene.time , 1000+random).
                            setValues( .1, 1, .1 , 1).
                            setInterpolator(
                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );


                    brickActor.emptyBehaviorList().
                        addBehavior(moveB).
                        addBehavior(sb).
                        enableEvents(false);

                    
                    var actorCount=0;
                    moveB.addListener( {
                        behaviorExpired : function( behavior, time, actor ) {
                            actorCount++;
                            if ( actorCount==me.gameRows*me.gameColumns ) {
                                if ( me.context.status==me.context.ST_INITIALIZING ) {
                                    me.context.setStatus( me.context.ST_RUNNNING );
                                }
                            }
                        }
                    });
                }
            }

            this.actorInitializationCount=0;
        },
        contextEvent : function( event ) {

            var i, j;
            var brickActor;
            var me= this;

            if ( event.source=='context' ) {
                if ( event.event=='levelchange') {
                    this.bricksContainer.enableEvents(true);
                } else if ( event.event=='status') {
                    if ( event.params==this.context.ST_INITIALIZING ) {

                        this.director.audioPlay( 'mostrarpanel' );

                        this.initializeActors();
                    } else if ( event.params==this.context.ST_RUNNNING) {
                        for( i=0; i<this.gameRows; i++ ) {
                            for( j=0; j<this.gameColumns; j++ ) {
                                brickActor= this.brickActors[i][j];
                                brickActor.enableEvents(true);
                            }
                        }

                        this.cancelTimer();
                        this.enableTimer();

                    } else if ( event.params==this.context.ST_LEVEL_RESULT ) {
                        this.director.audioPlay('10');
                        this.cancelTimer();
                        var me= this;
                        // wait 1 sec
                        var timer= this.directorScene.createTimer(
                                this.directorScene.time,
                                1000,
                                function (sceneTime, time, timerTask) {
                                    me.endLevel();
                                },
                                null
                                );
                    } else if ( event.params==this.context.ST_ENDGAME ) {
                        this.director.audioPlay('01');
                        this.endGame();
                    }
                }
            } else if ( event.source=='brick' ) {
                if ( event.event=='selection' ) {   // des/marcar un elemento.
                    this.director.audioPlay( event.params.selected ? '11' : 'deseleccionar' );
                    this.brickSelectionEvent(event);
                } else if ( event.event=='selectionoverflow') {  // seleccion error.
                    this.director.audioPlay( 'sumamal' );
                    this.selectionOverflowEvent(event);
                } else if ( event.event=='selection-cleared') {
                    document.body.style.cursor = 'default';
                    this.director.audioPlay('12');
                    this.selectionClearedEvent(event);
                }

                // rebuild selection path
                this.selectionPath.setup(
                        this.context,
                        this.getBrickWidth(),
                        this.getBrickHeight() );
            }
        },
        brickSelectionEvent : function(event) {
            var brick= event.params;
            var brickActor= this.brickActors[brick.row][brick.column];

            if ( brick.selected ) {

                // dibujar un grupo de estrellas desde el centro del ladrillo haciendo fade-out.
                var x0= brickActor.x+brickActor.width/2+this.starsImage.singleWidth/2;
                var y0= brickActor.y+brickActor.height/2+this.starsImage.singleHeight/2;
                var R= Math.sqrt( brickActor.width*brickActor.width + brickActor.height*brickActor.height )/2;
                var N= 16;
                var i;
                var rad= Math.PI/N*2;
                var T= 300;

                for( i=0; i<N; i++ ) {
                    var x1= x0+ R*Math.cos( i*rad );
                    var y1= y0+ R*Math.sin( i*rad );

                    var iindex= (Math.random()*6)>>0;
                    var actor= new CAAT.SpriteActor();
                    actor.__imageIndex= iindex;
                    actor.
                        create().
                        setSpriteImage( this.starsImage ).
                        setAnimationImageIndex( [iindex] ).
                        setDiscardable(true).
                        enableEvents(false).
                        setFrameTime(this.directorScene.time, T).
                        addBehavior(/*
                            new CAAT.AlphaBehavior().
                                setFrameTime(this.directorScene.time, T).
                                setValues( .6, .1 ).
                                setInterpolator(
                                    new CAAT.Interpolator().createExponentialOutInterpolator(
                                        2,
                                        false))
                                        */
                            new CAAT.GenericBehavior().
                                setFrameTime(this.directorScene.time, T).
                                setValues( 1, .1, null, null, function(value,target,actor) {
                                    actor.setAnimationImageIndex( [
                                            actor.__imageIndex+(23-((23*value)>>0))*actor.compoundbitmap.cols
                                        ] );
                                })/*.
                                setInterpolator(
                                    new CAAT.Interpolator().createExponentialOutInterpolator(
                                        2,
                                        false))*/
                        ).
                        addBehavior(
                            new CAAT.PathBehavior().
                                setFrameTime(this.directorScene.time,T).
                                setPath( new CAAT.LinearPath().
                                    setInitialPosition(x0,y0).
                                    setFinalPosition(x1,y1)).
                                    setInterpolator(
                                        new CAAT.Interpolator().createExponentialOutInterpolator(
                                            2,
                                            false)
                                    )
                        );
                    this.particleContainer.addChild(actor);
                }

                brickActor.emptyBehaviorList();

                var sb= new CAAT.ScaleBehavior().
                        setValues( 1, .65, 1, .65 ).
                        setFrameTime( 0, 1000 ).
                        setPingPong();
                var ab= new CAAT.AlphaBehavior().
                        setValues( .75, .25 ).
                        setFrameTime( 0, 1000 ).
                        setPingPong();

                var cb= new CAAT.ContainerBehavior().
                        setFrameTime( this.directorScene.time, 1000 ).
                        setCycle(true).
                        setPingPong().
                        addBehavior( sb ).
                        addBehavior( ab );

                brickActor.addBehavior(cb);
            }
            else {
                brickActor.reset();
            }
        },
        selectionOverflowEvent : function(event) {
            var i,j;
            var selectedContextBricks= event.params;
            var actor;

            for( i=0; i<selectedContextBricks.length; i++ ) {
                this.brickActors[ selectedContextBricks[i].row ][ selectedContextBricks[i].column ].reset();
            }

            this.bricksContainer.enableEvents(false);

            // get all active actors on board
            var activeActors= [];
            for( i=0; i<this.gameRows; i++ ) {
                for( j=0; j<this.gameColumns; j++ ) {
                    actor= this.brickActors[i][j];
                    if ( !actor.brick.removed ) {
                        activeActors.push(actor);
                    }
                }
            }

            // define animation callback
            var count=0;
            var maxCount= activeActors.length;
            var me= this;
            var callback= {
                behaviorExpired : function(behavior, time, actor) {
                    count++;
                    if ( count==maxCount ) {
                        me.bricksContainer.enableEvents(true);
                    }
                }
            };

            // for each active actor, play a wrong-path.
            for( i=0; i<activeActors.length; i++ ) {
                actor= activeActors[i];

                var signo= Math.random()<.5 ? 1: -1;
                actor.emptyBehaviorList().
                    addBehavior(
                        new CAAT.PathBehavior().
                            setFrameTime(this.directorScene.time, 200).
                            setPath(
                                new CAAT.Path().
                                    beginPath( actor.x, actor.y ).
                                    addLineTo(
                                        actor.x + signo*(5+5*Math.random()),
                                        actor.y ).
                                    addLineTo(
                                        actor.x - signo*(10+5*Math.random()),
                                        actor.y ).
                                    closePath() ).
                            addListener(callback).
                            setPingPong() );
            }
        },
        selectionClearedEvent : function(event) {
            var selectedContextBricks= event.params;
            var me= this;
            var i,j;

            for( i=0; i<selectedContextBricks.length; i++ ) {

                var actor= this.brickActors[ selectedContextBricks[i].row ][ selectedContextBricks[i].column ];

                var signo= Math.random()<.5 ? 1 : -1;
                var offset= 50+Math.random()*30;
                var offsetY= 60+Math.random()*30;

                actor.parent.setZOrder(actor,Number.MAX_VALUE);
                actor.enableEvents(false).
                    emptyBehaviorList().
                    addBehavior(
                        new CAAT.PathBehavior().
                            setFrameTime( this.directorScene.time, 800 ).
                            setPath(
                                new CAAT.Path().
                                    beginPath( actor.x, actor.y ).
                                    addQuadricTo(
                                        actor.x+offset*signo,   actor.y-300,
                                        actor.x+offset*signo*2, actor.y+this.director.canvas.height+20).
                                    endPath() ).
                            addListener( {
                                behaviorExpired : function(behavior, time, actor) {
                                    actor.setExpired(true);
                                },
                                behaviorApplied : function(behavior, time, normalizedTime, actor, value) {

                                    for( i=0; i<3; i++ ) {
                                        var offset0= Math.random()*10*(Math.random()<.5?1:-1);
                                        var offset1= Math.random()*10*(Math.random()<.5?1:-1);
                                        var iindex= (Math.random()*6)>>0;
                                        var actor2= new CAAT.SpriteActor();
                                        actor2.__imageIndex= iindex;
                                        actor2.
                                                create().
                                                setSpriteImage( me.starsImage ).
                                                setLocation( offset0+actor.x+actor.width/2, offset1+actor.y).
                                                setAnimationImageIndex( [iindex] ).
                                                setDiscardable(true).
                                                enableEvents(false).
                                                setFrameTime(me.directorScene.time, 400).
                                                addBehavior(/*
                                                    new CAAT.AlphaBehavior().
                                                        setFrameTime(me.directorScene.time, 300).
                                                        setValues( .6, .1 ).
                                                        setInterpolator(
                                                            new CAAT.Interpolator().createExponentialInInterpolator(
                                                                4,
                                                                false))*/
                                                    new CAAT.GenericBehavior().
                                                            setFrameTime(me.directorScene.time, 400).
                                                            setValues(1, .1, null, null, function(value, target, actor) {
                                                            actor.setAnimationImageIndex([
                                                                actor.__imageIndex + (23 - ((23 * value) >> 0)) * actor.compoundbitmap.cols
                                                            ]);
                                                        })
                                                    );
                                        me.particleContainer.addChild(actor2);
                                    }
                                }
                            })
                    ).addBehavior(
                        new CAAT.RotateBehavior().
                            setFrameTime( this.directorScene.time, 800 ).
                            setValues( 0, (Math.PI + Math.random()*Math.PI*2)*(Math.random()<.5?1:-1) )
                    ).addBehavior(
                        new CAAT.AlphaBehavior().
                            setFrameTime( this.directorScene.time, 800 ).
                            setValues( 1, .25 )
                    ).setScale( 1.5, 1.5 );
            }

            this.timer.reset(this.directorScene.time);
        },
        showLevelInfo : function() {

        },
        prepareSceneIn : function() {
            // setup de actores
            var i,j;

                this.bricksContainer.enableEvents(true);

                // fuera de pantalla
                for( i=0; i<this.gameRows; i++ ) {
                    for( j=0; j<this.gameColumns; j++ ) {
                        this.brickActors[i][j].setLocation(-100,-100);
                    }
                }

                this.selectionPath.initialize();

                this.chronoActor.tick(0,0);
                this.scoreActor.reset();

                this.endGameActor.setFrameTime(-1,0);
        },
        endGame : function() {
            this.gardenScene.scores.addScore( this.context.score, this.context.level, this.context.difficulty );
            this.showGameEvent( this.endGameActor );
        },
        setDifficulty : function(level) {
            this.context.difficulty=level;
        },
        cancelTimer : function(){
            if ( this.timer!=null ) {
                this.timer.cancel();
            }
            this.timer= null;
        },
        enableTimer : function() {
            var me= this;
            
            this.timer= this.directorScene.createTimer(
                this.directorScene.time,
                this.context.turnTime,
                function timeout(sceneTime, time, timerTask) {
                    me.context.timeUp();
                },
                function tick(sceneTime, time, timerTask) {
                    me.chronoActor.tick(time, timerTask.duration);
                });

        },
        endLevel : function() {
            var level= this.context.level;
            if ( level>7 ) {
                level=7;
            }
            var image= this.director.getImage( 'msg'+level);
            if ( null!=image ) {
                this.endLevelMessage.setImage( image );
                this.endLevelMessage.setLocation(
                        (this.endLevelMessage.parent.width-image.width)/2,
                        30 + this.endLevelMessage.parent.height/2
                        );
            }
            this.showGameEvent( this.endLevelActor );
        },
        removeGameEvent : function( actor, callback ) {
            actor.enableEvents(false);
            this.uninitializeActors();

            var me= this;

            actor.emptyBehaviorList();
            actor.addBehavior(
                new CAAT.PathBehavior().
                    setFrameTime( actor.time, 2000 ).
                    setPath(
                        new CAAT.LinearPath().
                                setInitialPosition( actor.x, actor.y ).
                                setFinalPosition( actor.x, -actor.height )
                    ).
                    setInterpolator(
                        new CAAT.Interpolator().createExponentialInInterpolator(2,false)
                    ).
                    addListener(
                        {
                            behaviorExpired : function(behavior, time, actor) {
                                actor.setOutOfFrameTime();
                                callback();
                            }
                        }
                    )
            );
        },
        showGameEvent : function(actor) {
            // parar y eliminar cronometro.
            this.cancelTimer();

            // quitar contorl de mouse.
            this.bricksContainer.enableEvents(false);

            // mostrar endgameactor.

            var x= (this.directorScene.width - actor.width)/2;
            var y= (this.directorScene.height - actor.height)/2 - 100;

            var me_endGameActor= actor;
            actor.emptyBehaviorList().
                setFrameTime(this.directorScene.time, Number.MAX_VALUE).
                enableEvents(false).
                addBehavior(
                    new CAAT.PathBehavior().
                        setFrameTime( this.directorScene.time, 2000 ).
                        setPath(
                            new CAAT.LinearPath().
                                setInitialPosition( x, this.directorScene.height ).
                                setFinalPosition( x, y ) ).
                        setInterpolator(
                            new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) ).
                        addListener( {
                            behaviorExpired : function(behavior, time, actor) {
                                me_endGameActor.enableEvents(true);

                                me_endGameActor.emptyBehaviorList();
                                me_endGameActor.addBehavior(
                                        new CAAT.PathBehavior().
                                            setFrameTime( time, 3000 ).
                                            setPath(
                                                new CAAT.LinearPath().
                                                        setInitialPosition( me_endGameActor.x, me_endGameActor.y ).
                                                        setFinalPosition(
                                                            me_endGameActor.x+(Math.random()<.5?1:-1)*(5+5*Math.random()),
                                                            me_endGameActor.y+(Math.random()<.5?1:-1)*(5+5*Math.random()) )
                                            ).
                                            addListener( {
                                                behaviorExpired : function(behavior, time, actor) {
                                                    behavior.setFrameTime( time, 3000 );
                                                    behavior.path.setFinalPosition(
                                                            me_endGameActor.x+(Math.random()<.5?1:-1)*(5+5*Math.random()),
                                                            me_endGameActor.y+(Math.random()<.5?1:-1)*(5+5*Math.random())
                                                            );
                                                },
                                                behaviorApplied : function(behavior, time, normalizedTime, actor, value) {
                                                }
                                            }).
                                            setInterpolator(
                                                new CAAT.Interpolator().createExponentialInOutInterpolator(3,true)
                                                )
                                        );

                            },
                            behaviorApplied : function(behavior, time, normalizedTime, actor, value) {
                            }
                        } )
                );
        },
        soundControls : function(director) {
            var ci= new CAAT.CompoundImage().initialize( director.getImage('sound'), 2,3 );
            var dw= director.canvas.width;
            var dh= director.canvas.height;

            var music= new CAAT.Button().
                    create().
                    initialize( ci,0,1,0,0, function() {
                        director.audioManager.setMusicEnabled( !director.audioManager.isMusicEnabled() );
                        music.prepare();
                    }).
                    setBounds( dw-ci.singleWidth-2, 2, ci.singleWidth, ci.singleHeight );
            music.prepare= function() {
                if ( director.audioManager.isMusicEnabled() ) {
                    music.iNormal=0;
                    music.iOver=1;
                    music.iCurrent=0;
                } else {
                    music.iNormal= music.iOver= music.iCurrent=2;
                }
            };
            var sound= new CAAT.Button().
                    create().
                    initialize( ci,3,4,3,3, function() {
                        director.audioManager.setSoundEffectsEnabled( !director.audioManager.isSoundEffectsEnabled() );
                        sound.prepare();
                    }).
                    setBounds( dw-ci.singleWidth-2, 2+2+ci.singleHeight, ci.singleWidth, ci.singleHeight );
            sound.prepare= function() {
                if ( director.audioManager.isSoundEffectsEnabled() ) {
                            sound.iNormal=3;
                            sound.iOver=4;
                            sound.iCurrent=3;
                } else {
                    sound.iNormal= sound.iOver= sound.iCurrent=5;
                }
            };

            this.directorScene.addChild(sound);
            this.directorScene.addChild(music);

            this.music= music;
            this.sound= sound;
        },
        prepareSound : function() {
            try {
                this.sound.prepare();
                this.music.prepare();
            }
            catch(e) {

            }
        }

    };
})();
