import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Case from '../assets/models/case.gltf'

const root = document.getElementById('root')
const scene = new THREE.Scene()

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
loader.load(Case, function (gltf) {
  let object = gltf.scene

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
}, undefined, function (error) {
  console.error(error)
})

const animate = () => {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

animate()
