
(function() {
	HN.Grass = function() {
		return this;
	};

	HN.Grass.prototype= {

		alto_hierba:			0,		// grass height
		maxAngle:				0,		// maximum grass rotation angle (wind movement)
		angle:					0,		// construction angle. thus, every grass is different to others
		coords:					null,	// quadric bezier curves coordinates
		color:					null,	// grass color. modified by ambient component.
		offset_control_point: 	3,		// grass base size. greater values, wider at the basement.

        curve:                  null,   // gl curve.

		initialize : function(canvasWidth, canvasHeight, minHeight, maxHeight, angleMax, initialMaxAngle)	{

	        // grass start position
			var sx= Math.floor( Math.random()*canvasWidth );
			var sy= canvasHeight;

	        var offset_control_x=2;


			this.alto_hierba= minHeight+Math.random()*maxHeight;
			this.maxAngle= 10+Math.random()*angleMax;
			this.angle= Math.random()*initialMaxAngle*(Math.random()<.5?1:-1)*Math.PI/180;

			// hand crafted value. modify offset_control_x to play with grass curvature slope.
	        var csx= sx-offset_control_x ;

	        // curvatura de la hierba. - menor, curva mas tiesa. +valor, hierba lacia.
	        // grass curvature. greater values make grass bender.
	        var csy= sy-this.alto_hierba/2;

	        var psx= csx;
	        var psy= csy;

	        // the bigger offset_control_point, the wider on its basement.
	        this.offset_control_point=10;
	        var dx= sx+this.offset_control_point;
	        var dy= sy;

	        this.coords= [sx,sy,csx,csy,psx,psy,dx,dy];

	        // grass color.
	        this.color= [16+Math.floor(Math.random()*32),
	                     100+Math.floor(Math.random()*155),
	                     16+Math.floor(Math.random()*32) ];

		},

		/**
		 * paint every grass.
		 * @param ctx is the canvas2drendering context
		 * @param time for grass animation.
		 * @param ambient parameter to dim or brighten every grass.
		 * @returns nothing
		 */
		paint : function(ctx,time,ambient) {

//	        ctx.save();

	        // grass peak position. how much to rotate the peak.
	        // less values (ie the .0005), will make as if there were a softer wind.
	        var inc_punta_hierba= Math.sin(time*.0005);

	        // rotate the point, so grass curves are modified accordingly. If just moved horizontally, the curbe would
	        // end by being unstable with undesired visuals.
	        var ang= this.angle + Math.PI/2 + inc_punta_hierba * Math.PI/180*(this.maxAngle*Math.cos(time*.0002));
	        var px= this.coords[0]+ this.offset_control_point + this.alto_hierba*Math.cos(ang);
	        var py= this.coords[1]   			  			 - this.alto_hierba*Math.sin(ang);

	        ctx.beginPath();
	        ctx.moveTo( this.coords[0], this.coords[1] );
	        ctx.bezierCurveTo(this.coords[0], this.coords[1], this.coords[2], this.coords[3], px, py);

	        ctx.bezierCurveTo(px, py, this.coords[4], this.coords[5],  this.coords[6], this.coords[7]);
	        ctx.closePath();
	        ctx.fillStyle='rgb('+
	        		Math.floor(this.color[0]*ambient)+','+
	        		Math.floor(this.color[1]*ambient)+','+
	        		Math.floor(this.color[2]*ambient)+')';
	        ctx.fill();

		},
        paintActorGL : function(director, time, ambient, wmv) {
            if ( null==this.curve ) {
                this.curve= new CAAT.Bezier();
                this.__polyLine= new Float32Array( 11*2*3 );
            }

            var inc_punta_hierba= Math.sin(time*.0005);

            // rotate the point, so grass curves are modified accordingly. If just moved horizontally, the curbe would
            // end by being unstable with undesired visuals.
            var ang= this.angle + Math.PI/2 + inc_punta_hierba * Math.PI/180*(this.maxAngle*Math.cos(time*.0002));
            var px= this.coords[0]+ this.offset_control_point + this.alto_hierba*Math.cos(ang);
            var py= this.coords[1]   			  			 - this.alto_hierba*Math.sin(ang);

            var contour= this.curve.setQuadric(
                    this.coords[0],
                    this.coords[1],
                    this.coords[2],
                    this.coords[3],
                    px,
                    py ).getContour(10);

            var contour2= this.curve.setQuadric(
                    px,
                    py,
                    this.coords[4],
                    this.coords[5],
                    this.coords[6],
                    this.coords[7] ).getContour(10);

            contour= contour.concat(contour2);

            var pos=0;
            var z= -director.canvas.height/2;

            for( var i=0; i<contour.length; i++ ) {

                wmv.transformCoord[contour[i]];

                this.__polyLine[pos++]= contour[i].x;
                this.__polyLine[pos++]= contour[i].y;
                this.__polyLine[pos++]= z;
            }

            director.glTextureProgram.drawPolylines( this.__polyLine, contour.length,
                    Math.floor(this.color[0]*ambient)/255,
	        		Math.floor(this.color[1]*ambient)/255,
	        		Math.floor(this.color[2]*ambient)/255,
                    1,
                    3);
        }
	};
})();

(function() {
	HN.Garden= function() {
        HN.Garden.superclass.constructor.call(this);
        this.glEnabled= true;
		return this;
	};

	extend( HN.Garden, CAAT.Actor, {
		grass:			null,
		ambient:		1,
		stars:			null,
		firefly_radius:	10,
		num_fireflyes:	40,
		num_stars:		512,
        fireflyColor:   [ '#ffff00', '#7fff00', '#c0c000' ],
        backgroundEnabled: false,

		initialize : function(ctx,size,maxGrassHeight)	{
			this.grass= [];

			for(var i=0; i<size; i++ ) {
				var g= new HN.Grass();
				g.initialize(
						this.width,
						this.height,
						50,			// min grass height
						maxGrassHeight, // max grass height
						20, 		// grass max initial random angle
						40			// max random angle for animation
						);
				this.grass.push(g);
			}

			this.stars= [];
			for( i=0; i<this.num_stars; i++ )	{
				this.stars.push( Math.floor( Math.random()*(this.width-10)+5  ) );
				this.stars.push( Math.floor( Math.random()*(this.height-10)+5 ) );
			}

            if ( this.backgroundEnabled ) {
                this.lerp(ctx,0,2000);
            }

            return this;
		},
        paintActorGL : function(director,time) {
            director.glFlush();

            for( var i=0; i<this.grass.length; i++ ) {
                this.grass[i].paintActorGL(director,time,this.ambient,this.worldModelViewMatrix);
            }
        },
		paint : function(director, time){


			var ctx= director.ctx;

            if ( this.backgroundEnabled ) {
                ctx.fillStyle= this.gradient;
                ctx.fillRect(0,0,this.width,this.height);

                // draw stars if ambient below .3 -> night
                if ( this.ambient<.3 )	{

                    // modify stars translucency by ambient (as transitioning to day, make them dissapear).
                    ctx.globalAlpha= 1-((this.ambient-.05)/.25);

                    // as well as making them dimmer
                    var intensity= 1 - (this.ambient/2-.05)/.25;

                    // how white do you want the stars to be ??
                    var c= Math.floor( 192*intensity );
                    var strc= 'rgb('+c+','+c+','+c+')';
                    ctx.strokeStyle=strc;

                    // first num_fireflyes coordinates are fireflyes themshelves.
                    for( var j=this.num_fireflyes*2; j<this.stars.length; j+=2 )	{
                        var inc=1;
                        if ( j%3==0 ) {
                            inc=1.5;
                        } else if ( j%11==0 ) {
                            inc=2.5;
                        }
                        this.stars[j]= (this.stars[j]+.1*inc)%this.width;

                        var y= this.stars[j+1];
                        ctx.strokeRect(this.stars[j],this.stars[j+1],1,1);

                    }
                }

                ctx.globalAlpha= 1;
            }

			// draw fireflyes

	    	for(var i=0; i<this.num_fireflyes*2; i+=2) {
                ctx.fillStyle= this.fireflyColor[i%3];
		    	var angle= Math.PI*2*Math.sin(time*3E-4) + i*Math.PI/50;
		    	var radius= this.firefly_radius*Math.cos(time*3E-4);
                var fy= this.height - this.height*.3 +
		    			.5*this.stars[i+1] +
		    			20*Math.sin(time*3E-4) +	// move vertically with time
		    			radius*Math.sin(angle);

                if ( fy<director.height ) {
                    ctx.beginPath();
                    ctx.arc(
                            this.width/2 +
                            .5*this.stars[i] +
                            150*Math.cos(time*3E-4) +	// move horizontally with time
                            (radius+20*Math.cos((i%5)*Math.PI/3600))*Math.cos(angle),

                            fy,

                            2,
                            0,
                            Math.PI*2,
                            false );
                    ctx.fill();
                }
	    	}

			for( var i=0; i<this.grass.length; i++ ) {
				this.grass[i].paint(ctx,time,this.ambient);
			}


            if ( this.backgroundEnabled ) {
                // lerp.
                if ( time>this.nextLerpTime ) {
                    this.lerpindex= Math.floor((time-this.nextLerpTime)/this.nextLerpTime);
                    if ( (time-this.nextLerpTime)%this.nextLerpTime<this.lerpTime ) {
                        this.lerp( ctx, (time-this.nextLerpTime)%this.nextLerpTime, this.lerpTime );
                    }
                }
            }
		},

        gradient:       null,
        lerpTime:       10000,		// time taken to fade sky colors
        nextLerpTime:   15000,	// after fading, how much time to wait to fade colors again.
        colors:         [
                            [   0x00, 0x3f, 0x7f, //0x00, 0x00, 0x3f,
                                0x00, 0x3f, 0x7f,
                                0x1f, 0x5f, 0xc0,
                                0x3f, 0xa0, 0xff ],

                            [   0x00, 0x3f, 0x7f,
                              0xa0, 0x5f, 0x7f,
                              0xff, 0x90, 0xe0,
                              0xff, 0x90, 0x00 ],

                            [     0x00, 0x3f, 0x7f, //0x00, 0x00, 0x00,
                            0x00, 0x2f, 0x7f,
                            0x00, 0x28, 0x50,
                            0x00, 0x1f, 0x3f ],

                            [ 0x00, 0x3f, 0x7f, //0x1f, 0x00, 0x5f,
                              0x3f, 0x2f, 0xa0,
                              0xa0, 0x1f, 0x1f,
                              0xff, 0x7f, 0x00 ] ],

        ambients:       [ 1, .35, .05, .5 ],    // ambient intensities for each sky color
        lerpindex:      0,                      // start with this sky index.

        /**
         * fade sky colors
         * @param time current time
         * @param last how much time to take fading colors
         */
        lerp: function( ctx, time, last ) {
            this.gradient= ctx.createLinearGradient(0,0,0,this.height);

            var i0= this.lerpindex%this.colors.length;
            var i1= (this.lerpindex+1)%this.colors.length;

            for( var i=0; i<4; i++ )	{
                var rgb='rgb(';
                for( var j=0; j<3; j++ ) {
                    rgb+= Math.floor( (this.colors[i1][i*3+j]-this.colors[i0][i*3+j])*time/last + this.colors[i0][i*3+j]);
                    if ( j<2 ) rgb+=',';
                }
                rgb+=')';
                this.gradient.addColorStop( i/3, rgb );
            }

            this.ambient= (this.ambients[i1]-this.ambients[i0])*time/last + this.ambients[i0];
        }

	});
})();

(function() {

    HN.Cloud= function() {
        HN.Cloud.superclass.constructor.call(this);
        return this;
    };

    extend( HN.Cloud, CAAT.ImageActor, {
        scene:      null,

        setScene : function(scene) {
            this.scene= scene;
            return this;
        },
        animate : function( director, time ) {
            if ( this.behaviorList.length==0 ) {
                this.setupBehavior(director,true);
            }
            return HN.BackgroundImage.superclass.animate.call(this,director,time);
        },
        setupBehavior : function(director,bFirstTime) {

            this.setImage( director.getImage('cloudb'+ ((4*Math.random())>>0) ) );

            var me= this;
            var ix0, ix1, iy0, iy1;
            var from= Math.random();
            var dw= director.canvas.width;
            var dh= director.canvas.height;

            var ih= this.image.height;
            var iw= this.image.width;

            var t= 40000 + 5000*Math.random()*4;            

            if ( bFirstTime ) {
                ix0= this.x;
                iy0= this.y;
                t= (dw-ix0)/dw*t;
            } else {
                ix0= -iw + -iw*2*Math.random();
                iy0= dh*Math.random()/2;
            }

            ix1= dw;
            iy1= iy0 + 50*Math.random()/2;

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
                                    me.setupBehavior(director,false);
                                },
                                behaviorApplied : function(actor,time,normalizedTime,value) {

                                }
                            })
                    );
        }
    });

})();

(function() {

    HN.ScoreItem= function() {
        return this;
    };

    HN.ScoreItem.prototype= {
        score:  0,
        level:  0,
        difficulty: '',
        date:   '',

        initialize : function(score, level, difficulty) {
            this.score= score;
            this.level= level;
            this.difficulty= difficulty==0 ? 'Easy' : 'Hard';

            var d= new Date();
            this.date= ''+d.getFullYear()+'/'+this.pad(1+d.getMonth())+'/'+this.pad(d.getDate());
            return this;
        },
        
        pad : function( n ) {
            n= ''+n;
            if ( n.length==1 ) {
                n= '0'+n;
            }
            return n;
        }
    };

    HN.Scores= function() {
        return this;
    };

    HN.Scores.prototype= {
        maxScoreRows:   10,
        scores: null,

        initialize : function() {

            var rows= 0, i;
            if ( null!=this.scores ) {
                rows= this.scores.length;
                for( i=0; i<rows; i++ ) {
                    document.getElementById( i+'_1' ).innerHTML= this.scores[i].score;
                    document.getElementById( i+'_2' ).innerHTML= this.scores[i].level;
                    document.getElementById( i+'_3' ).innerHTML= this.scores[i].difficulty;
                    document.getElementById( i+'_4' ).innerHTML= this.scores[i].date;
                }
            } else {
                this.scores= [];
            }

            for( i=rows; i<10; i++ ) {
                for( var j=1; j<=4; j++ ) {
                    document.getElementById( i+'_'+j ).innerHTML='';
                }
            }

            return this;
        },
        addScore : function( score, level, difficulty ) {
            // quitar filas hasta que entre una.
            while ( this.scores.length>=this.maxScoreRows ) {
                this.scores.splice( this.scores.length-1, 1 );
            }

            // busca donde insertar el elemento.
            var i=0;
            for( i=0; i<this.scores.length; i++ ) {
                if ( score>this.scores[i].score ) {
                    break;
                }
            }
            this.scores.splice( i, 0, new HN.ScoreItem().initialize(score, level, difficulty ) );

            CAAT.modules.LocalStorage.prototype.save('sumon_scores', this.scores);

            this.initialize();

            return this;
        },
        setData : function() {
            this.scores= CAAT.modules.LocalStorage.prototype.load('sumon_scores');
            return this;
        }
    };
})();

(function() {

    HN.GardenScene= function() {
        this.scores= new HN.Scores().setData().initialize();
        return this;
    };

    HN.GardenScene.prototype= {

        gameScene:      null,
        directorScene:  null,
        director:       null,
        buttonImage:    null,
        scores:         null,

        music:          null,
        sound:          null,

        /**
         * Creates the main game Scene.
         * @param director a CAAT.Director instance.
         */
        create : function(director, gardenSize) {

            director.audioLoop('music'); 

            this.director= director;
            this.directorScene= director.createScene();

            var dw= director.canvas.width;
            var dh= director.canvas.height;
            var me= this;

            this.directorScene.activated= function() {
                me.prepareSound();
            };

            this.directorScene.addChild(
                    new CAAT.ImageActor().
                            create().
                            setBounds(0,0,dw,dh).
                            setImage( director.getImage('background') ).
                            setOffsetY( -director.getImage('background').height+dh ).
                            setClip(true)
                    );

            ///////////// some clouds
            for( i=0; i<5; i++ ) {
                var cl= new HN.Cloud().
                        create().
                        setScene( this.directorScene ).
                        setLocation( dw/5*i + (dw/5)*Math.random() , dh/3*Math.random() );
                this.directorScene.addChild(cl);
            }

            var ovnitrail= new CAAT.ActorContainer().create().setBounds(0,0,dw,dh);
            this.directorScene.addChild(ovnitrail);

            var ovniImage= new CAAT.CompoundImage().initialize( director.getImage('ovni'), 1, 2 );
            var starsImage= new CAAT.CompoundImage().initialize(director.getImage('stars'), 1,6 );

            var smokeImage= new CAAT.CompoundImage().initialize(director.getImage('smoke'), 32,1 );

            var TT=600;
            if ( director.glEnabled ) {
                TT=6000;
            }

            for( var i=0; i<2; i++ ) {
                var ox= Math.random()*dw;
                var oy= Math.random()*dh;
                var ovni= new CAAT.SpriteActor().
                        create().
                        setSpriteImage( ovniImage ).
                        setLocation( ox, oy ).
                        setAnimationImageIndex( [1-i] ).
                        enableEvents(false).
                        addBehavior(
                            new CAAT.PathBehavior().
                                    setFrameTime(0,0).
                                    setPath(
                                        new CAAT.Path().setLinear( ox,oy, ox,oy )
                                    ).
                                    addListener(
                                        {
                                            prevTime : -1,
                                            smokeTime: TT,
                                            nextSmokeTime: 100,
                                            behaviorExpired : function(behaviour,time) {
                                                var endCoord= behaviour.path.endCurvePosition();
                                                behaviour.setPath(
                                                        new CAAT.Path().setCubic(
                                                            endCoord.x,
                                                            endCoord.y,
                                                            Math.random()*director.width,
                                                            Math.random()*director.height,
                                                            Math.random()*director.width,
                                                            Math.random()*director.height,
                                                            Math.random()*director.width,
                                                            Math.random()*director.height) );
                                                behaviour.setFrameTime( me.directorScene.time, 3000+Math.random()*3000 );
                                            },
                                            behaviorApplied : function( behavior, time, normalizedTime, actor, value) {
                                                if ( -1==this.prevTime || time-this.prevTime>=this.nextSmokeTime ) {
                                                    //var img= director.getImage('smoke');
                                                    var img= smokeImage;
                                                    var offset0= Math.random()*10*(Math.random()<.5?1:-1);
                                                    var offset1= Math.random()*10*(Math.random()<.5?1:-1);
                                                    ovnitrail.addChildDelayed(
                                                        new CAAT.SpriteActor().
                                                            create().
                                                            setSpriteImage(img).
                                                                setAnimationImageIndex( [0] ).
                                                            setLocation(
                                                                offset0+actor.x+actor.width/2-img.singleWidth/2,
                                                                offset1+actor.y+actor.height/2-img.singleHeight/2).
                                                            setDiscardable(true).
                                                            enableEvents(false).
                                                            setFrameTime(time, this.smokeTime).
                                                            addBehavior(
                                                                new CAAT.GenericBehavior().
                                                                        setFrameTime(time, this.smokeTime).
                                                                        setValues( 1, .1, null, null, function(value, target, actor ) {
                                                                            actor.setAnimationImageIndex( [31-((value*31)>>0)] );
                                                                        }).
                                                                        setInterpolator(
                                                                            new CAAT.Interpolator().createExponentialInInterpolator(
                                                                                3,
                                                                                false)
                                                                        )
                                                            ).
                                                            addBehavior(
                                                                new CAAT.ScaleBehavior().
                                                                        setFrameTime(time, this.smokeTime).
                                                                        setValues( .5,1.5, .5,1.5 )
                                                            )
                                                    );

                                                    this.prevTime= time;
                                                }

                                            }
                                        }
                                    )
                        );

                this.directorScene.addChild(ovni);
            }

            // fondo. jardin.
            this.directorScene.addChild(
                    new HN.Garden().
                            create().
                            setBounds(0,0,dw,dh).
                            initialize( director.ctx, gardenSize, dh*.3 )
                    );

            var madeWith= new CAAT.Button().
                    create().
                    initialize( new CAAT.CompoundImage().initialize(director.getImage('madewith'),1,3), 0,1,2,0 ).
                    setLocation( dw-90, 0 );
            madeWith.mouseClick= function(mouseEvent) {
                window.open('http://labs.hyperandroid.com', 'Hyperandroid');
            };
            this.directorScene.addChild(madeWith);


            this.buttonImage= new CAAT.CompoundImage().initialize(
                    director.getImage('buttons'), 7,3 );

            var me=         this;
            var bw=         this.buttonImage.singleWidth;
            var bh=         this.buttonImage.singleHeight;
            var numButtons= 4;
            var yGap=       10;

            var EASY= 0;
            var MEDIUM= 3;

            // opciones del menu.
            var easy= new CAAT.Button().
                    create().
                    initialize(this.buttonImage, EASY, EASY+1, EASY+2, EASY, function() {
                        director.audioPlay('11');
                        me.startGame(director,0);
                    }).
                    setBounds( (dw-2*bw-20)/2, 250, bw, bh );

            var medium= new CAAT.Button().
                    create().
                    initialize(this.buttonImage, MEDIUM,MEDIUM+1,MEDIUM+2,MEDIUM,function() {
                        director.audioPlay('11');
                        me.startGame(director,1);
                    }).
                    setBounds( (dw-2*bw-20)/2 + 20 + bw, 250, bw, bh );

            var scores= new CAAT.Button().
                    create().
                    initialize( this.buttonImage, 18,19,20,18, function() {
                        director.audioPlay('11');
                        __enterCSS( document.getElementById('scores'), 700,0, 0,0, me.directorScene);
                    }).
                    setBounds( (dw-bw)/2, 320, bw, bh );

            var info_howto_ci= new CAAT.CompoundImage().initialize( director.getImage('info_howto'), 2, 3 );
            var ihw= info_howto_ci.singleWidth;
            var ihh= info_howto_ci.singleHeight;

            var info= new CAAT.Button().
                    create().
                    initialize(info_howto_ci, 0,1,2,0 ).
                    setBounds( 10, dh-10-ihh, ihw, ihh );
            info.mouseClick= function( mouseEvent ) {
                director.audioPlay('11');
                __enterCSS( document.getElementById('about'), -700,0, 0,0, me.directorScene );
            };

            var howto= new CAAT.Button().
                    create().
                    initialize(info_howto_ci, 3,4,5,3 ).
                    setBounds( 10, dh-10-ihh-ihh-5, ihw, ihh );
            howto.mouseClick= function( mouseEvent ) {
                director.audioPlay('11');
                __enterCSS( document.getElementById('tutorial'), 700,0, 0,0, me.directorScene );
            };

            this.directorScene.addChild(easy);
            this.directorScene.addChild(medium);
            this.directorScene.addChild(info);
            this.directorScene.addChild(howto);
            this.directorScene.addChild(scores);


            var logo= new CAAT.ImageActor().
                    create().
                    setImage(director.getImage('logo')).
                    setFrameTime( 1500, Number.MAX_VALUE );
            var xp= (dw - logo.width)/2;
            logo.addBehavior(
                    new CAAT.PathBehavior().
                            setPath(
                                new CAAT.LinearPath().
                                    setInitialPosition(xp, -logo.height).
                                    setFinalPosition(xp, -10)
                            ).
                            setFrameTime( 1500, 1000 ).
                            setInterpolator(
                                new CAAT.Interpolator().createBounceOutInterpolator(false)
                            )
            );
            this.directorScene.addChild(logo);

            this.soundControls(director);

            return this;
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
        },
        startGame : function(director,level) {
            //director.switchToNextScene(1000,false,true);
            this.gameScene.setDifficulty(level);
            this.gameScene.prepareSceneIn();
            director.easeInOut(
                    1,
                    CAAT.Scene.EASE_TRANSLATE,
                    CAAT.Actor.prototype.ANCHOR_TOP,
                    0,
                    CAAT.Scene.EASE_TRANSLATE,
                    CAAT.Actor.prototype.ANCHOR_BOTTOM,
                    1000,
                    false,
                    new CAAT.Interpolator().createExponentialInOutInterpolator(3,false),
                    new CAAT.Interpolator().createExponentialInOutInterpolator(3,false) );
        }
    };
})();