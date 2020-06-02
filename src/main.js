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
// Add dummy cube to see display group position
let geometry = new THREE.BoxGeometry()
let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
let cube = new THREE.Mesh(geometry, material)
cube.name = 'lol'
// displayGroup.add(cube)
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
  // camera.near = size / 100
  // camera.far = size * 100
  // camera.updateProjectionMatrix()

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

  // let cgeometry = new THREE.BoxGeometry()
  // let cmaterial = new THREE.MeshBasicMaterial({ color: 0x000 })
  // let ccube = new THREE.Mesh(cgeometry, cmaterial)
  // ccube.position.set(-5, 0, 0)
  // object.add(ccube)

  caseObj = object
  // displayGroup.position.set(caseObj.position.x + 2, caseObj.position.y, caseObj.position.z)
  // displayGroup.quaternion.set(caseObj.quaternion.x, caseObj.quaternion.y, caseObj.quaternion.z, caseObj.quaternion.w)
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
  console.log(mouseX, mouseY)
  console.log(event)
  // Ignore side menu or toggle clicks
  if (sideMenuItems.indexOf(event.target.id) !== -1) return

  // Ignore clicks if there is an animation in progress
  if (toDisplayAnimation && !toDisplayAnimation.completed) return

  // Display clicked objects details
  if (INTERSECTED) {
    let object = INTERSECTED

    // Handle groups (eventually all interactable objects will be groups, then this can be removed)
    if (object.parent.name.indexOf('Fan') !== -1 ||
        object.parent.name.indexOf('Ram') !== -1 ||
        object.parent.name.indexOf('CpuChip') !== -1 ||
        object.parent.name.indexOf('PowerSupply') !== -1 ||
        object.parent.name.indexOf('GraphicsCard') !== -1) {
      object = object.parent
    }

    title.innerHTML = objectProps[object.name].title
    description.innerHTML = objectProps[object.name].description

    // If the object is in its default position, move it into display position
    // otherwise move it back to its default position
    if (Number(object.position.x.toFixed(2)) === objectProps[object.name].position.x &&
        Number(object.position.y.toFixed(2)) === objectProps[object.name].position.y &&
        Number(object.position.z.toFixed(2)) === objectProps[object.name].position.z) {
      // If there is already something in display position, move it back
      if (DISPLAY_POSITION) animateToPosition(DISPLAY_POSITION, false, objectProps[DISPLAY_POSITION.name].position, objectProps[DISPLAY_POSITION.name].rotation)

      DISPLAY_POSITION = object
      // Move to display position
      // animateToPosition(object, true, objectProps[object.name].display.position, objectProps[object.name].display.rotation, objectProps[object.name].preRotation)
      moveToPosition(object, true)
    } else {
      // If you click the object currently in display position, move it back to default position
      DISPLAY_POSITION = null
      animateToPosition(object, false, objectProps[object.name].position, objectProps[object.name].rotation)
      resetContent()
    }
  } else {
    resetContent()
    // If there are any models in display position, move them back
    if (DISPLAY_POSITION) {
      // animateToPosition(DISPLAY_POSITION, false, objectProps[DISPLAY_POSITION.name].position, objectProps[DISPLAY_POSITION.name].rotation)
      moveToPosition(DISPLAY_POSITION, false)
      DISPLAY_POSITION = null
    }
  }
}

function setOpacity(obj, opacity) {
  console.log(obj)
  obj.children.forEach((child) => {
    setOpacity(child, opacity);
  })
  if (obj.material) {
    obj.material.transparent = true
    obj.material.opacity = opacity;
  }
}

const moveToPosition = (object, beingDisplayed) => {
  console.log(object)
  setOpacity(object, 0.5)

  // move the object to the display position
  // if (beingDisplayed) {
  //   for (let i = 0; i < caseObj.children.length; i++) {
  //     if (caseObj.children[i].name === object.name) {
  //       displayGroup.add(caseObj.children[i])
  //       object.position.set(0, 0, 0)

  //       // animate object from to the
  //     }
  //   }
  // } else {
  //   console.log('adding back to case object')
  //   caseObj.add(object)
  //   object.position.set(
  //     objectProps[object.name].position.x,
  //     objectProps[object.name].position.y,
  //     objectProps[object.name].position.z,
  //   )
  // }
}

const animateToPosition = (target, loopRotation, position, rotation, preRotation = null) => {
  toDisplayAnimation = Anime.timeline({
    targets: target.position,
    easing: 'easeOutSine',
    duration: 800
  })

  // Coming out to display position
  if (loopRotation) {
    toDisplayAnimation.add({ z: -2 }).add({ x: position.x, y: position.y }).add({ z: position.z })
    // Perform any pre display rotation
    if (preRotation) {
      Anime({
        targets: target.rotation,
        x: preRotation.x,
        y: preRotation.y,
        z: preRotation.z,
        easing: 'linear',
        duration: 800
      })
    }
    // Rotate object after reaching display position
    window.setTimeout(() => {
      onDisplayAnimation = Anime({
        targets: target.rotation,
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        easing: 'linear',
        loop: true,
        duration: 5000
      })
    }, 1800)
  }
  // Going back into case
  else {
    toDisplayAnimation.add({ z: -2 }).add({ x: position.x, y: position.y }).add({ z: position.z })
    // Pause on display animation and rotate back to default position
    if (onDisplayAnimation) onDisplayAnimation.pause()
    onDisplayAnimation = Anime({
      targets: target.rotation,
      y: rotation.y,
      x: rotation.x,
      z: rotation.z,
      easing: 'linear',
      duration: 800
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
