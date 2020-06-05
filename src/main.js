import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Case from '../assets/models/case-v2.glb'
import Anime from 'animejs'
import { objectProps, interactableObjNames } from './object-props'
import { createBackground } from '../lib/three-vignette.js'
import './styles.css'

const scene = new THREE.Scene()
const loader = new GLTFLoader()
const interactableObjects = []
let INTERSECTED
let DISPLAY_POSITION
let caseObj = null

// Elements
const root = document.getElementById('root')
const body = document.getElementsByTagName('body')[0]
const toggleFan = document.getElementById('toggle-fan')
const title = document.getElementById('title')
const description = document.getElementById('description')
const interactableObjectsMenu = document.getElementById('interactable-objects-menu')

// Raycaster
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Animations
let fanBladesAnimation
let toDisplayAnimation
let onDisplayAnimation
let midwayAnimation

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setClearColor(0xcccccc)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.physicallyCorrectLights = true
root.appendChild(renderer.domElement)

// Camera
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1000)
scene.add(camera)

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.3)
camera.add(ambient)

const directional = new THREE.DirectionalLight(0xffffff, 2.5)
directional.position.set(0.5, 0, 0.866)
camera.add(directional)

// Mouse
let mouseDown = false
let mouseX = 0
let mouseY = 0

// Vignette
const vignette = createBackground({
  aspect: camera.aspect,
  grainScale: 0.001,
  colors: ['#ffffff', '#353535']
})
vignette.name = 'Vignette'
scene.add(vignette)

// Display Group
const displayGroup = new THREE.Group()
displayGroup.position.set(2.5, 0, 0)
displayGroup.rotation.y = -3.4
scene.add(displayGroup)

// Midway Group - Acts as a waypoint for objects coming in and out of the case to make sure they lift out of the case
// before moving to and from the display position
const midwayGroupOut = new THREE.Group()
midwayGroupOut.position.set(0, 1.1, -2)
const midwayGroupIn = new THREE.Group()
midwayGroupIn.position.set(0, -0.4, -2)

// Load Case
loader.load(Case, gltf => {
  let object = gltf.scene
  object.name = 'Case'

  const RearFanArr = []
  const RearFanGroup = new THREE.Group()
  RearFanGroup.name = 'RearFan'
  setPosition(RearFanGroup, objectProps.RearFan.position)

  const FrontTopFanArr = []
  const FrontTopFanGroup = new THREE.Group()
  FrontTopFanGroup.name = 'FrontTopFan'
  setPosition(FrontTopFanGroup, objectProps.FrontTopFan.position)

  const FrontBottomFanArr = []
  const FrontBottomFanGroup = new THREE.Group()
  FrontBottomFanGroup.name = 'FrontBottomFan'
  setPosition(FrontBottomFanGroup, objectProps.FrontBottomFan.position)

  const FanBlades = []

  // Loop through all children and add interactable objects
  object.children.forEach(child => {
    if (interactableObjNames.indexOf(child.name) !== -1) {
      if (child.name.indexOf('FrontTop') !== -1) {
        if (child.name.indexOf('Blade') !== -1) {
          FanBlades.push(child.rotation)
        }
        child.position.set(0, 0, 0)
        FrontTopFanArr.push(child)
      } else if (child.name.indexOf('RearFan') !== -1) {
        if (child.name.indexOf('Blade') !== -1) {
          FanBlades.push(child.rotation)
        }
        child.position.set(0, 0, 0)
        RearFanArr.push(child)
      } else if (child.name.indexOf('FrontBottom') !== -1) {
        if (child.name.indexOf('Blade') !== -1) {
          FanBlades.push(child.rotation)
        }
        child.position.set(0, 0, 0)
        FrontBottomFanArr.push(child)
      } else {
        interactableObjects.push(child)
      }
    }
  })

  addArrToGroup(FrontTopFanArr, FrontTopFanGroup)
  addArrToGroup(FrontBottomFanArr, FrontBottomFanGroup)
  addArrToGroup(RearFanArr, RearFanGroup)

  interactableObjects.push(FrontTopFanGroup, RearFanGroup, FrontBottomFanGroup)

  object.add(FrontTopFanGroup)
  object.add(RearFanGroup)
  object.add(FrontBottomFanGroup)
  object.add(midwayGroupIn)
  object.add(midwayGroupOut)

  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3()).length()
  const center = box.getCenter(new THREE.Vector3())

  object.position.set(
    object.position.x += (object.position.x - center.x) - 2.0,
    object.position.y += (object.position.y - center.y) + 0.2,
    object.position.z += (object.position.z - center.z)
  )
  object.rotation.y = -3.4

  camera.position.copy(center)
  camera.position.set(
    camera.position.x += 1,
    camera.position.y += 0,
    camera.position.z += size / 0.57
  )
  camera.lookAt(center)

  // Animate fan blades
  fanBladesAnimation = Anime({
    targets: FanBlades,
    x: THREE.Math.degToRad(360),
    easing: 'linear',
    loop: true,
    duration: 1500,
  })
  fanBladesAnimation.pause()

  caseObj = object
  scene.add(caseObj)
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
      if (INTERSECTED) setHex(INTERSECTED, INTERSECTED.currentHex)

      INTERSECTED = intersects[0].object
      INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex()

      setHex(INTERSECTED, 0xc1c1c1)
    }
  } else {
    if (INTERSECTED) setHex(INTERSECTED, INTERSECTED.currentHex)

    INTERSECTED = null
  }

  renderer.render(scene, camera)
}

const onClick = event => {
  // Ignore clicks if there is an animation in progress
  if (toDisplayAnimation && !toDisplayAnimation.completed ||
      midwayAnimation && !midwayAnimation.completed) {
    return
  }

  // Handle menu item clicks
  if (interactableObjNames.indexOf(event.target.id) !== -1) {
    const menuItemObject = scene.getObjectByName(event.target.id)
    INTERSECTED = menuItemObject.children[0]
  }

  if (INTERSECTED) {
    let object = INTERSECTED.parent

    title.innerHTML = objectProps[object.name].title
    description.innerHTML = objectProps[object.name].description

    // If the object is in its default position, move it into display position
    // otherwise move it back to its default position
    if (Number(object.position.x.toFixed(2)) === objectProps[object.name].position.x &&
        Number(object.position.y.toFixed(2)) === objectProps[object.name].position.y &&
        Number(object.position.z.toFixed(2)) === objectProps[object.name].position.z) {
      // If there is already something in display position, move it back
      if (DISPLAY_POSITION) moveToMidway(DISPLAY_POSITION)

      // Move to display position
      DISPLAY_POSITION = object
    } else {
      // If you click the object currently in display position, move it back to default position
      DISPLAY_POSITION = null
      resetContent()
    }
    moveToMidway(object)
  }
}

const moveToDisplay = (object, props) => {
    displayGroup.attach(object)

    // Rotate object in display position
    let rotateInPlaceAnimation = {
      targets: object.rotation,
      x: undefined,
      y: undefined,
      z: undefined,
      easing: 'linear',
      loop: true,
      duration: 4000
    }
    const rotationAxis = props.displayRotationAxis ? props.displayRotationAxis : 'y'
    rotateInPlaceAnimation[rotationAxis] = THREE.Math.degToRad(360)

    // Move to display position
    toDisplayAnimation = Anime.timeline({
      targets: object.position,
      easing: 'easeOutSine',
      duration: 1000
    })
      .add({ x: 0 })
      .add({ y: 0, z: 0 })

    const rotationX = props.preRotation
      ? object.rotation.x + caseObj.rotation.x
      : 0

    // Rotate object to face the camera regardless of case rotation
    Anime({
      targets: object.rotation,
      x: rotationX,
      y: 0,
      z: 0,
      easing: 'easeOutSine',
      duration: 850
    })

    setTimeout(() => {
      onDisplayAnimation = Anime(rotateInPlaceAnimation)
    }, 950)
}

const moveToCase = (object, props) => {
  caseObj.attach(object)

  // Move back to default object position
  toDisplayAnimation = Anime({
    targets: object.position,
    x: props.position.x,
    y: props.position.y,
    z: props.position.z,
    easing: 'easeOutSine',
    duration: 1000
  })
}

const moveToMidway = object => {
  const props = objectProps[object.name]
  const beingDisplayed = object.parent.name === 'Case'

  if (beingDisplayed) {
    midwayGroupOut.attach(object)

    const preRotationX = (props.preRotation && props.preRotation.x) ? THREE.Math.degToRad(props.preRotation.x) : 0
    const preRotationY = (props.preRotation && props.preRotation.y) ? THREE.Math.degToRad(props.preRotation.y) : 0
    const preRotationZ = (props.preRotation && props.preRotation.z) ? THREE.Math.degToRad(props.preRotation.z) : 0

    // Apply any pre-rotations
    Anime({
      targets: object.rotation,
      x: preRotationX,
      y: preRotationY,
      z: preRotationZ,
      duration: 500,
      easing: 'easeOutSine'
    })

    // Move to midway group position
    midwayAnimation = Anime({
      targets: object.position,
      x: 0,
      y: 0,
      z: 0,
      duration: 500,
      easing: 'easeOutSine',
      complete: () => {
        moveToDisplay(object, props)
      }
    })
  // Remove object from display group and add it back into case group
  } else {
    onDisplayAnimation.pause()
    midwayGroupIn.attach(object)

    // Move to midway group position
    midwayAnimation = Anime.timeline({
      targets: object.position,
      duration: 500,
      easing: 'easeOutSine',
      complete: () => {
        moveToCase(object, props)
      }
    })
      .add({ z: 0 })
      .add({ x: 0, y: 0 })

    // Rotate back to original rotation
    Anime({
      targets: object.rotation,
      x: 0,
      y: 0,
      z: 0,
      duration: 500,
      easing: 'easeOutSine'
    })
  }
}

// Helper methods
const toggleFans = () => fanBladesAnimation.paused ? fanBladesAnimation.play() : fanBladesAnimation.pause()

const resetContent = () => {
  title.innerHTML = objectProps['Default'].title
  description.innerHTML = objectProps['Default'].description
}

const setHex = (object, colour) => {
  body.style = (colour === 0) ? 'cursor: default' : 'cursor: pointer'
  if (object.parent.name !== 'Case') {
    object = object.parent
    object.children.forEach(child => {
      child.material.emissiveIntensity = 0.5
      child.material.emissive.setHex(colour)
    })
  } else {
    object.material.emissiveIntensity = 0.5
    object.material.emissive.setHex(colour)
  }
}

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  vignette.style({ aspect: camera.aspect })
}

const setPosition = (object, props) => {
  object.position.set(props.x, props.y, props.z)
}

const addArrToGroup = (arr, group) => {
  arr.forEach(element => {
    group.add(element)
  })
}

const rotateObject = (deltaX, deltaY) => {
  caseObj.rotation.y += deltaX / 700
  caseObj.rotation.x += deltaY / 700
}

const onMouseMove = e => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1

  if (!mouseDown) return

  e.preventDefault()

  let deltaX = e.clientX - mouseX
  let deltaY = e.clientY - mouseY

  mouseX = e.clientX
  mouseY = e.clientY

  rotateObject(deltaX, deltaY)
}

const onMouseDown = e => {
  e.preventDefault()

  mouseDown = true
  mouseX = e.clientX
  mouseY = e.clientY
}

const onMouseUp = e => {
  e.preventDefault()

  mouseDown = false
}

const onInteractableObjectsMenuHover = e => {
  if (e.target.id !== 'interactable-objects-menu') {
    const object = scene.getObjectByName(e.target.id)
    let hex = 0

    if (e.type === 'mouseover') hex = 0xc1c1c1

    object.children.forEach(child => {
      child.material.emissiveIntensity = 0.5
      child.material.emissive.setHex(hex)
    })
  }
}

// Event listeners
window.addEventListener('click', onClick, false)
window.addEventListener('resize', onWindowResize, false)
window.addEventListener('mousemove', onMouseMove, false)
window.addEventListener('mousedown', onMouseDown, false)
window.addEventListener('mouseup', onMouseUp, false)
toggleFan.addEventListener('click', toggleFans, false)
interactableObjectsMenu.addEventListener('mouseover', onInteractableObjectsMenuHover, false)
interactableObjectsMenu.addEventListener('mouseout', onInteractableObjectsMenuHover, false)

animate()
