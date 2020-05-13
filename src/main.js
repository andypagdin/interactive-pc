import * as THREE from 'three'
// import * as OrbitControls from 'three-orbit-controls'
import GLTFLoader from 'three-gltf-loader'
import Cube from '../assets/models/cube.glb'
import Anime from 'animejs/lib/anime.es.js'

const HEIGHT = 700
const WIDTH = 700

// const Orbit = OrbitControls(THREE)
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(WIDTH, HEIGHT)
document.body.appendChild(renderer.domElement)

// const controls = new Orbit(camera, renderer.domElement)

const light = new THREE.AmbientLight(0x404040, 5)
scene.add(light)

const loader = new GLTFLoader()

loader.load(Cube, function (gltf) {
  console.log(gltf.scene.children[0])
  Anime({
    targets: gltf.scene.children[0].rotation,
    y: 5,
    x: 5,
    easing: 'linear',
    loop: true,
    direction: 'alternate',
    duration: 10000,
  })
  scene.add(gltf.scene.children[0])
}, undefined, function (error) {
  console.error(error)
})

camera.position.z = 5
// controls.update()

function animate() {
  requestAnimationFrame(animate)
  // controls.update()
  renderer.render(scene, camera)
}

animate()
