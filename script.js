import {
    simulationVertexShader,
    simulationFragmentShader,
    renderVertexShader,
    renderFragmentShader,
} from "./shaders.js";

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

