
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
            var z= -director.height/2;

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
//        this.glEnabled= true;
		return this;
	};


    HN.Garden.prototype= {
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
		},/*
        paintActorGL : function(director,time) {
            director.glFlush();

            for( var i=0; i<this.grass.length; i++ ) {
                this.grass[i].paintActorGL(director,time,this.ambient,this.worldModelViewMatrix);
            }
        },*/
		paint : function(director, time){
			var ctx= director.ctx;
            var i,j;

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
                    for( j=this.num_fireflyes*2; j<this.stars.length; j+=2 )	{
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

	    	for( i=0; i<this.num_fireflyes*2; i+=2) {
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

			for( i=0; i<this.grass.length; i++ ) {
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

	};

    extend( HN.Garden, CAAT.Actor);
})();

(function() {

    HN.Cloud= function() {
        HN.Cloud.superclass.constructor.call(this);
        return this;
    };

    HN.Cloud.prototype= {
        scene:      null,

        setupBehavior : function(director, bFirstTime) {

            this.setBackgroundImage( director.getImage('cloudb'+ ((4*Math.random())>>0) ), true );

            var me= this;
            var ix0, ix1, iy0, iy1;
            var from= Math.random();
            var dw= director.width;
            var dh= director.height;

            var ih= this.backgroundImage.height;
            var iw= this.backgroundImage.width;

            var t= 40000 + 5000*Math.random()*4;            

            if ( bFirstTime ) {
                ix0= (Math.random()*director.width)>>0;
                iy0= (Math.random()*director.height)>>0;
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
                            setFrameTime( this.time, t ).
                            setPath(
                                new CAAT.Path().setLinear( ix0,iy0, ix1,iy1 )
                            ).
                            addListener( {
                                behaviorExpired : function(behavior, time, actor) {
                                    me.setupBehavior(director,false);
                                }
                            })
                    );

            return this;

        }
    };

    extend( HN.Cloud, CAAT.Actor);

})();

(function() {

    HN.ScoreItem= function() {
        return this;
    };

    HN.ScoreItem.prototype= {
        score:  0,
        level:  0,
        mode:   '',
        date:   '',

        initialize : function(score, level, mode) {
            this.score= score;
            this.level= level;
            this.mode= mode;

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
                    this.setDOM( i+'_1', this.scores[i].score);
                    this.setDOM( i+'_2', this.scores[i].level);
                    this.setDOM( i+'_3', this.scores[i].mode);
                    this.setDOM( i+'_4', this.scores[i].date);
                }
            } else {
                this.scores= [];
            }

            for( i=rows; i<10; i++ ) {
                for( var j=1; j<=4; j++ ) {
                    this.setDOM( i+'_'+j, '');
                }
            }

            return this;
        },
        setDOM : function( elem, value ) {
            var dom= document.getElementById(elem);
            if ( null!=dom ) {
                dom.innerHTML= value;
            }
            return this;
        },
        addScore : function( score, level, mode ) {
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
            this.scores.splice( i, 0, new HN.ScoreItem().initialize(score, level, mode ) );

            CAAT.modules.LocalStorage.prototype.save('sumon_scores_1', this.scores);

            this.initialize();

            return this;
        },
        setData : function() {
            this.scores= CAAT.modules.LocalStorage.prototype.load('sumon_scores_1');
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

        createModeButtons : function() {

            var me= this;

            var m= [];
            m.push(new CAAT.SpriteImage().initialize( me.director.getImage('mode-classic'), 1,3 ));
            m.push(new CAAT.SpriteImage().initialize( me.director.getImage('mode-progressive'), 1,3 ));
            m.push(new CAAT.SpriteImage().initialize( me.director.getImage('mode-respawn'), 1,3 ));

            var modes= [ HN.GameModes.classic, HN.GameModes.progressive, HN.GameModes.respawn ];

            var i,w= 0;
            for( i=0; i<m.length; i++ ) {
                w= Math.max(w,m[i].singleWidth);
            }

            var margin= 20;
            w+=margin;
            var dw= (me.director.width-w*m.length)/2 + margin/2;

            function createb(index) {
                var text= new CAAT.SpriteImage().
                        initialize( me.director.getImage('mode-text'), 1,3 ).
                        setAnimationImageIndex([index]);

                var c= new CAAT.ActorContainer().create().setBounds(
                        dw + w*index, 230,
                        Math.max( m[index].singleWidth, text.singleWidth),
                        m[index].singleWidth+text.singleHeight );

                var b= new CAAT.Actor().
                        setAsButton(m[index], 0,1,2,0, function() {
                            me.director.audioPlay('11');
                            me.startGame(me.director,0,modes[index]);
                        }).
                        setBounds(
                            (c.width-m[index].singleWidth)/2,
                            0,
                            m[index].singleWidth,
                            m[index].singleHeight );

                var t = new CAAT.Actor().
                        setBackgroundImage(text).
                        setBounds(
                            (c.width - text.singleWidth) / 2,
                            b.height,
                            text.singleWidth,
                            text.singleHeight);

                c.addChild(b);
                c.addChild(t);

                return c;
            }

            this.directorScene.addChild( createb(0) );
            this.directorScene.addChild( createb(1) );
            this.directorScene.addChild( createb(2) );
        },
        /**
         * Creates the main game Scene.
         * @param director a CAAT.Director instance.
         */
        create : function(director, gardenSize) {

            director.audioLoop('music'); 

            this.director= director;
            this.directorScene= director.createScene();

            var dw= director.width;
            var dh= director.height;
            var me= this;

            this.directorScene.activated= function() {
                me.prepareSound();
            };

            var imgb= director.getImage('background');
            this.directorScene.addChild(
                    new CAAT.Actor().
                            setBounds(0,0,dw,dh).
                            setBackgroundImage(imgb).
                            setBackgroundImageOffset( 0, -imgb.height+dh ).
                            setClip(true)
                    );

            ///////////// some clouds
            for( i=0; i<5; i++ ) {
                var cl= new HN.Cloud().
                        setupBehavior(director,true).
                        setLocation( dw/5*i + (dw/5)*Math.random() , dh/3*Math.random() );
                this.directorScene.addChild(cl);
            }

            var ovnitrail= new CAAT.ActorContainer().create().setBounds(0,0,dw,dh);
            this.directorScene.addChild(ovnitrail);

            var ovniImage= new CAAT.SpriteImage().initialize( director.getImage('ovni'), 1, 2 );

            var smokeImage;
            if ( director.getRenderType()!='CSS' ) {
                smokeImage= new CAAT.SpriteImage().initialize(director.getImage('smoke'), 32,1 );
            } else {
                smokeImage= new CAAT.SpriteImage().initialize(director.getImage('smoke'), 1,1 );
            }

            var TT=1000;
            if ( director.glEnabled ) {
                TT=6000;
            }

            for( var i=0; i<2; i++ ) {
                var ox= Math.random()*dw;
                var oy= Math.random()*dh;
                var ovni= new CAAT.Actor().
                        setBackgroundImage( ovniImage.getRef().setAnimationImageIndex( [1-i] ), true ).
                        setLocation( ox, oy ).
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
                                                    var humo=
                                                        new CAAT.Actor().
                                                            setBackgroundImage(
                                                                smokeImage.getRef().setAnimationImageIndex([0]),
                                                                true).
                                                            setLocation(
                                                                offset0+actor.x+actor.width/2-img.singleWidth/2,
                                                                offset1+actor.y+actor.height/2-img.singleHeight/2).
                                                            setDiscardable(true).
                                                            enableEvents(false).
                                                            setFrameTime(time, this.smokeTime).
                                                            addBehavior(
                                                                new CAAT.ScaleBehavior().
                                                                        setFrameTime(time, this.smokeTime).
                                                                        setValues( .5,1.5, .5,1.5 )
                                                            );
                                                    if ( director.getRenderType()==='CSS' ) {
                                                        humo.addBehavior(
                                                            new CAAT.AlphaBehavior().
                                                                    setFrameTime(time, this.smokeTime).
                                                                    setValues( 1, 0 ));
                                                    } else {
                                                        humo.addBehavior(
                                                            new CAAT.GenericBehavior().
                                                                    setFrameTime(time, this.smokeTime).
                                                                    setValues( 1, 0, null, null, function(value, target, actor ) {
                                                                        actor.setAnimationImageIndex( [31-((value*31)>>0)] );
                                                                    })
                                                        );
                                                    }

                                                    ovnitrail.addChild(humo);

                                                    this.prevTime= time;
                                                }

                                            }
                                        }
                                    )
                        );

                this.directorScene.addChild(ovni);
            }

            if ( gardenSize>0 ) {
                // fondo. jardin.
                this.directorScene.addChild(
                        new HN.Garden().
                                create().
                                setBounds(0,0,dw,dh).
                                initialize( director.ctx, gardenSize, dh*.3 )
                        );
            }

            this.buttonImage= new CAAT.SpriteImage().initialize(
                    director.getImage('buttons'), 7,3 );

            var bw=         this.buttonImage.singleWidth;
            var bh=         this.buttonImage.singleHeight;
            var numButtons= 4;
            var yGap=       10;

            var scores= new CAAT.Actor().
                    setAsButton( this.buttonImage.getRef(), 18,19,20,18, function() {
                        director.audioPlay('11');
                        __enterCSS( document.getElementById('scores'), 700,0, 0,0, me.directorScene);
                    }).
                    setBounds( dw-bw-10, dh-bh-10, bw, bh );

            var info_howto_ci= new CAAT.SpriteImage().initialize( director.getImage('info_howto'), 2, 3 );
            var ihw= info_howto_ci.singleWidth;
            var ihh= info_howto_ci.singleHeight;

            var info= new CAAT.Actor().
                    setAsButton(info_howto_ci.getRef(), 0,1,2,0,
                        function(button) {
                            director.audioPlay('11');
                            __enterCSS( document.getElementById('about'), -700,0, 0,0, me.directorScene );
                        }).
                    setBounds( 10, dh-10-ihh, ihw, ihh );

            var howto= new CAAT.Actor().
                    setAsButton(info_howto_ci.getRef(), 3,4,5,3,
                        function() {
                            director.audioPlay('11');
                            __enterCSS( document.getElementById('tutorial'), 700,0, 0,0, me.directorScene );
                        }).
                    setBounds( 10, dh-10-ihh-ihh-5, ihw, ihh );

            this.createModeButtons();

            this.directorScene.addChild(info);
            this.directorScene.addChild(howto);
            this.directorScene.addChild(scores);


            var logo= new CAAT.Actor().
                    setBackgroundImage(director.getImage('logo'), true).
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

            var madeWith= new CAAT.Actor().
                    setAsButton( new CAAT.SpriteImage().initialize(director.getImage('madewith'),1,3), 0,1,2,0,
                        function(button) {
                            window.open('http://labs.hyperandroid.com', 'Hyperandroid');
                        }).
                    setLocation( dw-90, 0 );
            this.directorScene.addChild(madeWith);


            this.soundControls(director);

            return this;
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
                    }).
                    setBounds( dw-ci.singleWidth-2, 2+2+ci.singleHeight, ci.singleWidth, ci.singleHeight );

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
        startGame : function(director,level,gameMode) {
            //director.switchToNextScene(1000,false,true);
            this.gameScene.setDifficulty(level);

            this.gameScene.prepareSceneIn(gameMode);
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
        },
        /**
         * gameScene listener.
         * @param type {string}
         * @param data {object}
         */
        gameEvent : function( type, data ) {
            this.scores.addScore( data.score, data.level, data.gameMode );
        }
    };
})();