// Combined JavaScript bundle: shaders.js + script.js + main.js
// This file merges functionality from the original separate scripts to
// reduce the number of network requests on the index page. index.js remains
// a standalone module.

const simulationVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const simulationFragmentShader = `
precision mediump float;

uniform sampler2D textureA;
uniform vec2 mouse;
uniform vec2 resolution;
uniform float time;
uniform int frame;

varying vec2 vUv;

const float deltaBase = 0.72;

void main() {
    vec2 uv = vUv;

    if (frame == 0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    vec4 data = texture2D(textureA, uv);
    float pressure = data.x;
    float pVel = data.y;

    float isMobile = step(500.0, resolution.x); // 0 on mobile, 1 on desktop
    float scale = mix(2.0, 8.0, isMobile); // 2 on mobile, 8 on desktop
    vec2 texelSize = scale / resolution;
    float delta = deltaBase * mix(0.6, 1.0, isMobile); // 0.72 on mobile, 1.2 on desktop

    // Horizontal neighbors only for mobile performance
    vec2 offset = vec2(texelSize.x, 0.0);
    float left = texture2D(textureA, uv - offset).x;
    float right = texture2D(textureA, uv + offset).x;

    // Approximate vertical with same values to reduce reads
    float up = right;
    float down = left;

    float dH = right + left - 2.0 * pressure;
    float dV = up + down - 2.0 * pressure;

    pVel += delta * 0.25 * (dH + dV);
    pressure += delta * pVel;

    pVel -= 0.005 * delta * pressure;
    pVel *= 1.0 - 0.002 * delta;
    pressure *= 0.999;

    // Ripple initialization
    if (frame < 2) {
        vec2 deltaUV = uv - 0.5;
        float distSq = dot(deltaUV, deltaUV);
        if (distSq < 0.25) {
            pressure += 2.5 * (1.0 - distSq * 2.0);
        }
    }

    // Mouse interaction
    if (mouse.x > 0.0) {
        vec2 mouseUV = mouse / resolution;
        vec2 diff = uv - mouseUV;
        float distSq = dot(diff, diff);
        if (distSq < 0.0004) {
            float dist = sqrt(distSq);
            float softness = smoothstep(0.02, 0.005, dist);
            pressure += 1.2 * softness;
        }
    }

    gl_FragColor = vec4(pressure, pVel, (right - left) * 0.5, (up - down) * 0.5);
}
`;


const renderVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const renderFragmentShader = `
precision mediump float;

uniform sampler2D textureA;
uniform float time;

varying vec2 vUv;

const vec3 customGreen = vec3(0.7, 1.0, 0.3);
const vec3 customBlue = vec3(1.0, 0.5, 0.6);

void main() {
    vec4 data = texture2D(textureA, vUv);
    vec3 normal = normalize(vec3(-data.z, 0.2, -data.w));

    float t = time * 3.0;
    vec2 timeOffset = 0.00014 * vec2(sin(t), sin(t * 0.43));

    vec2 offset = normal.xz;
    vec2 offsetG = 0.024 * offset - timeOffset;
    vec2 offsetB = 0.022 * offset + timeOffset;

    // Cache texture reads
    float g = texture2D(textureA, vUv + offsetG).g;
    float b = texture2D(textureA, vUv + offsetB).b;

    vec3 rippleColor = g * customGreen + b * customBlue;
    float alpha = max(g, b) * 0.9;

    gl_FragColor = vec4(rippleColor, alpha);
}
`;

document.addEventListener("DOMContentLoaded", async () => {
    const canvas = document.getElementById('glcanvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    // 🚀 **Power Preference Optimization**
    const powerPref = window.innerWidth < 768 ? "low-power" : "high-performance";
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: false, // 🔥 Turn off AA for better mobile performance
        alpha: true,
        preserveDrawingBuffer: false,
        powerPreference: powerPref,
    });

    const scene = new THREE.Scene();
    const simScene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 🚀 **Dynamic DPR (Limits on Mobile)**
    const isMobile = window.innerWidth < 768;
    const dpr = isMobile ? 1.25 : Math.min(window.devicePixelRatio, 2);
    let width = Math.floor(window.innerWidth * dpr);
    let height = Math.floor(window.innerHeight * dpr);

    // 🚀 **Lower Resolution on Mobile**
    const simResFactor = isMobile ? 3 : 2;
    const simWidth = Math.floor(width / simResFactor);
    const simHeight = Math.floor(height / simResFactor);

    renderer.setPixelRatio(dpr);
    renderer.setSize(simWidth, simHeight, false);

    // 🚀 **Optimize Render Targets (Lower Res on Mobile)**
    const options = {
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        stencilBuffer: false,
        depthBuffer: false,
    };

    let rtA = new THREE.WebGLRenderTarget(simWidth, simHeight, options);
    let rtB = new THREE.WebGLRenderTarget(simWidth, simHeight, options);

    const simMaterial = new THREE.ShaderMaterial({
        uniforms: {
            textureA: { value: null },
            mouse: { value: new THREE.Vector2(-10, -10) },
            resolution: { value: new THREE.Vector2(simWidth, simHeight) },
            time: { value: 0 },
            frame: { value: 0 },
        },
        vertexShader: simulationVertexShader,
        fragmentShader: simulationFragmentShader,
    });

    const renderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            textureA: { value: null },
            time: { value: 0 },
        },
        vertexShader: renderVertexShader,
        fragmentShader: renderFragmentShader,
        transparent: true,
        depthWrite: false,
    });

    const plane = new THREE.PlaneGeometry(2, 2);
    const simQuad = new THREE.Mesh(plane, simMaterial);
    const renderQuad = new THREE.Mesh(plane, renderMaterial);

    simScene.add(simQuad);
    scene.add(renderQuad);

    let frame = 0;
    let lastTouchTime = 0;

    // ✅ **Optimized Mouse & Touch Mapping**
    function updateMousePosition(clientX, clientY) {
        const rect = renderer.domElement.getBoundingClientRect();

        let x = (clientX - rect.left) / rect.width;
        let y = 1.0 - (clientY - rect.top) / rect.height; // Flip Y

        x *= simWidth;
        y *= simHeight;

        simMaterial.uniforms.mouse.value.set(x, y);
    }

    // ✅ **Optimized Event Listeners (Touch Throttling)**
    function handleTouchMove(e) {
        e.preventDefault();
        const now = performance.now();
        if (now - lastTouchTime < 16) return; // 60 FPS limit
        lastTouchTime = now;
        if (e.touches.length > 0) {
            updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
        }
    }

    renderer.domElement.addEventListener("mousemove", (e) => {
        updateMousePosition(e.clientX, e.clientY);
    });

    renderer.domElement.addEventListener("mouseleave", () => {
        simMaterial.uniforms.mouse.value.set(-10, -10);
    });

    renderer.domElement.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
        }
    });

    renderer.domElement.addEventListener("touchmove", handleTouchMove);
    renderer.domElement.addEventListener("touchend", () => {
        simMaterial.uniforms.mouse.value.set(-10, -10);
    });

    // ✅ **Resize Event Handling**
    window.addEventListener("resize", () => {
        width = Math.floor(window.innerWidth * dpr);
        height = Math.floor(window.innerHeight * dpr);

        const simWidth = Math.floor(width / simResFactor);
        const simHeight = Math.floor(height / simResFactor);

        renderer.setSize(simWidth, simHeight, false);
        rtA.setSize(simWidth, simHeight);
        rtB.setSize(simWidth, simHeight);

        simMaterial.uniforms.resolution.value.set(simWidth, simHeight);
        frame = 0;
    });

    // ✅ **Animation Loop**
    const animate = () => {
        simMaterial.uniforms.frame.value = frame++;
        simMaterial.uniforms.time.value = performance.now() / 1000;
        simMaterial.uniforms.textureA.value = rtA.texture;

        renderer.setRenderTarget(rtB);
        renderer.render(simScene, camera);

        renderMaterial.uniforms.textureA.value = rtB.texture;
        renderMaterial.uniforms.time.value = performance.now() / 1000;

        renderer.setRenderTarget(null);
        renderer.render(scene, camera);

        [rtA, rtB] = [rtB, rtA];

        requestAnimationFrame(animate);
    };

    animate();
});



const textContainer = document.getElementById("scroll-down");

// Only apply animations if on a large screen
if (window.innerWidth >= 1000) {
    applyTextEffects();
}

function applyTextEffects() {
  

    const spans = document.querySelectorAll("#scroll-down span");
    let lastUpdate = 0;

    function handleMouseMove(e) {
        if (performance.now() - lastUpdate < 50) return; // Limit updates to ~20 FPS
    lastUpdate = performance.now();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const middleScreenX = screenWidth / 2;
        const middleScreenY = screenHeight / 2;

        spans.forEach((span, index) => {
            const letterRect = span.getBoundingClientRect();
            const letterCenterX = letterRect.left + letterRect.width / 2;
            const letterCenterY = letterRect.top + letterRect.height / 2;

            const distanceFromMouseX = Math.abs(letterCenterX - mouseX);
            const distanceFromMouseY = Math.abs(letterCenterY - mouseY);

            const strokeThickness = Math.floor(((middleScreenX - distanceFromMouseX) / middleScreenX) * 8) + 1;
            const finalStroke = Math.min(9, Math.max(1, strokeThickness));
            span.style.webkitTextStrokeWidth = `${finalStroke}px`;

            const weight = Math.floor(((middleScreenY - distanceFromMouseY) / middleScreenY) * 400) + 100;
            let offset = (index / spans.length) * 300;
            span.style.fontVariationSettings = `'wght' ${Math.min(400, Math.max(100, weight + offset))}`;

            const scaleSize = 1 + (finalStroke / 30);
            span.style.transform = `scale(${scaleSize})`;

            const spacing = finalStroke * 1;
            span.style.marginRight = `${spacing}px`;

            const shadowIntensity = Math.max(0, (middleScreenX - distanceFromMouseX) / middleScreenX);
            span.style.textShadow = shadowIntensity > 0.1
                ? `rgba(123, 123, 123, ${shadowIntensity}) -1px -1px ${6 * shadowIntensity}px,
                   rgba(110, 110, 110, ${shadowIntensity}) -1px -1px ${12 * shadowIntensity}px,
                   rgba(122, 122, 122, ${shadowIntensity}) -1px -1px ${30 * shadowIntensity}px`
                : "none";
        });
    }

    document.addEventListener("mousemove", handleMouseMove);
}

// Function to handle scroll action when user clicks
function handleScrollDown() {
    const nextDiv = document.querySelector('#bo');
    if (nextDiv) {
        nextDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

// Add event listener for click



const boDiv = document.querySelector('#bo');
const container2 = document.querySelector('#glcanvas');
const next = document.querySelector('#next');
const gridContainer = document.getElementById('boall');
const gridItems = document.querySelectorAll('.boagrid');





function applyH1GlitchEffect() {
  const h1Elements = document.querySelectorAll('h1');
  
  h1Elements.forEach(h1 => {
      // Create SVG wrapper
      const svgWrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svgWrapper.setAttribute('class', 'h1-glitch-svg');
      svgWrapper.setAttribute('width', '100%');
      svgWrapper.setAttribute('height', '100%');
      svgWrapper.style.position = 'absolute';
      svgWrapper.style.top = '0';
      svgWrapper.style.left = '0';
      svgWrapper.style.pointerEvents = 'none';

      // Create defs for filter
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      const filterId = `h1-turb-${Math.random().toString(36).substr(2, 9)}`;
      filter.setAttribute('id', filterId);

      // Turbulence with animation
      const feTurbulence = document.createElementNS("http://www.w3.org/2000/svg", "feTurbulence");
      feTurbulence.setAttribute('type', 'fractalNoise');
      feTurbulence.setAttribute('baseFrequency', '0.01 0.01');
      feTurbulence.setAttribute('numOctaves', '2');
      feTurbulence.setAttribute('result', 'turbulence');
      
      // Animate base frequency
      const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      animate.setAttribute('attributeName', 'baseFrequency');
      animate.setAttribute('attributeType', 'XML');
      animate.setAttribute('values', '0.01 0.01; 0.05 0.03; 0.01 0.01');
      animate.setAttribute('dur', '120s');
      animate.setAttribute('repeatCount', 'indefinite');

      // Displacement Map
      const feDisplacementMap = document.createElementNS("http://www.w3.org/2000/svg", "feDisplacementMap");
      feDisplacementMap.setAttribute('xChannelSelector', 'R');
      feDisplacementMap.setAttribute('yChannelSelector', 'G');
      feDisplacementMap.setAttribute('in', 'SourceGraphic');
      feDisplacementMap.setAttribute('in2', 'turbulence');
      feDisplacementMap.setAttribute('scale', '15');

      // Assemble the filter
      feTurbulence.appendChild(animate);
      filter.appendChild(feTurbulence);
      filter.appendChild(feDisplacementMap);
      defs.appendChild(filter);
      svgWrapper.appendChild(defs);

      // Wrap h1 in a relative positioned container
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      //wrapper.style.pointerEvents = 'none';
      h1.parentNode.insertBefore(wrapper, h1);
      wrapper.appendChild(h1);
      wrapper.appendChild(svgWrapper);

      // Apply filter
      h1.style.filter = `url(#${filterId})`;

    
   
  });
}

// Call the function when the page loads
window.addEventListener('load', applyH1GlitchEffect);







document.addEventListener("DOMContentLoaded", function() {
  var videos = document.querySelectorAll('video'); // Select all video elements
  var flElement = document.querySelector('.fl');

  if (videos.length > 0 && flElement) {
    videos.forEach(function(video) {
      video.addEventListener('mousemove', function(e) {
        flElement.style.display = 'block';
        flElement.style.left = e.pageX + 10 + 'px'; // 10px offset for better visibility
        flElement.style.top = e.pageY + 10 + 'px'; // 10px offset for better visibility
      });

      video.addEventListener('mouseleave', function() {
        flElement.style.display = 'none';
      });
    });
  } else {
    console.error('No video elements or the .fl element are not found in the DOM.');
  }
});





////


const typewriter = document.querySelector(".bio");


function toggleAnimation() {
  if (typewriter.classList.contains("animation")) {
    typewriter.classList.remove("animation");
    setTimeout(startAnimation, 500);
  } else {
    startAnimation();
  }
}

function startAnimation() {
  typewriter.classList.add("animation");
}





const container1 = document.querySelector('#rec .cent');
const video = document.querySelectorAll('.mot');






      next.addEventListener('mouseover', () => {
         container1.style.filter = "brightness(1.8) grayscale(0.8) blur(18px)";
         //container1.style.filter = "brightness(1) blur(18px)";
          container1.style.transition = "filter 0.6s ease";
         // container2.style.filter = "brightness(1.8) blur(18px)";
         container2.style.filter = "brightness(1.2) blur(13px)";
          container2.style.transition = "filter 0.6s ease";
       
          
      });
      
      next.addEventListener('mouseleave', () => {
         //container1.style.filter = "brightness(1.8) grayscale(0.8) opacity(0.6) drop-shadow(4px 4px 6px rgba(255, 255, 255, 0.745))";
          container1.style.filter = "brightness(1.8) grayscale(0.8) opacity(0.6) drop-shadow(4px 4px 6px rgba(255, 255, 255, 0.745))";
          container2.style.filter = "opacity(1) brightness(1.1)";

      });





// Add hover listeners to dynamically resize grid
gridItems.forEach(item => {
  item.addEventListener('mouseenter', () => {
    applyHoverEffect(item);
  });

  item.addEventListener('mouseleave', () => {
    resetGrid();
  });
});

function applyHoverEffect(hoveredItem) {
  switch (hoveredItem.classList[1]) {
    case 'a':
      gridContainer.style.gridTemplateRows = '1fr 1fr 4fr';
      gridContainer.style.gridTemplateColumns = '1fr 0.5fr 2fr';
      break;
    case 'b':
      gridContainer.style.gridTemplateRows = '2fr 1fr 1fr';
      gridContainer.style.gridTemplateColumns = '0.5fr 0.5fr 1fr';
      break;
    case 'c':
      gridContainer.style.gridTemplateRows = '1fr 0.5fr 1fr';
      gridContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
      break;
      case 'd':
        gridContainer.style.gridTemplateRows = '2fr 1fr 1fr';
        gridContainer.style.gridTemplateColumns = '1fr 0.5fr 1fr';
        break;
    case 'e':
      gridContainer.style.gridTemplateRows = '0.5fr 2fr 1fr';
      gridContainer.style.gridTemplateColumns = '0.1fr 0.5fr 1fr';
      break;
    case 'g':
      gridContainer.style.gridTemplateRows = '1fr 1fr 2fr';
      gridContainer.style.gridTemplateColumns = '1fr 0.25fr 1fr';
      break;
    case 'f':
        gridContainer.style.gridTemplateRows = '1fr 0.5fr 1fr';
        gridContainer.style.gridTemplateColumns = '1fr 0.5fr 1fr';
        break;
    default:
      resetGrid();
      break;
  }
}

function resetGrid() {
  gridContainer.style.transition = 'all 0.3s ease';
  gridContainer.style.gridTemplateRows = '1fr 0.5fr 1fr';
  gridContainer.style.gridTemplateColumns = '1fr 0.5fr 1fr';
}


document.addEventListener("DOMContentLoaded", () => {
  const hoverImage = document.getElementById("hover-image");

  // Add hover listeners to all new-item elements
  document.querySelectorAll("#new").forEach(item => {
      item.addEventListener("mouseenter", (event) => {
        const imageSrc = item.getAttribute("data-img");
        if (imageSrc) { // Check if imageSrc exists
          hoverImage.src = imageSrc; // Set the image source
          hoverImage.style.display = "block"; // Show the image
      } else {
          console.error("No data-img attribute found for this item:", item);
      }
      });

      item.addEventListener("mouseleave", () => {
          hoverImage.style.display = "none"; // Hide the image
      });

      item.addEventListener("mousemove", (event) => {
          // Position the image near the cursor
          hoverImage.style.left = `${event.pageX + 10}px`;
          hoverImage.style.top = `${event.pageY - 10}px`;
      });
  });
});


function handleGridVisibility() {
  if (window.innerWidth <= 1024) {
    // Always show grid items for small screens
    gridItems.forEach((item) => {
      item.classList.add("visible");
    });
  } else {
    // Ensure grid starts hidden for large screens
    gridItems.forEach((item) => {
      item.classList.remove("visible");
    });
  }
}

// Attach hover event only for large screens
boDiv.addEventListener("mouseenter", () => {
  if (window.innerWidth > 1024) {
    revealGrid();
  }
});

// Run on page load
handleGridVisibility();

// Recheck when window is resized
window.addEventListener("resize", handleGridVisibility);


function revealGrid() {
  gridItems.forEach((item, index) => {
    if (window.innerWidth <= 1024) {
      // Instantly make items visible on small screens
      item.classList.add("visible");
    } else {
      // Staggered reveal animation on larger screens
      setTimeout(() => {
        item.classList.add("visible");
      }, index * 450);
    }
  });
}





