import { copyCanvas } from "../canvas/copy-canvas";

export function loadCanvasFromMesh (mesh, texture, canvasRef, updateTexture) {
    copyCanvas(mesh.userData.canvas, canvasRef.current);
    updateTexture();
    mesh.material.map = texture;
}