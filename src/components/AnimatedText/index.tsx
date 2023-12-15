import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  OrbitControls,
  FontLoader,
  TextGeometry,
} from "three/examples/jsm/Addons.js";
import "./AnimatedText.scss";

const AnimatedText = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Canvas
    const canvas: HTMLCanvasElement | null = canvasRef.current;

    if (!canvas) return;

    // Scene
    const scene = new THREE.Scene();

    /**
     * Fonts
     */
    const fontLoader = new FontLoader();

    fontLoader.load("/fonts/helvetiker_regular.typeface.json", (font) => {
      const textGeometry = new TextGeometry("MP", {
        font: font,
        size: 1.5,
        height: 0.2,
        curveSegments: 16,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 4,
      });

      textGeometry.center();

      // Assign different colors based on the position along the axes
      const position = textGeometry.attributes.position;
      const colors = new Float32Array(position.count * 3);

      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);

        const color = new THREE.Color();
        color.setRGB(Math.abs(z), Math.abs(y), Math.abs(x));

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      textGeometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3)
      );

      const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1,
      });

      const text = new THREE.Mesh(textGeometry, material);
      scene.add(text);

      // Rotation based on cursor position
      canvas.addEventListener("mousemove", (event) => {
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

        text.rotation.x = mouseY * 2; // Adjust the rotation factor as needed
        text.rotation.y = mouseX * 2; // Adjust the rotation factor as needed
      });

      // Remove rotation on click
      canvas.addEventListener("click", () => {
        text.rotation.set(0, 0, 0);
      });
    });

    /**
     * Sizes
     */
    const sizes = {
      width: 300,
      height: 300,
    };

    window.addEventListener("resize", () => {
      // Update sizes
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      // Update renderer
      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Update camera
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
    });

    /**
     * Camera
     */
    const camera = new THREE.PerspectiveCamera(
      75,
      sizes.width / sizes.height,
      0.1,
      100
    );
    camera.position.set(0, 0, 2.5);
    scene.add(camera);

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = false;
    controls.enableZoom = false;

    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /**
     * Animate
     */
    const clock = new THREE.Clock();

    const tick = () => {
      // Update controls
      controls.update();

      // Render
      renderer.render(scene, camera);

      // Call tick again on the next frame
      window.requestAnimationFrame(tick);
    };

    tick();
  }, []);

  return (
    <div
      className="animatedText"
      style={{
        position: "fixed",
        top: "calc(50% - 30px)",
        left: "50%",
        transform: `translate(-50%, -50%)`,
        transition: `1s`,
        whiteSpace: "nowrap",
        transformStyle: "preserve-3d",
        fontSize: "200px",
      }}
    >
      <canvas ref={canvasRef} className="webgl"></canvas>
    </div>
  );
};

export default AnimatedText;
