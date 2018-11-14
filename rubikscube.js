
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












