import { animateEmissiveColor } from "../animations/animmate-emissive-color";
import { assignCanvasToMesh } from "./assign-canvas-to-mesh";
import { loadCanvasFromMesh } from "./load-canvas-from-mesh";

export function setEditingComponent(
  editingComponent,
  clickedMesh,
  fabricTexture,
  fabricCanvas,
  updateTexture,
  setEditingComponentName,
  animate,
  canvasSize
) {
  editingComponent.current = clickedMesh;
  if (animate) animateEmissiveColor(editingComponent.current, 400);
  //if (!editingComponent.current.userData.canvas) assignCanvasToMesh(editingComponent.current, canvasSize);
  setTimeout(() => {
    //loadCanvasFromMesh(editingComponent.current, fabricTexture, fabricCanvas, updateTexture);
    editingComponent.current.material.map = fabricTexture;
  }, 0);
  setEditingComponentName(editingComponent.current.name);
}
