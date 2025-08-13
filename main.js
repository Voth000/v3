
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





