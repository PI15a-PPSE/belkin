
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
	if(evt.code == "ShiftRight" || evt.code == 'ShiftLeft'){ //Reverse direction
		this.direction = -1*this.direction;
	}
}




