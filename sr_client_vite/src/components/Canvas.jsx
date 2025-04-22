import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";

const Canvas = () => {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [image, setImage] = useState(null);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
  });

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
    });
    setFabricCanvas(canvas);
    return () => canvas.dispose();
  }, []);

  // Function to handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        fabric.Image.fromURL(reader.result, (img) => {
          img.scaleToWidth(500);
          // fabricCanvas.clear(); // Clear previous image
          // fabricCanvas.add(img);
          if (fabricCanvas) {
            fabricCanvas.clear();
            fabricCanvas.add(img);
          }
          
          setImage(img);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply filters
  useEffect(() => {
    if (image) {
      image.filters = [
        new fabric.Image.filters.Brightness({ brightness: (filters.brightness - 100) / 100 }),
        new fabric.Image.filters.Contrast({ contrast: (filters.contrast - 100) / 100 }),
        new fabric.Image.filters.Saturation({ saturation: (filters.saturation - 100) / 100 }),
        new fabric.Image.filters.HueRotation({ rotation: filters.hue * (Math.PI / 180) }),
      ];
      image.applyFilters();
      fabricCanvas.renderAll();
    }
  }, [filters, image, fabricCanvas]);

  // Toggle drawing mode
  const toggleDrawing = () => {
    fabricCanvas.isDrawingMode = !fabricCanvas.isDrawingMode;
  };

  return (
    <div className="p-4">
      <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-4" />
      
      <canvas ref={canvasRef} width={500} height={400} className="border shadow" />

      <div className="flex gap-4 mt-4">
        <label>
          Brightness: <input type="range" min="0" max="200" value={filters.brightness} onChange={(e) => setFilters({ ...filters, brightness: e.target.value })} />
        </label>
        <label>
          Contrast: <input type="range" min="0" max="200" value={filters.contrast} onChange={(e) => setFilters({ ...filters, contrast: e.target.value })} />
        </label>
        <label>
          Saturation: <input type="range" min="0" max="200" value={filters.saturation} onChange={(e) => setFilters({ ...filters, saturation: e.target.value })} />
        </label>
        <label>
          Hue: <input type="range" min="0" max="360" value={filters.hue} onChange={(e) => setFilters({ ...filters, hue: e.target.value })} />
        </label>
      </div>

      <button onClick={toggleDrawing} className="mt-4 p-2 bg-blue-500 text-white rounded">
        {fabricCanvas?.isDrawingMode ? "Disable" : "Enable"} Drawing
      </button>
    </div>
  );
};

export default Canvas;