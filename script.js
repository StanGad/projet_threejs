import * as THREE from 'three';
import { Raycaster } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from './node_modules/three/examples/jsm/loaders/OBJLoader.js';





let scene, camera, renderer, dino, ground;
let obstacles = [];
let score = 0;
let gameSpeed = 0.1;
let isJumping = false;
let isGameOver = false;

const GROUND_WIDTH = 100;
const GROUND_HEIGHT = 100;
const DINO_SIZE = 1;
const OBSTACLE_SIZE = 0.8;

const INITIAL_SPEED = 0.1;
const SPEED_INCREMENT = 0.00005;
const MAX_SPEED = 0.5;
const JUMP_FORCE = 0.25; // Force de saut constante

// Ajout de constantes pour la profondeur
const SPAWN_DISTANCE = -30; // Distance d'apparition des obstacles
const DESPAWN_DISTANCE = 5; // Distance de disparition

let raycaster, mouse;
let hoverSound, jumpSound, deadSound, monsterHoverSound;
let isHovering = false;
let isMonsterHovering = false;

let lastTime = 0;
const fixedDeltaTime = 1/60; // 60 FPS comme référence

function init() {
    // Scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Ciel bleu

    // Caméra
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 3, 5);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    createGround();
    createDino();

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown);

    // Initialisation du raycaster et de la souris
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Initialisation des sons
    hoverSound = document.getElementById('hover-sound');
    jumpSound = document.getElementById('jump-sound');
    deadSound = document.getElementById('dead-sound');
    monsterHoverSound = document.getElementById('monster-hover-sound');

    // Ajout des événements de souris
    window.addEventListener('mousemove', onMouseMove);

    // Gestion des événements tactiles
    const jumpButton = document.getElementById('jump-button');
    
    // Événements pour le bouton de saut
    jumpButton.addEventListener('touchstart', handleJumpTouch, { passive: false });
    jumpButton.addEventListener('mousedown', handleJumpTouch, { passive: false });
    
    // Événement pour le redémarrage
    document.addEventListener('touchstart', handleRestart, { passive: false });

    animate();
}


const loader = new OBJLoader();
loader.load(
    './Assets/WallFond.obj', // Chemin du fichier OBJ
    (object) => {
        object.traverse((node) => {
            if (node.isMesh) {
                node.material = new THREE.MeshNormalMaterial(); // Remplace le matériau par un matériau normal
            }
        });
        object.scale.setScalar(0.2);
        object.position.set(0, 0, -25); // Déplace l'objet à x=1, y=2, z=3
        object.rotation.x = -Math.PI / 2; 
        scene.add(object);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded'); // Progression du chargement
    },
    (error) => {
        console.error('Une erreur est survenue lors du chargement :', error);
    }
);



function createGround() {
    const geometry = new THREE.PlaneGeometry(25, 80); // Augmentation de la profondeur du sol
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x90EE90,
        side: THREE.DoubleSide 
    });
    ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = SPAWN_DISTANCE/2; // Centrer le sol par rapport à la zone de jeu
    scene.add(ground);
}

function createbackGround() {
    const geometry = new THREE.PlaneGeometry(80, 50); // Ajustement du fond
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x90EE90,
        side: THREE.DoubleSide 
    });
    ground = new THREE.Mesh(geometry, material);
    ground.rotation.y = -Math.PI / 2;
    ground.position.set(-5, 0, SPAWN_DISTANCE/2); 
    scene.add(ground);
}

function createDino() {
    const geometry = new THREE.BoxGeometry(DINO_SIZE, DINO_SIZE, DINO_SIZE);
    const material = new THREE.MeshPhongMaterial({ color: 0x535353 });
    dino = new THREE.Mesh(geometry, material);
    dino.position.set(0, DINO_SIZE/2, 0);
    dino.userData.velocity = 0;
    scene.add(dino);
}

function createObstacle() {
    const geometry = new THREE.BoxGeometry(OBSTACLE_SIZE, OBSTACLE_SIZE * 2, OBSTACLE_SIZE);
    const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(0, OBSTACLE_SIZE, SPAWN_DISTANCE); // Apparition plus loin
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function jump() {
    if (!isJumping && !isGameOver) {
        isJumping = true;
        dino.userData.velocity = JUMP_FORCE;
        
        // Jouer le son de saut
        jumpSound.currentTime = 0;
        jumpSound.play().catch(e => console.log("Erreur audio:", e));
    }
}

function updateGame(deltaTime) {
    if (isGameOver) return;

    score++;
    document.getElementById('score').textContent = Math.floor(score/10);
    gameSpeed = Math.min(INITIAL_SPEED + (score * SPEED_INCREMENT), MAX_SPEED);

    // Mettre à jour les positions en fonction du deltaTime
    if (isJumping) {
        dino.position.y += dino.userData.velocity * deltaTime * 60;
        dino.userData.velocity -= 0.01 * deltaTime * 60;

        if (dino.position.y <= DINO_SIZE/2) {
            dino.position.y = DINO_SIZE/2;
            isJumping = false;
            dino.userData.velocity = 0;
        }
    }

    // Création d'obstacles
    if (Math.random() < 0.02 && obstacles.length < 3) {
        const canCreateObstacle = obstacles.length === 0 || 
            obstacles[obstacles.length - 1].position.z > SPAWN_DISTANCE + 10; // Plus grand espacement

        if (canCreateObstacle) {
            createObstacle();
        }
    }

    // Mise à jour des obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.position.z += gameSpeed * deltaTime * 60;

        if (checkCollision(dino, obstacle)) {
            gameOver();
        }

        if (obstacle.position.z > DESPAWN_DISTANCE) {
            scene.remove(obstacle);
            obstacles.splice(index, 1);
        }
    });
}

function checkCollision(dino, obstacle) {
    const dinoBox = new THREE.Box3().setFromObject(dino);
    const obstacleBox = new THREE.Box3().setFromObject(obstacle);
    return dinoBox.intersectsBox(obstacleBox);
}

function gameOver() {
    isGameOver = true;
    document.querySelector('.game-over').style.display = 'block';
    
    // Jouer le son de mort
    deadSound.currentTime = 0;
    deadSound.play().catch(e => console.log("Erreur audio:", e));
}

function resetGame() {
    score = 0;
    gameSpeed = 0.1;
    isGameOver = false;
    isJumping = false;
    
    // Réinitialisation du dino
    dino.position.y = DINO_SIZE/2;
    dino.userData.velocity = 0;
    
    // Suppression des obstacles
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
    
    // Ajuster la position de la caméra pour mobile
    if (width <= 768) {
        camera.position.set(6, 4, 7); // Ajustez ces valeurs selon vos besoins
        camera.lookAt(0, 1, -2);
    } else {
        camera.position.set(5, 3, 5);
        camera.lookAt(0, 0, 0);
    }
}

function animate(currentTime) {
    requestAnimationFrame(animate);
    
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 1/30); // Limite à 30 FPS sur mobile
    lastTime = currentTime;
    
    updateGame(deltaTime);
    renderer.render(scene, camera);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Vérification pour le dinosaure
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

    // Vérification pour les obstacles (monstres)
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
    e.preventDefault(); // Empêche le comportement par défaut
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

// Désactiver le défilement sur mobile
document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

init(); 