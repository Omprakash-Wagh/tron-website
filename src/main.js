import '/src/styles/main.css'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'

gsap.registerPlugin(ScrollTrigger)

/* =========================================
   SCENE CONFIGURATION
   ========================================= */
// ... (imports remain)

/* =========================================
   PRELOADER
   ========================================= */
function initPreloader() {
  const overlay = document.getElementById('preloader')
  const percentEl = document.getElementById('loader-percent')
  const barEl = document.getElementById('loader-progress-bar')

  if (!overlay) return // Safety check

  // Lock scroll during load
  document.body.style.overflow = 'hidden'

  let progress = 0

  // Longer wait for mobile to ensure assets load / look smoother
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const duration = isMobile ? 4500 : 2500

  const interval = 20
  const step = 100 / (duration / interval)

  const timer = setInterval(() => {
    progress += step
    // Add some randomness to make it feel real
    if (Math.random() > 0.7) progress += 1

    if (progress >= 100) {
      progress = 100
      clearInterval(timer)

      // Update final UI state
      if (percentEl) percentEl.textContent = 100
      if (barEl) barEl.style.width = '100%'

      // Fade out
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        delay: 0.2,
        onComplete: () => {
          overlay.style.visibility = 'hidden'
          document.body.style.overflow = '' // Unlock scroll
          // Start entry animations
          initEntryAnimations()
        }
      })
    } else {
      // Update UI
      if (percentEl) percentEl.textContent = Math.floor(progress)
      if (barEl) barEl.style.width = `${progress}%`
    }
  }, interval)
}

/* =========================================
   SCENE CONFIGURATION
   ========================================= */
// ... (rest of Scene Config and Cinema3D class remains the same)

class Cinema3D {
  // ... (existing class code)
  constructor() {
    this.canvas = document.querySelector('#webgl-canvas')
    if (!this.canvas) return

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x050409, 10, 50)

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
    // Start camera further away for dramatic zoom-in? Or keep standard
    this.camera.position.z = 20

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    })

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0

    this.group = new THREE.Group()
    this.scene.add(this.group)

    this.mouse = new THREE.Vector2()
    this.target = new THREE.Vector2()

    this.initObjects()
    this.addLights()
    this.initScrollInteraction()
    this.addEvents()

    this.animate = this.animate.bind(this) // Bind animate
    this.animate()
  }
  // ... (methods: initObjects, addLights, initScrollInteraction, addEvents, animate)
  initObjects() {
    // 1. The HERO SPHERE (Icosahedron)
    const geo = new THREE.IcosahedronGeometry(4, 3)

    // Wireframe Material
    const wireMat = new THREE.MeshStandardMaterial({
      color: 0x7B61FF, // Accent color
      wireframe: true,
      emissive: 0x220055,
      roughness: 0,
      metalness: 0.5
    })

    this.heroSphere = new THREE.Mesh(geo, wireMat)
    this.group.add(this.heroSphere)

    // Inner Core (Glowing)
    const coreGeo = new THREE.IcosahedronGeometry(3, 1)
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 1.0,
      transparent: true,
      opacity: 0.8
    })

    this.core = new THREE.Mesh(coreGeo, coreMat)
    this.group.add(this.core)

    // 2. Floating Debris / Data Particles
    const particlesGeo = new THREE.BufferGeometry()
    const count = 1000
    const pos = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 8 + Math.random() * 15
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = Math.sin(angle) * radius
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

    const particlesMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x8A8298,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    })

    this.debris = new THREE.Points(particlesGeo, particlesMat)
    this.group.add(this.debris)
  }

  addLights() {
    const ambient = new THREE.AmbientLight(0x404040, 2)
    this.scene.add(ambient)

    // const pl1 = new THREE.PointLight(0x7B61FF, 5, 50)
    // pl1.position.set(10, 10, 10)
    // this.scene.add(pl1)

    // const pl2 = new THREE.PointLight(0xFFFFFF, 5, 50)
    // pl2.position.set(-10, -5, 5)
    // this.scene.add(pl2)

    this.lights = {}
  }

  initScrollInteraction() {
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      }
    })

    timeline.to(this.group.rotation, {
      x: Math.PI * 2,
      y: Math.PI * 0.5,
      ease: "none"
    }, 0)

    timeline.to(this.group.position, {
      y: -10,
      z: -5,
      ease: "power1.inOut"
    }, 0)

    timeline.to(this.heroSphere.scale, {
      x: 1.5, y: 1.5, z: 1.5,
      ease: "sine.inOut"
    }, 0)

    timeline.to(this.core.scale, {
      x: 0.5, y: 0.5, z: 0.5,
      ease: "sine.inOut"
    }, 0)

    timeline.to(this.heroSphere.material.color, {
      r: 0.5, g: 0.2, b: 1, // Deep Purple Blue
      duration: 0.3
    }, 0.3)

    timeline.to(this.heroSphere.material.color, {
      r: 1, g: 1, b: 1,
      duration: 0.3
    }, 0.6)

    timeline.to(this.debris.rotation, {
      y: -Math.PI,
      ease: "none"
    }, 0)
  }

  addEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    })

    window.addEventListener('theme-change', (e) => {
      const isLight = e.detail === 'light'
      this.scene.fog.color.set(isLight ? 0xF8F7FA : 0x050409)
    })
  }

  animate() {
    const time = performance.now() * 0.001
    this.target.x = THREE.MathUtils.lerp(this.target.x, this.mouse.x * 0.5, 0.05)
    this.target.y = THREE.MathUtils.lerp(this.target.y, this.mouse.y * 0.5, 0.05)
    this.group.rotation.x += 0.001
    this.group.rotation.y += 0.002
    this.camera.position.x += (this.mouse.x * 2 - this.camera.position.x) * 0.05
    this.camera.position.y += (this.mouse.y * 2 - this.camera.position.y) * 0.05
    this.camera.lookAt(this.group.position)
    const pulse = 1 + Math.sin(time * 2) * 0.05
    this.core.scale.multiplyScalar(pulse / (this.core.previousPulse || 1))
    this.core.previousPulse = pulse
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this.animate)
  }
}

// Start 3D Logic immediately so it's ready behind the loader
const cinema = new Cinema3D()

/* =========================================
   UI & SMOOTH SCROLL
   ========================================= */
// ... (Lenis setup remains)
const lenis = new Lenis({
  lerp: 0.08,
  smoothWheel: true,
  wheelMultiplier: 1.2
})

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

/* =========================================
   ENTRY ANIMATIONS
   ========================================= */
function initEntryAnimations() {
  const tl = gsap.timeline()

  tl.from('.hero-title', {
    y: 100,
    opacity: 0,
    duration: 1.5,
    ease: "power4.out",
    clearProps: "all" // Ensure visibility after animation
  })
    .from('.hero-desc', {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      clearProps: "all"
    }, '-=1')
    .from('.scroll-indicator', {
      opacity: 0,
      duration: 1,
      clearProps: "all"
    }, '-=0.5')
}

/* =========================================
   THEME MANAGER
   ========================================= */
const themeToggle = document.getElementById('nav-theme-toggle')
const html = document.documentElement

function updateTheme(theme) {
  html.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
  if (themeToggle) {
    themeToggle.textContent = theme === 'light' ? 'DARK MODE' : 'LIGHT MODE'
  }
  window.dispatchEvent(new CustomEvent('theme-change', { detail: theme }))
}

const savedTheme = localStorage.getItem('theme') || 'dark'
updateTheme(savedTheme)

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme')
    updateTheme(current === 'light' ? 'dark' : 'light')
  })
}

// Init everything
initPreloader()
