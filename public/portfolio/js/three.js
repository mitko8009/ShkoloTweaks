import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';

if ( WebGL.isWebGLAvailable() ) {
    
    async function loadShader(url) {
        const response = await fetch(url);
        return await response.text();
    }
    
    async function init() {
        const vertexShader = await loadShader('../shaders/vertexShader.glsl');
        const fragmentShader = await loadShader('../shaders/fragmentShader.glsl');
    
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(25, 16 / 9, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
    
        const uniforms = {
            iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
            iTime: { value: 0 },
            iMouse: { value: new THREE.Vector4() }
        };
    
        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            transparent: true
        });
    
        const geometry = new THREE.PlaneGeometry(16, 9);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    
        camera.position.z = 10;
    
        function animate() {
            uniforms.iTime.value += 0.006;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }
    
        animate();
    
        window.addEventListener('mousemove', (event) => {
            uniforms.iMouse.value.x = event.clientX;
            uniforms.iMouse.value.y = window.innerHeight - event.clientY;
        });
    
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            uniforms.iResolution.value.set(width, height, 1);
        });
    }
    
    init();

} else {

	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById( 'container' ).appendChild( warning );

}
