import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import waterVertexShader from './shaders/water/vertex.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'
import { cubeMapNode } from 'three/src/nodes/utils/CubeMapNode.js'
// Theme toggle
const toggleButton = document.getElementById('toggleTheme')
let isNight = false

/**
 * Base
 */
// Debug
const gui = new GUI({
    width: 300
})
const debugObject = {}
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()
const bakedDayTexture = textureLoader.load('baked-day.jpg')
const bakedNightTexture = textureLoader.load('baked.jpg')
bakedDayTexture.colorSpace = THREE.SRGBColorSpace
bakedDayTexture.flipY = false
bakedNightTexture.colorSpace = THREE.SRGBColorSpace
bakedNightTexture.flipY = false

// Material

const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedDayTexture })

// GLTF loader
const gltfLoader = new GLTFLoader()

gltfLoader.load('kame.glb', (gltf) => {
    gltf.scene.traverse((child) => {
        child.material = bakedMaterial
    })
    scene.add(gltf.scene)
})

/**
 * Object
 */

debugObject.nearColor = '#0596ed'
debugObject.farColor = '#b3d7fb'

const waterGeometry = new THREE.PlaneGeometry(100, 100, 512, 512)
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
});

const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x = -Math.PI / 2
water.position.y = 1.3
scene.add(water)

gui.addColor(debugObject, 'nearColor').onChange(() => { waterMaterial.uniforms.uColorNear.value.set(debugObject.nearColor) })
gui.addColor(debugObject, 'farColor').onChange(() => { waterMaterial.uniforms.uColorFar.value.set(debugObject.farColor) })

/** 
* Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000)
camera.position.x = -2
camera.position.y = 9
camera.position.z = 15
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.minPolarAngle = Math.PI / 3
controls.maxPolarAngle = Math.PI / 3
controls.enableZoom = false;
controls.enablePan = false;
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    waterMaterial.uniforms.uTime.value = elapsedTime;
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

gui.hide()

toggleButton.addEventListener('click', () => {
    isNight = !isNight
    toggleButton.textContent = isNight ? '🌙' : '🌞'
    bakedMaterial.map = isNight ? bakedNightTexture : bakedDayTexture
    debugObject.nearColor = isNight ? '#046dac' : '#0596ed'
    debugObject.farColor = isNight ? '#304270' : '#b3d7fb'
    waterMaterial.uniforms.uColorNear.value.set(debugObject.nearColor)
    waterMaterial.uniforms.uColorFar.value.set(debugObject.farColor)
    bakedMaterial.needsUpdate = true
})
