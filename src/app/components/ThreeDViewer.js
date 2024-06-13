"use client";

//EXTERNAL LIBRARIES
import * as THREE from "three";
import { fabric } from "fabric";
import TWEEN from "@tweenjs/tween.js";

//REACT IMPORTS
import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

//IMAGES
import galeryIcon from "@/imgs/icons/galeryBlack.png";
import textIcon from "@/imgs/icons/textIcon.png";
import colorIcon from "@/imgs/icons/colorIcon.webp";
import abertoIcon from "@/imgs/icons/abertoIcon.png";
import fechadoIcon from "@/imgs/icons/fechadoIcon.png";
import model1 from "@/imgs/hoodie-options/3foto.png";
import model2 from "@/imgs/hoodie-options/5foto.png";
import model3 from "@/imgs/hoodie-options/2foto.png";
import model4 from "@/imgs/hoodie-options/4foto.png";
import model5 from "@/imgs/hoodie-options/1foto.png";
import buildingIcon from "@/imgs/icons/buildingIcon.png";
import shareIcon from "@/imgs/icons/iconShare.png";

//EXTERNAL FUNTIONS
//THREE
import { createSceneLayout } from "../actions/three/create-scene-layout";
import { loadGLBModel } from "../actions/three/load-glb-model";
import {
  getIntersection,
  getIntersections,
} from "../actions/three/get-intersections";
import { setEditingComponent } from "../actions/three/set-editing-component";
import { storeCanvasAndTexture } from "../actions/canvas/store-canvas-and-texture";

//CANVAS
import { uploadImage } from "../actions/canvas/upload-image";
import { setBGColor } from "../actions/canvas/set-bg-color";
import { selectImage } from "../actions/canvas/select-image";
import { addTextbox } from "../actions/canvas/add-textbox";
import { scaleOrRotateOrMove } from "../actions/canvas/scale-or-rotate";
import { scaleOrRotateOrMove2 } from "../actions/canvas/scale-rotate-or-move";
import { hdri } from "../actions/three/load-hdri";

//ANIMATIONS
import { animateEmissiveColor } from "../actions/animations/animmate-emissive-color";
import { magicLoading } from "../actions/animations/magic-loading";

//MISC
import { getPartName } from "../actions/misc/getPartName";
import { logAllObjectsFromAllCanvases } from "../actions/misc/log-all-objects-frm-all-canvases";
import { calculateArea } from "../actions/misc/calculate-area";

//COMPONENTS
import ImageEditor from "./ImageEditor";
import ColorEditor from "./ColorEditor";
import TextEditor from "./TextEditor";

//STYLE
import styles from "../../styles/threedviewer.module.css";

//FIREBASE
import { getActiveScene } from "../actions/firebasee/get-active-scene";
import { sendData } from "../actions/firebasee/send-data";
import { scaleRotateMove } from "../actions/canvas/scale-rotate-move-new";

const ThreeDViewer = () => {
  //VARIABLES//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //THREE
  let editingComponent = useRef(null);
  //const sceneLayoutRef = useRef(createSceneLayout());
  const sceneRef = useRef(null);
  /*const rendererRef = useRef(sceneLayoutRef.current.renderer);
  const cameraRef = useRef(sceneLayoutRef.current.camera);
  const orbitRef = useRef(sceneLayoutRef.current.orbit);*/
  let orbit;
  const [editingComponentName, setEditingComponentName] = useState("");
  const raycaster = new THREE.Raycaster();
  let currentMouse = new THREE.Vector2();
  let initialMouse = new THREE.Vector2();
  let initialMouseOut = useRef(null);
  let previousUVCursor = new THREE.Vector2();
  let currentUVCursor = new THREE.Vector2();
  let previousMouse = new THREE.Vector2();
  let initialUVCursor = new THREE.Vector2();
  const containerRef = useRef();
  const [fabricTexture, setFabricTexture] = useState(null);
  let selectedMesh = useRef(null);
  let isMouseOutsideModel = useRef(false);
  let allMeshes = useRef([]);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAbaOpen, setIsAbaOpen] = useState(false);

  //FABRIC
  let fabricCanvas = useRef(null);
  let objectRotation = useRef(0);
  const [activeObject, setActiveObject] = useState(null);
  const [canvasSize, setCanvasSize] = useState(480);
  let originalLeft = useRef(null);
  let originalTop = useRef(null);
  let originalOCoords = useRef(null);
  let textBoxWidth;
  let initialAngle;

  //CONTROL
  const [escolheBtn, setEscolheBtn] = useState(true);
  const [model, setModel] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [inputImage, setInputImage] = useState("");

  const editZoneRef = useRef(null);
  const editZoneRefChild = useRef(null);

  let isDragging = false;
  let selectImageResult;

  const [colorEditor, setColorEditor] = useState(false);
  const [imageEditor, setImageEditor] = useState(false);
  const [textEditor, setTextEditor] = useState(false);

  const [imageSrc, setImageSrc] = useState("");

  const backgroundMagic = useRef(null);
  const modelosZone = useRef(null);
  const modelos = useRef(null);
  const titleModels = useRef(null);

  const [fabricCanvases, setFabricCanvases] = useState([]);

  const [docId, setDocId] = useState("");

  const router = useRouter();

  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [forceClose, setForceClose] = useState(false);

  const [animatedPrice, setAnimatedPrice] = useState("0.00");

  const [success, setSuccess] = useState(false);

  const nextStep =
    clientData.name != "" &&
    clientData.email != "" &&
    clientData.phone != "" &&
    docId != "";

  const [allCanvasData, setAllCanvasData] = useState([]);

  const [windowWidth, setWindowWidth] = useState(0);

  // Style based on preview state
  const buttonStyle = {
    right: preview
      ? windowWidth < 750
        ? 110
        : 165
      : windowWidth < 750
      ? 25
      : 50,
    color: preview ? "#fff" : "#000",
    backgroundColor: preview ? "transparent" : "#fff",
  };

  let lastDUVRecorded = useRef(null);
  let lastDCursorRecorded = useRef(null);
  let lastDeltaUVRecorded = useRef(null);

  //TEXT EDITOR
  const [fillColor, setFillColor] = useState("#000000"); // Default color set to blue
  const [textAlign, setTextAlign] = useState("center");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(35);

  //BROWSER ADJUSTMENTS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isChrome =
      /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
    const isSafari = /Safari/.test(userAgent) && !isChrome;

    if (isSafari) {
      setCanvasSize(480);
    } else {
      setCanvasSize(1024);
    }

    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };

    updateWindowWidth();

    window.addEventListener("resize", updateWindowWidth);

    return () => {
      window.removeEventListener("resize", updateWindowWidth);
    };
  }, []);

  //IMAGE URL///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (activeObject && activeObject instanceof fabric.Image) {
      const imageSrc = activeObject.getSrc();
      setImageSrc(imageSrc);
      imageEditorTab();
    } else if (activeObject && activeObject instanceof fabric.Textbox) {
      textEditorTab();
    }
  }, [activeObject]);

  //LOAD CANVAS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    fabricCanvas.current = new fabric.Canvas("fabric-canvas", {
      width: canvasSize,
      height: canvasSize,
      backgroundColor: "#fff",
    });

    const texture = new THREE.CanvasTexture(fabricCanvas.current.getElement());
    texture.repeat.y = -1;
    texture.offset.y = 1;
    setFabricTexture(texture);

    return () => fabricCanvas.current.dispose();
  }, [canvasSize]);

  //MAIN USEEFFECT///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!fabricTexture) return;

    //CREATE SCENE
    const sceneLayout = createSceneLayout();
    const scene = sceneLayout.scene;
    sceneRef.current = scene;
    const renderer = sceneLayout.renderer;
    const camera = sceneLayout.camera;
    orbit = sceneLayout.orbit;
    containerRef.current.appendChild(renderer.domElement);

    const url =
      model == 1
        ? "/glbs/meshes/hoodie11.glb"
        : model == 2
        ? "/glbs/meshes/1.glb"
        : model == 3
        ? "/glbs/meshes/2.glb"
        : model == 4
        ? "/glbs/meshes/3.glb"
        : model == 5
        ? "/glbs/meshes/4.glb"
        : null;

    //if (model == 1 || model == 2 || model == 3 || model == 4 || model == 5)
    loadGLBModel(
      "/newWallet.glb",
      scene,
      setIsLoading,
      renderer,
      allMeshes,
      () => {}
    );

    const animate = () => {
      requestAnimationFrame(animate);
      TWEEN.update();
      orbit.update();

      renderer.render(scene, camera);
    };
    animate();

    //FUNCTIONS//////////////////////////////////////////////////////////////////////////
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //ACTIONS////////////////////////////////////////////////////////////////////////////
    function onMouseDown(e) {
      const isTouchEvent = e.type.includes("touch");
      const x = isTouchEvent ? e.touches[0].clientX : e.clientX;
      const y = isTouchEvent ? e.touches[0].clientY : e.clientY;

      initialMouse = new THREE.Vector2(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1
      );
      const intersections = getIntersections(
        raycaster,
        camera,
        scene,
        initialMouse
      );

      //INTERSETA
      if (intersections.length > 0) {
        //orbit.enabled = false;
        const intersectionResult = intersections[0];
        const clickedMesh = intersectionResult.object;
        selectedMesh.current = clickedMesh;

        if (!colorEditor) {
          closeEditor();
        }

        //mesh.morphTargetInfluences[0] = 0;

        // Make the transition smooth

        scene.children.forEach((child) => {
          if (child instanceof THREE.Group) {
            child.children.forEach((mesh) => {
              console.log(mesh);
              mesh.material.emissive.setRGB(0, 0, 0);
            });
          }
        });

        let animate = false;
        //EXISTE EDITING COMPONENT ATIVO
        if (
          editingComponent.current &&
          editingComponent.current != clickedMesh
        ) {
          closeAllTabs();
          storeCanvasAndTexture(
            editingComponent,
            fabricCanvas.current,
            canvasSize,
            setFabricCanvases,
            fabricCanvases
          );
          animate = true;
          setEditingComponent(
            editingComponent,
            clickedMesh,
            fabricTexture,
            fabricCanvas,
            updateTexture,
            setEditingComponentName,
            animate,
            canvasSize
          );
        }
        if (!editingComponent.current) {
          animate = true;
          setEditingComponent(
            editingComponent,
            clickedMesh,
            fabricTexture,
            fabricCanvas,
            updateTexture,
            setEditingComponentName,
            animate,
            canvasSize
          );
        }

        /*setTimeout(() => {
          selectImageResult = selectImage(
            intersectionResult,
            previousUVCursor,
            previousMouse,
            fabricCanvas,
            objectRotation,
            initialUVCursor,
            updateTexture,
            canvasSize,
            originalLeft,
            originalTop,
            originalOCoords
          );
          const selectedObject = fabricCanvas.current.getActiveObject();

          if (selectedObject) {
            isDragging = true;
            orbit.enabled = false;
            objectRotation.current = selectedObject.angle;
            initialAngle = selectedObject.angle;
            setActiveObject(selectedObject);
            textBoxWidth = selectedObject.width;

            if (selectedObject instanceof fabric.Image) {
              imageEditorTab();
            } else if (selectedObject instanceof fabric.Textbox) {
              textEditorTab();
            }
          } else {
            setActiveObject(null);
            editZoneRefChild.current.style.opacity = "1";
            setForceClose(true);
            setTimeout(() => {
              closeAllTabs();
            }, 100);
          }
        }, 10);*/

        openEditor();

        //NÃO INTERSETA
      } /*else {
        if (editingComponent.current)
          storeCanvasAndTexture(
            editingComponent,
            fabricCanvas.current,
            canvasSize,
            setFabricCanvases,
            fabricCanvases
          );
        closeEditor();
        setTimeout(() => {
          editingComponent.current = null;
          fabricCanvas.current.discardActiveObject();
          fabricCanvas.current.renderAll();
          setActiveObject(null);
        }, 10);

        editZoneRefChild.current.style.opacity = "1";
      }*/
    }

    /*const onMouseMove = (e) => {
      if (!isDragging) return;

      const x = e.clientX;
      const y = e.clientY;
      handleMove(x, y);
    };

    const onTouchMove = (e) => {
      if (e.touches.length > 0) {
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        handleMove(x, y);
      }
    };

    const handleMove = (x, y) => {
      if (!isDragging || orbit.enabled) return;
      orbit.enabled = false;

      scaleRotateMove(
        x,
        y,
        initialMouse,
        previousMouse,
        currentMouse,
        initialMouseOut,
        initialUVCursor,
        previousUVCursor,
        currentUVCursor,
        editingComponent,
        raycaster,
        camera,
        isMouseOutsideModel,
        fabricCanvas,
        objectRotation,
        updateTexture,
        selectImageResult,
        canvasSize,
        originalLeft,
        originalTop,
        originalOCoords,
        textBoxWidth,
        initialAngle,
        lastDUVRecorded,
        lastDCursorRecorded,
        lastDeltaUVRecorded,
        orbit
      );
    };

    function onMouseUp(e) {
      isDragging = false;
      orbit.enabled = true;
      isMouseOutsideModel.current = false;
      fabricCanvas.current.forEachObject((obj, index) => {
        if (obj.selectable == false) {
          fabricCanvas.current.remove(obj);
        }
      });
      fabricCanvas.current.renderAll();
      updateTexture();
    }*/

    //LISTENERS////////////////////////////////////////////////////////////////////////////
    window.addEventListener("resize", onWindowResize);
    containerRef.current.addEventListener("mousedown", onMouseDown);
    //containerRef.current.addEventListener("mousemove", onMouseMove);
    //containerRef.current.addEventListener("mouseup", onMouseUp);
    containerRef.current.addEventListener("touchstart", onMouseDown, {
      passive: true,
    });
    /*containerRef.current.addEventListener("touchmove", onTouchMove, {
      passive: true,
    });
    containerRef.current.addEventListener("touchend", onMouseUp, {
      passive: true,
    });*/

    fabricCanvas.current.on("object:modified", updateTexture());
    fabricCanvas.current.on("object:scaling", updateTexture());
    fabricCanvas.current.on("object:moving", updateTexture());
    fabricCanvas.current.on("object:rotating", updateTexture());
    fabricCanvas.current.on("object:added", updateTexture());

    return () => {
      renderer.domElement.remove();
      renderer.dispose();
      window.removeEventListener("resize", onWindowResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousedown", onMouseDown);
        // containerRef.current.removeEventListener("mousemove", onMouseMove);
        //containerRef.current.removeEventListener("mouseup", onMouseUp);
        containerRef.current.removeEventListener("touchstart", onMouseDown);
        //containerRef.current.removeEventListener("touchmove", onTouchMove);
        //containerRef.current.removeEventListener("touchend", onMouseUp);
      }
      fabricCanvas.current.off("object:modified", updateTexture());
      fabricCanvas.current.off("object:scaling", updateTexture());
      fabricCanvas.current.off("object:moving", updateTexture());
      fabricCanvas.current.off("object:rotating", updateTexture());
      fabricCanvas.current.off("object:added", updateTexture());
    };
  }, [fabricTexture]);

  //FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const updateTexture = () => {
    if (fabricTexture) fabricTexture.needsUpdate = true;
  };

  const openEditor = () => {
    setForceClose(false);

    if (editZoneRef.current) {
      setTimeout(() => {
        editZoneRef.current.style.right = "50px";
        editZoneRef.current.style.opacity = 1;
        editZoneRef.current.style.scale = 1;
        editZoneRef.current.style.filter = "none";
        editZoneRef.current.style.top = "110px";
        editZoneRef.current.style.transition =
          "right 0.3s cubic-bezier(0.4, 0.0, 0.6, 1.0), scale 0.3s cubic-bezier(0.4, 0.2, 0.6, 1.0), top 0.2s cubic-bezier(0.4, 0.0, 0.6, 1.0), filter 0.4s 0.1s cubic-bezier(0.1, 0.7, 0.0, 1.0), opacity 0.4s linear, scale 0.4s cubic-bezier(0.1, 0.7, 0.0, 1.0), height 0.3s 0.1s cubic-bezier(0.1, 0.7, 0.0, 1.0)";
        editZoneRef.current.style.scale = 1;
        editingComponent.current.name.includes("COR")
          ? (editZoneRef.current.style.height = "292px")
          : editingComponent.current.name.includes("MIX")
          ? (editZoneRef.current.style.height = "210px")
          : (editZoneRef.current.style.height = "100px");
      }, 10);
    }
  };

  const closeEditor = () => {
    closeAllTabs();
    editZoneRef.current.style.height = "210px";
    setTimeout(() => {
      setForceClose(true);
    }, 100);

    if (editZoneRef.current) {
      editZoneRefChild.current.style.opacity = "1";
      editZoneRef.current.style.right = "-300px";
      editZoneRef.current.style.scale = 0;
      editZoneRef.current.style.opacity = 0;
      editZoneRef.current.style.filter = "blur(25px)";
      editZoneRef.current.style.top = "150px";
      editZoneRef.current.style.transition =
        "right 0.3s cubic-bezier(0.4, 0.0, 0.6, 1.0), scale 0.3s cubic-bezier(0.4, 0.2, 0.5, 1.0), filter 0.4s cubic-bezier(0.9, 0.3, 1.0, 0.0), opacity 0.2s 0.1s linear, scale 0.3s 0.1s cubic-bezier(0.9, 0.3, 0.9, 0.5), top 0.2s 0.2s cubic-bezier(0.6, 1.0, 0.4, 0.0), height 0.1s .4s linear";
      editZoneRef.current.style.scale = 0;
      editZoneRef.current.style.height = "292px";
    }
  };

  const closeAllTabs = () => {
    //setColorEditor(false);
    //setTextEditor(false);
    //setImageEditor(false);

    closeColorEditor();
    closeImageEditor();
    closeTextEditor();
  };

  const colorEditorTab = () => {
    setForceClose(false);
    setColorEditor(true);
    setTextEditor(false);
    setImageEditor(false);
    editZoneRef.current.style.height = "130px";
    editZoneRefChild.current.style.opacity = "0";
    editZoneRefChild.current.style.transition =
      "all 0.1s cubic-bezier(0.1, 0.7, 0.0, 1.0)";
  };

  const imageEditorTab = () => {
    setForceClose(false);
    setColorEditor(false);
    setTextEditor(false);
    setImageEditor(true);
    editZoneRef.current.style.height = "292px";
    editZoneRefChild.current.style.opacity = "0";
    editZoneRef.current.style.transition =
      "height 0.5s cubic-bezier(0.1, 0.7, 0.0, 1.0)";
    editZoneRefChild.current.style.transition =
      "opacity 0.1s cubic-bezier(0.1, 0.7, 0.0, 1.0)";
  };

  const textEditorTab = () => {
    setForceClose(false);
    setColorEditor(false);
    setTextEditor(true);
    setImageEditor(false);
    editZoneRef.current.style.height = "292px";
    editZoneRef.current.style.transition =
      "all 0.5s cubic-bezier(0.1, 0.7, 0.0, 1.0)";
    editZoneRefChild.current.style.opacity = "0";
    editZoneRefChild.current.style.transition =
      "all 0.1s cubic-bezier(0.1, 0.7, 0.0, 1.0)";
  };

  const closeColorEditor = () => {
    setColorEditor(false);
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.renderAll();
    updateTexture();
    setActiveObject(null);
  };

  const closeTextEditor = () => {
    setTextEditor(false);
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.renderAll();
    updateTexture();
    setActiveObject(null);
  };

  const closeImageEditor = () => {
    setImageEditor(false);
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.renderAll();
    updateTexture();
    setActiveObject(null);
  };

  const handleBGColorChange = (color) => {
    function convertHexColor(hexColor) {
      if (hexColor.startsWith("#")) {
        hexColor = hexColor.slice(1);
      }
      return parseInt(hexColor, 16);
    }
    //setBGColor(color, editingComponent, fabricCanvas, updateTexture);
    allMeshes.current.forEach((mesh) => {
      mesh.material.color = new THREE.Color(convertHexColor(color));
    });
  };

  const handelUploadImage = (e) => {
    uploadImage(
      e,
      editingComponent,
      fabricCanvas,
      updateTexture,
      canvasSize,
      canvasSize
    );
    setTimeout(() => {
      setActiveObject(fabricCanvas.current.getActiveObject());
      imageEditorTab();
      setInputImage("");
    }, 100);
  };

  const handleAddTextBox = (text) => {
    addTextbox(
      text,
      fabricCanvas,
      updateTexture,
      editingComponent,
      fontSize,
      fontFamily,
      fillColor,
      textAlign,
      setActiveObject
    );
    fabricCanvas.current.getActiveObject();
  };

  const handleIndirectUpload = (e) => {
    uploadImage(e, editingComponent, fabricCanvas, updateTexture, canvasSize);
    setTimeout(() => {
      setInputImage("");
      const selectedObject = fabricCanvas.current.getActiveObject();
      setActiveObject(selectedObject);
      imageEditorTab();
    }, 100);
  };

  const handleFileUpload = () => {
    let upload = true;
    fabricCanvas.current._objects.forEach((object) => {
      if (object instanceof fabric.Image) {
        upload = false;
      }
    });
    if (upload) {
      document.getElementById("fileInput").click();
    } else imageEditorTab();
  };

  const handleChange = (e) => {
    setClientData({
      ...clientData,
      [e.target.name]: e.target.value,
    });
  };

  const openOrCloseWallet = () => {
    if (isAbaOpen) {
      openAba();
    }

    setTimeout(() => {
      allMeshes.current.forEach((mesh) => {
        console.log(mesh.morphTargetInfluences);
      });
      if (isWalletOpen) {
        editZoneRef.current.style.height = "210px";

        allMeshes.current.forEach((mesh) => {
          const start = {
            influence: 0,
            inverse: 1,
            rotation: -Math.PI / 2,
            x: 0,
          };
          const end = { influence: 1, inverse: 0, rotation: 0, x: -2 }; // Target value

          new TWEEN.Tween(start)
            .to(end, 500) // Duration in milliseconds
            .easing(TWEEN.Easing.Exponential.InOut)
            .onUpdate(() => {
              mesh.morphTargetInfluences[2] = start.influence;
              mesh.morphTargetInfluences[0] = start.inverse;
              mesh.rotation.y = start.rotation;
            })
            .start();
        });
        setIsWalletOpen(false);
      } else {
        editZoneRef.current.style.height = "292px";

        allMeshes.current.forEach((mesh) => {
          const start = { influence: 1, inverse: 0, rotation: 0, x: -2 };
          const end = {
            influence: 0,
            inverse: 1,
            rotation: -Math.PI / 2,
            x: 0,
          }; // Target value

          new TWEEN.Tween(start)
            .to(end, 500) // Duration in milliseconds
            .easing(TWEEN.Easing.Exponential.InOut)
            .onUpdate(() => {
              mesh.morphTargetInfluences[2] = start.influence;
              mesh.morphTargetInfluences[0] = start.inverse;
              mesh.rotation.y = start.rotation;
            })
            .start();
        });

        setIsWalletOpen(true);
      }
    }, 510);
  };

  const openAba = () => {
    if (isAbaOpen) {
      allMeshes.current.forEach((mesh) => {
        const start = { influence: 0, inverse: 1 };
        const end = { influence: 1, inverse: 0 }; // Target value

        new TWEEN.Tween(start)
          .to(end, 500) // Duration in milliseconds
          .easing(TWEEN.Easing.Exponential.InOut)
          .onUpdate(() => {
            mesh.morphTargetInfluences[0] = start.influence;
            mesh.morphTargetInfluences[1] = start.inverse;
          })
          .start();
      });
      setIsAbaOpen(false);
    } else {
      allMeshes.current.forEach((mesh) => {
        const start = { influence: 1, inverse: 0 };
        const end = { influence: 0, inverse: 1 }; // Target value

        new TWEEN.Tween(start)
          .to(end, 500) // Duration in milliseconds
          .easing(TWEEN.Easing.Exponential.InOut)
          .onUpdate(() => {
            mesh.morphTargetInfluences[0] = start.influence;
            mesh.morphTargetInfluences[1] = start.inverse;
          })
          .start();
      });

      setIsAbaOpen(true);
    }
  };

  return (
    <>
      {isLoading && (
        <div className={styles.loadingContainer}>
          <p>A carregar...</p>
        </div>
      )}

      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      <>
        <div ref={editZoneRef} className={styles.editZone}>
          <div className={styles.nameZone}>
            <button onClick={closeEditor} className={styles.fileUploadLabeal}>
              <p
                style={{
                  marginTop: -14,
                  fontSize: 12.5,
                  fontFamily: "Arial",
                  color: "#ed2828aa",
                  fontWeight: "1000",
                  alignSelf: "center",
                  justifyContent: "center",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                &#10005;
              </p>
            </button>
            <div>
              <p className={styles.trititle}>
                A Costumizar{" "}
                <b className={styles.subtitle}>
                  {editingComponent.current
                    ? getPartName(editingComponent.current.name)
                    : ""}
                </b>
              </p>
            </div>

            <button
              className={styles.fileUploadLabeal}
              style={{ opacity: 0 }}
            />
          </div>

          <div className={styles.editHeader} ref={editZoneRefChild}>
            <div>
              {editingComponentName.includes("COR") ? (
                <>
                  <button
                    onClick={colorEditorTab}
                    className={styles.divAreaEspecifica}
                  >
                    <div className={styles.divIcon}>
                      <NextImage
                        src={colorIcon}
                        width={20}
                        height={20}
                        alt="step"
                      />
                    </div>
                    <div>
                      <p className={styles.titleText}>Cor</p>
                      <p className={styles.infoText}>
                        Dá um toque final ao teu produto.
                      </p>
                    </div>
                  </button>
                  <button
                    className={styles.divAreaEspecifica}
                    onClick={openOrCloseWallet}
                    style={{ borderWidth: isWalletOpen ? 1 : 0 }}
                  >
                    <div className={styles.divIcon}>
                      <NextImage
                        src={isWalletOpen ? fechadoIcon : abertoIcon}
                        width={20}
                        height={20}
                        alt="step"
                      />
                    </div>
                    <div>
                      <p className={styles.titleText}>
                        {isWalletOpen ? "Fechar Carteira" : "Abrir Carteira"}
                      </p>
                      <p className={styles.infoText}>
                        {isWalletOpen
                          ? "Visualize o interior da sua carteira."
                          : "Visualize o exterior da sua carteira."}
                      </p>
                    </div>
                  </button>
                  {isWalletOpen ? (
                    <button
                      className={styles.divAreaEspecifica}
                      onClick={openAba}
                      style={{
                        borderWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                          display: "flex",
                          fontSize: 16,
                          color: "#000",
                        }}
                        className={styles.divIcon}
                      >
                        {isAbaOpen ? <p> &#8595;</p> : <p> &#8593;</p>}
                      </div>
                      <div>
                        <p className={styles.titleText}>
                          {isAbaOpen ? "Fechar Aba" : "Abrir Aba"}
                        </p>
                        <p className={styles.infoText}>
                          {isAbaOpen
                            ? "Abra a aba da carteira."
                            : "Feche a aba da carteira."}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <button
                      className={styles.divAreaEspecifica}
                      style={{
                        borderWidth: 0,
                        opacity: 0.5,
                        cursor: "not-allowed",
                      }}
                    >
                      <div
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                          display: "flex",
                          fontSize: 16,
                          color: "#000",
                        }}
                        className={styles.divIcon}
                      >
                        {isAbaOpen ? <p> &#8595;</p> : <p> &#8593;</p>}
                      </div>
                      <div>
                        <p className={styles.titleText}>
                          {isAbaOpen ? "Fechar Aba" : "Abrir Aba"}
                        </p>
                        <p className={styles.infoText}>
                          {isAbaOpen
                            ? "Abra a aba da carteira."
                            : "Feche a aba da carteira."}
                        </p>
                      </div>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {editingComponentName.includes("MIX") ? (
                    <>
                      <button
                        onClick={handleFileUpload}
                        className={styles.divAreaEspecifica}
                      >
                        <div className={styles.divIcon}>
                          <NextImage
                            src={galeryIcon}
                            width={20}
                            height={20}
                            alt="step"
                          />
                        </div>
                        <div>
                          <p className={styles.titleText}>Imagem</p>
                          <p className={styles.infoText}>
                            Remover cores e alterar os atributos.
                          </p>
                        </div>
                      </button>
                      <input
                        type="file"
                        id="fileInput"
                        style={{ display: "none" }}
                        value={inputImage}
                        onChange={handleIndirectUpload}
                      />
                      <button
                        onClick={textEditorTab}
                        className={styles.divAreaEspecifica}
                      >
                        <div className={styles.divIcon}>
                          <NextImage
                            src={textIcon}
                            width={20}
                            height={20}
                            alt="step"
                          />
                        </div>
                        <div>
                          <p className={styles.titleText}>Texto</p>
                          <p className={styles.infoText}>
                            Cor, fontes, tamanhos e alinhamentos.
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={colorEditorTab}
                        className={styles.divAreaEspecifica}
                        style={{ borderWidth: 0 }}
                      >
                        <div className={styles.divIcon}>
                          <NextImage
                            src={colorIcon}
                            width={20}
                            height={20}
                            alt="step"
                          />
                        </div>
                        <div>
                          <p className={styles.titleText}>Cor</p>
                          <p className={styles.infoText}>
                            Dá um toque final ao teu produto.
                          </p>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      {editingComponentName.includes("IMP") && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImage}
                            style={{
                              padding: "50px",
                              backgroundColor: "#234567",
                              position: "absolute",
                              top: "100px",
                            }}
                          />
                        </>
                      )}
                    </>
                  )}
                  {editingComponentName.includes("NOT") && (
                    <p
                      style={{ marginTop: 75, textAlign: "center" }}
                      className={styles.infoText}
                    >
                      Não é possível personalizar esta área
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {!preview && editingComponent.current && (
          <div className={styles.editZoneTlm}>
            <div className={styles.mainBtns}>
              <button className={styles.colorButton} onClick={colorEditorTab}>
                <NextImage src={colorIcon} width={20} height={20} />
              </button>
              <button
                className={styles.colorButton}
                onClick={openOrCloseWallet}
              >
                <NextImage
                  src={isWalletOpen ? fechadoIcon : abertoIcon}
                  width={20}
                  height={20}
                />
              </button>
              {isWalletOpen ? (
                <>
                  {isAbaOpen ? (
                    <button className={styles.colorButton} onClick={openAba}>
                      &#8595;
                    </button>
                  ) : (
                    <button className={styles.colorButton} onClick={openAba}>
                      &#8593;
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )}
      </>

      {isWalletOpen ? (
        <button className={styles.abrirBtn} onClick={openAba}>
          {isAbaOpen ? "Fechar Aba" : "Abrir Aba"}
        </button>
      ) : null}

      {success == false && (
        <>
          <div className={styles.priceBtnMain}>
            {preview && (
              <button
                className={styles.priceBtn}
                style={{
                  opacity: nextStep ? "1" : "0.5",
                  pointerEvents: nextStep ? "auto" : "none",
                }}
                onClick={() => {
                  nextStep &&
                    (setSuccess(true),
                    sendData(allCanvasData, docId, clientData));
                }}
              >
                {nextStep ? "Continuar" : "Aguarde"}
              </button>
            )}
          </div>

          <div className={styles.exportBtnNot}>
            <button style={buttonStyle}>
              {preview ? (
                windowWidth < 450 ? (
                  <p
                    style={{
                      marginTop: 0,
                    }}
                  >
                    &#8592;
                  </p>
                ) : (
                  "Voltar à Personalização"
                )
              ) : window.innerWidth > 750 ? (
                "Concluído"
              ) : (
                "->"
              )}
            </button>
          </div>
        </>
      )}

      {colorEditor && (
        <ColorEditor
          handleBGColorChange={handleBGColorChange}
          closeEditor={closeColorEditor}
          editingComponent={editingComponent}
          editZoneRef={editZoneRef}
          editZoneRefChild={editZoneRefChild}
          forceClose={forceClose}
          isWalletOpen={isWalletOpen}
        />
      )}

      {imageEditor && (
        <ImageEditor
          fabricCanvas={fabricCanvas}
          updateTexture={updateTexture}
          closeImageEditor={closeImageEditor}
          activeObject={activeObject}
          uploadImage={handelUploadImage}
          setImageSrc={setImageSrc}
          imageSrc={imageSrc}
          editZoneRef={editZoneRef}
          editZoneRefChild={editZoneRefChild}
          editingComponent={editingComponent}
          forceClose={forceClose}
          setActiveObject={setActiveObject}
        />
      )}

      {textEditor && (
        <TextEditor
          fabricCanvas={fabricCanvas}
          updateTexture={updateTexture}
          closeTabs={closeTextEditor}
          addTextbox={handleAddTextBox}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          activeObject={activeObject}
          fontSize={fontSize}
          setFontSize={setFontSize}
          textAlign={textAlign}
          setTextAlign={setTextAlign}
          fillColor={fillColor}
          setFillColor={setFillColor}
          editingComponent={editingComponent}
          editZoneRefChild={editZoneRefChild}
          forceClose={forceClose}
          setActiveObject={setActiveObject}
          canvasSize={canvasSize}
        />
      )}

      {/*escolheBtn == false && (
        <div ref={backgroundMagic} className={styles.modelsZone}>
          <div ref={modelosZone} className={styles.modelsList}>
            <h1
              ref={titleModels}
              className={styles.title}
              style={{
                textAlign: "center",
                marginBottom: 25,
                fontSize: 15,
                color: "#fff",
              }}
            >
              ESCOLHE O TEU MODELO
            </h1>
            <div ref={modelos} className={styles.modelosBtns}>
              <button
                className={styles.modeloBtn}
                onClick={() => {
                  magicLoading(backgroundMagic, modelos, titleModels);
                  setTimeout(() => {
                    setEscolheBtn(true);
                  }, 800);
                  setModel("5");
                }}
              >
                <NextImage
                  src={model5}
                  className={styles.modelosImgs}
                  width={150}
                  height={150}
                />
              </button>
              <button
                className={styles.modeloBtn}
                onClick={() => {
                  setModel("3");
                  magicLoading(backgroundMagic, modelos, titleModels);
                  setTimeout(() => {
                    setEscolheBtn(true);
                  }, 800);
                }}
              >
                <NextImage
                  src={model3}
                  className={styles.modelosImgs}
                  width={150}
                  height={150}
                />
              </button>
              <button
                className={styles.modeloBtn}
                onClick={() => {
                  setModel("1");
                  magicLoading(backgroundMagic, modelos, titleModels);
                  setTimeout(() => {
                    setEscolheBtn(true);
                  }, 800);
                }}
              >
                <NextImage
                  src={model1}
                  className={styles.modelosImgs}
                  width={150}
                  height={150}
                />
              </button>
              <button
                className={styles.modeloBtn}
                onClick={() => {
                  setModel("4");
                  magicLoading(backgroundMagic, modelos, titleModels);
                  setTimeout(() => {
                    setEscolheBtn(true);
                  }, 800);
                }}
              >
                <NextImage
                  src={model4}
                  className={styles.modelosImgs}
                  width={150}
                  height={150}
                />
              </button>
              <button
                className={styles.modeloBtn}
                onClick={() => {
                  setModel("2");
                  magicLoading(backgroundMagic, modelos, titleModels);
                  setTimeout(() => {
                    setEscolheBtn(true);
                  }, 800);
                }}
              >
                <NextImage
                  src={model2}
                  className={styles.modelosImgs}
                  width={150}
                  height={150}
                />
              </button>
            </div>
          </div>
        </div>
      )*/}

      {preview == true && (
        <div className={styles.checkoutZone}>
          {success === false ? (
            <>
              <div className={styles.modelsList}>
                <p
                  className={styles.title}
                  style={{
                    textAlign: "center",
                    fontSize: 15,
                    color: "#fff",
                  }}
                >
                  PREÇO TOTAL ESTIMADO (POR UN.)
                </p>

                <h1
                  id="precoFinal"
                  className={styles.title}
                  style={{
                    textAlign: "center",
                    marginBottom: 15,
                    fontSize: 100,
                    color: "#fff",
                    fontWeight: 800,
                    letterSpacing: -3.2,
                    marginTop: -15,
                  }}
                >
                  €{animatedPrice}
                </h1>
              </div>

              <div className={styles.inputsFormMain}>
                <h1
                  className={styles.title}
                  style={{
                    textAlign: "center",
                    fontSize: 15,
                    color: "#8c8c8c",
                  }}
                >
                  INFORMAÇÕES DE ENVIO
                </h1>
                <div className={styles.inputsForm}>
                  <input
                    className={styles.inputForm}
                    placeholder="Nome"
                    name="name"
                    value={clientData.name}
                    onChange={handleChange}
                  />
                  <input
                    className={styles.inputForm}
                    placeholder="Email"
                    name="email"
                    value={clientData.email}
                    onChange={handleChange}
                  />
                  <input
                    className={styles.inputForm}
                    placeholder="Telemóvel"
                    name="phone"
                    value={clientData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.successOrderMain}>
                <h1 className={styles.successOrderText}>
                  Personalização submetida com sucesso
                </h1>
                <p
                  style={{ marginTop: -10, marginBottom: 35 }}
                  className={styles.successOrderSubText}
                >
                  Iremos entrar em contacto consigo muito brevemente
                </p>
                <div className={styles.finalBtns}>
                  {docId != "" ? (
                    <button
                      className={styles.btnPreviewLink}
                      onClick={() => router.push(`/visualize/${docId}`)}
                      target={"_blank"}
                    >
                      <NextImage src={shareIcon} width={20} height={20} />
                      <p>Abrir link de pré-visualização</p>
                    </button>
                  ) : (
                    <button className={styles.btnBuildLink}>
                      <NextImage src={buildingIcon} width={20} height={20} />
                      <p>A criar o teu link de pré-visualização</p>
                    </button>
                  )}
                  <Link
                    className={styles.goToAllkitsBtn}
                    style={{ textDecoration: "none" }}
                    href={"https://www.allkits.pt"}
                  >
                    Voltar à Allkits
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ThreeDViewer;
