import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Case from '../assets/models/case.glb'
import Fan from '../assets/models/fan.glb'
import Anime from 'animejs'

const scene = new THREE.Scene()
const interactableObjects = []
let INTERSECTED

// Elements
const root = document.getElementById('root')
const body = document.getElementsByTagName('body')[0]
const toggleFanBtn = document.getElementById('toggle-fans')

// Raycaster
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Animations
let fanBladesAnimation

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true })
renderer.setClearColor(0x5ae8d0)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputEncoding = THREE.sRGBEncoding
root.appendChild(renderer.domElement)

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
const cameraPos = new THREE.Vector3(1, 0.2, 0.7)
scene.add(camera)

// Lights
const light = new THREE.HemisphereLight(0xffffff, 0x222222, 1.2)
scene.add(light)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.update()

const loader = new GLTFLoader()

// Load Case
loader.load(Case, gltf => {
  let object = gltf.scene
  object.name = 'Case'

  // Reposition the camera and object into the center of the scene
  object.updateMatrixWorld()
  const boundingBox = new THREE.Box3().setFromObject(object)
  const modelSizeVec3 = new THREE.Vector3()
  boundingBox.getSize(modelSizeVec3)
  const modelSize = modelSizeVec3.length()
  const modelCenter = new THREE.Vector3()
  boundingBox.getCenter(modelCenter)

  object.position.x = -modelCenter.x
  object.position.y = -modelCenter.y
  object.position.z = -modelCenter.z
  camera.position.copy(modelCenter)
  camera.position.x += modelSize * cameraPos.x
  camera.position.y += modelSize * cameraPos.y
  camera.position.z += modelSize * cameraPos.z
  camera.near = modelSize / 100
  camera.far = modelSize * 100
  camera.updateProjectionMatrix()
  camera.lookAt(modelCenter)

  scene.add(object)
}, undefined, error => {
  console.error(error)
})

// Load Fan
loader.load(Fan, gltf => {
  let object = gltf.scene
  object.name = 'RearFan'

  // Position into default position
  object.scale.set(40, 40, 40)
  object.rotation.set(0, 9.4, 4.7)
  object.position.set(-202, 122, 36)

  interactableObjects.push(object)
  scene.add(object)

  // Animate fan blades
  fanBladesAnimation = Anime({
    targets: scene.getObjectByName('Fan_Blades').rotation,
    y: 12.5,
    easing: 'linear',
    loop: true,
    duration: 2500,
  })
}, undefined, error => {
    console.error(error)
})

const animate = () => {
  requestAnimationFrame(animate)
  controls.update()
  render()
}

const render = () => {
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(interactableObjects, true)

  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) {
        setChildrenHex(INTERSECTED.parent.children, INTERSECTED.currentHex)
      }

      INTERSECTED = intersects[0].object
      INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex()

      setChildrenHex(INTERSECTED.parent.children, 0xff0000)
    }
  } else {
    if (INTERSECTED) {
      setChildrenHex(INTERSECTED.parent.children, INTERSECTED.currentHex)
    }

    INTERSECTED = null
  }

  renderer.render(scene, camera)
}

const toggleFans = () => {
  if (fanBladesAnimation.paused) {
    fanBladesAnimation.play()
  } else {
    fanBladesAnimation.pause()
  }
}

const onMouseMove = event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
}

const setChildrenHex = (children, colour) => {
  body.style = (colour === 0) ? 'cursor: default' : 'cursor: pointer'
  for (let i = 0; i < children.length; i++) {
    children[i].material.emissive.setHex(colour)
  }
}

// Event listeners
toggleFanBtn.addEventListener('click', toggleFans, false)
window.addEventListener('mousemove', onMouseMove, false)

animate()
