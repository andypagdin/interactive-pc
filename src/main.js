import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Cube from '../assets/models/cube.glb'
import Anime from 'animejs/lib/anime.es.js'

const HEIGHT = 700
const WIDTH = 700

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let INTERSECTED

function onMouseMove (event) {
  event.preventDefault()
  mouse.x = ( event.clientX / WIDTH ) * 2 - 1;
	mouse.y = - ( event.clientY / HEIGHT ) * 2 + 1;
}

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(WIDTH, HEIGHT)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const light = new THREE.AmbientLight(0x404040, 5)
scene.add(light)

const loader = new GLTFLoader()

loader.load(Cube, function (gltf) {
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
controls.update()

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  render()
}

function render () {
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(scene.children)

  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) {
        INTERSECTED.material.color.set(INTERSECTED.currentHex)
      }

      INTERSECTED = intersects[0].object
      INTERSECTED.currentHex = INTERSECTED.material.color.getHex()
      INTERSECTED.material.color.set(0xff0000)
    }
  } else {
    if (INTERSECTED) {
      INTERSECTED.material.color.set(INTERSECTED.currentHex)
    }
    INTERSECTED = null
  }

  renderer.render(scene, camera)
}

window.addEventListener('mousemove', onMouseMove, false)

animate()
