
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












