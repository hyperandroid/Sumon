/**
 * See LICENSE file.
 *
 * Game model..
 */

(function() {
    HN.GameModes= {
        classic:  {
            fixed_table_size:   true,
            rearrange_on_remove:true,
            rows_initial:       8,
            columns_initial:    8,
            rows_max:           8,
            columns_max:        8,
            time_policy:        -500,
            minTurnTime:        12000,
            number_policy:      [10,10,10,15,15,15,20,20,25,30,35,40,45,50],
            name:               'classic'
        },
        progressive : {
            fixed_table_size:   false,
            rearrange_on_remove:true,
            rows_initial:       3,
            columns_initial:    3,
            rows_max:           8,
            columns_max:        8,
            time_policy:        0,
            number_policy:      [10,10,10,10,10,15,15,15,15,20,25,30,35,40,45,50],
            name:               'progressive'
        },
        respawn : {
            fixed_table_size:   true,
            rearrange_on_remove:true,
            respawn:            true,
            respawn_time:       22000,
            rows_initial:       8,
            columns_initial:    8,
            rows_max:           8,
            columns_max:        8,
            time_policy:        500,
            minTurnTime:        8000,
            initial_map:        [
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,1,1,0,0,0],
                    [0,0,1,1,1,1,0,0],
                    [0,1,1,1,1,1,1,0],
                    [1,1,1,1,1,1,1,1]
            ],
            number_policy:      [10,10,10,10,10,15,15,15,15,20,25,30,35,40,45,50],
            name:               'respawn'
        }
    }
})();

(function() {

    HN.Brick= function() {
        return this;
    };

    HN.Brick.prototype= {

        value:      0,
        color:      0,
        selected:   false,
        removed:    false,

        row:        0,
        column:     0,

        context:    null,
        delegate:   null,

        /**
         *
         * @param row
         * @param column
         * @param context the HN.Context instance
         */
        initialize : function(row, column, context, removed) {

            removed= removed || false;

            this.row=       row;
            this.column=    column;
            this.selected=  false;
            this.removed=   removed;
            this.color=     (Math.random()*context.getNumberColors())>>0;
            this.context=   context;

            this.respawn();
        },
        changeSelection : function() {

            // prevent brick selection while bricks are flying in.
            if ( this.context.status!==this.context.ST_RUNNNING ) {
                return;
            }

            this.selected= !this.selected;
            this.context.selectionChanged(this);
        },
        respawn : function() {

            this.selected= false;

            // favorecer los numeros 3..9
            if ( Math.random()>.3 ) {
                this.value= 4 + (Math.random()*6)>>0;
            } else {
                this.value= 1 + (Math.random()*3)>>0;
            }

            if ( this.value<1 ) {
                this.value=1;
            } else if ( this.value>9 ) {
                this.value=9;
            }

            if ( null!=this.delegate ) {
                this.delegate();
            }

            return this;
        }
    };

})();

(function() {

    HN.Context= function() {
        this.eventListener= [];
        return this;
    };

    HN.Context.prototype= {

        eventListener:  null,   // context listeners

        gameMode:       null,

        rows:           0,      // model size in
        columns:        0,      //  rows x columns
        numNumberColors:0,
        initialRows:    0,
        initialColumns: 0,
        currentRows:    0,
        currentColumns: 0,

        /**
         * Numero inicial de ladrillos activos en el nivel.
         * Se puede especificar un mapa de ladrillos activos a traves del gameMode.
         * Como no tiene porque coincidir con todos los ladrillos de initialRows*initialColumns,
         * necesito contarlos porque el juego no progresa de la animaci—n de entrada de ladrillos
         * volando hasta que todos llegan a su sitio.
         */
        initialBricks:  0,

        data:           null,   // context model. Bricks.

        guessNumber:    0,      // number to sum up with bricks.
        time:           0,      // maximum time to take to guess an adding number sequence.

        selectedList:   null,   // selected bricks.

        status:         0,      // <-- control logic -->
        level:          0,

        score:          0,      // game points.


        turnTime:       15000,

        turnTimes:      [20000, 15000, 10000],
        difficulty:     0,    // 0: easy, 1: hard, 2: hardcore.

        brickIncrementByDifficulty: [5,10],

        meters:         0,

        ST_STARTGAME:       5,
        ST_INITIALIZING:    0,
        ST_START_LEVEL:     2,
        ST_RUNNNING:        1,
        ST_LEVEL_RESULT:    3,
        ST_ENDGAME:         4,


        /**
         * Called once on game startup.
         *
         * @return nothing.
         */
        create : function( maxR, maxC, numNumberColors  ) {
            this.rows=              maxR;
            this.columns=           maxC;
            this.numNumberColors=   numNumberColors;
            this.data=              [];

            var i,j;

            for( i=0; i<this.rows; i++ ) {
                this.data.push( [] );
                for( j=0; j<this.columns; j++ ) {
                    this.data[i].push( new HN.Brick() );
                }
            }

            return this;
        },
        setGameMode : function( gameMode) {
            if ( gameMode!=this.gameMode ) {
                this.gameMode=          gameMode;
                this.initialRows=       gameMode.rows_initial;
                this.initialColumns=    gameMode.columns_initial;
            }

            this.initialize();
        },
        getNumberColors : function()  {
            return this.numNumberColors;
        },
        initialize : function() {

            this.setStatus( this.ST_STARTGAME );
            this.turnTime= this.turnTimes[this.difficulty];
            this.score=0;
            this.level=0;
            this.setAltitude(0);
            this.currentRows= this.initialRows;
            this.currentColumns= this.initialColumns;
            this.nextLevel();
            return this;
        },
        getLevelActiveBricks : function() {
            return this.initialBricks;
        },
        prepareBricks : function() {

            var i,j;

            for( i=0; i<this.rows; i++ ) {
                for( j=0; j<this.columns; j++ ) {
                    this.data[i][j].initialize(i,j,this,true);
                }
            }

            if ( this.gameMode.initial_map ) {
                var im= this.gameMode.initial_map;

                this.initialBricks=0;
                for( i=0; i<this.currentRows; i++ ) {
                    for( j=0; j<this.currentColumns; j++ ) {

                        var removed= true;
                        if ( im.length<i ) {
                            removed= false;
                        } else {
                            if ( im[i].length<j ) {
                                removed= false;
                            } else {
                                removed= im[i][j]==0;
                            }
                        }

                        this.data[i][j].initialize(i,j,this,removed);

                        if (!removed) {
                            this.initialBricks++;
                        }
                    }
                }

            } else {
                this.initialBricks= this.currentRows*this.currentColumns;

                for( i=0; i<this.currentRows; i++ ) {
                    for( j=0; j<this.currentColumns; j++ ) {
                        this.data[i][j].initialize(i,j,this,false);
                    }
                }
            }
        },
        nextLevel : function() {

            this.level++;
            this.fireEvent('context','levelchange',this.level);

            this.selectedList=  [];

            // not fixed size.
            // add one column/row alternatively until reaching rows/columsn size.
            if ( !this.gameMode.fixed_table_size ) {
                if ( this.level>1 && (this.currentRows<this.rows || this.currentColumns<this.columns )) {
                    if ( this.currentRows==this.currentColumns ) {
                        this.currentColumns++;
                    } else {
                        this.currentRows++;
                    }
                }
            }

            this.prepareBricks();

            this.setStatus( this.ST_INITIALIZING );

            if ( this.level>1 ) {
                // 1 seconds less each level.
                this.turnTime-= this.gameMode.time_policy;
                if ( this.gameMode.minTurnTime ) {
                    if ( this.turnTime<this.gameMode.minTurnTime ) {
                        this.turnTime= this.gameMode.minTurnTime;
                    }
                }
            }

            return this;
        },
        /**
         * Notify listeners of a context event
         * @param sSource event source object
         * @param sEvent an string indicating the event type
         * @param params an object with event parameters. Each event type will have its own parameter set.
         */
        fireEvent : function( sSource, sEvent, params ) {
            var i;
            for( i=0; i<this.eventListener.length; i++ ) {
                this.eventListener[i].contextEvent( {
                    source: sSource,
                    event:  sEvent,
                    params: params
                });
            }
        },
        addContextListener : function( listener ) {
            this.eventListener.push(listener);
            return this;
        },
        getBrick : function( row, column ) {
            return this.data[row][column];
        },
        setStatus : function( status ) {
            this.status= status;
            this.fireEvent( 'context', 'status', this.status );

            if ( this.status==this.ST_RUNNNING ) {
                this.setGuessNumber();
            }
        },
        selectionChanged : function(brick) {

            // si ya estaba en la lista de seleccionados, quitarlo.
            var i,j;
            for( i=0; i<this.selectedList.length; i++ ) {
                // esta en la lista.
                // eliminar y salir del metodo
                if ( this.selectedList[i]==brick ) {
                    this.selectedList.splice( i, 1 );
                    this.fireEvent('brick','selection',brick);
                    return;
                }
            }

            // chequear que la suma de los elementos seleccionados es igual al numero magico.
            var sum=0;
            for( i=0; i<this.selectedList.length; i++ ) {
                sum+= this.selectedList[i].value;
            }

            sum+= brick.value;

            var selected;

            if ( sum>this.guessNumber ) {

                brick.selected= false;
                selected= this.selectedList.slice(0);
                for( i=0; i<this.selectedList.length; i++ ) {
                    this.selectedList[i].selected= false;
                }
                this.selectedList= [];

                // quitar marca de seleccion al ladrillo.
                this.fireEvent('brick','selectionoverflow', selected );
            } else if ( sum==this.guessNumber ) {
                this.selectedList.push(brick);
                selected= this.selectedList.slice(0);
                for( i=0; i<this.selectedList.length; i++ ) {
                    this.selectedList[i].selected= false;
                    this.selectedList[i].removed= true;
                }

                // rearrange bricks if needed
                if ( this.gameMode.rearrange_on_remove ) {
                    for( i=0; i<this.selectedList.length; i++ ) {
                        var r= this.selectedList[i].row;
                        var c= this.selectedList[i].column;

                        // bajar todos los elementos de columna una posicion.
                        for( var row= r; row>0; row-- ) {
                            var move= this.data[row-1][c];
                            var to=   this.data[row][c];

                            var tmp= move;
                            this.data[row-1][c]= this.data[row][c];
                            this.data[row][c]= tmp;

                            // cambiar row del brick. la columna es la misma
                            tmp= move.row;
                            move.row= to.row;
                            to.row= tmp;

                            this.fireEvent(
                                    'brick',
                                    'rearranged',
                                    {
                                        fromRow :   move.row-1,
                                        toRow:      move.row,
                                        column:     c
                                    });
                        }
                    }
                }

                this.selectedList= [];

                this.fireEvent('brick','selection-cleared', selected );

                this.score+= this.multiplier * ((selected.length+1)*(this.difficulty==0?10:20))*selected.length;

                this.fireEvent('context','score',this);

                for( i=0; i<this.rows; i++ ) {
                    for( j=0; j<this.columns; j++ ) {
                        if ( !this.data[i][j].removed ) {
                            this.setGuessNumber();
                            return;
                        }
                    }
                }

                this.setStatus( this.ST_LEVEL_RESULT );
                
            } else {
                // todavia podemos sumar numeros.
                this.selectedList.push(brick);
                this.fireEvent('brick','selection',brick);
                this.setMultipliers();
            }
        },
        setGuessNumber : function() {

            // first get all available board numbers.
            var activeBricks= [];
            var i,j;
            for( i=0; i<this.rows; i++ ) {
                for( j=0; j<this.columns; j++ ) {
                    if ( !this.data[i][j].removed ) {
                        activeBricks.push(this.data[i][j]);
                    }
                }
            }

            // scramble elements.
            if ( activeBricks.length>1 ) {
                for( i=0; i<activeBricks.length; i++ ) {
                    var rpos0=              (Math.random()*activeBricks.length)>>0;
                    var tmp=                activeBricks[i];

                    activeBricks[i]=        activeBricks[rpos0];
                    activeBricks[rpos0]=    tmp;
                }
            }

            /**
             * tenemos que estar seguros que el numero ofrecido al player debe estar entre:
             * 10-15 15-20 20-25 ... (facil)
             * 10-20 20-30 30-40 ... (dificil)
             */
            var sum=0;
            var diff= this.brickIncrementByDifficulty[this.difficulty];
            //var min= 10 + (this.level-1)*diff;
            var index__= this.level-1;
            if ( index__>=this.gameMode.number_policy.length ) {
                index__= this.gameMode.number_policy.length-1;
            }
            var min= this.gameMode.number_policy[index__];
            var max= min+diff;
            var brickCount=0;

            if ( activeBricks.length==1 ) {
                sum= activeBricks[0].value;
            } else if ( activeBricks.length==2 ) {
                sum= activeBricks[0].value+activeBricks[1].value;
            } else {
                for( i=0; i<activeBricks.length; i++ ) {
                    if ( sum+activeBricks[i].value<=max ) {
                        sum+= activeBricks[i].value;
                        brickCount++;
                    } else {
                        if ( sum>min ) {
                            break;
                        }
                    }
                }

                if ( brickCount==1 ) {
                    sum= activeBricks[0].value+activeBricks[1].value;
                }
            }
            this.guessNumber= sum;
            this.fireEvent( 'context','guessnumber',this );

            this.setMultipliers();
        },
        timeUp : function() {
            this.setStatus( this.ST_ENDGAME );
        },
        respawn : function() {
            // comprobar que podemos meter nuevos elementos.
            var cabenMas= true;
            var i,j;
            for( i=0; i<this.currentColumns; i++ ) {
                // una columna est‡ llena. no seguir.
                if ( !this.data[0][i].removed ) {
                    cabenMas= false;
                    break;
                }
            }

            if (!cabenMas) {
                this.setStatus( this.ST_ENDGAME );
                return;
            }

            var respawnData= [];
            // meter una nueva fila de numeros.
            for( j=0; j<this.currentColumns; j++ ) {
                // buscar la fila donde cae el numero
                for( i=0; i<this.currentRows; i++ ) {
                    if ( !this.data[i][j].removed ) {
                        break;
                    }
                }

                // i tiene la fila con el ultimo elemento valido
                i--;
                this.data[i][j].removed= false;
                this.data[i][j].selected= false;
                this.data[i][j].respawn();

                respawnData.push( {
                    row:    i,
                    column: j
                } );
            }

            this.fireEvent('brick','respawn',respawnData);

        },
        /**
         * establece multiplicadores de puntos en funcion de:
         *  + numero de ladridllos
         *  + distancia total entre ladrillos
         */
        setMultipliers : function() {

            if ( this.selectedList && this.selectedList.length>0 ) {
                var x0= this.selectedList[0].column;
                var y0= this.selectedList[0].row;
                var d=  0;
                var i;

                for( i=1; i<this.selectedList.length; i++ ) {
                    var x1= this.selectedList[i].column;
                    var y1= this.selectedList[i].row;

                    d+= Math.sqrt( (x1-x0)*(x1-x0) + (y1-y0)*(y1-y0) );

                    x0= x1;
                    y0= y1;
                }

                d= d>>0;
                d= 1+ (d/10)>>0;
                if ( d<1 ) {
                    d=1;
                } else if ( d>5 ) {
                    d=5;
                }

                this.multiplier= d;
            } else {
                this.multiplier= 0;
            }

            this.fireEvent('context','multiplier',this);
        },
        incrementAltitude : function( increment ) {
            this.setAltitude( this.meters+increment );
        },
        setAltitude : function( altitude ) {
            this.meters= altitude;
            this.fireEvent( 'context','altitude',this.meters);
        }
    };
})();