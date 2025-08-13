import * as THREE from 'https://unpkg.com/three@0.139.2/build/three.module.js';
import { GLTFLoader } from "./GLTFLoader.js";
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';



class SceneManager {
    constructor() {
        this.container = document.getElementById('model');
        this.canvas = document.querySelector('.webgl');
        this.scene = new THREE.Scene();
        this.root1 = null;
        this.circle = null;
        this.circle1 = null;
        this.activeIndex = 0;
        this.activeIndex1 = 0; // Manage active box index
        this.activeIndex2 = 0; // Manage active bebe index
        this.activeIndex3 = 0;
        this.points = [];
        this.isHovering = false; // Track hover state
        this.autoLoopTimeout = null; // Store timeout reference
        this.lastAutoSwitchTime = 0;

        this.initScene();
    }

    initScene() {
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.loadModel();
        this.createCircles();
        this.setupControls();
        this.setupEventListeners();
    }

    setupCamera() {
        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        this.camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000);
        this.camera.position.set(0, 3, 14);
        this.camera.lookAt(this.scene.position);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGL1Renderer({
            antialias: true,  // Smooth edges
            canvas: this.canvas,
            alpha: true,      // Transparent background
            
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 4));
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.renderer.physicallyCorrectLights = true;
        this.renderer.shadowMap.enabled = false;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
        this.renderer.setClearColor(0xffffff, 0);
        this.renderer.gammaOutput = true;


    }

    setupLighting() {
          // Ambient light for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2); // Reduced intensity
    this.scene.add(ambientLight);

    // Directional light to create shadows and depth
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1); 
    directionalLight.position.set(-5, 10, 7); // Adjust position for better lighting
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Additional point light for more depth
    const pointLight = new THREE.PointLight(0xFFFFFF, 2, 100);
    pointLight.position.set(-10, -10, -10);
    this.scene.add(pointLight);
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load('./ava.glb', (glb) => {
            this.root1 = glb.scene;
            this.adjustRootScale();
            this.root1.rotation.y = -0.7;
            this.root1.rotation.x = 0.05;
            
            this.root1.position.y = -4;
           
            this.root1.name = "root1";
            this.root1.visible = true;
 // Advanced model optimization
 this.root1.traverse((child) => {
    if (child.isMesh) {
        // Optimize mesh rendering
        child.frustumCulled = true; // Improve rendering performance
        
        // Material optimizations
        if (child.material) {
            child.material.needsUpdate = true;
            child.material.blending = THREE.NormalBlending;
            child.material.roughness = 0.3; // Adjust this value as needed
                        
                        // Ensure the material updates
                        child.material.needsUpdate = true;
            
            // Handle potential transparency issues
            if (child.material.transparent) {
                child.material.opacity = 0.8;
            }
        }
        
        // Ensure proper normals for smooth rendering
        child.geometry.computeVertexNormals();
    }
});
            this.root1.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            this.scene.add(this.root1);
            this.setupHoverEffects();
        }, 
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + "% loaded");
        }, 
        (error) => {
            console.error("An error occurred while loading the model", error);
        });
    }

    calculateRadius() {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 768;
        const shouldReduce = isTouchDevice || isSmallScreen;
    
        const minDimension = Math.min(window.innerWidth / 1.25, window.innerHeight / 1.25);
        const scale = shouldReduce ? 0.5 : 1;
    
        return minDimension * 0.016 * scale;
    }

    updateCirclePoints() {
        const radius = this.calculateRadius();
        const segments = 64;
        this.points = [];

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * 2 * Math.PI;
            this.points.push(new THREE.Vector3(
                radius * Math.cos(theta), 
                radius * Math.sin(theta), 
                0
            ));
        }

        if (this.circle) this.circle.geometry.setFromPoints(this.points);
        if (this.circle1) this.circle1.geometry.setFromPoints(this.points);
    }

    createCircles() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({ color: 0x292929 });

        this.updateCirclePoints();

        this.circle = new THREE.LineLoop(geometry, material);
        this.circle.rotation.x = Math.PI / -2.25;
        this.circle.rotation.y = Math.PI / -8;
        this.circle.scale.set(0.4, 0.4, 0.4);
        this.circle.position.y = 1;

        this.scene.add(this.circle);

        this.circle1 = new THREE.LineLoop(geometry, material);
        this.circle1.rotation.x = Math.PI / -2.25;
        this.circle1.rotation.y = Math.PI / -8;
        this.circle1.scale.set(0.4, 0.4, 0.4);
        this.circle1.position.y = 1;
        this.scene.add(this.circle1);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.autoRotate = false;
        this.controls.enableZoom = false;
        this.controls.enableRotate = true;
    
        // Prevent OrbitControls from capturing unintended touch gestures
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };
    
        // Ensure scrolling outside the canvas still works
        this.renderer.domElement.style.touchAction = "none"; // Prevents browser gestures from blocking controls
    
        let touchStartY = 0;
        let touchEndY = 0;
        let isTouchScrolling = false;
    
        // Detect touch start
        window.addEventListener("touchstart", (e) => {
            touchStartY = e.touches[0].clientY;
        });
    
        // Detect touch move
        window.addEventListener("touchmove", (e) => {
            touchEndY = e.touches[0].clientY;
            const deltaY = touchStartY - touchEndY;
    
            if (Math.abs(deltaY) > 30) {
                isTouchScrolling = true;
                this.controls.enabled = false; // Disable controls during scrolling
            }
        });
    
        // Re-enable controls after touch ends
        window.addEventListener("touchend", () => {
            setTimeout(() => {
                isTouchScrolling = false;
                this.controls.enabled = true;
            }, 200);
        });
    
        // Prevent OrbitControls from capturing scroll events when not over canvas
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };
    
        // Ensure scroll events propagate outside the canvas
        this.renderer.domElement.addEventListener("wheel", (event) => {
            if (!event.target.closest("canvas")) {
                event.stopPropagation();
            }
        }, { passive: false });
    }
    
    

    setupHoverEffects() {
        const hoverRotations = {
            's1': -0.7,
            's2': 0.5,
            's3': 1.8,
            's4': 3.5
        };
    
        // Hover for the main1 buttons
        Object.keys(hoverRotations).forEach(selector => {
            $(`#${selector}`).hover(
                () => {
                    this.isHovering = true;
                    if (this.root1) {
                        if (this.autoLoopTimeout) {
                            clearTimeout(this.autoLoopTimeout);  // Clear auto-loop while hovering
                        }
                     ;
    
                        // Activate corresponding elements
                        const buttons = document.querySelectorAll('.main1');
                        const boxs = document.querySelectorAll('.main2');
                        const bebes = document.querySelectorAll('.bebe');
    
                        buttons.forEach(button => button.classList.remove('active'));
                        boxs.forEach(box => box.classList.remove('active'));
                        bebes.forEach(bebe => bebe.classList.remove('active'));
    
                        const index = Object.keys(hoverRotations).indexOf(selector);
                        buttons[index].classList.add('active');
                        boxs[index].classList.add('active');
                        bebes[index].classList.add('active');
                    }
                },
                () => {
                    this.isHovering = false;
                    this.startHoverLoop(); // Restart the auto-loop after hover
                }
            );
        });
    
         // Hover for the main2 elements
         const main2Container = document.querySelector('.main2');
         const main2Elements = document.querySelectorAll('.main2 .op1');
         

         main2Elements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                this.isHovering = true; // Stop auto-switching
                if (this.autoLoopTimeout) {
                    clearTimeout(this.autoLoopTimeout); // Prevent auto-loop while hovering
                }
    
                // Deactivate all and activate the hovered element
                main2Elements.forEach(el => el.classList.remove('active'));
                element.classList.add('active');
            });
    
            element.addEventListener('mouseleave', () => {
                this.isHovering = false; // Resume auto-switching
                this.startHoverLoop(); // Restart auto-loop
            });
        });
 // Handle when mouse leaves the entire main2 container
 if (main2Container) {
    main2Container.addEventListener('mouseleave', () => {
        main2Elements.forEach(el => el.classList.remove('active')); // Clear active state
        this.isHovering = false; // Reset hover state
        this.startHoverLoop(); // Restart auto-loop
    });
}
     
         this.startHoverLoop(); // Start the loop initially
     }
     

    resetButtonActiveState() {
        // Reset the active state of all buttons
        const buttons = document.querySelectorAll('.main1');
        buttons.forEach(button => {
            button.classList.remove('active');
        });
    }






    
    startHoverLoop() {
        let currentHoverIndex = 2;
        const hoverRotations = {
            's1': -0.7,
            's2': 0.5,
            's3': 1.8,
            's4': 3.5
        };
        const hoverKeys = Object.keys(hoverRotations);
    
        const loopHoverEffects = () => {
            // Only proceed with the loop if not hovering
            if (!this.isHovering && this.root1) {
                const currentSelector = hoverKeys[currentHoverIndex];
    
               ;
    
                currentHoverIndex = (currentHoverIndex + 1) % hoverKeys.length;
            }
    
            // Repeat the loop after 4 seconds
            this.autoLoopTimeout = setTimeout(loopHoverEffects, 8000);
        };
    
        loopHoverEffects();
    }

    autoSwitchButton() {
        if (this.isHovering) return;  // Skip auto-switching if hovering
    
        const buttons = document.querySelectorAll('.main1');
        const boxs = document.querySelectorAll('.main2');
        const bebes = document.querySelectorAll('.bebe');
    
        // Remove the active class from the previous button, box, and bebe
        buttons[this.activeIndex].classList.remove('active');
        boxs[this.activeIndex].classList.remove('active');
        bebes[this.activeIndex].classList.remove('active');
    
        // Increment active index and loop back to 0 if it exceeds the length
        this.activeIndex = (this.activeIndex + 1) % buttons.length;
    
        // Add the active class to the next button, box, and bebe
        buttons[this.activeIndex].classList.add('active');
        boxs[this.activeIndex].classList.add('active');
        bebes[this.activeIndex].classList.add('active');

        this.autoLoopTimeout = setTimeout(() => this.autoSwitchButton(), 8000);

        this.positionArrow();
       ;
    }
    

    positionArrow() {
        const arrow = document.querySelector('.arrow');
        const buttonPoints = [32, 52, 2, 18]; // Make sure this matches actual button indexes
        const pointIndex = buttonPoints[this.activeIndex]; // Ensure activeIndex is correctly used
    
        // Safety check to prevent errors
        if (!this.points[pointIndex]) return;
    
        const vector = this.points[pointIndex].clone();
        vector.applyMatrix4(this.circle1.matrixWorld);
        vector.project(this.camera);
    
        const x = (vector.x * 0.5 + 0.5) * this.container.clientWidth;
        const y = (vector.y * -0.5 + 0.5) * this.container.clientHeight;
    
        arrow.style.left = `${x}px`;
        arrow.style.top = `${y}px`;
    }
    


 adjustRootScale() {
        if (this.root1) {
            const isSmallScreen = window.innerWidth < 500;
            this.root1.scale.set(isSmallScreen ? 2 : 3, isSmallScreen ? 2 : 3, isSmallScreen ? 2 : 3);
            this.root1.position.set(
                isSmallScreen ? 0 : -0.3, 
                isSmallScreen ? -2 : -3, 
                0
            );
        }
    }

    adjustCircleScale() {
        if (this.circle) {
            const isSmallScreen = window.innerWidth < 500;
            this.circle.scale.set(isSmallScreen ? 0.8 : 0.4, isSmallScreen ? 0.8 : 0.4, isSmallScreen ? 0.8 : 0.4);
            
        }
    }





    setupEventListeners() {
        window.addEventListener('resize', this.handleResize.bind(this));
        this.positionButtons();
        this.animate();
    }

    handleResize() {
        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        this.camera.aspect = sizes.width / sizes.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(sizes.width, sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.updateCirclePoints();
        this.positionButtons();
        this.positionArrow();
        this.adjustRootScale();
        this.adjustCircleScale();
    }

   


    positionButtons() {
        const buttons = document.querySelectorAll('.main1');
        const boxs = document.querySelectorAll('.main2');
        const buttonPoints = [32, 52, 2, 18];

        buttonPoints.forEach((pointIndex, i) => {
            const vector = this.points[pointIndex].clone();
            vector.applyMatrix4(this.circle.matrixWorld);
            vector.project(this.camera);

            const x = (vector.x * 0.5 + 0.5) * this.container.clientWidth;
            const y = (vector.y * -0.5 + 0.5) * this.container.clientHeight;

            const x1 = x - 40;
            const y1 = y + 20;

            buttons[i].style.left = `${x}px`;
            buttons[i].style.top = `${y}px`;

            boxs[i].style.left = `${x1}px`;
            boxs[i].style.top = `${y1}px`;
        });
    }
    
    positionArrow() {
        const arrow = document.querySelector('.arrow');
        const buttonPoints = [32, 52, 2, 18]; // Ensure this is the correct mapping for buttons
    
        if (this.activeIndex >= buttonPoints.length) {
            console.warn("Active index out of bounds for buttonPoints");
            return;
        }
    
        const pointIndex = buttonPoints[this.activeIndex];
        if (!this.points[pointIndex]) {
            console.warn("No point found at index", pointIndex);
            return;
        }
    
        const vector = this.points[pointIndex].clone();
        vector.applyMatrix4(this.circle1.matrixWorld);
        vector.project(this.camera);
    
        const x = (vector.x * 0.5 + 0.5) * this.container.clientWidth;
        const y = (vector.y * -0.5 + 0.5) * this.container.clientHeight;
    
        arrow.style.left = `${x}px`;
        arrow.style.top = `${y}px`;
    }
    

animate() {
        requestAnimationFrame(() => this.animate());
       
    const now = Date.now();
        if (!this.isHovering && now - this.lastAutoSwitchTime > 8000) {
            this.autoSwitchButton();
            this.lastAutoSwitchTime = now;
        }


        this.circle1.rotation.z += 0.008;
        this.updateCirclePoints();
        this.positionButtons();
        this.positionArrow();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.adjustRootScale();
        this.adjustCircleScale();
    }    


}




// Initialize the scene
const sceneManager = new SceneManager();
sceneManager.animate();


// Flag to track hover state globally

