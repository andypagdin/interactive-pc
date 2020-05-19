import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Case from '../assets/models/case.glb'
import Fan from '../assets/models/fan.glb'
import Anime from 'animejs'

const scene = new THREE.Scene()
const interactableObjects = []
let INTERSECTED
let DISPLAY_POSITION

const defaultObjProps = {
  Default: {
    title: 'Keep going!',
    description: 'Click on another component to learn about it'
  },
  RearFan: {
    title: 'Rear Fan',
    description: 'Fans are used to draw cooler air into the case from the outside, expel warm air from inside and move air across a heat sink to cool a particular component.',
    position: { x: -652, y: 122, z: 36 },
    rotation: { x: 0, y: 9.4, z: 4.7 }
  }
}
const displayPositionProps = {
  position: { x: 0, y: 100, z: 0 },
  rotation: { y: 15.7 }
}

// Elements
const root = document.getElementById('root')
const body = document.getElementsByTagName('body')[0]
const toggleFanBtn = document.getElementById('toggle-fans')
const title = document.getElementById('title')
const description = document.getElementById('description')

// Raycaster
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Animations
let fanBladesAnimation
let toDisplayAnimation
let onDisplayAnimation

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true })
renderer.setClearColor(0xecf0f1)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputEncoding = THREE.sRGBEncoding
root.appendChild(renderer.domElement)

// Camera
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1000)
const cameraPos = new THREE.Vector3(1, 0.6, 2)
scene.add(camera)

// Lights
const light = new THREE.HemisphereLight(0xffffff, 0x222222, 1.2)
scene.add(light)

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

  object.position.set(
    -modelCenter.x - 450,
    -modelCenter.y,
    -modelCenter.z
  )
  camera.position.set(
    modelSize * cameraPos.x,
    modelSize * cameraPos.y,
    modelSize * cameraPos.z
  )
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
  object.name = "RearFan"

  // Position into default position
  object.scale.set(40, 40, 40)
  object.rotation.set(
    defaultObjProps.RearFan.rotation.x,
    defaultObjProps.RearFan.rotation.y,
    defaultObjProps.RearFan.rotation.z
  )
  object.position.set(
    defaultObjProps.RearFan.position.x,
    defaultObjProps.RearFan.position.y,
    defaultObjProps.RearFan.position.z
  )

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
  // fanBladesAnimation.pause()
}, undefined, error => {
    console.error(error)
})

const animate = () => {
  requestAnimationFrame(animate)
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
  fanBladesAnimation.paused ? fanBladesAnimation.play() : fanBladesAnimation.pause()
}

const onMouseMove = event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1
}

const onClick = () => {
  // Ignore clicks if there is an animation in progress
  if (toDisplayAnimation && !toDisplayAnimation.completed) return

  // Display clicked objects details
  if (INTERSECTED) {
    const parent = INTERSECTED.parent

    title.innerHTML = defaultObjProps[parent.name].title
    description.innerHTML = defaultObjProps[parent.name].description

    // If the object is in its default position, move it into display position
    // otherwise move it back to its default position
    if (parent.position.x === defaultObjProps[parent.name].position.x &&
        parent.position.y === defaultObjProps[parent.name].position.y &&
        parent.position.z === defaultObjProps[parent.name].position.z) {
      // If there is already something in display position, move it back
      if (DISPLAY_POSITION) {
        animateToPosition(DISPLAY_POSITION, false, defaultObjProps[DISPLAY_POSITION.name].position, defaultObjProps[DISPLAY_POSITION.name].rotation)
      }
      DISPLAY_POSITION = parent
      // Move to display position
      animateToPosition(parent, true, displayPositionProps.position, displayPositionProps.rotation)
    } else {
      // If you click the object currently in display position, move it back to default position
      DISPLAY_POSITION = null
      animateToPosition(parent, false, defaultObjProps[parent.name].position, defaultObjProps[parent.name].rotation)
      resetContent()
    }
  } else {
    resetContent()
    // If there are any models in display position, move them back
    if (DISPLAY_POSITION) {
      animateToPosition(DISPLAY_POSITION, false, defaultObjProps[DISPLAY_POSITION.name].position, defaultObjProps[DISPLAY_POSITION.name].rotation)
      DISPLAY_POSITION = null
    }
  }
}

const animateToPosition = (target, loopRotation, position, rotation) => {
  toDisplayAnimation = Anime.timeline({
    targets: target.position,
    easing: 'easeOutSine',
    duration: 500
  })

  // Coming out to display position
  if (loopRotation) {
    toDisplayAnimation.add({
      z: 200,
    }).add({
      z: position.z,
      x: position.x,
      y: position.y
    })
    window.setTimeout(() => {
      onDisplayAnimation = Anime({
        targets: target.rotation,
        y: rotation.y,
        easing: 'linear',
        loop: true,
        duration: 3000
      })
    }, 800)
  // Going back into case
  } else {
    toDisplayAnimation.add({
      z: 200,
      x: position.x,
      y: position.y
    }).add({
      z: position.z
    })
    onDisplayAnimation.pause()
    onDisplayAnimation = Anime({
      targets: target.rotation,
      y: rotation.y,
      easing: 'linear',
      duration: 500
    })
  }
}

const resetContent = () => {
  title.innerHTML = defaultObjProps['Default'].title
  description.innerHTML = defaultObjProps['Default'].description
}

const setChildrenHex = (children, colour) => {
  body.style = (colour === 0) ? 'cursor: default' : 'cursor: pointer'
  for (let i = 0; i < children.length; i++) {
    children[i].material.emissive.setHex(colour)
  }
}

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// Event listeners
toggleFanBtn.addEventListener('click', toggleFans, false)
window.addEventListener('mousemove', onMouseMove, false)
window.addEventListener('click', onClick, false)
window.addEventListener('resize', onWindowResize, false)

animate()
