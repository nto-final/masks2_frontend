import * as THREE from 'three';
import * as ZapparThree from '@zappar/zappar-threejs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import mask1 from './assets/chert.glb';
import mask2 from './assets/Mask2.glb';
import mask3 from './assets/Mask3.glb';
import './index.sass';
import ZapparSharing from '@zappar/sharing';
import previousSvg from "./assets/icons/previous.svg";
import changeTextures from "./assets/icons/changeTextures.svg";
import change from "./assets/icons/change.svg";
import cam from "./assets/icons/cam.svg";



if (ZapparThree.browserIncompatible()) {
  ZapparThree.browserIncompatibleUI();
  throw new Error('Unsupported browser');
}

let obects = [mask1, mask2, mask3]
let currentObj = mask1;
const manager = new ZapparThree.LoadingManager();

const renderer = new THREE.WebGLRenderer({ antialias: true,  preserveDrawingBuffer: true });
const scene = new THREE.Scene();
document.body.appendChild(renderer.domElement);
let nextBtn = document.getElementById("changeModel")
let textureBtn = document.getElementById("changeTexture")
let photoBtn = document.getElementById("takePhoto");
let previousBtn = document.getElementById("previousBtn");

(nextBtn?.children[0] as any).src = change;
(textureBtn?.children[0] as any).src = changeTextures;
(photoBtn?.children[0] as any).src = cam;
(previousBtn?.children[0] as any).src = previousSvg;


renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const camera = new ZapparThree.Camera();


ZapparThree.permissionRequestUI().then((granted) => {

  if (granted) camera.start(true); 
  else ZapparThree.permissionDeniedUI();
});

ZapparThree.glContextSet(renderer.getContext());

scene.background = camera.backgroundTexture;

const faceTracker = new ZapparThree.FaceTrackerLoader(manager).load();
const faceTrackerGroup = new ZapparThree.FaceAnchorGroup(camera, faceTracker);

scene.add(faceTrackerGroup);

faceTrackerGroup.visible = false;

const mask = new ZapparThree.HeadMaskMeshLoader().load();
faceTrackerGroup.add(mask);

const gltfLoader = new GLTFLoader(manager);
let mixer:any;

gltfLoader.load(mask1, (gltf) => {
  currentObj = mask1
   mixer = new THREE.AnimationMixer(gltf.scene)

  const animationAction = mixer.clipAction((gltf as any).animations[0])
  animationAction.play()
  gltf.scene.position.set(0, 0, 0);
  gltf.scene.scale.set(2.1, 2.1, 2.1);
  faceTrackerGroup.add(gltf.scene);
}, undefined, () => {
  console.log('An error ocurred loading the GLTF model');
});



const directionalLight = new THREE.DirectionalLight('white', 3);
directionalLight.position.set(0, 5, 7);
directionalLight.lookAt(0, 0, 0);
scene.add(directionalLight);

const ambeintLight = new THREE.AmbientLight('white', 0.4);
scene.add(ambeintLight);

faceTrackerGroup.faceTracker.onVisible.bind(() => { faceTrackerGroup.visible = true; });
faceTrackerGroup.faceTracker.onNotVisible.bind(() => { faceTrackerGroup.visible = false; });

function loadModel(){
  faceTrackerGroup.remove(faceTrackerGroup.children[faceTrackerGroup.children.length - 1])
  let ind = obects.indexOf(currentObj) + 1
  if (ind == 3){
    ind = 0
  }
  currentObj = obects[ind]
  gltfLoader.load(obects[ind], (gltf) => {
    mixer = new THREE.AnimationMixer(gltf.scene)
    const animationAction = mixer.clipAction(gltf.animations[0])
    animationAction.play()
    gltf.scene.position.set(0, 0, 0);
    gltf.scene.scale.set(2.1, 2.1, 2.1);
    faceTrackerGroup.add(gltf.scene);
  }, undefined, () => {
    console.log('An error ocurred loading the GLTF model');
  });
}
nextBtn?.addEventListener('click',loadModel)
const clock = new THREE.Clock()

var textureLoader = new THREE.TextureLoader(manager);
let textures : any[] = [];
let currentTexture = textureLoader.load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');

textures.push(
  textureLoader.load('https://threejs.org/examples/textures/uv_grid_opengl.jpg'),
  textureLoader.load('https://threejs.org/examples/textures/colors.png')
);


function changeTexture(){
  let ind = textures.indexOf(currentTexture) == 1? 0:1

  faceTrackerGroup.children[faceTrackerGroup.children.length - 1].traverse(function(child:any) {

    currentTexture = textures[ind]
    if (child.isMesh) {
      child.material.map = currentTexture;
    }
  });
}

textureBtn?.addEventListener("click", changeTexture);

photoBtn?.addEventListener('click', () => {
  const canvas = document.getElementsByTagName('canvas')[0];

  const url = canvas?.toDataURL();
  ZapparSharing({
    data: url!,
    fileNamePrepend: 'pyc',
  }, {
    containerDiv : {
      zIndex: '10003',
    },
  },
  {
    
    TapAndHoldToSave: 'Скачайте или поделитесь фото',
    SAVE: 'Скачать',
    SHARE: 'Поделится',
  }
  );
});
function render(): void {
  camera.updateFrame(renderer);
  mask.updateFromFaceAnchorGroup(faceTrackerGroup);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
  mixer.update(clock.getDelta())
}


render();
