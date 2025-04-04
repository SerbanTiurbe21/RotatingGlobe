import "./tailwind.css";
import * as THREE from "three";
import gsap from "gsap";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import aVertexShader from "./shaders/atmosphereVertex.glsl";
import aFragmentShader from "./shaders/atmosphereFragment.glsl";
import countries from "./countries.json";

const scene = new THREE.Scene();
const canvasContainer = document.querySelector("#canvasContainer");
let camera = new THREE.PerspectiveCamera(
  75,
  canvasContainer.offsetWidth / canvasContainer.offsetHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.querySelector("canvas"),
});

renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
renderer.setPixelRatio(window.devicePixelRatio);
//document.body.appendChild(renderer.domElement);

// create sphere
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      globeTexture: {
        value: new THREE.TextureLoader().load("./img/globe.jpg"),
      },
    },
  })
);

// create atmosphere
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader: aVertexShader,
    fragmentShader: aFragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  })
);

atmosphere.scale.set(1.1, 1.1, 1.1);
scene.add(atmosphere);

const group = new THREE.Group();
group.add(sphere);
scene.add(group);

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
});

const starVertices = [];
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = -Math.random() * 2000;
  starVertices.push(x, y, z);
}

starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starVertices, 3)
);

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

camera.position.z = 15;

function createBoxes(countries) {
  countries.forEach((country) => {
    const scale = country.population / 1000000000;
    const lat = country.latlng[0];
    const lng = country.latlng[1];
    const zScale = 0.8 * scale;

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(
        Math.max(0.1, 0.2 * scale),
        Math.max(0.1, 0.2 * scale),
        Math.max(zScale, 0.4 * Math.random())
      ),
      new THREE.MeshBasicMaterial({
        color: "#3BF7FF",
        opacity: 0.4,
        transparent: true,
      })
    );

    const latitude = (lat / 180) * Math.PI;
    const longitude = (lng / 180) * Math.PI;
    const radius = 5;

    const x = radius * Math.cos(latitude) * Math.sin(longitude);
    const y = radius * Math.sin(latitude);
    const z = radius * Math.cos(latitude) * Math.cos(longitude);

    box.position.x = x;
    box.position.y = y;
    box.position.z = z;

    box.lookAt(0, 0, 0);
    box.geometry.applyMatrix4(
      new THREE.Matrix4().makeTranslation(0, 0, -zScale / 2)
    );

    group.add(box);

    gsap.to(box.scale, {
      z: 1.4,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: "linear",
      delay: Math.random(),
    });

    box.country = country.name.common;
    box.population = new Intl.NumberFormat().format(country.population);
  });
}

createBoxes(countries);

sphere.rotation.y = -Math.PI / 2;
group.rotation.offset = {
  x: 0,
  y: 0,
};

const mouse = {
  x: 0,
  y: 0,
  down: false,
  xPrev: undefined,
  yPrev: undefined,
};

const keyboard = {
  w: false,
  a: false,
  s: false,
  d: false,
  q: false,
  e: false,
};

let rotationSpeed = 0.002;
let isPaused = false;

const raycaster = new THREE.Raycaster();
const popUpEl = document.querySelector("#popUpEl");
const populationEl = document.querySelector("#populationEl");
const populationValueEl = document.querySelector("#populationValueEl");

//use GSAP to animate the sphere
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  const targetRotation = {
    x: -mouse.y * 0.3,
    y: mouse.x * 0.5,
  };

  if (!isPaused) {
    group.rotation.y += rotationSpeed;
    if (keyboard.w) {
      mouse.y = 1;
    } else if (keyboard.s) {
      mouse.y = -1;
    }
    if (keyboard.a) {
      mouse.x = 1;
    } else if (keyboard.d) {
      mouse.x = -1;
    }

    /* asta e rotirea dupa mouse
    gsap.to(group.rotation, {
      x: targetRotation.x,
      y: targetRotation.y,
      duration: 2,
    });*/
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(
    group.children.filter((mesh) => {
      return mesh.geometry.type === "BoxGeometry";
    })
  );

  group.children.forEach((mesh) => {
    mesh.material.opacity = 0.4;
  });

  gsap.set(popUpEl, {
    display: "none",
  });

  for (let i = 0; i < intersects.length; i++) {
    let box = intersects[i].object;
    box.material.opacity = 1;
    gsap.set(popUpEl, {
      display: "block",
    });
    populationEl.innerHTML = box.country;
    populationValueEl.innerHTML = box.population;
  }

  renderer.render(scene, camera);
  updateRotationSpeed();
}
animate();

addEventListener("keydown", (event) => {
  switch (event.key) {
    case "w":
      keyboard.w = true;
      break;
    case "a":
      keyboard.a = true;
      break;
    case "s":
      keyboard.s = true;
      break;
    case "d":
      keyboard.d = true;
      break;
    case "q":
      keyboard.q = true;
      break;
    case "e":
      keyboard.e = true;
      break;
    case "p":
    case " ":
      isPaused = !isPaused;
      break;
  }
});

addEventListener("keyup", (event) => {
  switch (event.key) {
    case "w":
      keyboard.w = false;
      break;
    case "a":
      keyboard.a = false;
      break;
    case "s":
      keyboard.s = false;
      break;
    case "d":
      keyboard.d = false;
      break;
    case "q":
      keyboard.q = false;
      break;
    case "e":
      keyboard.e = false;
      break;
  }
});

function updateRotationSpeed() {
  if (keyboard.q) {
    if (rotationSpeed >= 0.001) rotationSpeed -= 0.001;
    rotationSpeed = Math.max(rotationSpeed, 0.001);
  }
  if (keyboard.e) {
    rotationSpeed += 0.001;
  }
}

canvasContainer.addEventListener("mousedown", ({ clientX, clientY }) => {
  mouse.down = true;
  mouse.xPrev = clientX;
  mouse.yPrev = clientY;
});

addEventListener("mouseup", () => {
  mouse.down = false;
});

addEventListener("mousemove", (event) => {
  if (innerWidth >= 1280) {
    mouse.x = ((event.clientX - innerWidth / 2) / (innerWidth / 2)) * 2 - 1;
    mouse.y = -(event.clientY / innerHeight) * 2 + 1;
  } else {
    const offset = canvasContainer.getBoundingClientRect().top;
    mouse.x = (event.clientX / innerWidth) * 2 - 1;
    mouse.y = -((event.clientY - offset) / innerHeight) * 2 + 1;
  }

  gsap.set(popUpEl, {
    x: event.clientX,
    y: event.clientY,
  });

  if (mouse.down) {
    event.preventDefault();
    const deltaX = event.clientX - mouse.xPrev;
    const deltaY = event.clientY - mouse.yPrev;

    group.rotation.offset.x += deltaY * 0.002;
    group.rotation.offset.y += deltaX * 0.002;

    gsap.to(group.rotation, {
      y: group.rotation.offset.y,
      x: group.rotation.offset.x,
      duration: 2,
    });

    mouse.xPrev = event.clientX;
    mouse.yPrev = event.clientY;
  }
});

addEventListener("resize", () => {
  renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
  camera = new THREE.PerspectiveCamera(
    75,
    canvasContainer.offsetWidth / canvasContainer.offsetHeight,
    0.1,
    1000
  );
  camera.position.z = 15;
});

addEventListener("touchend", () => {
  mouse.down = false;
});

addEventListener(
  "touchmove",
  (event) => {
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;

    const doesIntersect = raycaster.intersectObjects(sphere);

    if (doesIntersect.length > 0) mouse.down = true;
    if (mouse.down) {
      const offset = canvasContainer.getBoundingClientRect().top;
      mouse.x = (event.clientX / innerWidth) * 2 - 1;
      mouse.y = -((event.clientY - offset) / innerHeight) * 2 + 1;

      gsap.set(popUpEl, {
        x: event.clientX,
        y: event.clientY,
      });

      event.preventDefault();
      const deltaX = event.clientX - mouse.xPrev;
      const deltaY = event.clientY - mouse.yPrev;

      group.rotation.offset.x += deltaY * 0.002;
      group.rotation.offset.y += deltaX * 0.002;

      gsap.to(group.rotation, {
        y: group.rotation.offset.y,
        x: group.rotation.offset.x,
        duration: 2,
      });

      mouse.xPrev = event.clientX;
      mouse.yPrev = event.clientY;
    }
  },
  { passive: false }
);
