import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { hdri } from "./load-hdri";

export function createSceneLayout() {
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(2);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f4f4);

  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 15;
  camera.position.y = -5;

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const topLight = new THREE.RectAreaLight(0xaaaaff, 2, 10, 10);
  topLight.position.set(0, 7, 0);
  topLight.lookAt(0, 0, 0);
  scene.add(topLight);

  const light1 = new THREE.RectAreaLight(0xaaaaff, 2, 10, 10);
  light1.position.set(5, 5, 0);
  light1.lookAt(0, 0, 0);
  scene.add(light1);

  const light2 = new THREE.RectAreaLight(0xffaaaa, 2, 10, 10);
  light2.position.set(-5, 5, 0);
  light2.lookAt(0, 0, 0);
  scene.add(light2);
  /*
  const light3 = new THREE.RectAreaLight(0xffaaaa, 2, 10, 10);
  light3.position.set(0, 5, 5);
  light3.lookAt(0, 0, 0);
  scene.add(light3);

  const light4 = new THREE.RectAreaLight(0xffaaaa, 2, 10, 10);
  light4.position.set(0, 5, -5);
  light4.lookAt(0, 0, 0);
  scene.add(light4);

  const light5 = new THREE.RectAreaLight(0xaaaaff, 1, 10, 10);
  light5.position.set(5, -5, 0);
  light5.lookAt(0, 0, 0);
  scene.add(light5);

  const light6 = new THREE.RectAreaLight(0xaaaaff, 1, 10, 10);
  light6.position.set(-5, -5, 0);
  light6.lookAt(0, 0, 0);
  scene.add(light6);

  const light7 = new THREE.RectAreaLight(0xffaaaa, 1, 10, 10);
  light7.position.set(0, -5, 5);
  light7.lookAt(0, 0, 0);
  scene.add(light7);

  const light8 = new THREE.RectAreaLight(0xffaaaa, 1, 10, 10);
  light8.position.set(0, -5, -5);
  light8.lookAt(0, 0, 0);
  scene.add(light8);*/

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.target.set(0, 0, 0);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.161;
  orbit.screenSpacePanning = false;
  orbit.maxPolarAngle = Math.PI / 1.61; // nao deixa ir o user ver por baixo do hoodie, so o suficiente
  orbit.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: null,
  };
  orbit.enablePan = false;
  orbit.enabled = true;
  orbit.minDistance = 10;
  orbit.maxDistance = 20;

  //scene.fog = new THREE.FogExp2(0xf4f4f4, 0.0161);

  scene.environment = hdri("/hdri5.exr", renderer, scene);
  scene.environmentIntensity = 5;

  return {
    scene: scene,
    renderer: renderer,
    orbit: orbit,
    camera: camera,
  };
}
