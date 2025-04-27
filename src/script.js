import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import waterVertexShader from './shaders/water/vertex.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'

/**
 * Setup de base
 */
const toggleDayButton = document.getElementById('toggleTheme')
const toggleMusicButton = document.getElementById('toggleMusic')
let isNight = false
let muted = true

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

// Debug
const gui = new GUI({ width: 300 })
const debugObject = {
    nearColor: '#0596ed',
    farColor: '#b3d7fb',
    skyColor: "#aDD8e6"
}

// Canvas, textures et matériaux
const textureLoader = new THREE.TextureLoader()
const starTexture = textureLoader.load("/textures/star.png")
const bakedDayTexture = textureLoader.load('/textures/baked-day.jpg')
const bakedNightTexture = textureLoader.load('/textures/baked-night.jpg')
bakedDayTexture.colorSpace = THREE.SRGBColorSpace
bakedNightTexture.colorSpace = THREE.SRGBColorSpace
bakedDayTexture.flipY = false
bakedNightTexture.flipY = false

const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedDayTexture })
const cloudMaterial = new THREE.MeshBasicMaterial({
    color: "#f7d87c",
    transparent: true,
    opacity: 0.95,
})

// GLTF Loader pour la scène
const gltfLoader = new GLTFLoader()
let cloud;
gltfLoader.load('/models/cloud.glb', (gltf) => {
    cloud = gltf.scene
    cloud.traverse((child) => {
        if (child.isMesh) {
            child.material = cloudMaterial
        }
    })
    cloud.scale.set(0.3, 0.3, 0.3)
    cloud.position.set(-2, 2, -2)
    cloud.rotation.y = Math.PI / 6
    scene.add(cloud)
})

gltfLoader.load('/models/kame.glb', (gltf) => {
    gltf.scene.traverse((child) => child.material = bakedMaterial)
    scene.add(gltf.scene)
})

// Ciel

const skyGeometry = new THREE.SphereGeometry(200)
const skyMaterial = new THREE.MeshBasicMaterial({ color: debugObject.skyColor, side: THREE.BackSide })
const sky = new THREE.Mesh(skyGeometry, skyMaterial)
scene.add(sky)
const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    transparent: true,
    opacity: 0.8,
    alphaMap: starTexture,
    depthWrite: false
});
const starGeometry = new THREE.BufferGeometry();
const starCount = 10000;
const starPositions = [];
for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 190;
    const x = Math.sin(phi) * Math.cos(theta) * radius;
    const y = Math.sin(phi) * Math.sin(theta) * radius;
    const z = Math.cos(phi) * radius;
    starPositions.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
stars.visible = false
scene.add(stars);

// Paramètres de l'eau
const waterGeometry = new THREE.CircleGeometry(200, 256);
const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms: {
        uTime: { value: 0.0 },
        uWaveSpeed: { value: 1.05 },
        uWaveAmplitude: { value: 0.1 },
        uColorNear: { value: new THREE.Color(debugObject.nearColor) },
        uColorFar: { value: new THREE.Color(debugObject.farColor) },
        uTextureSize: { value: 20.0 },
    },
    transparent: true,
    opacity: 0.95
})
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x = -Math.PI / 2
water.position.y = 0.5
scene.add(water)

// Interface utilisateur pour le contrôle des couleurs de l'eau
gui.addColor(debugObject, 'nearColor').onChange(() => waterMaterial.uniforms.uColorNear.value.set(debugObject.nearColor))
gui.addColor(debugObject, 'farColor').onChange(() => waterMaterial.uniforms.uColorFar.value.set(debugObject.farColor))
gui.addColor(debugObject, 'skyColor').onChange(() => waterMaterial.uniforms.uColorFar.value.set(debugObject.skyColor))

/**
 * Configuration de la caméra
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000)
camera.position.set(-8, 12, 18)
scene.add(camera)

// Contrôles
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.minPolarAngle = Math.PI / 3
controls.maxPolarAngle = Math.PI / 2.1
controls.enableZoom = true
controls.minDistance = 10
controls.maxDistance = 30
controls.enablePan = false

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Musique et sons
 */
const listener = new THREE.AudioListener()
camera.add(listener)

const musicDay = new THREE.Audio(listener)
const waves = new THREE.Audio(listener)
const insects = new THREE.Audio(listener)
const cloudEffect = new THREE.Audio(listener)

const audioLoader = new THREE.AudioLoader()
audioLoader.load('sounds/day_music.mp3', (buffer) => musicDay.setBuffer(buffer).setLoop(true).setVolume(0.5))
audioLoader.load('sounds/waves.mp3', (buffer) => waves.setBuffer(buffer).setLoop(true).setVolume(0.3))
audioLoader.load('sounds/insects.mp3', (buffer) => insects.setBuffer(buffer).setLoop(true).setVolume(0.3))
audioLoader.load('sounds/cloud.mp3', (buffer) => cloudEffect.setBuffer(buffer).setVolume(0.5))

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
directionalLight.position.set(5, 100, 7.5)
scene.add(directionalLight)
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

// Click handles

let isMoving = false;
let isMovingBack = true;
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

const moveCloud = () => {
    if (cloud) {
        if (cloud.position.x > 100) {
            isMoving = false;
            cloud.position.x = -100
            isMovingBack = true
        }
        cloud.position.x += 0.95
    }

};

const moveBackCloud = () => {
    if (cloud) {
        if (cloud.position.x > -2) {
            isMovingBack = false;
            cloud.rotation.y = Math.PI / 6
        }
        cloud.position.x += 0.95
    }
};

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = - (event.clientY / sizes.height) * 2 + 1;
});

window.addEventListener('click', () => {
    if (cloud && !isMoving && !isMovingBack) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(cloud, true);
        if (intersects.length > 0) {
            console.log('Clic sur le nuage');
            cloudEffect.play()
            cloud.rotation.y = Math.PI / 2
            isMoving = true;
        }
    }
});

/**
 * Animation
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    if (isMoving) {
        moveCloud();
    }
    if (isMovingBack) {
        moveBackCloud();
    }
    waterMaterial.uniforms.uTime.value = elapsedTime;
    if (cloud) {
        cloud.position.y = 5 + (Math.cos(elapsedTime) / 5);
        const scaleFactor = 1 + 0.05 * Math.sin(elapsedTime);
        cloud.scale.set(0.3 * scaleFactor, 0.3 * scaleFactor, 0.3 * scaleFactor);
    }
    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

tick();
gui.hide();

/**
 * Fonction de changement de thème (jour/nuit) et musique
 */
const updateThemeAndMusic = () => {
    stars.visible = isNight ? true : false;
    bakedMaterial.map = isNight ? bakedNightTexture : bakedDayTexture
    debugObject.nearColor = isNight ? '#046dac' : '#0596ed'
    debugObject.farColor = isNight ? '#304270' : '#b3d7fb'
    debugObject.skyColor = isNight ? "#080821" : "#aDD8e6"
    if (cloud) {
        cloud.visible = !isNight
    }
    waterMaterial.uniforms.uColorNear.value.set(debugObject.nearColor)
    waterMaterial.uniforms.uColorFar.value.set(debugObject.farColor)
    skyMaterial.color.set(debugObject.skyColor)
    bakedMaterial.needsUpdate = true
    // Gestion des sons
    if (!muted) {
        waves.play()
        if (isNight) {
            musicDay.stop()
            insects.play()
        } else {
            insects.stop()
            musicDay.play()
        }
    }
}

/**
 * Gestion des événements
 */
toggleDayButton.addEventListener('click', () => {
    isNight = !isNight
    toggleDayButton.textContent = isNight ? '🌙' : '🌞'
    updateThemeAndMusic()
})

toggleMusicButton.addEventListener('click', () => {
    muted = !muted
    toggleMusicButton.textContent = muted ? '🔇' : '🎵'
    if (muted) {
        musicDay.stop()
        insects.stop()
        waves.stop()
    } else {
        updateThemeAndMusic()
    }
})

// Gestion du redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})



window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader')
        loader.style.display = 'none'
        const buttons = document.querySelectorAll("button")
        buttons.forEach((el) => {
            el.style.visibility = "visible"
        })
    }, 1500)
})

const toggleInfoButton = document.getElementById('toggleInfo');
const infoDialog = document.getElementById('infoDialog');
const closeDialogButton = document.getElementById('closeDialog');

toggleInfoButton.addEventListener('click', () => {
    infoDialog.style.display = 'flex';
});
closeDialogButton.addEventListener('click', () => {
    infoDialog.style.display = 'none';
});
infoDialog.addEventListener('click', (event) => {
    if (event.target === infoDialog) {
        infoDialog.style.display = 'none';
    }
});