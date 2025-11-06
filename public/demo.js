// public/demo.js
(async () => {
  // Prevent double init (HMR / multiple mounts)
  if (window.__SOLAR_DEMO_ACTIVE__) return;
  window.__SOLAR_DEMO_ACTIVE__ = true;

  // === Imports ===
  const THREE = await import("https://esm.sh/three@0.160.0");
  const { OrbitControls } = await import(
    "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js"
  );
  const { CSS2DRenderer, CSS2DObject } = await import(
    "https://esm.sh/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js"
  );

  // === Setup ===
  const scene = new THREE.Scene();
  const showStars = true;

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 20, 60);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const container = document.getElementById("viz") || document.body;
  // remove previous canvases if any (safety)
  // while (container.firstChild) container.removeChild(container.firstChild);
  container.appendChild(renderer.domElement);

  // === 2D Label Renderer ===
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
  labelRenderer.domElement.style.zIndex = "10";
  container.appendChild(labelRenderer.domElement);

  // === Lighting ===
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sunLight = new THREE.PointLight(0xffffff, 2.5, 0);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // === Optional Starfield ===
  if (showStars) {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1500;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < positions.length; i++) positions[i] = (Math.random() - 0.5) * 2000;
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true, opacity: 0.8, transparent: true });
    scene.add(new THREE.Points(starGeo, starMat));
  }

  // === Colors ===
  const colors = {
    sun: 0xffcc33, mercury: 0xaaaaaa, venus: 0xffc97f, earth: 0x3399ff,
    mars: 0xff5533, jupiter: 0xffaa66, saturn: 0xffd27f, uranus: 0x99ffff, neptune: 0x6666ff
  };

  // === Sun ===
  const sunMaterial = new THREE.MeshStandardMaterial({
    color: colors.sun, emissive: 0xffee55, emissiveIntensity: 2.2, roughness: 0.3, metalness: 0.0
  });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 64), sunMaterial);
  scene.add(sun);
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(5.8, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0.25, depthWrite: false })
  ));

  // === Planet Data ===
  const planetData = [
    { name: "Mercury", size: 0.5, dist: 8,  speed: 0.04,  color: colors.mercury },
    { name: "Venus",   size: 1.2, dist: 11, speed: 0.015, color: colors.venus },
    { name: "Earth",   size: 1.3, dist: 14, speed: 0.01,  color: colors.earth },
    { name: "Mars",    size: 0.9, dist: 17, speed: 0.008, color: colors.mars },
    { name: "Jupiter", size: 3.5, dist: 24, speed: 0.004, color: colors.jupiter },
    { name: "Saturn",  size: 3.0, dist: 32, speed: 0.003, color: colors.saturn },
    { name: "Uranus",  size: 2.0, dist: 38, speed: 0.002, color: colors.uranus },
    { name: "Neptune", size: 2.0, dist: 44, speed: 0.001, color: colors.neptune },
  ];

  // === Create Planets + Labels ===
  const planets = [];
  const labelEntries = []; // {mesh, labelDiv}

  for (const data of planetData) {
    const material = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.8, metalness: 0.1 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.size, 48, 48), material);

    const orbit = new THREE.Object3D();
    orbit.add(mesh);
    mesh.position.x = data.dist;

    // Label (single per planet)
    const labelDiv = document.createElement("div");
    labelDiv.textContent = data.name;
    labelDiv.style.color = "white";
    labelDiv.style.fontSize = "13px";
    labelDiv.style.fontFamily = "system-ui, -apple-system, sans-serif";
    labelDiv.style.fontWeight = "600";
    labelDiv.style.textShadow = "0 1px 4px rgba(0,0,0,0.7)";
    labelDiv.style.whiteSpace = "nowrap";
    labelDiv.style.opacity = "0.0"; // start hidden; we’ll fade select ones in
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, data.size * 1.5, 0);
    mesh.add(label);

    // Orbit ring
    const orbitCurve = new THREE.RingGeometry(data.dist - 0.05, data.dist + 0.05, 128);
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
    const orbitLine = new THREE.Mesh(orbitCurve, orbitMat);
    orbitLine.rotation.x = Math.PI / 2;
    scene.add(orbitLine);

    scene.add(orbit);
    planets.push({ ...data, mesh, orbit });
    labelEntries.push({ mesh, labelDiv });
  }

  // === Controls (Ctrl-drag to pan) ===
  // === Controls (Ctrl-drag to pan) ===
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.minDistance = 10;
  controls.maxDistance = 300;
  controls.target.set(0, 0, 0);

  // Defaults
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };

  let leftDefault = THREE.MOUSE.ROTATE; // remember default

  // Decide behavior at drag start
  renderer.domElement.addEventListener("pointerdown", (e) => {
    // If Ctrl held when drag begins, use left-drag = PAN for this drag
    if (e.ctrlKey) {
      controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    } else {
      controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    }
  });

  // Restore after drag ends or pointer leaves
  const restoreLeft = () => (controls.mouseButtons.LEFT = leftDefault);
  renderer.domElement.addEventListener("pointerup", restoreLeft);
  renderer.domElement.addEventListener("pointercancel", restoreLeft);
  renderer.domElement.addEventListener("pointerleave", restoreLeft);


  // === Hover detection to show label of hovered planet ===
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredMesh = null;

  const onPointerMove = (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh), true);
    hoveredMesh = intersects.length ? intersects[0].object : null;
  };
  renderer.domElement.addEventListener("pointermove", onPointerMove);

  // === Label selection logic (show few, fade others) ===
  const MAX_VISIBLE_LABELS = 8;
  function updateLabels() {
    // Compute distances to camera
    const withDist = labelEntries.map(entry => {
      const pos = new THREE.Vector3();
      entry.mesh.getWorldPosition(pos);
      return { entry, dist: camera.position.distanceTo(pos) };
    });

    // Sort by distance (near → far) and pick top N
    withDist.sort((a, b) => a.dist - b.dist);
    const visibleSet = new Set(withDist.slice(0, MAX_VISIBLE_LABELS).map(x => x.entry.mesh));

    // Ensure hovered is always visible
    if (hoveredMesh) visibleSet.add(hoveredMesh);

    // Apply opacities
    for (const { entry } of withDist) {
      const isVisible = visibleSet.has(entry.mesh);
      const target = isVisible ? 1 : 0;
      // small ease on opacity
      const current = parseFloat(entry.labelDiv.style.opacity || "0");
      const next = current + (target - current) * 0.25;
      entry.labelDiv.style.opacity = next.toFixed(2);
    }
  }

  // === Animation Loop ===
  function animate() {
    requestAnimationFrame(animate);

    sun.rotation.y += 0.002;

    for (const p of planets) {
      p.orbit.rotation.y += p.speed;
      p.mesh.rotation.y += 0.002;
    }

    updateLabels();
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  animate();

  // === Resize ===
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
