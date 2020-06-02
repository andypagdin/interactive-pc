import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Case from '../assets/models/case-v2.glb'
import Anime from 'animejs'
import { objectProps, interactableObjNames, sideMenuItems } from './object-props'
import { createBackground } from '../lib/three-vignette.js'

const scene = new THREE.Scene()
const interactableObjects = []
let INTERSECTED
let DISPLAY_POSITION

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
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setClearColor(0xcccccc)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.physicallyCorrectLights = true
root.appendChild(renderer.domElement)

// Camera
const fov = 30
const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000)
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

const loader = new GLTFLoader()
let caseObj = null

const displayGroup = new THREE.Group()
displayGroup.position.set(2.5, 0 , 0)
scene.add(displayGroup)

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
  for (let i = 0; i < object.children.length; i++) {
    if (interactableObjNames.indexOf(object.children[i].name) !== -1) {
      let child = object.children[i]
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
  }

  addArrToGroup(FrontTopFanArr, FrontTopFanGroup)
  addArrToGroup(FrontBottomFanArr, FrontBottomFanGroup)
  addArrToGroup(RearFanArr, RearFanGroup)

  interactableObjects.push(FrontTopFanGroup, RearFanGroup, FrontBottomFanGroup)

  object.add(FrontTopFanGroup)
  object.add(RearFanGroup)
  object.add(FrontBottomFanGroup)

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
    x: 12.5,
    easing: 'linear',
    loop: true,
    duration: 2500,
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
  // Ignore side menu or toggle clicks
  if (sideMenuItems.indexOf(event.target.id) !== -1) return

  // Ignore clicks if there is an animation in progress
  if (toDisplayAnimation && !toDisplayAnimation.completed) return

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
      if (DISPLAY_POSITION) moveToPosition(DISPLAY_POSITION)

      // Move to display position
      DISPLAY_POSITION = object
    } else {
      // If you click the object currently in display position, move it back to default position
      DISPLAY_POSITION = null
      resetContent()
    }
    moveToPosition(object)
  }
}

const moveToPosition = object => {
  const props = objectProps[object.name]
  const beingDisplayed = object.parent.name === 'Case'

  // move the object to the display position
  if (beingDisplayed) {
    // Remove the object being displayed from the case parent object
    // add it into the display group, so it is no longer affected by the case rotation
    displayGroup.add(object)
    object.position.set(0, 0, 0)

    // apply any pre rotation
    if (props.preRotation) object.rotation.set(props.preRotation.x, props.preRotation.y, props.preRotation.z)

    // rotate object in display position
    let animation = {
      targets: object.rotation,
      x: undefined,
      y: undefined,
      z: undefined,
      easing: 'linear',
      loop: true,
      duration: 5000
    }
    const rotationAxis = props.displayRotationAxis ? props.displayRotationAxis : 'y'
    animation[rotationAxis] = THREE.Math.degToRad(360)
    onDisplayAnimation = Anime(animation)
  // Remove object from display group and add it back into case group
  } else {
    onDisplayAnimation.pause()
    object.rotation.set(props.rotation.x, props.rotation.y, props.rotation.z)
    object.position.set(props.position.x, props.position.y, props.position.z)
    caseObj.add(object)
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
    for (let i = 0; i < object.children.length; i++) {
      object.children[i].material.emissiveIntensity = 0.5
      object.children[i].material.emissive.setHex(colour)
    }
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
  for (let i = 0; i < arr.length; i++) {
    group.add(arr[i])
  }
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

// Event listeners
toggleFanBtn.addEventListener('click', toggleFans, false)
window.addEventListener('click', onClick, false)
window.addEventListener('resize', onWindowResize, false)
window.addEventListener('mousemove', onMouseMove, false)
window.addEventListener('mousedown', onMouseDown, false)
window.addEventListener('mouseup', onMouseUp, false)

animate()
