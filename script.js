import * as THREE from 'three';
import { Raycaster } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';




const textureLoader = new THREE.TextureLoader(); 




let scene, camera, renderer, dino, ground;
let obstacles = [];
let score = 0;
let gameSpeed = 0.1;
let isJumping = false;
let isGameOver = false;


const DINO_SIZE = 1;


const INITIAL_SPEED = 0.1;
const SPEED_INCREMENT = 0.00005;
const MAX_SPEED = 0.5;
const JUMP_FORCE = 0.25; 


const SPAWN_DISTANCE = -30; 
const DESPAWN_DISTANCE = 15; 

let raycaster, mouse;
let hoverSound, jumpSound, deadSound, monsterHoverSound;
let isHovering = false;
let isMonsterHovering = false;

let lastTime = 0;
const fixedDeltaTime = 1/60; 


let mixers = [];

   
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); 

   
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 4, 0);
    camera.lookAt(0, 1, -3  );

  
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

   
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    createGround();
    createDino();
    createPortal();
    leftWall();

   
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown);

   
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

 
    hoverSound = document.getElementById('hover-sound');
    jumpSound = document.getElementById('jump-sound');
    deadSound = document.getElementById('dead-sound');
    monsterHoverSound = document.getElementById('monster-hover-sound');

    
    window.addEventListener('mousemove', onMouseMove);

    
    const jumpButton = document.getElementById('jump-button');
    
   
    jumpButton.addEventListener('touchstart', handleJumpTouch, { passive: false });
    jumpButton.addEventListener('mousedown', handleJumpTouch, { passive: false });
    
   
    document.addEventListener('touchstart', handleRestart, { passive: false });  





    
    const loader = new OBJLoader();
    loader.load(
        './Assets/WallFond.obj', 
        (object) => {
            object.traverse((node) => {
                if (node.isMesh) {
                    const texture = textureLoader.load('./Assets/Textures/RockTexture.jpg'); 
                   // texture.repeat.set(2, 2);  
                   texture.repeat.set(0.005, 0.005);  
                   texture.wrapS = THREE.RepeatWrapping; 
                   texture.wrapT = THREE.RepeatWrapping; 
                  
                    node.material = new THREE.MeshStandardMaterial({
                        map: texture,  
                       // color: new THREE.Color(0x7d7d7d), 
                        roughness: 0.8, 
                       
                    });
                }
            });
            object.scale.setScalar(0.3);
            object.position.set(0, 0, -25); 
            object.rotation.x = -Math.PI / 2; 
            scene.add(object);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded'); 
        },
        (error) => {
            console.error('Une erreur est survenue lors du chargement :', error);
        }
    );
    

    
const loaderG = new GLTFLoader();
let mixer; 

function leftWall() {
    const textureLoader = new THREE.TextureLoader();


    const baseColor = textureLoader.load('./Assets/Portal/Abstract_011_basecolor.jpg');
    const aoMap = textureLoader.load('./Assets/Portal/Abstract_011_ambientOcclusion.jpg');
    const heightMap = textureLoader.load('./Assets/Portal/Abstract_011_height.png');
    const normalMap = textureLoader.load('./Assets/Portal/Abstract_011_normal.jpg');
    const roughnessMap = textureLoader.load('./Assets/Portal/Abstract_011_roughness.jpg');

  
    const scale =2;
    baseColor.repeat.set(scale, scale);
    aoMap.repeat.set(scale, scale);
    heightMap.repeat.set(scale, scale);
    normalMap.repeat.set(scale, scale);
    roughnessMap.repeat.set(scale, scale);

    baseColor.wrapS = THREE.MirroredRepeatWrapping;
    baseColor.wrapT = THREE.MirroredRepeatWrapping;
    aoMap.wrapS = THREE.MirroredRepeatWrapping;
    aoMap.wrapT = THREE.MirroredRepeatWrapping;
    heightMap.wrapS = THREE.MirroredRepeatWrapping;
    heightMap.wrapT = THREE.MirroredRepeatWrapping;
    normalMap.wrapS = THREE.MirroredRepeatWrapping;
    normalMap.wrapT = THREE.MirroredRepeatWrapping;
    roughnessMap.wrapS = THREE.MirroredRepeatWrapping;
    roughnessMap.wrapT = THREE.MirroredRepeatWrapping;

  
    const geometry = new THREE.PlaneGeometry(40, 25);

   
    const material = new THREE.MeshStandardMaterial({
        map: baseColor,
        aoMap: aoMap,
        displacementMap: heightMap,
        displacementScale: 1,
        normalMap: normalMap,
       // roughnessMap: roughnessMap,
      //  roughness: 0.5,
        metalness: 1.0,
        side: THREE.DoubleSide
    });

    
    const leftWall = new THREE.Mesh(geometry, material);
    leftWall.rotation.z = -Math.PI ;
    leftWall.rotation.y = -Math.PI / 2;
    leftWall.position.set(-5, 0, -10);
    scene.add(leftWall);
    return leftWall;
}


function createPortal() {
    const textureLoader = new THREE.TextureLoader();


    const baseColor = textureLoader.load('./Assets/Portal/Abstract_011_basecolor.jpg');
    const aoMap = textureLoader.load('./Assets/Portal/Abstract_011_ambientOcclusion.jpg');
    const heightMap = textureLoader.load('./Assets/Portal/Abstract_011_height.png');
    const normalMap = textureLoader.load('./Assets/Portal/Abstract_011_normal.jpg');
    const roughnessMap = textureLoader.load('./Assets/Portal/Abstract_011_roughness.jpg');


    const scale = 1;
    baseColor.repeat.set(scale, scale);
    aoMap.repeat.set(scale, scale);
    heightMap.repeat.set(scale, scale);
    normalMap.repeat.set(scale, scale);
    roughnessMap.repeat.set(scale, scale);

    baseColor.wrapS = THREE.MirroredRepeatWrapping;
    baseColor.wrapT = THREE.MirroredRepeatWrapping;
    aoMap.wrapS = THREE.MirroredRepeatWrapping;
    aoMap.wrapT = THREE.MirroredRepeatWrapping;
    heightMap.wrapS = THREE.MirroredRepeatWrapping;
    heightMap.wrapT = THREE.MirroredRepeatWrapping;
    normalMap.wrapS = THREE.MirroredRepeatWrapping;
    normalMap.wrapT = THREE.MirroredRepeatWrapping;
    roughnessMap.wrapS = THREE.MirroredRepeatWrapping;
    roughnessMap.wrapT = THREE.MirroredRepeatWrapping;

 
    const geometry = new THREE.PlaneGeometry(10, 10);

    ial
    const material = new THREE.MeshStandardMaterial({
        map: baseColor,
        aoMap: aoMap,
        displacementMap: heightMap,
        displacementScale: 0.01,
        normalMap: normalMap,
       // roughnessMap: roughnessMap,
      //  roughness: 0.5,
        metalness: 1.0,
        side: THREE.DoubleSide
    });

    
    const portal = new THREE.Mesh(geometry, material);
    portal.rotation.z = -Math.PI / 2;
    portal.position.set(0, 0, -27);
    scene.add(portal);

    return portal;
}




function createGround() {
   
    const textureLoader = new THREE.TextureLoader();

   
    const baseColor = textureLoader.load('./Assets/RockMapTest/Stylized_Rocks_003_basecolor.png');
    const aoMap = textureLoader.load('./Assets/RockMapTest/Stylized_Rocks_003_ambientOcclusion.png'); 
    const heightMap = textureLoader.load('./Assets/RockMapTest/Stylized_Rocks_003_height.png'); 
    const normalMap = textureLoader.load('./Assets/RockMapTest/Stylized_Rocks_003_normal.png'); 
    const roughnessMap = textureLoader.load('./Assets/RockMapTest/Stylized_Rocks_003_roughness.png'); 


    const scale = 20 ; 
    baseColor.repeat.set(scale, scale);
    aoMap.repeat.set(scale, scale);
    heightMap.repeat.set(scale, scale);
    normalMap.repeat.set(scale, scale);
    roughnessMap.repeat.set(scale, scale);

    baseColor.wrapS = THREE.MirroredRepeatWrapping;
    baseColor.wrapT = THREE.MirroredRepeatWrapping;
    aoMap.wrapS = THREE.MirroredRepeatWrapping;
    aoMap.wrapT = THREE.MirroredRepeatWrapping;
    heightMap.wrapS = THREE.MirroredRepeatWrapping;
    heightMap.wrapT = THREE.MirroredRepeatWrapping;
    normalMap.wrapS = THREE.MirroredRepeatWrapping;
    normalMap.wrapT = THREE.MirroredRepeatWrapping;
    roughnessMap.wrapS = THREE.MirroredRepeatWrapping;
    roughnessMap.wrapT = THREE.MirroredRepeatWrapping;


    const geometry = new THREE.PlaneGeometry(25, 80);


    const material = new THREE.MeshStandardMaterial({
        map: baseColor,
        aoMap: aoMap,
        displacementMap: heightMap,
        displacementScale: 0.1,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        roughness: 0.5,
        metalness: 0.0,
        side: THREE.DoubleSide
    });


    ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = SPAWN_DISTANCE / 2;
e
    scene.add(ground);
}



function createDino() {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./Assets/Snail/Snail.mtl', (materials) => {
        materials.preload();
    
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
    
        objLoader.load(
            './Assets/Snail/Snail.obj',
            (object) => {
                dino = object;
                
                dino.scale.set(0.5, 0.5, 0.5);
                const initialHeight = 0.30; 
                dino.position.set(0, initialHeight, 0); 
                dino.rotation.y = Math.PI/2;
                 
  
                const box = new THREE.Box3().setFromObject(dino);
                const boxGeometry = new THREE.BoxGeometry(
                    (box.max.x - box.min.x) * 3,
                    (box.max.y - box.min.y) * 2,
                    (box.max.z - box.min.z) * 2
                );
                const boxMaterial = new THREE.MeshBasicMaterial({
                    wireframe: true,
                    visible: false 
                });
                const collisionBox = new THREE.Mesh(boxGeometry, boxMaterial);
                
                collisionBox.position.y = (box.max.y - box.min.y) * 1 ;  

                dino.add(collisionBox);
                dino.userData.collisionBox = collisionBox;
                dino.userData.initialY = initialHeight;
                dino.userData.velocity = 0;
                
                scene.add(dino);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            },
            (error) => {
                console.error('Erreur de chargement du snail:', error);
            }
        );
    });
}



function createObstacle() {
    loaderG.load(
        './Assets/CesiumMan.glb',
        (gltf) => {
            const model = gltf.scene;
            model.position.set(0, 0, SPAWN_DISTANCE);
            model.scale.set(1.25, 1.25, 1.25);
            
      
            const mixer = new THREE.AnimationMixer(model);
            if (gltf.animations.length > 0) {
                const action = mixer.clipAction(gltf.animations[0]);
                action.timeScale = 2.5; 
                action.play();
                mixers.push(mixer);
            }

           
            const texture = textureLoader.load('./Assets/bubl.jpeg');
            model.traverse((node) => {
                if (node.isMesh) {
                    node.material = new THREE.MeshStandardMaterial({
                        map: texture,
                        roughness: 0.7,
                        metalness: 0.3
                    });
                }
            });
            
            
            setTimeout(() => {
                const box = new THREE.Box3().setFromObject(model);
                const boxGeometry = new THREE.BoxGeometry(
                    (box.max.x - box.min.x) * 0.6,
                    (box.max.y - box.min.y) * 0.6,
                    (box.max.z - box.min.z) * 0.6
                );
                const boxMaterial = new THREE.MeshBasicMaterial({
                    wireframe: true,
                    visible: false
                });
                const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
                
                boxMesh.position.y = (box.max.y - box.min.y) / 2;
                
                model.add(boxMesh);
                model.userData.collisionBox = boxMesh;
            }, 100);
            
            scene.add(model);
            obstacles.push(model);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
            console.error('Erreur de chargement du modèle:', error);
        }
    );
}

function jump() {
    if (!isJumping && !isGameOver && dino) {
        isJumping = true;
        dino.userData.velocity = JUMP_FORCE;
        
   
        if (dino.position.y < dino.userData.initialY) {
            dino.position.y = dino.userData.initialY;
        }
        
        jumpSound.currentTime = 0;
        jumpSound.play().catch(e => console.log("Erreur audio:", e));
    }
}
let size = 30; 
let redValue = 0; 

let scoreElement = document.getElementById("score");
function updateGame(deltaTime) {
    if (isGameOver || !dino) return;
    
    score++;
    size += 0.04; 
    redValue = Math.min(255, redValue + 0.05); 
    scoreElement.style.fontSize = size + "px";
    scoreElement.style.color = `rgb(${redValue}, 0, 0)`; 


    document.getElementById('score').textContent = Math.floor(score/10);
    gameSpeed = Math.min(INITIAL_SPEED + (score * SPEED_INCREMENT), MAX_SPEED);


    if (isJumping) {
        dino.position.y += dino.userData.velocity * deltaTime * 60;
        dino.userData.velocity -= 0.01 * deltaTime * 60;

        if (dino.position.y <= 0.5) { 
            dino.position.y = 0.5;  
            isJumping = false;
            dino.userData.velocity = 0;
        }
    }


    if (Math.random() < 0.02 && obstacles.length < 3) {
        const canCreateObstacle = obstacles.length === 0 || 
            obstacles[obstacles.length - 1].position.z > SPAWN_DISTANCE + 10; 

        if (canCreateObstacle) {
            createObstacle();
        }
    }


    obstacles.forEach((obstacle, index) => {
        if (!obstacle) return; 
        
        obstacle.position.z += gameSpeed * deltaTime * 60;
        

        if (obstacle.userData.collisionBox && checkCollision(dino, obstacle)) {
            gameOver();
        }

        if (obstacle.position.z > DESPAWN_DISTANCE) {
            scene.remove(obstacle);
            obstacles.splice(index, 1);
        }
    });
}

function checkCollision(dino, obstacle) {
    if (!dino || !obstacle || !dino.userData.collisionBox || !obstacle.userData.collisionBox) {
        return false;
    }

    try {
        const dinoBox = new THREE.Box3().setFromObject(dino.userData.collisionBox);
        const obstacleBox = new THREE.Box3().setFromObject(obstacle.userData.collisionBox);
        
        return dinoBox.intersectsBox(obstacleBox);
    } catch (error) {
        console.warn("Erreur lors de la vérification des collisions:", error);
        return false;
    }
}

function gameOver() {
    isGameOver = true;
    document.querySelector('.game-over').style.display = 'block';
    

    saveBestScore("Joueur", Math.floor(score/10)); 
   // localStorage.clear();

    const bestScore = localStorage.getItem('bestScore') || 0; 


    document.querySelector('.best-score').textContent = `Meilleur Score: ${bestScore}`;
    
    deadSound.currentTime = 0;
    deadSound.play().catch(e => console.log("Erreur audio:", e));
}


function resetGame() {
    score = 0;
    gameSpeed = 0.1;
    isGameOver = false;
    isJumping = false;
     size = 30; 
    redValue = 0; 
    
  
    dino.position.y = DINO_SIZE/2;
    dino.userData.velocity = 0;

    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];
   
    document.querySelector('.game-over').style.display = 'none';
}

function onKeyDown(event) {
    if (event.code === 'Space') {
        if (isGameOver) {
            resetGame();
        } else {
            jump();
        }
    }
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    

    if (width <= 768) {
        camera.position.set(6, 4, 7); 
        camera.lookAt(0, 1, -2);
    } else {
        camera.position.set(5, 3, 5);
        camera.lookAt(0, 0, 0);
    }
}


//const clock = new THREE.Clock();
function animate(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 1/30);
    

    mixers.forEach((mixer) => {
        mixer.update(deltaTime);
    });
    
    requestAnimationFrame(animate);
    
    
    lastTime = currentTime;
    
    updateGame(deltaTime);
    composer.render();
   // renderer.render(scene, camera);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);


    const dinoIntersects = raycaster.intersectObject(dino);
    const dinoInfo = document.getElementById('dino-info');

    if (dinoIntersects.length > 0) {
        if (!isHovering) {
            hoverSound.currentTime = 0;
            hoverSound.play().catch(e => console.log("Erreur audio:", e));
            isHovering = true;
        }
        dinoInfo.style.display = 'block';
        dinoInfo.style.left = event.clientX + 10 + 'px';
        dinoInfo.style.top = event.clientY + 10 + 'px';
    } else {
        dinoInfo.style.display = 'none';
        isHovering = false;
    }

    const monsterIntersects = raycaster.intersectObjects(obstacles);
    if (monsterIntersects.length > 0) {
        if (!isMonsterHovering) {
            monsterHoverSound.currentTime = 0;
            monsterHoverSound.play().catch(e => console.log("Erreur audio:", e));
            isMonsterHovering = true;
        }
    } else {
        isMonsterHovering = false;
    }
}

function handleJumpTouch(e) {
    e.preventDefault(); 
    if (!isGameOver) {
        jump();
    }
}

function handleRestart(e) {
    if (isGameOver) {
        e.preventDefault();
        resetGame();
    }
}


document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });



function saveBestScore(playerName, score) {
    const currentBestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0;


    if (score > currentBestScore) {
        localStorage.setItem('bestScore', score); 
    }
}



//PostPRocess

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
new THREE.Vector2(window.innerWidth, window.innerHeight),
0.3, 
0.5, 
0.1 
);
const outputPass = new OutputPass();

composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(outputPass); 


const filmPass = new FilmPass(0.35, 0.025, 648, false);

 composer.addPass(filmPass);  


animate();


function removeObstacle(index) {
    const obstacle = obstacles[index];
    scene.remove(obstacle);
    

    mixers = mixers.filter((mixer) => mixer.getRoot() !== obstacle);
    
    obstacles.splice(index, 1);
}




