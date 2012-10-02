/**
 * See LICENSE file.
 *
 * Play scene..
 */

(function() {
    HN.BrickActor= function() {
        HN.BrickActor.superclass.constructor.call(this);

        this.sb= new CAAT.ScaleBehavior().
            setFrameTime(-1,0).
            setValues(1,1);
        this.addBehavior(this.sb);

        this.rb= new CAAT.RotateBehavior().
                setFrameTime(-1,0).
                setValues(0,0)
        this.addBehavior(this.rb);

        this.pb= new CAAT.PathBehavior().
                setFrameTime(-1,0)
        this.addBehavior(this.pb);

        this.ab= new CAAT.AlphaBehavior().
                setFrameTime(-1,0).
                setValues(1)
        this.addBehavior(this.ab);

        return this;
    };

    HN.BrickActor.status= {
        REGULAR:    0,      // en tablero.
        FALLING:    1,      // cayendo. (rearrange)
        CLEARED:    2       // eliminado, no disponible (cayendo y eliminado)
    }

    HN.BrickActor.prototype= {

        timeOver:       250,
        timeSelection:  1000,
        timeRespawn:    1500,
        timeRearrange:  1500,
        timeOverflow:   200,
        timeCleared:    800,

        brick:          null,

        status:         0,  // 0: regular state, 1: falling, 2: cleared.

        ab:             null,
        sb:             null,
        rb:             null,
        pb:             null,

        /**
         *
         * @param numberImage
         * @param brick a HN.Brick instance.
         */
        initialize : function( numberImage, brick ) {

            var tw= numberImage.singleWidth;
            var th= numberImage.singleHeight;
            this.setSize(tw,th);

            this.setBackgroundImage(numberImage.getRef(),true);

            this.brick= brick;

            var me= this;
            brick.delegate =  function() {
                me.setSpriteIndex( me.brick.value + numberImage.columns*me.brick.color );
            }

            return this;
        },

        /**
         * Make initialize animation.
         * @param brickPosition
         */
            /*
        initializeForPlay: function( brickPosition, animationStartTime, animationDuration ) {

            var brickActor= this;

            brickActor.
                setLocation( brickPosition.x, brickPosition.y ).
                setScale( .01, .01 );

            brickActor.sb.
                setValues( .01,1, .01, 1).
                setInterpolator(
                    new CAAT.Interpolator().createElasticOutInterpolator(1.1, 0.1, false) ).
                setFrameTime(animationStartTime, animationDuration );

        },
*/
        setStatus : function(st) {
            this.status= st;
            return this;
        },
        mouseEnter : function(mouseEvent) {

            if ( this.brick.selected ) {
                return;
            }

            this.parent.setZOrder( this, Number.MAX_VALUE );

            this.sb.setFrameTime( this.time, this.timeOver ).
                    setValues( 1, 1.2, 1, 1.2 ).
                    setPingPong();

            if ( !CocoonJS.available ) {
                CAAT.setCursor('pointer');
            }
        },
        mouseExit : function(mouseEvent) {
            if ( !CocoonJS.available ) {
                CAAT.setCursor('default');
            }
        },
        mouseDown : function(mouseEvent) {
            this.brick.changeSelection();
        },
        toString : function() {
            return 'HN.Brick '+this.brick.row+','+this.brick.column;
        },
        /**
         * brick deselected.
         */
        reset : function() {

            this.resetAlpha().
                    resetRotate().
                    resetScale().
                    resetTransform();
            this.alpha=1;
            return this;
        },
        resetBehavior : function(b,p1,p2) {
            b.emptyListenerList();
            b.setCycle(false);
            b.setInterpolator( new CAAT.Interpolator().createLinearInterpolator() );
            b.setFrameTime(-1,0);
            if ( p1&& p2 ) {
                b.setValues(p1,p2);
            }
        },
        resetAlpha: function() {
            this.resetBehavior(this.ab,1,1);
            return this;
        },
        resetScale: function() {
            this.resetBehavior(this.sb,1,1);
            return this;
        },
        resetRotate: function() {
            this.resetBehavior(this.rb,0,2*Math.PI);
            return this;
        },
        resetPath : function() {
            this.resetBehavior(this.pb);
            return this;
        },
        resetBehaviors : function() {
            this.resetAlpha();
            this.resetScale();
            this.resetRotate();
            this.resetPath();
            return this;
        },
        /**
         * brick selected.
         */
        setSelected : function() {

            this.sb.
                    setValues( 1, .65, 1, .65 ).
                    setFrameTime( this.time, this.timeSelection ).
                    setPingPong().
                    setCycle(true);

            this.ab.
                    setValues( .75, .25 ).
                    setFrameTime( this.time, this.timeSelection ).
                    setPingPong().
                    setCycle(true);

        },
        /**
         * game just started.
         */
        set: function() {
            this.status= HN.BrickActor.status.REGULAR;
            this.enableEvents(true);
            this.reset();
        },
        /**
         * actors entering game upon respawn timeout.
         * @param x
         * @param y
         */
        respawn: function(x,y) {
            this.
                reset().
                enableEvents(true).
                setFrameTime(this.time,Number.MAX_VALUE).
                resetTransform().
                setAlpha(1).
                setStatus(HN.BrickActor.status.FALLING)
                ;

            this.pb.
                emptyListenerList().
                setFrameTime(this.time, this.timeRespawn+this.brick.row*50).
                setPath( new CAAT.LinearPath().
                    setInitialPosition(x, -this.height-((Math.random()*100)>>0) ).
                    setFinalPosition(x, y)).
                setInterpolator(
                    new CAAT.Interpolator().createBounceOutInterpolator()
                ).
                addListener(
                    {
                        behaviorApplied : function() {
                        },
                        // re-enable events on actor after moving to rearrange position.
                        behaviorExpired : function(behavior, time, actor) {
                            actor.setStatus(HN.BrickActor.status.REGULAR);
                        }
                    }
                );

        },
        /**
         * brick's been rearranged, i.e. moved position in context.
         * @param x
         * @param y
         */
        rearrange: function(x,y) {
            if ( this.status===HN.BrickActor.status.CLEARED ) {
                return;
            }

            this.setStatus(HN.BrickActor.status.FALLING);
            this.pb.
                emptyListenerList().
                setFrameTime(this.time + this.brick.column*50, this.timeRearrange).
                setPath( new CAAT.LinearPath().
                    setInitialPosition(this.x, this.y).
                    setFinalPosition(x, y)).
                setInterpolator(
                    new CAAT.Interpolator().createBounceOutInterpolator()
                ).
                addListener({
                    behaviorApplied : function() {
                    },
                    // re-enable events on actor after moving to rearrange position.
                    behaviorExpired : function(behavior, time, actor) {
                        actor.setStatus(HN.BrickActor.status.REGULAR);
                    }
                });
        },
        /**
         * selection excedes suggested number.
         * @param callback
         */
        selectionOverflow : function() {
            // ladrillos que estn cayendo, no hacen el path de error.
            //if ( !this.falling ) {
            if ( this.status===HN.BrickActor.status.REGULAR ) {
                var signo= Math.random()<.5 ? 1: -1;

                this.pb.
                        emptyListenerList().
                        setFrameTime(this.time, this.timeOverflow).
                        setPath(
                            new CAAT.Path().
                                    beginPath(this.x,this.y).
                                    addLineTo(this.x + signo*(5+5*Math.random()),this.y).
                                    addLineTo(this.x - signo*(5+5*Math.random()),this.y).
                                    endPath() ).
                        setPingPong();
            }

        },
        /**
         * this brick belongs to valid selection which sums up the suggested number.
         * @param scene
         * @param maxHeight
         */
        selectionCleared : function(scene, maxHeight) {

            this.setStatus(HN.BrickActor.status.CLEARED);

            var signo= Math.random()<.5 ? 1 : -1;
            var offset= 50+Math.random()*30;
            var actor= this;

            this.enableEvents(false).setScale( 1.5, 1.5 );

            this.pb.
                emptyListenerList().
                setFrameTime( this.time, this.timeCleared ).
                setPath(
                    new CAAT.Path().
                        beginPath( this.x, this.y ).
                        addQuadricTo(
                            this.x+offset*signo,   this.y-300,
                            this.x+offset*signo*2, this.y+maxHeight+20).
                        endPath() );

            if ( !HN.LOWQUALITY ) {
                this.pb.addListener( {
                    behaviorExpired : function(behavior, time, actor) {
                        actor.setExpired(true);
                    },
                    behaviorApplied : function(behavior, time, normalizedTime, actor, value) {

                        for( var i=0; i< (CocoonJS.available ? 1 : 3); i++ ) {
                            var offset0= Math.random()*10*(Math.random()<.5?1:-1);
                            var offset1= Math.random()*10*(Math.random()<.5?1:-1);

                            if ( scene.fallingStarCache.length>0 ) {
                                var actor2= scene.fallingStarCache.shift();
                                // check for no parent, that is, no active actor.
                                if ( !actor2.domParent ) {
                                    actor2.
                                        setAnimationImageIndex( [(Math.random()*6)>>0] ).
                                        setFrameTime(actor.time, 400).
                                        setLocation(
                                            offset0+actor.x+actor.width/2,
                                            offset1+actor.y);
                                    actor2.__parent.addChild(actor2);

                                    actor2.getBehavior( '__alpha' ).setFrameTime( actor.time, 400 );
                                }
                            }
                        }
                    }
                });
            }
            
            this.pb.setInterpolator( new CAAT.Interpolator().createLinearInterpolator(false,false) );

            this.rb.
                setFrameTime( this.time, this.timeCleared ).
                setValues( 0, (Math.PI + Math.random()*Math.PI*2)*(Math.random()<.5?1:-1) );

            this.ab.
                setFrameTime( this.time, this.timeCleared ).
                setValues( 1, .25 );
        }
    };

    extend( HN.BrickActor, CAAT.Actor);
})();

(function() {
    HN.RespawnClockActor= function() {
        HN.RespawnClockActor.superclass.constructor.call(this);
        this.ticks= [];
        return this;
    };

    HN.RespawnClockActor.prototype= {

        ticks:          null,
        respawnTime:    10000,
        scene:          null,
        context:        null,
        arrow:          null,
        enabled:        false,

        initialize: function(director, scene, context) {
            this.scene= scene;
            this.context= context;

            var itick= director.getImage('rclock-tick');
            var itickci;
            itickci= new CAAT.SpriteImage().initialize( itick, 16, 1 );
            var ibg= director.getImage('rclock-bg');
            var iarrow= director.getImage('rclock-arrow');
            var me= this;

            this.setSize(64,64);

            var bg= new CAAT.Actor().
                    setBackgroundImage( ibg, true ).
                    setLocation((this.width-ibg.width)/2, (this.height-ibg.height)/2);
            this.addChild(bg);

            var NTicks= 12;
            for( var i=0; i<NTicks; i++ ) {
                var tick= new CAAT.Actor().
                        setBackgroundImage( itickci.getRef(), true ).
                        setLocation(
                            this.width/2  + 29*Math.cos( -Math.PI/2 + i*2*Math.PI/NTicks ) - itick.width/2,
                            this.height/2 + 29*Math.sin( -Math.PI/2 + i*2*Math.PI/NTicks ) - itick.width/2
                            );

                this.addChild(tick);

                this.ticks.push(tick);

                var cb= new CAAT.ContainerBehavior().
                    setOutOfFrameTime().
                    addBehavior(
                        new CAAT.ScaleBehavior().
                            setFrameTime( i*this.respawnTime/NTicks, 300 ).
                            setValues( 1,3, 1,3 )
                    );
                    cb.addBehavior(
                        new CAAT.GenericBehavior().
                            setFrameTime( i*this.respawnTime/NTicks, 300 ).
                            setValues( 1, 0, null, null, function(value, target, actor ) {
                                actor.setAnimationImageIndex( [15-((value*15)>>0)] );
                            })
                    );
                tick.addBehavior(cb);
            }

            var flecha= new CAAT.Actor().setBackgroundImage(iarrow, true);
            flecha.setLocation(
                    (this.width-flecha.width)/2, this.height/2-23-.5
                    );
            this.addChild(flecha);

            flecha.addBehavior(
                    new CAAT.RotateBehavior().
                            setOutOfFrameTime().
                            setValues(0, 2*Math.PI, .50, (23/flecha.height*100)/100 ).
                            addListener({
                                behaviorExpired : function(behavior, time, actor) {
                                    me.resetTimer();
                                    me.context.respawn();

                                },
                                behaviorApplied : function(behavior, time, normalizedTime, actor, value) {}
                            })
                    );

            this.arrow= flecha;

            return this;
        },
        resetTimer : function() {
            var NTicks= this.ticks.length;
            for( var i=0; i<NTicks; i++ ) {
                this.ticks[i].resetTransform().setAnimationImageIndex([0]);
                this.ticks[i].behaviorList[0].setFrameTime(this.scene.time, this.respawnTime);
                this.ticks[i].behaviorList[0].behaviors[0].setFrameTime( i*this.respawnTime/NTicks, 300 );
                this.ticks[i].behaviorList[0].behaviors[1].setFrameTime( i*this.respawnTime/NTicks, 300 );
            }

            this.arrow.behaviorList[0].setFrameTime(this.scene.time, this.respawnTime);
        },
        stopTimer : function() {
            for( var i=0; i<this.ticks.length; i++ ) {
                this.ticks[i].resetTransform();
                this.ticks[i].behaviorList[0].setOutOfFrameTime();
            }
            this.arrow.behaviorList[0].setOutOfFrameTime();
        },
        contextEvent : function( event ) {
            if ( !this.enabled ) {
                return;
            }

            if ( event.event=='status') {
                if ( event.params==HN.Context.prototype.ST_RUNNNING ) {
                    this.resetTimer();
                } else {
                    this.stopTimer();
                }
            }
        },
        enable : function( enabled, respawnTime ) {
            this.respawnTime= respawnTime;
            this.enabled= enabled;
            if ( enabled ) {
                this.setFrameTime(0,Number.MAX_VALUE);
            } else {
                this.setOutOfFrameTime();
            }
        }
    };

    extend(HN.RespawnClockActor, CAAT.ActorContainer);
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

        container:      null,
        actors:         null,

        setNumbersImage : function( image, bg ) {

            this.setBackgroundImage(bg);
            this.numbersImage= image;

            this.container= new CAAT.ActorContainer()
                .setBounds( 10,0,this.width,this.height);
            this.addChild( this.container );

            this.offsetX= (this.width - 2 * (image.singleWidth-30)) / 2;
            this.offsetY= 10 + (this.height - image.singleHeight) / 2;

            for( var i=0; i<2; i++ ) {
                var digit=
                    new CAAT.Actor()
                        .setBackgroundImage(image.getRef(), true)
                        .setLocation(this.offsetX,this.offsetY)
                        .setVisible(false)
                    ;
                
                this.actors.push(digit);
                this.container.addChild(digit).setGlobalAlpha(true);
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
                    if ( snumber.length===1 ) {
                        snumber='0'+snumber;
                    }
                    me.offsetX= 10;
                    me.offsetY= (me.height - me.numbersImage.singleHeight)/2;

                    var i;
                    for( i=0; i<snumber.length; i++ ) {
                        me.numbers[i]= parseInt(snumber.charAt(i));
                        this.actors[i].setLocation(
                                me.offsetX+i*(me.numbersImage.singleWidth-30),
                                this.actors[i].y );
                        this.actors[i].setVisible(true);
                    }



                    if ( null==me.tmpnumbers ) {

                        for( i=0; i<snumber.length; i++ ) {
                            this.actors[i].setAnimationImageIndex([this.numbers[i]]);
                        }

                        this.container.emptyBehaviorList();
                        this.container.addBehavior(
                            new CAAT.AlphaBehavior().
                                setFrameTime( this.time, 250 ).
                                setValues(0,1).
                                setId(1000)
                            );

                        me.tmpnumbers= me.numbers;

                    } else {
                        this.container.emptyBehaviorList();
                        this.container.addBehavior(
                            new CAAT.AlphaBehavior().
                                setFrameTime( this.time, 250 ).
                                setValues(1,0).
                                addListener( {
                                    behaviorExpired : function(behavior, time, actor) {

                                        if (null!=me.numbers ) {
                                            for( i=0; i<snumber.length; i++ ) {
                                                me.actors[i].setAnimationImageIndex([me.numbers[i]]);
                                            }
                                        }

                                        actor.emptyBehaviorList();
                                        actor.addBehavior(
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

        this.actorventana= new CAAT.Actor();
        this.actorcrono= new CAAT.Actor().setLocation(14,18);
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
            this.actorventana.setBackgroundImage(background, true);
            this.actorcrono.setBackgroundImage(progress, true);

            this.setSize( this.actorventana.width, this.actorventana.height );
            this.actorcrono.setImageTransformation( CAAT.SpriteImage.prototype.TR_FIXED_TO_SIZE );
            return this;
        },
        animate : function(director, time) {
            var size=
                    this.maxTime!=0 ?
                            this.elapsedTime/this.maxTime * this.progressHole :
                            0;
            // make sure this actor is marked as dirty by calling setSize and not .width=new_size.
            this.actorcrono.setSize( this.progressHole-size, this.actorcrono.height );

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

    extend( HN.Chrono, CAAT.ActorContainer);
})();

(function() {
    HN.SelectionPath= function(director) {
        HN.SelectionPath.superclass.constructor.call(this);

        this.coords=        [];
        this.particles=     [];
        this.fillStyle=     null;
        this.bolasImage=
                new CAAT.SpriteImage().initialize(
                    director.getImage('bolas'),1,8);
        this.director=      director;
        return this;
    };

    HN.SelectionPath.prototype= {

        coords:                 null,   // an array of 2D positions on screen.
        path:                   null,
        pathMeasure:            null,
        particles:              null,   // an array of random time to position on path.
        particlesPerSegment:    10,
        traversingPathTime:     3000,
        context:                null,
        bolasImage:             null,
        director:               null,

        /**
         *
         * @param bolas {CAAT.SpriteImage}
         */
        initialize : function() {
            this.coords=        [];
            this.path=          null;
            this.pathMeasure=   null;
        },
        setup : function( context, brickActors ) {

            var i;

            this.context= context;
            this.brickActors= brickActors;
            this.coords= [];

            // no bricks, no path
            if ( 0==context.selectedList.length ) {
                this.initialize();
                return;
            }

            var expectedParticleCount= this.particlesPerSegment*(context.selectedList.length-1);
            if ( this.particles.length> expectedParticleCount ) {
                this.particles.splice( expectedParticleCount, this.particles.length-expectedParticleCount );
            } else {
                while( this.particles.length<expectedParticleCount ) {
                    this.particles.push( (context.selectedList.length)*this.traversingPathTime + this.traversingPathTime*Math.random() );
                }
            }
        },
        setupPath : function() {
            this.coords= [];

            if ( this.context.selectedList.length ) {
                var numberWidth= this.brickActors[0][0].width;
                var numberHeight= this.brickActors[0][0].height;
                var offsetX= (this.context.columns-this.context.currentColumns)/2*numberWidth;
                var offsetY= (this.context.rows-this.context.currentRows)/2*numberHeight;

                // get selected bricks screen coords.
                for( i=0; i<this.context.selectedList.length; i++ )  {
                    var brick= this.context.selectedList[i];
                    var brickActor= this.brickActors[brick.row][brick.column];
                    this.coords.push(
                        {
                            x: brickActor.x + brickActor.width/2,// + offsetX,
                            y: brickActor.y + brickActor.height/2// + offsetY
                        });
                }

                // setup a path for the coordinates.
                this.path= new CAAT.Path();
                this.path.beginPath( this.coords[0].x, this.coords[0].y );
                for( i=1; i<this.context.selectedList.length; i++ ) {
                    this.path.addLineTo( this.coords[i].x, this.coords[i].y );
                }
                this.path.endPath();
                this.pathMeasure= new CAAT.PathBehavior().
                        setPath(this.path).
                        setFrameTime(0, this.traversingPathTime*this.context.selectedList.length).
                        setCycle(true);
            }
        },
        paint : function(director, time)    {
            if ( null!=this.context && 0!=this.context.selectedList.length ) {

                var i;
                this.setupPath();


                var ctx= director.ctx;

                ctx.beginPath();
                var i;
                for( i=0; i<this.coords.length; i++ ) {
                    ctx.lineTo( this.coords[i].x, this.coords[i].y );
                }

                ctx.strokeStyle=    '#ffff00';
                ctx.lineCap=        'round';
                ctx.lineJoin=       'round';

                for( i=2; i<=(CocoonJS.available ? 2 : 8); i+=2 ) {

                    ctx.lineWidth=  i;
                    ctx.globalAlpha= .5 - i/8/3;
                    ctx.stroke();
                }

                if ( this.pathMeasure ) {
                    var pos;
                    for(i=0; i<this.particles.length; i++) {
                        pos= this.pathMeasure.positionOnTime( (this.particles[i]+time)*(1+(i%3)*.33) );
                        this.bolasImage.setSpriteIndex(i%8);
                        this.bolasImage.paint( director, 0, pos.x-4, pos.y-4 );
                    }
                }
            }

        },
        contextEvent : function( event ) {
            /*
            if ( event.source=='brick' &&
                (event.event=='selection' || event.event=='selectionoverflow' || event.event=='selection-cleared') ) {
                this.setupPath();
            }
            */
        },
        paintActorGL : function(director,time) {

            if ( null!=this.context && this.context.selectedList.length>1 ) {
                this.setupPath();
                if ( null===this.coords || 0===this.coords.length ) {
                    return;
                }


                director.glFlush();

                var i,
                    pos=0,
                    z= 0,
                    point= new CAAT.Point(),
                    m= this.worldModelViewMatrix,
                    cc= director.coords,
                    ccthis= this.coords,
                    pa= this.particles;

                for( i=0; i<ccthis.length; i++ ) {
                    point.set(ccthis[i].x, ccthis[i].y,0);
                    m.transformCoord(point);
                    cc[pos++]= point.x;
                    cc[pos++]= point.y;
                    cc[pos++]= z;
                }
                for( i=2; i<=8; i+=2 ) {
                    director.glTextureProgram.drawPolylines(cc, ccthis.length, 1,1,0,.5 - i/8/3, i);
                }


                //
                // setup particles
                //

                pos=0;
                for(i=0; i<pa.length; i++) {
                    ppos= this.pathMeasure.positionOnTime( (pa[i]+time)*(1+(i%3)*.33) );
                    point.set(ppos.x, ppos.y,0);
                    m.transformCoord(point);
                    cc[pos++]= point.x-3;
                    cc[pos++]= point.y-3;
                    cc[pos++]= z;

                    cc[pos++]= point.x+3;
                    cc[pos++]= point.y+3;
                    cc[pos++]= z;
                }
                director.glTextureProgram.drawLines(cc, pa.length, 1,1,1,.3, 7);

            }
        }
    };

    extend( HN.SelectionPath, CAAT.Actor);
})();

(function() {
    HN.ScoreActor= function() {
        HN.ScoreActor.superclass.constructor.call(this);
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
        initialize : function(font, background) {

            var i;

            this.font= font;
            this.interpolator= new CAAT.Interpolator().createExponentialInOutInterpolator(2,false);
            this.setBackgroundImage(background, true);

            for( i=0; i<this.numDigits; i++ ) {
                var actor= new CAAT.Actor().
                        setBackgroundImage(font.getRef(), true).
                        setLocation(
                            (((this.width-this.numDigits*this.font.singleWidth*this.FONT_CORRECTION)/2)>>0) +
                                (i*this.font.singleWidth*this.FONT_CORRECTION) - 5,
                            12
                        ).
                        setScale( this.FONT_CORRECTION, this.FONT_CORRECTION );

                this.addChild(actor);
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

    extend( HN.ScoreActor, CAAT.ActorContainer);
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
        altitude:                   .05,
        altitudeMeterByIncrement:   2,
        currentAltitude:            0,
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
                            this.currentOffset= this.backgroundImage.offsetY;
                            this.addBehavior(
                                    new CAAT.GenericBehavior().
                                            setFrameTime( this.scene.time, 1000 ).
                                            setValues(this.currentOffset, this.initialOffset, null, null,
                                                function(value,target,actor) {
                                                    me.setBackgroundImageOffset(0,value);
                                                }).
                                            setInterpolator( new CAAT.Interpolator().
                                                createBounceOutInterpolator(false) )
                                    );

                            me.currentAltitude= me.initialOffset;
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
            if ( !this.timer ) {
                this.timer= this.scene.createTimer(
                    me.scene.time,
                    200,
                    function timeout(sceneTime, time, timerTask) {

                        me.currentAltitude+= me.altitude;
                        if ( me.currentAltitude>0 ) {
                            me.currentAltitude=0;
                        }
                        me.setBackgroundImageOffset( 0, me.currentAltitude );
                        timerTask.reset( me.scene.time );
                        me.context.incrementAltitude( me.altitudeMeterByIncrement );
                    },
                    null,
                    null );
            }
        },
        setInitialOffset : function( offset ) {
            this.setBackgroundImageOffset( 0, offset );
            this.initialOffset= offset;
            this.currentAltitude= offset;
            return this;
        },
        caer : function(time) {
            this.setBackgroundImageOffset( 0, this.currentOffset + (this.initialOffset-this.currentOffset)*time );
        }
    };

    extend( HN.AnimatedBackground, CAAT.Actor);

})();

(function() {

    HN.BackgroundImage= function() {
        HN.BackgroundImage.superclass.constructor.call(this);
        return this;
    };

    HN.BackgroundImage.prototype= {

        setupBehavior : function(director, bFirstTime) {

            var is_bg= Math.random()<.4;

            this.setBackgroundImage( director.getImage('cloud'+(is_bg ? 'b' : '')+ ((4*Math.random())>>0) ), true );
            
            var t= (30000*(is_bg?1.5:1) + 5000*Math.random()*2);
            var me= this;
            var ix0, ix1, iy0, iy1;
            var dw= director.width;
            var dh= director.height-200;

            var ih= this.backgroundImage.height;
            var iw= this.backgroundImage.width;

            if ( bFirstTime ) {
                ix0= dw*Math.random();
                iy0= dh*Math.random();
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
                            setFrameTime( this.time, t ).
                            setPath(
                                new CAAT.Path().setLinear(ix0, iy0, ix1, iy1)
                            ).
                            addListener( {
                                behaviorExpired : function(behavior, time, actor) {
                                    me.setupBehavior(director, false);
                                },
                                behaviorApplied : function(actor,time,normalizedTime,value) {
                                    
                                }
                            })
                    );

            return this;
        }
    };

    extend( HN.BackgroundImage, CAAT.Actor);
})();

(function() {
    HN.LevelActor= function() {
        HN.LevelActor.superclass.constructor.call(this);
        this.numbers= [];
        return this;
    };

    HN.LevelActor.prototype= {
        font:       null,
        numbers:    null,

        initialize : function(font, background) {
            this.font= font;

            for( var i=0; i<2; i++ ) {
                var digit= new CAAT.Actor().
                        setBackgroundImage(font.getRef(), true).
                        setVisible(false);
                this.numbers.push(digit);
                this.addChild(digit);
            }

            this.setBackgroundImage(background, true);

            return this;
        },
        contextEvent : function(event) {
            if ( event.source=='context' ) {
                if ( event.event=='levelchange') {
                    this.level=   event.params;

                    var snumber= this.level.toString();
                    var i, number;
                    var correction= this.font.singleWidth*.8;

                    for( i=0; i<snumber.length; i++ ) {
                        number= parseInt(snumber.charAt(i));
                        this.numbers[i].
                            setSpriteIndex(number).
                            setLocation(
                                (this.width - snumber.length*correction)/2 + i*correction, 24 ).
                            setVisible(true);
                    }

                    for( ;i<this.numbers.length; i++ ) {
                        this.numbers[i].setVisible(false);
                    }

                }
            }
        }
    };

    extend(HN.LevelActor, CAAT.ActorContainer);
})();

(function() {
    HN.MultiplierActor= function() {
        HN.MultiplierActor.superclass.constructor.call(this);

        this.actorx=    new CAAT.Actor().setVisible(false);
        this.actornum=  new CAAT.Actor();

        this.addChild(this.actorx);
        this.addChild(this.actornum);

        return this;
    };

    HN.MultiplierActor.prototype= {

        actorx:     null,
        actornum:   null,

        multiplier: 0,

        setImages : function( font, x ) {

            this.actorx.setBackgroundImage(x,true);
            this.actornum.setBackgroundImage(font,true).setVisible(false);

            var xoffset= (this.width-x.width-font.singleWidth)/2 + 10;

            this.actorx.setLocation( xoffset, this.height-x.height+5 );
            this.actornum.setLocation( xoffset+x.width, 0 );

            return this;
        },
        hideMultiplier : function() {
            this.multiplier=0;
            this.actornum.setVisible(false);
            this.setVisible(false);
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
                        this.actornum.setVisible(true).setAnimationImageIndex([this.multiplier]);
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

                        this.setVisible(true);
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

    extend( HN.MultiplierActor, CAAT.ActorContainer);
})();

(function() {
    HN.MultiplierActorS= function() {
        HN.MultiplierActorS.superclass.constructor.call(this);

        this.star=      new CAAT.Actor();
        this.container= new CAAT.ActorContainer();
        this.actorx=    new CAAT.Actor();
        this.actornum=  new CAAT.Actor();

        this.addChild(this.star);
        this.addChild(this.container);
        this.container.addChild(this.actorx);
        this.container.addChild(this.actornum);

        this.container.setGlobalAlpha(true);

        return this;
    };

    HN.MultiplierActorS.prototype= {

        actorx:     null,
        actornum:   null,
        star:       null,

        multiplier: 0,

        setImages : function( font, x, star, scene ) {

            this.scene= scene;
            this.setOutOfFrameTime();

            this.star.setBackgroundImage(star);
            var S= this.star.width/2;
            this.actorx.setBackgroundImage(x,false).
                setBounds(0, (this.star.height-S)/2, S, S).
                setImageTransformation( CAAT.SpriteImage.prototype.TR_FIXED_TO_SIZE );
            this.actornum.setBackgroundImage(font,true).
                setScale( .4,.4 ).
                setLocation( 0, -20 );

            this.setSize( this.star.width, this.star.height);
            this.container.setSize( this.star.width, this.star.height);
            this.container.setRotation( Math.PI/16 );

            this.star.setLocation( 0,0 );


            return this;
        },
        hideMultiplier : function() {
            this.multiplier=0;
            this.setOutOfFrameTime();
        },
        b1 : function(actor) {
            actor.emptyBehaviorList();
            var cb= new CAAT.ContainerBehavior().
                    setFrameTime(this.scene.time,1000).
                    setCycle(true);

            var ab= new CAAT.AlphaBehavior().
                    setFrameTime(0,1000).
                    setValues(.8,1).
                    setPingPong();

            var sb= new CAAT.ScaleBehavior().
                setFrameTime(0,1000).
                setValues(.8, 1, .8, 1).
                setPingPong();

            cb.addBehavior(ab);
            cb.addBehavior(sb);

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
                        this.setFrameTime(0, Number.MAX_VALUE);

                        this.emptyBehaviorList();
                        this.star.addBehavior(
                            new CAAT.RotateBehavior().
                                setFrameTime(this.time,1000).
                                setValues(0, Math.PI*2 ).
                                setCycle(true));

                        this.b1(this.container);

                    } else {
                        this.emptyBehaviorList();
                        this.b2(this.container);
                    }
                } else if ( event.event=='status') {
                    if ( event.params==HN.Context.prototype.ST_ENDGAME ) {
                        this.hideMultiplier();
                    }
                }
            }
        }
    };

    extend( HN.MultiplierActorS, CAAT.ActorContainer);
})();

(function() {
    HN.GameScene= function() {
        this.gameListener= [];
        return this;
    };

    HN.GameScene.prototype= {

        gameRows:                   15,
        gameColumns:                20,

        context:                    null,
        directorScene:              null,

        selectionPath:              null,
        bricksContainer:            null,
        brickActors:                null,
        particleContainer:          null,

        selectionStarCache:         null,
        fallingStarCache:           null,

        brickWidth:                 0,
        brickHeight:                0,
        buttonImage:                null,
        starsImage:                 null,
        numbersImage:               null,
        numbersImageSmall:          null,

        levelActor:                 null,
        chronoActor:                null,
        timer:                      null,
        scrollTimer:                null,
        scoreActor:                 null,
        respawnClock:               null,

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

        gameListener:               null,

        /**
         * Creates the main game Scene.
         * @param director a CAAT.Director instance.
         */
        create : function(director, gameMode ) {

            var me= this;
            var i,j;

            this.director= director;

            this.bricksImageAll= new CAAT.SpriteImage().initialize(
                    director.getImage('bricks'), 9, 10 );

            this.brickWidth=  this.bricksImageAll.singleWidth;
            this.brickHeight= this.bricksImageAll.singleHeight;

            this.buttonImage= new CAAT.SpriteImage().initialize(
                    director.getImage('buttons'), 7,3 );
            this.starsImage= new CAAT.SpriteImage().initialize(
                    director.getImage('stars'), 24,6 );
            this.numbersImage= new CAAT.SpriteImage().initialize(
                    director.getImage('numbers'), 1,10 );
            this.numbersImageSmall= new CAAT.SpriteImage().initialize(
                    director.getImage('numberssmall'), 1,10 );

            this.context= new HN.Context().
                    create( 8,8, 9 ).
                    addContextListener(this);

            this.gameRows=      this.context.rows;
            this.gameColumns=   this.context.columns;


            this.directorScene= director.createScene();
            this.directorScene.activated= function() {
                // cada vez que la escena se prepare para empezar partida, inicializar el contexto.
                //me.context.initialize();
                me.context.setGameMode(me.gameMode);
                me.prepareSound();
            };

            var dw= director.width;
            var dh= director.height;

            //////////////////////// animated background

            this.backgroundContainer= new HN.AnimatedBackground().
                    setBounds(0,0,dw,dh).
                    setBackgroundImage( director.getImage('background-1'), false ).
                    setImageTransformation( CAAT.SpriteImage.prototype.TR_FIXED_WIDTH_TO_SIZE ).
                    setInitialOffset( -director.getImage('background-1').height+dh ).
                    setData(this.directorScene, this.context);
            this.directorScene.addChild( this.backgroundContainer );
            this.context.addContextListener(this.backgroundContainer);
            

            this.brickActors= [];

            ///////////// some clouds
            for( i=0; i<4; i++ ) {
                var cl= new HN.BackgroundImage().setupBehavior(director,true);
                this.directorScene.addChild(cl);
            }

            //////////////////////// game container
            var gameContainer= new CAAT.ActorContainer();
            if ( dw>dh ) {
                gameContainer.setBounds(0,0,700,500);
            } else {
                gameContainer.setBounds(0,0,500,700);
            }
            this.directorScene.addChild( gameContainer );

            //////////////////////// Number Bricks
            this.bricksContainer= new CAAT.ActorContainer().
                    create().
                    setSize(
                        this.gameColumns*this.brickWidth,
                        this.gameRows*this.brickHeight )
                ;

            for( i=0; i<this.gameRows; i++ ) {
                this.brickActors.push([]);
                for( j=0; j<this.gameColumns; j++ ) {
                    var brick= new HN.BrickActor().
                            initialize( this.bricksImageAll, this.context.getBrick(i,j) ).
                            setLocation(-100,-100);

                    this.brickActors[i].push( brick );
                    this.bricksContainer.addChild(brick);
                }
            }

            /////////////////////// game indicators.
            var controls= new CAAT.ActorContainer();
            if ( dw>dh ) {
                controls.setSize( 180, gameContainer.height);
            } else {
                controls.setSize( dw, 210 );
            }

            ///////////////////// Guess Number
            var guess= new HN.GuessNumberActor().
                    setNumbersImage( this.numbersImage, director.getImage('target-number') );

            this.context.addContextListener(guess);
            controls.addChild(guess);

            ///////////////////// score
            this.scoreActor= new HN.ScoreActor().
                    initialize( this.numbersImageSmall, director.getImage('points') );
            controls.addChild( this.scoreActor );
            this.context.addContextListener(this.scoreActor);

            ///////////////////// chronometer
            this.chronoActor= new HN.Chrono().
                    setImages( director.getImage('time'), director.getImage('timeprogress'));

            this.context.addContextListener(this.chronoActor);
            controls.addChild(this.chronoActor);

            ///////////////////// Level indicator
	        this.levelActor= new HN.LevelActor().
                    initialize( this.numbersImageSmall, dw>dh ? director.getImage('level') : director.getImage('level-small') );

            this.context.addContextListener(this.levelActor);

	        controls.addChild(this.levelActor);

            /////////////////////// initialize button
            var restart= new CAAT.Actor();
            if ( dw>dh )    {
                restart.setAsButton( this.buttonImage.getRef(), 9,10,11,9,
                        function(button) {
                            me.context.timeUp();
                        });
            } else {
                restart.
                    setAsButton(
                        new CAAT.SpriteImage().initialize(director.getImage('boton-salir'), 1, 3),
                        0,2,0,0,
                        function(button) {
                                me.context.timeUp();
                        });
            }

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

            ////////////////////// Multiplier
            var multiplier;

                var star= director.getImage('multiplier-star');
                multiplier= new HN.MultiplierActorS().
                    setImages( this.numbersImage, director.getImage('multiplier'), star, this.directorScene);
            this.multiplier= multiplier;
            controls.addChild( multiplier );
            this.context.addContextListener(multiplier);


///// lay it all out.

            var HH=55;
            var WW=10;

            if ( dw>dh ) {
                var layoutControls= new CAAT.UI.BoxLayout().
                        setAxis( CAAT.UI.BoxLayout.AXIS.Y).
                        setHorizontalAlignment( CAAT.UI.ALIGNMENT.CENTER).
                        setVerticalAlignment( CAAT.UI.ALIGNMENT.TOP).
                        setVGap(0);

                layoutControls.doLayout( controls );
                this.multiplier.setLocation(
                    this.scoreActor.x + this.scoreActor.width - star.width*.8,
                    this.scoreActor.y - star.height*.3 );

                gameContainer.addChild(this.bricksContainer);
                gameContainer.addChild( controls );
                gameContainer.centerAt( dw/2, dh/2 );

            } else {
                guess.setLocation( WW, HH );
                this.scoreActor.setLocation( dw-this.scoreActor.width-WW, HH );
                this.chronoActor.setLocation( dw-this.chronoActor.width-WW, guess.y+guess.height-this.chronoActor.height-15 );
                this.levelActor.setLocation(
                    // espacio entre target number y score actor
                    ((this.scoreActor.x- (guess.x+guess.width)) - this.levelActor.width)/2 + (guess.x+guess.width),
                    guess.y+guess.height - this.levelActor.height - 10 );
                this.multiplier.setLocation(
                    this.scoreActor.x + this.scoreActor.width - star.width*.8,
                    this.scoreActor.y - star.height*.3 );

                gameContainer.addChild( controls );
                gameContainer.addChild(this.bricksContainer);
            }

            var layout= new CAAT.UI.BoxLayout().
                            setAxis( dw>dh ? CAAT.UI.BoxLayout.AXIS.X : CAAT.UI.BoxLayout.AXIS.Y ).
                            setVerticalAlignment( CAAT.UI.BoxLayout.ALIGNMENT.TOP ).
                            setHorizontalAlignment( CAAT.UI.BoxLayout.ALIGNMENT.CENTER).
                            setHGap(20).
                            setVGap(5).
                            setPadding( 0,0,10,0 );
            layout.doLayout( gameContainer );

            if ( dw>dh ) {
                // scale content if landscape.
                var min= Math.min( gameContainer.width, gameContainer.height );
                var scale=  Math.min(dw,dh) / min;
                gameContainer.setScale( scale, scale );
            }


            /////////////////////// particle container
            // just to accelerate events delivery
            if ( !HN.LOWQUALITY ) {
                this.particleContainer= new CAAT.ActorContainer().
                        setBounds( this.bricksContainer.x, this.bricksContainer.y, dw, dh ).
                        enableEvents(false);
                gameContainer.addChild( this.particleContainer );
                this.create_cache();
            }

            /////////////////////// initialize selection path
            /// create this one as the last actor so when gl active, no extra drawtris call needed.
            this.selectionPath= new HN.SelectionPath(director).
                    setBounds(
                        this.bricksContainer.x,
                        this.bricksContainer.y,
                        this.gameColumns*this.brickWidth,
                        this.gameRows*this.brickHeight);
            this.selectionPath.enableEvents(false);
            gameContainer.addChild(this.selectionPath);
            this.context.addContextListener(this.selectionPath);


            ////////////// respawn
            this.create_respawntimer(director);
            if ( dw>dh ) {
                this.respawnClock.setLocation(2,2);
            } else {
                this.respawnClock.setLocation(
                    this.levelActor.x + (this.levelActor.width - this.respawnClock.width)/2,
                    this.levelActor.y - this.respawnClock.height );
            }

            ////////////////////////////////////////////////
            this.create_EndGame(director);
            this.create_EndLevel(director);
            this.soundControls( director );


            ////////////////////////////////////////////////
/*
            var me= this;
            var C=20;
            var count=0;
            var fpsc=0;
            var fps= new CAAT.Actor().setBounds(0,0,120,40);
            fps.__fps=0;
            fps.paintActor= function( director, time ) {

                this.invalidate();

                CAAT.Actor.prototype.__paintActor.call(this,director,time);

                fpsc+= CAAT.FRAME_TIME;

                count++;
                if ( !(count%C) ) {
                    this.__fps= ((C*1000)/fpsc)>>0;
                    fpsc=0;
                    count=0;
                }

                this.__fps=''+this.__fps;

                var ctx= director.ctx;
                var im= me.numbersImageSmall;

                ctx.fillStyle= 'rgb(32,32,32)';
                ctx.fillRect(0,0,this.__fps.length*im.singleWidth+10, 10+im.singleHeight);

                for( var i=0; i<this.__fps.length;i++ ) {
                    var c= this.__fps.charAt(i);
                    c= parseInt(c,10);

                    if ( c>=0 && c<=9 ) {
                        im.setSpriteIndex(c);
                        im.paint( director, 0, i*im.singleWidth+5, 5 );
                    }
                }

            };

            this.directorScene.addChild( fps );
*/
            return this;
        },
        createCachedStar : function(director) {
            var iindex= (Math.random()*this.starsImage.columns)>>0;
            var actor= new CAAT.Actor();
            actor.__imageIndex= iindex;
            actor.
                setBackgroundImage( this.starsImage.getRef().setAnimationImageIndex( [iindex] ), true ).
                enableEvents(false).
                setDiscardable(true).
                setOutOfFrameTime().
                addBehavior(
                this.director.getRenderType()==='CSS' ?
                    new CAAT.AlphaBehavior().
                        setValues( 1, .1 ).
                        setId('__alpha'):
                    new CAAT.GenericBehavior().
                        setValues( 1, .1, null, null, function(value,target,actor) {
                            actor.backgroundImage.setAnimationImageIndex( [
                                actor.__imageIndex+(23-((23*value)>>0))*actor.backgroundImage.getColumns()
                            ] );
                        }).
                        setId('__alpha') );

            return actor;
        },
        create_cache: function() {
            this.selectionStarCache= [];
            this.fallingStarCache=   [];

            var i,actor,me;

            me= this;

            for( i=0; i<16*4; i++ ) {
                actor= this.createSelectionStarCache();
                actor.addListener( {
                    actorLifeCycleEvent : function(actor, event, time) {
                        if (event === 'destroyed') {
                            me.selectionStarCache.push(actor);
                        }
                    }
                });
                actor.__parent= this.particleContainer;
                this.selectionStarCache.push(actor);
            }

            for( i=0; i<384; i++ ) {
                var actor= this.createCachedStar();
                actor.addListener( {
                    actorLifeCycleEvent : function(actor, event, time) {
                        if (event === 'destroyed') {
                            me.fallingStarCache.push(actor);
                        }
                    }
                });
                actor.__parent= this.particleContainer;
                this.fallingStarCache.push(actor);
            }
        },
        createSelectionStarCache : function() {
            var actor= this.createCachedStar();

            var trb=
                new CAAT.PathBehavior().
                    setFrameTime(this.directorScene.time,0).
                    setPath(
                        new CAAT.LinearPath().
                            setInitialPosition(0,0).
                            setFinalPosition(0,0)
                    ).
                    setInterpolator(
                        new CAAT.Interpolator().createExponentialOutInterpolator(
                            2,
                            false)
                    );
            actor.__trb= trb;
            actor.addBehavior(trb);

            var ab= null;
            if ( this.director.getRenderType()==='CSS' ) {
                ab= new CAAT.AlphaBehavior().setValues( 1, .1 );
            } else {
                ab= new CAAT.GenericBehavior().
                        setValues( 1, .1, null, null, function(value,target,actor) {
                            actor.backgroundImage.setAnimationImageIndex( [
                                    actor.__imageIndex+(23-((23*value)>>0))*actor.backgroundImage.getColumns()
                                ] );
                        });
            }
            actor.__ab= ab;
            actor.addBehavior(ab);


            return actor;
        },
        create_respawntimer: function(director) {
            var clock= new HN.RespawnClockActor().create().initialize(director, this.directorScene, this.context);
            this.directorScene.addChild( clock );
            this.context.addContextListener(clock);
            this.respawnClock= clock;
            this.respawnClock.setOutOfFrameTime();
        },
        create_EndLevel : function( director ) {
            this.endLevelActor= new CAAT.ActorContainer().
                    setBackgroundImage( director.getImage('levelclear'), true);

            var me= this;
            var me_endLevel= this.endLevelActor;
            var continueButton= new CAAT.Actor().
                    setAsButton( this.buttonImage.getRef(), 12,13,14,12,
                        function(button) {
                            director.audioPlay('11');
                            me.removeGameEvent( me.endLevelActor, function() {
                                me.context.nextLevel();
                            });
                        });
            continueButton.setLocation(
                    (this.endLevelActor.width-continueButton.width)/2,
                    this.endLevelActor.height-continueButton.height-50 );


            this.endLevelMessage= new CAAT.Actor().
                    setBackgroundImage( director.getImage('msg1'), true );

            this.endLevelActor.addChild(continueButton);
            this.endLevelActor.addChild(this.endLevelMessage);
            this.endLevelActor.setOutOfFrameTime();
            this.directorScene.addChild(this.endLevelActor);
        },
        create_EndGame : function(director, go_to_menu_callback ) {
            var me= this;

            this.endGameActor= new CAAT.ActorContainer().
                    setBackgroundImage( director.getImage('background_op'), true );

            var menu= new CAAT.Actor().
                    setAsButton( this.buttonImage.getRef(), 15,16,17,15,
                        function(button) {
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
                        });
            var me_endGame= this.endGameActor;

            var restart= new CAAT.Actor().
                    setAsButton( this.buttonImage.getRef(), 12,13,14,12,
                        function(button) {
                            director.audioPlay('11');
                            me.removeGameEvent( me.endGameActor, function() {
                                me.prepareSceneIn(me.context.gameMode);
                                me.context.initialize();
                            })
                        });

            if ( !CocoonJS.available ) {
                var tweetImage= new CAAT.SpriteImage().initialize( director.getImage('tweet'), 1, 3 );
                var tweet= new CAAT.Actor().
                        setAsButton( tweetImage, 0,1,2,0,
                            function(button) {
                                var url = "http://twitter.com/home/?status=Wow! I just scored "+me.context.score+" points (mode "+me.context.gameMode.name+") in Sumon. Beat that! http://labs.hyperandroid.com/static/sumon/sumon.html";
                                window.open(url, 'blank', '');
                            });
            }

            var x= 45;
            //var x= (this.endGameActor.width-2*menu.width-30)/2;
            var y= this.endGameActor.height-35-menu.height;

            menu.setLocation( x, y );
            //restart.setLocation( x+menu.width+30, y );
            restart.setLocation( x+menu.width+10, y );

            this.endGameActor.addChild(menu);
            this.endGameActor.addChild(restart);

            var __buttons= [ menu, restart ];
            if ( !CocoonJS.available ) {
                tweet.setLocation( 375, this.endGameActor.height - 25 - tweetImage.height );
                this.endGameActor.addChild(tweet);
                __buttons.push( tweet );
            } else {
                CAAT.modules.LayoutUtils.row(
                    this.endGameActor,
                    __buttons,
                    {
                        padding_left:   50,
                        padding_right:  50,
                        top:            y
                    });
            }

            //////////////////////// info de partida
            this.levelActorEG= new HN.LevelActor().
                    initialize(this.numbersImageSmall, director.getImage('level'));
            this.levelActorEG.
                    setBounds(
                        (this.endGameActor.width-this.levelActorEG.width)/2,
                        265,
                        this.levelActorEG.width,
                        this.levelActorEG.height );
            this.endGameActor.addChild(this.levelActorEG);
            this.context.addContextListener(this.levelActorEG);

            ///////////////////// score
            this.scoreActorEG= new HN.ScoreActor().
                    create().
                    setBounds(
                        ((this.endGameActor.width-this.scoreActor.width)/2)|0,
                        335,
                        this.scoreActor.width,
                        this.scoreActor.height ).
                    initialize( this.numbersImageSmall, director.getImage('points') );
            this.endGameActor.addChild( this.scoreActorEG );
            this.context.addContextListener(this.scoreActorEG);

            this.endGameActor.setOutOfFrameTime();

            this.directorScene.addChild(this.endGameActor);
        },
        getBrickPosition : function(row,column) {
            return {
                x: (this.context.columns-this.context.currentColumns)/2*this.brickWidth+ column*this.brickWidth,
                y: (this.context.rows-this.context.currentRows)/2*this.brickHeight+ row*this.brickHeight
            };
        },
        uninitializeActors : function() {
            this.selectionPath.initialize();

            var i, j;
            var radius= Math.max(this.director.width,this.director.height );
            var angle=  Math.PI*2*Math.random();
            var me=     this;

            var p0= Math.random()*this.director.width;
            var p1= Math.random()*this.director.height;
            var p2= Math.random()*this.director.width;
            var p3= Math.random()*this.director.height;

            for( i=0; i<this.gameRows; i++ ) {
                for( j=0; j<this.gameColumns; j++ ) {
                    var brickActor= this.brickActors[i][j];

                    if ( brickActor.brick.removed ) {
                        continue;
                    }

                    var random= Math.random()*1000;

                    brickActor.pb.
                            emptyListenerList().
//                            setFrameTime(this.directorScene.time, 1000+random).
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
                    if (!HN.LOWQUALITY) {
                        brickActor.pb.
                                setFrameTime(this.directorScene.time, 1000+random );
                    } else {
                        brickActor.pb.
                                setFrameTime(this.directorScene.time + i*200, 700+random/3 );
                    }

                    if (!HN.LOWQUALITY) {
                        brickActor.sb.
                                emptyListenerList().
                                setFrameTime(this.directorScene.time , 1000+random).
                                setValues( 1, .1, 1 , .1).
                                setInterpolator(
                                    new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );
                    }
                    
                    brickActor.
                        enableEvents(false).
                        setAlpha(1).
                        resetTransform();

                }
            }

        },
        initializeActors : function() {

            this.selectionPath.initialize();

            var i, j;
            var maxt= 0;

            var context;

            var radius= Math.max(this.director.width,this.director.height );
            var angle=  Math.PI*2*Math.random();


            var p0= Math.random()*this.director.width;
            var p1= Math.random()*this.director.height;
            var p2= Math.random()*this.director.width;
            var p3= Math.random()*this.director.height;


            for( i=0; i<this.gameRows; i++ ) {
                for( j=0; j<this.gameColumns; j++ ) {
                    var brickActor= this.brickActors[i][j];

                    if ( brickActor.brick.removed ) {
                        brickActor.setOutOfFrameTime();
                    } else {

                        brickActor.
                                setFrameTime( this.directorScene.time, Number.MAX_VALUE ).
                                setAlpha(1).
                                enableEvents(true).
                                reset();

                        var random= (Math.random()*1000)>>0;
                        if ( random>maxt ) {
                            maxt= random;
                        }

                        var brickPosition= this.getBrickPosition(i,j);
                        brickActor.pb.
                                emptyListenerList().
                                setPath(
                                    new CAAT.CurvePath().
                                            setCubic(
                                                radius/2 + Math.cos(angle)*radius,
                                                radius/2 + Math.sin(angle)*radius,
                                                p0, p1, p2, p3,
                                                brickPosition.x,
                                                brickPosition.y)
                                    ).
                                setInterpolator(
                                    new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) ).
                                setFrameTime(this.directorScene.time, 1000+random);
                        brickActor.sb.
                                emptyListenerList().
                                setValues( .1, 1, .1 , 1).
                                setInterpolator(
                                    new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) ).
                                setFrameTime(this.directorScene.time , 1000+random);

                        brickActor.enableEvents(false);

                    }
                }
            }


            context= this.context;
            // setup a timer which fires when all the bricks have stopped flying in.
            this.directorScene.createTimer(
                this.directorScene.time,
                maxt,
                function timeout() {
                    if ( context.status==context.ST_INITIALIZING ) {
                        context.setStatus( context.ST_RUNNNING );
                    }
                }
            );

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
                                brickActor= this.brickActors[i][j].set();
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
            } else if ( event.source==='brick' ) {
                if ( event.event==='selection' ) {   // des/marcar un elemento.
                    this.director.audioPlay( event.params.selected ? '11' : 'deseleccionar' );
                    this.brickSelectionEvent(event);
                } else if ( event.event==='selectionoverflow') {  // seleccion error.
                    this.director.audioPlay( 'sumamal' );
                    this.selectionOverflowEvent(event);
                } else if ( event.event==='selection-cleared') {
                    CAAT.setCursor('default');
                    this.director.audioPlay('12');
                    this.selectionClearedEvent(event);
                } else if ( event.event==='rearranged' ) {
                    this.rearrange( event );
                } else if ( event.event==='respawn' ) {
                    this.respawn(event);
                }

                // rebuild selection path
                this.selectionPath.setup(
                        this.context,
                        this.brickActors);
            }
        },
        respawn : function(event) {
            var respawnData= event.params;

            for( var i=0; i<respawnData.length; i++ ) {
                var row= respawnData[i].row;
                var col= respawnData[i].column;

                var brickPos= this.getBrickPosition(row,col);
                this.brickActors[row][col].respawn(brickPos.x, brickPos.y);
            }
        },
        rearrange : function(event) {

            var fromRow= event.params.fromRow;
            var toRow=   event.params.toRow;
            var column=  event.params.column;

            var tmp= this.brickActors[fromRow][column];
            this.brickActors[fromRow][column]= this.brickActors[toRow][column];
            this.brickActors[toRow][column]= tmp;

            // el actor de posicion row, column, no tiene que ser el que esperabamos
            // porque se ha reorganizado la cuadricula del modelo.
            var brickActor= this.brickActors[toRow][column];
            var brickPos= this.getBrickPosition(toRow,column);

            brickActor.rearrange( brickPos.x, brickPos.y );
        },
        brickSelectionEvent : function(event) {
            var me= this;
            var brick= event.params;
            var brickActor= this.brickActors[brick.row][brick.column];

            if ( brick.selected ) {

                if ( !HN.LOWQUALITY ) {
                    // dibujar un grupo de estrellas desde el centro del ladrillo haciendo fade-out.
                    var x0= brickActor.x+brickActor.width/2-this.starsImage.singleWidth/2;
                    var y0= brickActor.y+brickActor.height/2-this.starsImage.singleHeight/2;
                    var R= Math.sqrt( brickActor.width*brickActor.width + brickActor.height*brickActor.height )/2;
                    var N= 16;
                    var i;
                    var rad= Math.PI/N*2;
                    var T= 300;

                    for( i=0; i<N; i++ ) {
                        var x1= x0+ R*Math.cos( i*rad );
                        var y1= y0+ R*Math.sin( i*rad );

                        if ( this.selectionStarCache.length ) {
                            var actor= this.selectionStarCache.shift();
                            actor.setFrameTime(this.directorScene.time, T);
                            actor.backgroundImage.setAnimationImageIndex( [(Math.random()*6)>>0] );
                            actor.__trb.setFrameTime(this.directorScene.time, T);
                            actor.__trb.path.setInitialPosition(x0,y0).setFinalPosition(x1,y1);
                            actor.__ab.setFrameTime(this.directorScene.time, T);

                            actor.__parent.addChild(actor);
                        }
                    }
                }

                brickActor.setSelected();
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

            var me= this;

            // for each active actor, play a wrong-path.
            for( i=0; i<activeActors.length; i++ ) {
                activeActors[i].selectionOverflow();
            }

            var ttimer;
            ttimer= this.directorScene.createTimer(
                this.directorScene.time,
                HN.BrickActor.prototype.timeOverflow+100,
                function timeout(sceneTime, time, timerTask) {
                    me.bricksContainer.enableEvents(true);
                },
                function tick(sceneTime, time, timerTask) {
                });

        },
        selectionClearedEvent : function(event) {
            var selectedContextBricks= event.params;
            var i;

            for( i=0; i<selectedContextBricks.length; i++ ) {
                var actor= this.brickActors[ selectedContextBricks[i].row ][ selectedContextBricks[i].column ];
                actor.parent.setZOrder(actor,Number.MAX_VALUE);
                actor.selectionCleared(this, this.director.height);
            }

            this.timer.reset(this.directorScene.time);
        },
        showLevelInfo : function() {

        },
        prepareSceneIn : function(gameMode) {
            // setup de actores
            var i,j;

            this.gameMode= gameMode;

            if ( this.gameMode.respawn ) {
                this.respawnClock.enable(true,this.gameMode.respawn_time);
            } else {
                this.respawnClock.enable(false,this.gameMode.respawn_time);
            }
            //this.context.initialize()

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
            this.fireEvent( 'end-game', {
                score: this.context.score,
                level: this.context.level,
                gameMode: this.context.gameMode.name
            })
//            this.gardenScene.scores.addScore( this.context.score, this.context.level, this.context.gameMode.name );
            this.showGameEvent( this.endGameActor );
        },
        addGameListener : function(gameListener) {
            this.gameListener.push(gameListener);
        },
        fireEvent : function( type, data ) {
            for( var i=0, l= this.gameListener.length; i<l; i++ ) {
                this.gameListener[i].gameEvent(type, data);
            }
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
        setGameMode : function(gameMode) {
            this.context.setGameMode(gameMode);
        },
        endLevel : function() {
            var level= this.context.level;
            if ( level>7 ) {
                level=7;
            }
            var image= this.director.getImage( 'msg'+level);
            if ( null!=image ) {
                this.endLevelMessage.setBackgroundImage( image, true );
                this.endLevelMessage.setLocation(
                        (this.endLevelMessage.parent.width-image.width)/2,
                        this.endLevelMessage.parent.height/2 - 25
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

                                                    if (HN.INTERSTITIAL) {
                                                        CocoonJS.AdController.showFullscreen();
                                                    }

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
            var ci= new CAAT.SpriteImage().initialize( director.getImage('sound'), 2,3 );
            var dw= director.width;
            var dh= director.height;

            var music= new CAAT.Actor().
                    setAsButton( ci.getRef(),0,1,0,0, function(button) {
                        director.audioManager.setMusicEnabled( !director.audioManager.isMusicEnabled() );
                        if ( director.audioManager.isMusicEnabled() ) {
                            button.setButtonImageIndex(0,1,0,0);
                        } else {
                            button.setButtonImageIndex(2,2,2,2);
                        }
                    }).
                    setBounds( dw-ci.singleWidth-2, 2, ci.singleWidth, ci.singleHeight );

            var sound= new CAAT.Actor().
                    setAsButton( ci.getRef(),3,4,3,3, function(button) {
                        director.audioManager.setSoundEffectsEnabled( !director.audioManager.isSoundEffectsEnabled() );
                        if ( director.audioManager.isSoundEffectsEnabled() ) {
                            button.setButtonImageIndex(3,4,3,3);
                        } else {
                            button.setButtonImageIndex(5,5,5,5);
                        }
                    });
            if ( director.width>director.height ) {
                sound.setBounds( dw-ci.singleWidth-2, 2+2+ci.singleHeight, ci.singleWidth, ci.singleHeight );
            } else {
                sound.setBounds( dw-ci.singleWidth*2-2, 2+2, ci.singleWidth, ci.singleHeight );
            }

            music.prepare= function() {
                if ( director.audioManager.isMusicEnabled() ) {
                    this.setButtonImageIndex(0,1,0,0);
                } else {
                    this.setButtonImageIndex(2,2,2,2);
                }
            }

            sound.prepare= function() {
                if ( director.audioManager.isSoundEffectsEnabled() ) {
                    this.setButtonImageIndex(3,4,3,3);
                } else {
                    this.setButtonImageIndex(5,5,5,5);
                }
            }

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
