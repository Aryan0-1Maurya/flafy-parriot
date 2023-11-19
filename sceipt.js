/* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/


 "use strict";

 let sceneWidth, sceneHeight, camera, scene, renderer, orbitControl, stats, quality = 0.6;
 let ground, groundAttributes = {width: 10, height: 10, widthSegments: 64, heightSegments: 64}, glow, heightMap, heightScale = 0.67; //ground
 let parrot, flyingAnimation, acceleration = -0.2, orgTilt, tilt = THREE.Math.degToRad(-30), minTilt = -30, maxTilt = 30, maxHeight, jumpTimeout, tiltTimeout;   //parrot
 let up, down, front, planes = [], z, dZ = 0, yMax, zMax = 0.8, dRot, collided = false;   //collision
 let landscape, landscapePool = [], meshes = [], materials = [], pole1, pole2, gap = 0.14;   //object groups
 let cameraTarget = new THREE.Vector3(0, 0, 3);  //camera
 let clock = new THREE.Clock(), delta = 0, speed = 2, mixer; //timing
 let score = 0, highScore = 0, scoreLabel, gameOver = false;  //score
 let flapSound, hitSound, metalSound, scoreSound, laugh;    //sound effects
 const loader = new THREE.GLTFLoader();
 
 //initializes the scene
 function init() {
     stats = new Stats();
     stats.showPanel(0);
     //document.body.appendChild(stats.dom);
     sceneWidth = window.innerWidth;
     sceneHeight = window.innerHeight;
     scene = new THREE.Scene();  //the 3d scene
     camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.0001, 1000);    //perspective camera
     camera.position.set(0.635, 0.301, 5.232);
     camera.lookAt(cameraTarget);
     loadSounds();
     renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
     renderer.shadowMap.enabled = true;
     renderer.shadowMap.type = THREE.PCFSoftShadowMap;
     renderer.setPixelRatio(window.devicePixelRatio * quality);
     renderer.setSize(sceneWidth, sceneHeight);
     renderer.setClearColor(0xa9f5f2, 1);
     document.body.appendChild(renderer.domElement);
     addScore();
     //add items to scene
     addLight();
     addGround(groundAttributes.width, groundAttributes.height, groundAttributes.widthSegments, groundAttributes.heightSegments);
     addObjects([
         {type: 'cloud', size: 0.75, x: -4, y: 2, z: -2},
         {type: 'cloud', size: 0.6, x: -2, y: 2, z: 1.5},
         {type: 'cloud', size: 0.3, x: -3, y: 2, z: 2},
         {type: 'tree', size: 0.8, x: -3.2, z: -4},
         {type: 'smallTree', size: 1, x: -4, z: -3},
         {type: 'tree', size: 0.8, x: -1.5, z: -3},
         {type: 'tree', size: 0.5, x: -2.75, z: -2},
         {type: 'smallTree', size: 1, x: -3.5, z: -1},
         {type: 'tree', size: 0.8, x: -1.5, z: 0},
         {type: 'tree', size: 0.6, x: -4, z: 0.8},
         {type: 'smallTree', size: 1.2, x: -2, z: 1.5},
         {type: 'tree', size: 0.8, x: -1.5, z: 3},
         {type: 'tree', size: 0.8, x: -4, z: 3},
         {type: 'smallTree', size: 1, x: -2.75, z: 4},
         {type: 'smallTree', size: 0.67, x: 1, z: -4},
         {type: 'tree', size: 0.52, x: 1, z: -2},
         {type: 'cloud', size: 1, x: 2, y: 2, z: -1},
         {type: 'tree', size: 0.52, x: 1, z: 0},
         {type: 'cloud', size: 0.5, x: 3, y: 2, z: 1},
         {type: 'smallTree', size: 0.67, x: 1, z: 2},
         {type: 'tree', size: 0.4, x: 1, z: 4}
     ]);
     mergeObjects();
     for (let i = 0; i < 5; ++i){
         landscapePool.push(landscape.clone());
         landscapePool[i].position.z = - 10 * i;
         //landscapePool[i].castShadow = true;
         //landscapePool[i].receiveShadow = true;
         scene.add(landscapePool[i]);
     }
     pole1 = createPole(gap, 0.05);
     pole1.position.y = 0.5;
     pole1.position.z = 10;
     scene.add(pole1);
     pole2 = createPole(gap, 0.05);
     pole2.position.y = 0.5;
     pole2.position.z = 0;
     scene.add(pole2);
     addBird({x: 0, y: 0.4, z: 4}, 0.002);
     ///////////////////////
     renderer.render(scene, camera);
     window.addEventListener('resize', onWindowResize, false);//resize callback
 }
 
 //starts the game
 function startGame(){
     swal({
         title: "Flappy Parrot",
         text: ((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? 'Tap the screen to jump.' : 'Press the space bar to jump.') + '\n**Please play responsibly**',
         button: "Play",
         closeOnClickOutside: false,
         closeOnEsc: false,
     }).then(function(){
         clock.start();
         update();
     });
 }
 
 //loads sound effects
 function loadSounds(){
     let listener = new THREE.AudioListener();
     camera.add(listener);
     let audioLoader = new THREE.AudioLoader();
     flapSound = new THREE.Audio( listener );
     audioLoader.load( 'https://badasstechie.github.io/audio/flapSound.mp3', function( buffer ) {
         flapSound.setBuffer( buffer );
         flapSound.setLoop( false );
         flapSound.setVolume( 1 );
     });
     hitSound = new THREE.Audio( listener );
     audioLoader.load( 'https://badasstechie.github.io/audio/hitSound.mp3', function( buffer ) {
         hitSound.setBuffer( buffer );
         hitSound.setLoop( false );
         hitSound.setVolume( 1 );
     });
     metalSound = new THREE.Audio( listener );
     audioLoader.load( 'https://badasstechie.github.io/audio/metalSound.mp3', function( buffer ) {
         metalSound.setBuffer( buffer );
         metalSound.setLoop( false );
         metalSound.setVolume( 1 );
     });
     scoreSound = new THREE.Audio( listener );
     audioLoader.load( 'https://badasstechie.github.io/audio/scoreSound.mp3', function( buffer ) {
         scoreSound.setBuffer( buffer );
         scoreSound.setLoop( false );
         scoreSound.setVolume( 1 );
     });
 }
 
 //restarts game
 function restartGame(){
     collided = false;
     highScore = (score > highScore)? score : highScore;
     swal({
         title: "Game Over",
         text: "Score: "+score+"\nBest: "+highScore,
         buttons: {
             confirm: "Play Again",
             cancel: "Quit"
         },
         closeOnClickOutside: false,
         closeOnEsc: false
     }).then(function(val){
         if (val) {
             camera.position.set(0.635, 0.301, 5.232);
             parrot.position.y = 0.4;
             parrot.position.z = 4;
             if (jumpTimeout) clearTimeout(jumpTimeout);
             acceleration = -0.2;
             parrot.rotation.x = orgTilt;
             tilt = THREE.Math.degToRad(-30);
             if (tiltTimeout) clearTimeout(tiltTimeout);
             pole1.position.y = 0.5;
             pole1.position.z = 10;
             pole1.material.opacity = 1;
             pole2.position.y = 0.5;
             pole2.position.z = 0;
             pole2.material.opacity = 1;
             landscapePool[0].position.z = 0;
             landscapePool.forEach(function(item, index){
                 if (index > 0){
                     let prevIndex = index - 1;
                     item.position.z = landscapePool[prevIndex].position.z - 10;
                 }
             });
             score = 0;
             scoreLabel.innerText = 'Score: ' + score.toString();
             dZ = 0;
             gameOver = false;
 
         }
     });
 }
 
 //appends score to html
 function addScore(){
     scoreLabel = document.createElement('div');
     scoreLabel.style.position = 'absolute';
     scoreLabel.style.top = '0px';
     scoreLabel.style.left = '0px';
     scoreLabel.style.width = '100%';
     scoreLabel.style.height = '40px';
     scoreLabel.style.fontSize = '20px';
     scoreLabel.style.fontWeight = 'bold';
     scoreLabel.style.color = '#ffffff';
     scoreLabel.style.textShadow = '0px 0px 10px #000000';
     scoreLabel.style.textAlign = 'center';
     scoreLabel.style.verticalAlign = 'middle';
     scoreLabel.style.lineHeight = '40px';
     scoreLabel.innerHTML = "Score: 0";
     document.body.appendChild(scoreLabel);
 }
 
 //adds trees and clouds
 function addObjects(data, showVertices = false){
     data.forEach(function(item){
         if (item.type === 'tree') {
             let tree = createTree([{trees:5, height:0.7, radius: 0.2}, {trees:5, height:0.95, radius: 0.3}, {trees:5, height:1.2, radius: 0.2}], item.size, showVertices);
             positionTree(tree, item.x, item.z);
             tree.children.forEach(function(item, index){
                 let child = item.clone();
                 child.position.set(tree.position.x+item.position.x*tree.scale.x, tree.position.y+item.position.y*tree.scale.y, tree.position.z+item.position.z*tree.scale.z);
                 child.scale.set(tree.scale.x, tree.scale.y, tree.scale.z);
                 meshes.push({mesh: child, materialIndex: meshes[meshes.length-1].materialIndex + 1});
                 materials.push(child.material);
             });
         } else if (item.type === 'smallTree'){
             let smallTree = createTree([{trees:5, height:0.6, radius: 0.25}], item.size, showVertices);
             positionTree(smallTree, item.x, item.z);
             smallTree.children.forEach(function(item, index){
                 let child = item.clone();
                 child.position.set(smallTree.position.x+item.position.x*smallTree.scale.x, smallTree.position.y+item.position.y*smallTree.scale.y, smallTree.position.z+item.position.z*smallTree.scale.z);
                 child.scale.set(smallTree.scale.x, smallTree.scale.y, smallTree.scale.z);
                 meshes.push({mesh: child, materialIndex: meshes[meshes.length-1].materialIndex + 1});
                 materials.push(child.material);
             });
         } else if (item.type === 'cloud'){
             let cloud = createCloud(item.size, 12, 12, showVertices);
             cloud.position.x = item.x;
             cloud.position.y = item.y;
             cloud.position.z = item.z;
             cloud.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, 0.5775));
             cloud.children.forEach(function(item, index){
                 let child = item.clone();
                 child.position.set(cloud.position.x+item.position.x*cloud.scale.x, cloud.position.y+item.position.y*cloud.scale.y, cloud.position.z+item.position.z*cloud.scale.z);
                 child.scale.set(cloud.scale.x, cloud.scale.y, cloud.scale.z);
                 meshes.push({mesh: child, materialIndex: meshes[meshes.length-1].materialIndex + 1});
                 materials.push(child.material);
             });
         }
     });
 }
 

 /* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/

 //merges common objects so as to render only a single object in place of many and reduce the number of drawcalls, thereby improving performance
 function mergeObjects(){
     let totalGeometry = new THREE.Geometry();
     for(let i = 0; i < meshes.length; ++i){
         meshes[i].mesh.updateMatrix();
         totalGeometry.merge(meshes[i].mesh.geometry, meshes[i].mesh.matrix, meshes[i].materialIndex);
     }
     let totalBufferGeometry = new THREE.BufferGeometry().fromGeometry(totalGeometry);
     landscape = new THREE.Mesh(totalBufferGeometry, materials);
 }
 
 //let there be light
 function addLight(){
     //ambient lighting
     let light = new THREE.HemisphereLight(0xfffff, 0x000000, 0.5);
     scene.add(light);
     //the sun
     let sunGeometry = new THREE.SphereBufferGeometry(0.31, 12, 12);
     let sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff99, transparent: true, opacity: 0.8, flatShading: true });
     let sun = new THREE.Mesh(sunGeometry, sunMaterial);
     sun.position.set(-3, 3, -3);
     scene.add(sun);
     let glowGeometry = new THREE.SphereBufferGeometry(0.7, 12, 12);
     let glowMaterial = new THREE.ShaderMaterial({
         uniforms: {
             viewVector: {type: "v3", value: camera.position}
         },
         vertexShader: document.getElementById('vertexShader').textContent,
         fragmentShader: document.getElementById('fragmentShader').textContent,
         side: THREE.BackSide,
         blending: THREE.AdditiveBlending,
         transparent: true
     });
     glow = new THREE.Mesh(glowGeometry, glowMaterial);
     glow.position.set(sun.position.x, sun.position.y, sun.position.z);
     scene.add(glow);
     //sun rays
     let sunlight = new THREE.DirectionalLight(0xffffff, 0.8);
     sunlight.position.set(sun.position.x, sun.position.y, sun.position.z);
     sunlight.castShadow = true;
     sunlight.shadow.camera.near = -8;
     sunlight.shadow.camera.far = 12;
     sunlight.shadow.camera.top = 10;
     sunlight.shadow.camera.bottom = -10;
     sunlight.shadow.camera.left = -20;
     sunlight.shadow.camera.right = 10;
     //scene.add(new THREE.CameraHelper(sunlight.shadow.camera));    //enable to show shadow properties in scene
     scene.add(sunlight);
 }
 
 //adds the parrot to the scene
 function addBird(pos, scale){
     let loader = new THREE.GLTFLoader();
     loader.load("https://badasstechie.github.io/models/Parrot.glb", function (gltf) {
         parrot = gltf.scene.children[0];
         parrot.applyMatrix(new THREE.Matrix4().makeScale(scale, scale, scale));
         parrot.applyMatrix(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(180)));
         orgTilt = parrot.rotation.x;
         parrot.position.set(pos.x, pos.y, pos.z);
         scene.add(parrot);
         up = (new THREE.Vector3(0, 4.5, 0).applyMatrix4(parrot.matrix));
         down = (new THREE.Vector3(0, -9.5, 0).applyMatrix4(parrot.matrix));
         front = (new THREE.Vector3(0, 0, 24).applyMatrix4(parrot.matrix));
         maxHeight = pos.y * 2;
         //lights up our parrot
         let light = new THREE.SpotLight(0xffffff, 5, pos.y * 1.9, THREE.Math.degToRad(24));
         light.position.set(pos.x, 0, pos.z);
         light.target = parrot;
         light.target.updateMatrixWorld();
         scene.add(light);
         //scene.add(new THREE.SpotLightHelper(light));
         let light2 = new THREE.SpotLight(0xffffff, 5, pos.y * 1.9, THREE.Math.degToRad(24));
         light2.position.set(pos.x, pos.y * 2, pos.z);
         light2.target = parrot;
         light2.target.updateMatrixWorld();
         scene.add(light2);
         //scene.add(new THREE.SpotLightHelper(light2));
         //makes the parrot flap his wings
         let animations = gltf.animations;
         mixer = new THREE.AnimationMixer(parrot);
         flyingAnimation = mixer.clipAction(animations[0]);
         flyingAnimation.play();
         //start game
         startGame();
     });
 }
 
 //adds the ground
 function addGround(width, height, cols, rows, showVertices = false){
     let planeGeometry = new THREE.PlaneGeometry(width, height, cols-1, rows-1);
     addHeight(planeGeometry, [
         [0, 0, 0, 0, 0, 0, 0],
         [0, 0, 0, 0, 0, 0, 0],
         [0, 0.5, 0.8, 0, -0.4, 0.6, 0],
         [0, -0.5, 0.2, 0, 0.1, 0.2, 0],
         [0, 0.1, -0.7, 0, 0.3, -0.4, 0],
         [0, 0, 0, 0, 0, 0, 0],
         [0, 0, 0, 0, 0, 0, 0]
     ], heightScale );
     let planeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: showVertices, flatShading: true });
     ground = new THREE.Mesh(planeGeometry, planeMaterial);
     ground.receiveShadow = true;
     ground.castShadow = true;
     ground.rotation.x = -THREE.Math.degToRad(90);
     meshes.push({mesh: ground, materialIndex: 0});
     materials.push(ground.material);
 }
 
 //adds height to a plane
 function addHeight(planeGeometry, points, scale){
     let rows = planeGeometry.parameters.heightSegments+1, cols = planeGeometry.parameters.widthSegments+1;
     heightMap = new Array(rows);
     for (let i = 0; i < rows; ++i) heightMap[i] = new Array(cols);
     for(let y = 1; y <= points.length-3; ++y){
         for(let x = 1; x <= points[y].length-3; ++x){
             let y0 = (rows)/(points.length-3), x0 = (cols)/(points[y].length-3);
             for(let dy = 0; dy < y0; ++dy){
                 for(let dx = 0; dx < x0; ++dx){
                     heightMap[((y-1)*y0)+dy][((x-1)*x0)+dx] = bicubicInterpolation([
                         [ points[y-1][x-1],  points[y-1][x], points[y-1][x+1], points[y-1][x+2] ],
                         [ points[y][x-1],  points[y][x], points[y][x+1], points[y][x+2] ],
                         [ points[y+1][x-1],  points[y+1][x], points[y+1][x+1], points[y+1][x+2] ],
                         [ points[y+2][x-1],  points[y+2][x], points[y+2][x+1], points[y+2][x+2] ]
                     ], dx*(1/x0), dy*(1/y0));
                 }
             }
         }
     }
     let vertices = [].concat.apply([], heightMap);
     for (let i=0; i<planeGeometry.vertices.length; ++i){
         planeGeometry.vertices[i].z = scale * vertices[i];
     }
     planeGeometry.verticesNeedUpdate = true;
 }
 
 //creates trees
 function createTree(data, size, showVertices) {
     let tree = new THREE.Group();
     for (let i = 0; i < data.length; ++i) {
         let spheres = new Array(data.length);
         for (let x = 0; x < data[i].trees; ++x) {
             let geometry = new THREE.SphereGeometry(data[i].radius, 12, 12);
             let material = new THREE.MeshBasicMaterial({ color: 0x009933, wireframe: showVertices, flatShading: true });
             spheres[x] = new THREE.Mesh(geometry, material);
             spheres[x].position.x = 0.75 * data[i].radius;
             spheres[x].position.y = data[i].height;
             rotateAbout(spheres[x], new THREE.Vector3(0, data[i].height, 0), new THREE.Vector3(0, 1, 0), THREE.Math.degToRad((360 / data[i].trees) * x));
             spheres[x].castShadow = true;
             tree.add(spheres[x]);
         }
     }
     let treeTrunkGeometry = new THREE.CylinderGeometry(0.1, 0.1, data[0].height - data[0].radius, 8, 1);
     let trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x4d2600, wireframe: showVertices, flatShading: true });
     let treeTrunk = new THREE.Mesh(treeTrunkGeometry, trunkMaterial);
     treeTrunk.position.y = (data[0].height - data[0].radius)/2;
     treeTrunk.receiveShadow = true;
     treeTrunk.castShadow = true;
     tree.add(treeTrunk);
     tree.scale.set(size, size, size);
     return tree;
 }
 
 //positions trees
 function positionTree(tree, xPos, zPos){
     tree.position.x = xPos;
     tree.position.z = zPos;
     let x = groundAttributes.width/2 + xPos, y = groundAttributes.height/2 + zPos;
     let scaleX = (groundAttributes.widthSegments+1)/groundAttributes.width, scaleY = (groundAttributes.heightSegments+1)/groundAttributes.height;
     let vertexX = Math.floor(x * scaleX), vertexY = Math.floor(y * scaleY);
     let height = heightMap[vertexY][vertexX];
     tree.position.y = height * heightScale;
 }
 
 //creates clouds
 function createCloud(size, cols, rows, showVertices){
     let cloud = new THREE.Group();
     let material = new THREE.MeshBasicMaterial({ color: 0xd9dfe2, wireframe: showVertices, flatShading: true });
     let sphere1Geometry = new THREE.SphereGeometry(0.18, rows, cols);
     let sphere1 = new THREE.Mesh(sphere1Geometry, material);
     sphere1.position.set(0, 0, -0.1);
     sphere1.castShadow = true;
     cloud.add(sphere1);
     let sphere2Geometry = new THREE.SphereGeometry(0.28, rows, cols);
     let sphere2 = new THREE.Mesh(sphere2Geometry, material);
     sphere2.position.set(0, 0, -0.275);
     sphere2.castShadow = true;
     cloud.add(sphere2);
     let sphere3Geometry = new THREE.SphereGeometry(0.28, rows, cols);
     let sphere3 = new THREE.Mesh(sphere3Geometry, material);
     sphere3.position.set(-0.18, 0, -0.4);
     sphere3.castShadow = true;
     cloud.add(sphere3);
     let sphere4Geometry = sphere3Geometry.clone();
     let sphere4 = new THREE.Mesh(sphere4Geometry, material);
     sphere4.position.set(0.18, 0, -0.4);
     sphere4.castShadow = true;
     cloud.add(sphere4);
     let sphere5Geometry = sphere3Geometry.clone();
     let sphere5 = new THREE.Mesh(sphere5Geometry, material);
     sphere5.position.set(-0.18, 0, -0.76);
     sphere5.castShadow = true;
     cloud.add(sphere5);
     let sphere6Geometry = sphere3Geometry.clone();
     let sphere6 = new THREE.Mesh(sphere6Geometry, material);
     sphere6.position.set(0.18, 0, -0.76);
     sphere6.castShadow = true;
     cloud.add(sphere6);
     let sphere7Geometry = new THREE.SphereGeometry(0.28, rows, cols);
     let sphere7 = new THREE.Mesh(sphere7Geometry, material);
     sphere7.position.set(-0.05, 0.15, -0.5);
     sphere7.castShadow = true;
     cloud.add(sphere7);
     let sphere8Geometry = new THREE.SphereGeometry(0.35, rows, cols);
     let sphere8 = new THREE.Mesh(sphere8Geometry, material);
     sphere8.position.set(0.05, 0.15, -0.63);
     sphere8.castShadow = true;
     cloud.add(sphere8);
     let sphere9Geometry = new THREE.SphereGeometry(0.25, rows, cols);
     let sphere9 = new THREE.Mesh(sphere9Geometry, material);
     sphere9.position.set(0, 0, -0.985);
     sphere9.castShadow = true;
     cloud.add(sphere9);
     cloud.scale.set(size, size, size);
     return cloud;
 }
 
 //creates poles for the parrot to fly through
 function createPole(gap, innerRadius, showVertices = false){
     let lowerPole1 = new THREE.CylinderBufferGeometry(innerRadius, innerRadius, 100, 12, 1);
     let lowerPole2 = new THREE.CylinderBufferGeometry(1.5*innerRadius, 1.5*innerRadius, 0.75*innerRadius, 18, 1);
     let higherPole1 = new THREE.CylinderBufferGeometry(innerRadius, innerRadius, 100, 12, 1);
     let higherPole2 = new THREE.CylinderBufferGeometry(1.5*innerRadius, 1.5*innerRadius, 0.75*innerRadius, 18, 1);
     if (planes.length === 0){
         planes.push({z0: -innerRadius/2, z1: innerRadius/2, y0: -10, y1: -gap/2});
         planes.push({z0: -(1.5*innerRadius)/2, z1: (1.5*innerRadius)/2, y0: (-gap/2)-(0.75*innerRadius), y1: -gap/2});
         planes.push({z0: -innerRadius/2, z1: innerRadius/2, y0: gap/2, y1: 10});
         planes.push({z0: -(1.5*innerRadius)/2, z1: (1.5*innerRadius)/2, y0: gap/2, y1: (gap/2)+(0.75*innerRadius)});
     }
     lowerPole1.applyMatrix(new THREE.Matrix4().makeTranslation(0, -gap/2-lowerPole1.parameters.height/2, 0));
     lowerPole2.applyMatrix(new THREE.Matrix4().makeTranslation(0, -gap/2-lowerPole2.parameters.height/2, 0));
     higherPole1.applyMatrix(new THREE.Matrix4().makeTranslation(0, gap/2+higherPole1.parameters.height/2, 0));
     higherPole2.applyMatrix(new THREE.Matrix4().makeTranslation(0, gap/2+higherPole2.parameters.height/2, 0));
     let geometry = THREE.BufferGeometryUtils.mergeBufferGeometries([lowerPole1, lowerPole2, higherPole1, higherPole2]);
     let material = new THREE.MeshBasicMaterial({ color: 0x59ca02, transparent: true, opacity: 1, wireframe: showVertices, flatShading: true });
     return new THREE.Mesh(geometry, material);
 }
 
 //makes the parrot jump
 function jump(){
     if (parrot){
         if (!gameOver) flapSound.play();
         //makes sure the parrot doesn't fly higher than he's supposed to
         if (parrot.position.y <= maxHeight){
             if (acceleration < 0){
                 acceleration *= -2;
                 jumpTimeout = setTimeout(function(){
                     acceleration = -0.2;
                 }, 250);
             } else if(acceleration > 0){
                 clearTimeout(jumpTimeout);
                 jumpTimeout = setTimeout(function(){
                     acceleration = -0.2;
                 }, 250);
             }
         }
         if (tilt < 0){
             tilt = THREE.Math.degToRad(120);
             tiltTimeout = setTimeout(function(){
                 tilt = THREE.Math.degToRad(-30);
             }, 250);
         } else if(tilt > 0){
             clearTimeout(tiltTimeout);
             tiltTimeout = setTimeout(function(){
                 tilt = THREE.Math.degToRad(-30);
             }, 250);
         }
     }
 }
 
 //collision detection
 function collisionDetection(obj){
     let keyPoints = [], regions = [];
     let vecUp = up.clone().applyMatrix4(new THREE.Matrix4().makeRotationX(parrot.rotation.x - orgTilt));
     let vecDown = down.clone().applyMatrix4(new THREE.Matrix4().makeRotationX(parrot.rotation.x - orgTilt));
     let vecFront = front.clone().applyMatrix4(new THREE.Matrix4().makeRotationX(parrot.rotation.x - orgTilt));
     keyPoints.push({
         y: vecUp.y + parrot.position.y,
         z: vecUp.z + parrot.position.z
     });
     keyPoints.push({
         y: vecDown.y + parrot.position.y,
         z: vecDown.z + parrot.position.z
     });
     keyPoints.push({
         y: vecFront.y + parrot.position.y,
         z: vecFront.z + parrot.position.z
     });
     planes.forEach(function(item){
         let region = Object.assign({}, item);
         regions.push({
             y0: region.y0 + obj.position.y,
             z0: region.z0 + obj.position.z,
             y1: region.y1 + obj.position.y,
             z1: region.z1 + obj.position.z
         });
     });
     for (let i = 0; i < keyPoints.length; ++i){
         for (let j = 0; j < regions.length; ++j){
             if (keyPoints[i].y > regions[j].y0 && keyPoints[i].y < regions[j].y1 && keyPoints[i].z > regions[j].z0 && keyPoints[i].z < regions[j].z1) return true;
         }
     }
     return false;
 }
 
 //courtesy of Lee Stemkoski - http://stemkoski.github.io/Three.js/Collision-Detection.html
 //this approach (which, for the record, is the most accurate) had a massive hit on performance, so I had to avoid it
 //this is because the mesh on which we need to test collision has well over 2,000 polygons
 function collisionDetectionTheRightWay(){
     for (let vertexIndex = 0; vertexIndex < parrotVertices.length; ++vertexIndex){
         let localVertex = parrotVertices[vertexIndex].clone();
         let globalVertex = localVertex.applyMatrix4(parrotMatrix);
         let directionVector = globalVertex.sub(parrot.position);
         let ray = new THREE.Raycaster(parrot.position, directionVector.clone().normalize());
         let collisionResults = ray.intersectObjects([pole1, pole2]);
         if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length){
             return true;    //collided
         }
     }
     return false;
 }
 
 //game loop
 function update(){
     stats.begin();
     delta = clock.getDelta();
     if (!gameOver){
         landscapePool.forEach(function(item, index){
             let prevIndex = index === 0 ? landscapePool.length - 1 : index - 1;
             if (item.position.z >= 10) item.position.z = landscapePool[prevIndex].position.z - 10;
             item.position.z += speed*delta;    //makes game speed consistent regardless of framerate
         });
         pole1.position.z += speed*delta;
         pole2.position.z += speed*delta;
         if (parrot) {
             //makes parrot fly
             if (parrot.position.y > 0){
                 let coeff = Math.abs((maxHeight - parrot.position.y)/maxHeight);
                 parrot.position.y += (acceleration + 0.5*coeff*acceleration) * delta;
                 if (parrot.rotation.x >= orgTilt + THREE.Math.degToRad(minTilt) && parrot.rotation.x <= orgTilt + THREE.Math.degToRad(maxTilt)){
                     parrot.rotation.x += tilt * delta;
                 } else if (parrot.rotation.x < orgTilt + THREE.Math.degToRad(minTilt)){
                     if (tilt > 0) parrot.rotation.x += tilt * delta;
                 } else if (parrot.rotation.x > orgTilt + THREE.Math.degToRad(maxTilt)){
                     if (tilt < 0) parrot.rotation.x += tilt * delta;
                 }
             } else{ //if the parrot falls
                 gameOver = true;
                 hitSound.play();
                 restartGame();
             }
             //spawns poles
             if (pole1.position.z >= parrot.position.z && pole2.position.z >= parrot.position.z){
                 let min = gap, max = maxHeight - gap;
                 if (pole1.position.z > pole2.position.z){
                     pole1.position.z = parrot.position.z - 5;
                     pole1.position.y = Math.random() * (max - min) + min;
                     pole1.material.opacity = 1;
                     pole2.material.opacity = 0.33;
                 } else {
                     pole2.position.z = parrot.position.z - 5;
                     pole2.position.y = Math.random() * (max - min) + min;
                     pole2.material.opacity = 1;
                     pole1.material.opacity = 0.33;
                 }
                 scoreSound.play();
                 score++;
                 scoreLabel.innerText = 'Score: ' + score.toString();
             }
             //collision detection
             if (collisionDetection(pole1) || collisionDetection(pole2)){
                 dRot = parrot.rotation.x
                 yMax = parrot.position.y;
                 metalSound.play();
                 gameOver = true;
                 collided = true;
             }
         }
         glow.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, glow.position);
         if (mixer) mixer.update(delta);
     } else{
         if (collided){
             if (dZ < zMax){
                 z = (speed/1.25)*delta;
                 dZ += z;
                 parrot.position.z += z;
                 parrot.position.y = yMax * Math.cos((dZ/zMax)*THREE.Math.degToRad(90));    //makes the parrot fall backwards
                 parrot.rotation.x -= (z/zMax) * dRot;
                 camera.position.z += 0.01*speed;
             } else{
                 //animation ended
                 hitSound.play();
                 restartGame();
             }
         }
     }
     renderer.render(scene, camera);
     //console.log(renderer.info.render.calls);
     stats.end();
     requestAnimationFrame(update);
 }
 
 
 //resizes and aligns
 function onWindowResize() {
     sceneHeight = window.innerHeight;
     sceneWidth = window.innerWidth;
     renderer.setSize(sceneWidth, sceneHeight);
     camera.aspect = sceneWidth / sceneHeight;
     camera.updateProjectionMatrix();
 }
 
 //utility functions
 //cubic interpolation
 function cubicInterpolation(p, x){
     //constants
     let a = 1.5*(p[1] - p[2]) + 0.5*(p[3] - p[0]);
     let b = p[0] - 2.5*p[1] + 2*p[2] - 0.5*p[3];
     let c = 0.5*(p[2] - p[0]);
     let d = p[1];
     return a*Math.pow(x, 3) + b*Math.pow(x, 2) + c*x + d;    //third order polynomial
 }
 
 //bicubic interpolation
 function bicubicInterpolation(p, x, y){
     let arr = [];
     arr.push(cubicInterpolation(p[0], x));
     arr.push(cubicInterpolation(p[1], x));
     arr.push(cubicInterpolation(p[2], x));
     arr.push(cubicInterpolation(p[3], x));
     return cubicInterpolation(arr, y);
 }
 
 //rotates objects a given point - pivot and axis expressed in vector form, angle in radians
 function rotateAbout(obj, pivot, axis, theta){
     obj.position.sub(pivot);    //remove the offset
     obj.position.applyAxisAngle(axis, theta);   //rotate the position
     obj.position.add(pivot);    //re-add the offset
     obj.rotateOnAxis(axis, theta);  //rotate the object
 }
 
 //eventlistener(s)
 document.addEventListener('keypress', keyPressHandler, false);
 document.addEventListener('touchstart', handleTouchStart, false);
 
 //event handler(s)
 //space bar(computer)
 function keyPressHandler(e) {
     if (e.keyCode == 32) {
         jump();
     }
 }
 
 //touchstart (mobile)
 function handleTouchStart(evt) {
     jump();
 }
 ///////////////////////////
 /* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/