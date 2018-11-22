
// cubeApp definition
var cubeApp = {
    renderer: null,
    scene: null,
    camera: null,
    cubeColors :[ 
        new THREE.Color(0xff0000), //Red
        new THREE.Color(0xff5500),  //Orange
        new THREE.Color(0xffffff), //White
        new THREE.Color(0xffff00),  //Yellow
        new THREE.Color(0x00ff00),  //Green
        new THREE.Color(0x0000ff), //Blue
    ],
    active: [],
    pivot: null,
    pivotFace: null,
    rubiksCube: null,
    startX : -10,
    startY : 0,
    startZ : 0,
    SPACING : 2,
    uRot: 0,
    dRot: 0,
    rRot: 0,
    lRot: 0,
    fRot: 0,
    bRot: 0,
    locked: [false, false, false, false, false, false],
    prevMove: null,
    scramble: false,
    animate: false,
    animateAmt: 0,
    solve: false,
    stack: [],
    direction: 1,
    normalMap: null
};
/**
* This function is called initially, loads normal map image resource, then calls init
* Necessary for resource to be loaded in time
*/
cubeApp.load = function(){
    //set up the material loader
    var loader = new THREE.TextureLoader();
    loader.load("diceNMap.png",
        function(tex2){
            cubeApp.normalMap = tex2;
            cubeApp.init()
        });
}

/**
* Initializes scene, camera, renderer, lights then creates cube and runs app
*/
cubeApp.init = function(){
    //Pass an object that contains parameters
    var canvas = document.getElementById('glCanvas');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    this.renderer = new THREE.WebGLRenderer( {canvas: canvas, antialias: true} );

    //Set viewport size
    this.renderer.setSize(canvas.width, canvas.height);

    //Create a scene object
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xeeeeee );

    //Create a camera
    this.camera = new THREE.PerspectiveCamera( //Setup view frustum
        45, //Field of view in degrees
        canvas.width/canvas.height, //Aspect ration
        1, 4000 //Near and far view planes
    ); 
     //Move the camera
    this.camera.position.z = 20;
    this.camera.position.y = 10;
    this.camera.lookAt(new THREE.Vector3(0,0,1))
    this.scene.add(this.camera); // Add to scene

    // Left, Right, Bottom lights
    var light1 = new THREE.DirectionalLight(0xffffff, 1.5); 
    light1.position.set(1, 1, 1);
    var light2 = new THREE.DirectionalLight(0xffffff, 1.5);
    light2.position.set(-1, 1, 1);
    var light2 = new THREE.DirectionalLight(0xffffff, 1.5); 
    light2.position.set(-1, 1, 1);
    var light3 = new THREE.PointLight(0xffffff, 1.5, 10); 
    light3.position.set(0, -10, 1);

    this.scene.add(light1);
    this.scene.add(light2);
    this.scene.add(light3)

    // call func to create rubiks cube
    this.createRubiks();
    //Set event listener for keyboard
    document.onkeydown = function(evt){cubeApp.onKeyDown(evt)};
    //Run it
    this.run();
};

/**
* This function creates the rubiks cube and all the necessary groups to make it move/rotate
*/
cubeApp.createRubiks = function(){
    //Create geometry
    var geom = new THREE.CubeGeometry(2, 2, 2); 
    // Setup cube face color for each face
    var index = 0;
    for(var i = 0; i < this.cubeColors.length; i ++){
        //triangles so need to do twice for each face
        geom.faces[index].color = this.cubeColors[i]
        geom.faces[index+1].color = this.cubeColors[i]
        index+=2
    }
    this.rubiksCube = new THREE.Object3D();
    //Create material for cube
    var cubeMaterial = new THREE.MeshPhongMaterial({ vertexColors: THREE.FaceColors});
    cubeMaterial.normalMap = this.normalMap;
    var yPos = this.startY;
    // Triple for-loop to create all 27 individual cubes that make up the rubiks cube
    for(var y = 0; y < 3; y ++){
        var zPos = this.startZ;
        for(var z = 0; z < 3 ; z ++){
            var xPos = this.startX;
            for(var x = 0; x < 3; x ++){
                var cube = new THREE.Mesh(geom, cubeMaterial); //Give the cube the geometry and material
                cube.position.z = zPos;
                cube.position.x = xPos;
                cube.position.y = yPos;
                this.rubiksCube.add(cube);  
                xPos += this.SPACING;
            }
            zPos += this.SPACING;
        }
        yPos += this.SPACING;
    }
    // "box" referenced from docs. Allows center position to be set/maintained for cube
    var box = new THREE.Box3().setFromObject( this.rubiksCube );
    this.pivotFace = new THREE.Object3D(); // Pivot for face that is going to rotate
    box.getCenter( this.rubiksCube.position ); // this re-sets the obj position
    box.getCenter( this.pivotFace.position );
    this.rubiksCube.position.multiplyScalar( - 1 );

    this.pivot = new THREE.Group(); // Pivot for entire cube
    
    this.scene.add( this.pivot );
    this.pivot.add( this.rubiksCube );
    this.pivot.add(this.pivotFace);
}

/**
* This function rotates the specified cube face in the given direction
*/
cubeApp.makeMove = function(move, direction){
    var angle = Math.PI/4 * direction // Rotation amount
    if(move == 'r' || move == 'l'){ // Left or right vertical move
        var xPos = -10;
        if(move == 'r'){
            xPos = -6;
        }
        if(this.prevMove != move || this.prevMove == undefined){ // Add correct cubes if necessary
            this.active = []
            for(var i = 0; i < this.rubiksCube.children.length; i ++){
                if(this.rubiksCube.children[i].position.x < (xPos + 1) && this.rubiksCube.children[i].position.x > (xPos - 1)){
                    this.active.push(this.rubiksCube.children[i]);
                }
            }
        }
        this.pivotFace.rotation.set( 0, 0, 0 );
        this.pivotFace.updateMatrixWorld();

        for ( var i in this.active ) { //Attach cubes to pivotFace from cube
            THREE.SceneUtils.attach( this.active[ i ], this.rubiksCube, this.pivotFace );
        }
        this.pivotFace.rotateX(angle) //Perform rotation
    }
    //Horizontal move
    else if(move == 'u' || move == 'd'){
        var yPos = 0;
        if(move == 'u'){
            yPos = 4;
        }
        if(this.prevMove != move || this.prevMove == undefined){
            this.active = []
            for(var i = 0; i < this.rubiksCube.children.length; i ++){
                if(this.rubiksCube.children[i].position.y > (yPos - 1) && this.rubiksCube.children[i].position.y < (yPos + 1)){
                    this.active.push(this.rubiksCube.children[i]);
                }
            }
        }
        this.pivotFace.rotation.set( 0, 0, 0 );
        this.pivotFace.updateMatrixWorld();
        for ( var i in this.active ) {
            THREE.SceneUtils.attach( this.active[ i ], this.rubiksCube, this.pivotFace );
        }
        this.pivotFace.rotateY(angle)
    }
    //front move
    else if(move == 'f' || move == 'b'){
        var zPos = 0;
        if(move == 'f'){
            zPos = 4
        }
        if(this.prevMove != move || this.prevMove == undefined){
            this.active = []
            for(var i = 0; i < this.rubiksCube.children.length; i ++){
                if(this.rubiksCube.children[i].position.z > (zPos - 1) && this.rubiksCube.children[i].position.z < (zPos + 1)){
                    this.active.push(this.rubiksCube.children[i]);
                }
            }
        }
        this.pivotFace.rotation.set( 0, 0, 0 );
        this.pivotFace.updateMatrixWorld();
        for ( var i in this.active ) {
            THREE.SceneUtils.attach( this.active[ i ], this.rubiksCube, this.pivotFace );
        }
        this.pivotFace.rotateZ(angle)   
    }
    this.pivotFace.updateMatrixWorld(); //Update matrix
        for ( var i in this.active ) { //Detach cubes from pivot and re-attach to rubiks cube
            this.rubiksCube.children[ i ].updateMatrixWorld(); // if not done by the renderer
            THREE.SceneUtils.detach( this.active[ i ], this.pivotFace, this.rubiksCube );
        }
    this.prevMove = move; //Set the previous move
}

/**
* Run method that is called repeatedly (not recursion)
*/
cubeApp.run = function(){
    // Set timeout used to slow function calls down (otherwise cube animations occur too quickly)
    setTimeout(function(){
        requestAnimationFrame( function(){ cubeApp.run(); } ); 
    }, 100);
    //Render scene from perspective of camera
    this.renderer.render(this.scene, this.camera);

    // Update screen to text
    canvasText();

    if(this.scramble == true){ // Scramble cube if Key "S" is pressed
        this.scrambleCube()
    }
    if(this.animate == true){ // Animate cube 360 degrees if "A" is pressed
        this.animateAmt += .09817477132239698; //About Pi/32 (These are necessary due to rounding differences with Math.PI)
        if(this.animateAmt == 6.283185364633411){ //About 2 PI, Couldn't find a way around hard-coding these (see above)
            this.animateAmt = 0;
            this.animate = false;
            this.unlockFaces();
        }
        this.animateCube() //func gets called until 360 degree rotation occurs
    }
    if(this.solve == true){ // Solve cube if Enter is pressed
        if(this.stack.length == 0){
            this.solve = false;
            this.direction *= -1 //Invert direction back to normal
        }
        else{
            this.solveCube() //func gets called until cube is solved
        }
    }
}

/**
* Event listener for keyboard
* Parameters: evt is key event, solve is boolean
*/
cubeApp.onKeyDown = function(evt, solve){
    if(evt.code == "ShiftLeft" || evt.code == 'ShiftRight'){ //Reverse direction
        this.direction = -1*this.direction;
    }
    switch(evt.code){
        case "KeyU":
            if(this.locked[0] != true){ // Make sure face isn't locked
                this.uRot += 45; // Update rotation amount (for screen text)
                if(solve != true){ // If theyre not trying to solve, push it to stack
                    this.stack.push({move: 'u', direction: this.direction})
                }
                this.makeMove('u',this.direction) //Make the move
                if(this.uRot % 90 != 0){ //If it isnt rotate at a 90 degree angle
                    this.lockFaces(0); // Lock all the other faces
                }
                else{
                    this.unlockFaces(); //Otherwise, unlike the other faces
                }
            }
            break;
        case "KeyD":
            if(this.locked[1] != true){
                this.dRot += 45;
                if(solve != true){
                    this.stack.push({move: 'd', direction: this.direction})
                }
                this.makeMove('d',this.direction)
                if(this.dRot % 90 != 0){
                    this.lockFaces(1);
                }
                else{
                    this.unlockFaces();
                }
            }
            break;
        case "KeyR":
            if(this.locked[2] != true){
                this.rRot += 45;
                if(solve != true){
                    this.stack.push({move: 'r', direction: this.direction})
                }
                this.makeMove('r',this.direction)
                if(this.rRot % 90 != 0){
                    this.lockFaces(2);
                }
                else{
                    this.unlockFaces();
                }
            }
            break;
        case "KeyL":
            if(this.locked[3] != true){
                this.lRot += 45;
                if(solve != true){
                    this.stack.push( {move: 'l', direction: this.direction} )
                }
                this.makeMove('l',this.direction)
                if(this.lRot % 90 != 0){
                    this.lockFaces(3);
                }
                else{
                    this.unlockFaces();
                }
            }
            break;
        case "KeyF":
            if(this.locked[4] != true){
                this.fRot += 45;
                if(solve != true){
                    this.stack.push({move: 'f',direction: this.direction})
                }
                this.makeMove('f',-1 * this.direction)
                if(this.fRot % 90 != 0){
                    this.lockFaces(4);
                }
                else{
                    this.unlockFaces();
                }
            }
            break;
        case "KeyB":
            if(this.locked[5] != true){
                this.bRot += 45;
                if(solve != true){
                    this.stack.push({move: 'b',direction: this.direction})
                }
                this.makeMove('b',(-1 *this.direction))
                if(this.bRot % 90 != 0){
                    this.lockFaces(5);
                }
                else{
                    this.unlockFaces();
                }
            }
            break;
        case "ArrowLeft": //Update camera to new position
            this.camera.position.y = 7;
            this.camera.position.x = -20
            this.camera.lookAt(new THREE.Vector3(0,0,1)) //reset vector
            break;
        case "ArrowRight": //Update camera to new position       
            this.camera.position.y = 7;
            this.camera.position.x = 20
            this.camera.lookAt(new THREE.Vector3(0,0,1)) //reset vector
            break;
        case "ArrowUp": //Update camera to new position
            this.camera.position.y = 10;
            this.camera.position.x = 0;
            this.camera.lookAt(new THREE.Vector3(0,0,1)) //reset vector
            break;
        case "ArrowDown": //Update camera to new position
            this.camera.position.y = -10;
            this.camera.position.x = 0;
            this.camera.lookAt(new THREE.Vector3(0,0,1)) //reset vector
            break;
        case "KeyS": //Turn scramble on/off
            this.scramble = !this.scramble;
            break;
        case "KeyA": // Start 360 degree rotation
            this.animate = true;
            this.lockFaces();
            break;
        case "Enter": //Start solve
            this.solve = true;
            break;
    }
}

/**
* Print text to canvas screen
*/
function canvasText(){
    // look up the text canvas.
    var textCanvas = document.getElementById("text");
     
    // make a 2D context for it
    var ctx = textCanvas.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font="20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText('CUBE CONTROLS:', 50, 40);
    ctx.font="15px Arial";

    ctx.fillText('U - UP | ' + cubeApp.uRot%360+' Degrees | Locked: ' + cubeApp.locked[0], 50, 80);
    ctx.fillText('D - DOWN | ' + cubeApp.dRot%360+' Degrees | Locked: ' + cubeApp.locked[1], 50, 120);
    ctx.fillText('L - LEFT | ' + cubeApp.lRot%360+' Degrees | Locked: ' + cubeApp.locked[3], 50, 160);
    ctx.fillText('R - RIGHT | ' + cubeApp.rRot%360+' Degrees | Locked: ' + cubeApp.locked[2], 50, 200);
    ctx.fillText('F - FRONT | ' + cubeApp.fRot%360+' Degrees | Locked: ' + cubeApp.locked[4], 50, 240);
    ctx.fillText('B - BACK | ' + cubeApp.bRot%360+' Degrees | Locked: ' + cubeApp.locked[5], 50, 280);
    if(cubeApp.direction == 1){
        ctx.fillText('Rotation Direction: Normal', 50, 310);
    }
    else{
        ctx.fillText('Rotation Direction: Inverted' , 50, 310);
    }
    ctx.fillText('** Switch Directions by pressing Shift' , 50, 330);

    ctx.font="20px Arial";
    ctx.fillText('OTHER CONTROLS:', 50, 380);
    ctx.font="15px Arial";

    ctx.fillText('Left Camera View - Left Arrow', 50, 400);
    ctx.fillText('Right Camera View - Right Arrow', 50, 420);
    ctx.fillText('Normal Camera View - Up Arrow', 50, 440);
    ctx.fillText('Bottom Camera View - Down Arrow', 50, 460);
    ctx.fillText('Start/Stop Scramble - S', 50, 480);
    ctx.fillText('Animate - A', 50, 500);
    ctx.fillText('PRESS ENTER TO SOLVE', 50, 520);
 }
/**
* Lock all the faces (0-5) except parameter face 
*/
 cubeApp.lockFaces = function(face){
    for(var i = 0; i < this.locked.length; i ++){
        if(i != face){
            this.locked[i] = true;
        }
    }
}
/**
* Unlock every face
*/
cubeApp.unlockFaces = function(){
    for(var i = 0; i < this.locked.length; i ++){
        this.locked[i] = false;
    }   
}
/**
* Scramble the cube (Called repeatedly by run() as necessary)
*/
cubeApp.scrambleCube = function(){
    var evt = {code: null};
    var moves = ['KeyD','KeyU','KeyL','KeyR','KeyB','KeyF'];
    var move = moves[Math.ceil(Math.random()* 5)]; // Get random key move
    evt.code = move;
    this.onKeyDown(evt) // Make the move
}
/**
* Animate the cube (Called repeatedly by run func until 360 degree rotation completed)
*/
cubeApp.animateCube = function(){
    this.pivot.rotateY(Math.PI/32)
}
/**
* Solve the cube (Called repeatedly by run func until solved)
*/
cubeApp.solveCube = function(){
    var move = this.stack[this.stack.length-1].move; //Pop top move off stack
    var direction = this.stack[this.stack.length-1].direction;  //Pop top direction off stack
    this.stack.splice(this.stack.length-1) // Remove from stack
    if(direction == -1){ //set direction to opposite of move's
        this.direction = 1;
    }
    else{
        this.direction = -1;
    }
    // Make necessary move and set "solve" to true
    if(move == 'r'){
        this.rRot -= 90;
        this.onKeyDown({code : 'KeyR'}, true)
    }
    if(move == 'l'){
        this.lRot -= 90;
        this.onKeyDown({code : 'KeyL'}, true)
    }
    if(move == 'u'){
        this.uRot -= 90;
        this.onKeyDown({code : 'KeyU'}, true)
    }
    if(move == 'd'){
        this.dRot -= 90;
        this.onKeyDown({code : 'KeyD'}, true)
    }
    if(move == 'f'){
        this.fRot -= 90;
        this.onKeyDown({code : 'KeyF'}, true)
    }
    if(move == 'b'){
        this.bRot -= 90;
        this.onKeyDown({code : 'KeyB'}, true)
    }
}

