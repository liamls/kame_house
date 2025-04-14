import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import waterVertexShader from './shaders/water/vertex.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'

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
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.colorSpace = THREE.SRGBColorSpace
bakedTexture.flipY = false

// Material

const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })


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

debugObject.nearColor = '#046dac'
debugObject.farColor = '#304270'

const waterGeometry = new THREE.PlaneGeometry(100, 100, 512, 512)
const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms: {
        uTime: { value: 0.0 },
        uWaveSpeed: { value: 1.1 },
        uWaveAmplitude: { value: 0.2 },
        uColorNear: { value: new THREE.Color(debugObject.nearColor) },
        uColorFar: { value: new THREE.Color(debugObject.farColor) },
        uTextureSize: { value: 20.0 },
    },
    transparent: true,
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
controls.minPolarAngle = Math.PI / 3 // 90 degrés en radians
controls.maxPolarAngle = Math.PI / 3 // 90 degrés en radians

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