import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, renderer, camera, camcontrols;
let mapa, mapsx, mapsy;
let scale = 5;
let lavaRivers = [];
let datosRios = [];
let currentDayIndex = 0;
let frameCounter = 0;

// Datos del mapa de elevación
let heightData, heightWidth, heightHeight;
const fechaDiv = document.createElement("div");
fechaDiv.style.position = "absolute";
fechaDiv.style.top = "20px";
fechaDiv.style.left = "20px";
fechaDiv.style.fontSize = "24px";
fechaDiv.style.color = "#ffffff";
fechaDiv.style.backgroundColor = "rgba(0,0,0,0.5)";
fechaDiv.style.padding = "6px 12px";
fechaDiv.style.borderRadius = "8px";
fechaDiv.style.fontFamily = "Arial, sans-serif";
document.body.appendChild(fechaDiv);

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 3, 3);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camcontrols = new OrbitControls(camera, renderer.domElement);

  const light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(light);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  crearMapa();
}

function crearMapa() {
  const tx1 = new THREE.TextureLoader().load("src/mapa.png");
  const dm1Path = "src/mapa_elevacion.png";
  const dm1 = new THREE.TextureLoader().load(dm1Path);
  mapsx = 21.6 / 2.5;
  mapsy = 10.8 / 2.5;
  Plano(0, 0, 0, mapsx, mapsy, tx1, dm1);

  cargarMapaElevacion(dm1Path);
  cargarCSV("src/volcan.csv");
}

function cargarCSV(rutaCSV) {
  fetch(rutaCSV)
    .then((r) => {
      if (!r.ok) throw new Error("Error al cargar CSV");
      return r.text();
    })
    .then((t) => procesarCSVRios(t))
    .catch((e) => console.error(e));
}

let riosAcumulados = {}; // Almacenar ríos por ID

function procesarCSVRios(content) {
  const filas = content.split("\n");
  const riosPorFecha = {};

  for (let i = 1; i < filas.length; i++) {
    const fila = filas[i].trim();
    if (!fila) continue;

    const [fecha, rioID, puntoID, x, y, z, ancho] = fila.split(",");
    const f = fecha.trim();

    if (!riosPorFecha[f]) riosPorFecha[f] = {};
    if (!riosPorFecha[f][rioID]) riosPorFecha[f][rioID] = [];

    riosPorFecha[f][rioID].push({
      id: parseInt(puntoID),
      x: parseFloat(x),
      y: parseFloat(y),
      z: parseFloat(z),
      ancho: parseFloat(ancho),
    });
  }

  // Convertir a array acumulativo
  for (const fecha in riosPorFecha) {
    const riosDelDia = {};

    for (const id in riosPorFecha[fecha]) {
      const puntos = riosPorFecha[fecha][id].sort((a, b) => a.id - b.id);

      // Acumular puntos
      if (!riosAcumulados[id]) {
        riosAcumulados[id] = [];
      }
      riosAcumulados[id].push(...puntos);

      // Guardar estado acumulado
      riosDelDia[id] = {
        vertices: riosAcumulados[id].map((p) => ({ x: p.x, y: p.y, z: p.z })),
        ancho: puntos[0].ancho,
        color: 0xff4500,
      };
    }

    datosRios.push({
      fecha: new Date(fecha),
      rios: Object.values(riosDelDia),
    });
  }
}

function Plano(px, py, pz, sx, sy, txt, dismap) {
  const geometry = new THREE.PlaneBufferGeometry(sx, sy, 200, 200);
  const material = new THREE.MeshPhongMaterial({ wireframe: false });
  if (txt) material.map = txt;
  if (dismap) {
    material.displacementMap = dismap;
    material.displacementScale = 0.3;
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  mapa = mesh;
}

// --- MAPA DE ELEVACIÓN ---

function cargarMapaElevacion(path) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = path;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    heightData = imgData.data;
    heightWidth = img.width;
    heightHeight = img.height;
    console.log("Mapa de elevación cargado:", img.width, "x", img.height);
  };
}

function getAlturaMapa(x, z) {
  if (!heightData) return 0;

  // Convertir coordenadas del mundo a coordenadas UV
  const u = (x / mapsx + 0.5) * heightWidth;
  const v = (z / mapsy + 0.5) * heightHeight;

  const ix = Math.min(Math.max(Math.floor(u), 0), heightWidth - 1);
  const iy = Math.min(Math.max(Math.floor(v), 0), heightHeight - 1);

  const index = (iy * heightWidth + ix) * 4;
  const r = heightData[index];
  const g = heightData[index + 1];
  const b = heightData[index + 2];

  const h = ((r + g + b) / 3 / 255) * 0.3; // escalar según displacementScale
  return h;
}

// --- RÍOS DE LAVA ---

function crearRioDeLava(rioData) {
  const { vertices, color, ancho } = rioData;
  if (vertices.length < 2) return;

  const points = vertices.map((v) => {
    const altura = getAlturaMapa(v.x, v.z);
    return new THREE.Vector3(v.x, altura + 0.01, v.z);
  });

  const curve = new THREE.CatmullRomCurve3(points);
  curve.tension = 0.5;

  // Grosor proporcional al ancho en el CSV
  const tubeRadius = ancho / 3000; // Ajusta el divisor según necesites
  const radialSegments = 8;
  const tubularSegments = points.length * 20;

  const tubeGeometry = new THREE.TubeGeometry(
    curve,
    tubularSegments,
    tubeRadius,
    radialSegments,
    false
  );

  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.9,
    emissive: color,
    emissiveIntensity: 0.5,
  });

  const tube = new THREE.Mesh(tubeGeometry, material);
  lavaRivers.push(tube);
  scene.add(tube);
}

// --- ANIMACIÓN ---

function animate() {
  requestAnimationFrame(animate);

  if (currentDayIndex > 0 && currentDayIndex <= datosRios.length) {
    const dia = datosRios[currentDayIndex - 1];
    const options = { year: "numeric", month: "short", day: "numeric" };
    fechaDiv.textContent = dia.fecha.toLocaleDateString("es-ES", options);
  }

  if (
    datosRios.length > 0 &&
    frameCounter % 120 === 0 &&
    currentDayIndex < datosRios.length
  ) {
    const dia = datosRios[currentDayIndex];
    dia.rios.forEach((rio) => crearRioDeLava(rio));
    currentDayIndex++;
  }

  for (let i = 0; i < lavaRivers.length; i++) {
    const river = lavaRivers[i];
    if (river.material && river.material.opacity !== undefined) {
      const pulse = Math.sin(Date.now() * 0.003 + i) * 0.1 + 0.9;
      river.material.opacity = pulse * 0.8;
    }
  }

  frameCounter++;
  renderer.render(scene, camera);
}
