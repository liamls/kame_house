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
    farColor: '#b3d7fb'
}

// Canvas, textures et matériaux
const textureLoader = new THREE.TextureLoader()
const bakedDayTexture = textureLoader.load('baked-day.jpg')
const bakedNightTexture = textureLoader.load('baked.jpg')
bakedDayTexture.colorSpace = THREE.SRGBColorSpace
bakedNightTexture.colorSpace = THREE.SRGBColorSpace
bakedDayTexture.flipY = false
bakedNightTexture.flipY = false

const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedDayTexture })

// GLTF Loader pour la scène
const gltfLoader = new GLTFLoader()
gltfLoader.load('kame.glb', (gltf) => {
    gltf.scene.traverse((child) => child.material = bakedMaterial)
    scene.add(gltf.scene)
})

// Paramètres de l'eau
const waterGeometry = new THREE.PlaneGeometry(120, 120, 512, 512)
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
water.position.y = 1.3
scene.add(water)

// Interface utilisateur pour le contrôle des couleurs de l'eau
gui.addColor(debugObject, 'nearColor').onChange(() => waterMaterial.uniforms.uColorNear.value.set(debugObject.nearColor))
gui.addColor(debugObject, 'farColor').onChange(() => waterMaterial.uniforms.uColorFar.value.set(debugObject.farColor))

/**
 * Configuration de la caméra
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000)
camera.position.set(-2, 12, 18)
scene.add(camera)

// Contrôles
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.minPolarAngle = Math.PI / 3
controls.maxPolarAngle = Math.PI / 3
controls.enableZoom = false
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

const soundDay = new THREE.Audio(listener)
const soundNight = new THREE.Audio(listener)

const audioLoader = new THREE.AudioLoader()
audioLoader.load('music.mp3', (buffer) => soundDay.setBuffer(buffer).setLoop(true).setVolume(0.5))
audioLoader.load('ambient.mp3', (buffer) => soundNight.setBuffer(buffer).setLoop(true).setVolume(0.5))

/**
 * Animation
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    waterMaterial.uniforms.uTime.value = elapsedTime
    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()

gui.hide()

/**
 * Fonction de changement de thème (jour/nuit) et musique
 */
const updateThemeAndMusic = () => {
    // Changement de thème
    bakedMaterial.map = isNight ? bakedNightTexture : bakedDayTexture
    debugObject.nearColor = isNight ? '#046dac' : '#0596ed'
    debugObject.farColor = isNight ? '#304270' : '#b3d7fb'
    waterMaterial.uniforms.uColorNear.value.set(debugObject.nearColor)
    waterMaterial.uniforms.uColorFar.value.set(debugObject.farColor)
    bakedMaterial.needsUpdate = true
    // Gestion des sons
    if (!muted) {
        if (isNight) {
            soundDay.stop()
            if (!soundNight.isPlaying) soundNight.play()
        } else {
            soundNight.stop()
            if (!soundDay.isPlaying) soundDay.play()
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
        soundDay.stop()
        soundNight.stop()
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
