// src/components/layout/ModelStatusDebug.tsx
"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "system_model_preference";

export default function ModelStatusDebug() {
  const [currentModel, setCurrentModel] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) || "none";
      setCurrentModel(stored);
      
      const handleChange = (e: CustomEvent) => {
        setCurrentModel(e.detail.modelId);
      };
      window.addEventListener("system-model-changed", handleChange as EventListener);
      
      return () => {
        window.removeEventListener("system-model-changed", handleChange as EventListener);
      };
    }
  }, []);

  const forceTheme = () => {
    const body = document.body;
    
    // Remove all model classes
    body.classList.remove("model-barbearia", "model-padrao", "model-personalizado");
    
    // Apply inline styles directly to body
    if (currentModel === "barbearia_v1") {
      body.classList.add("model-barbearia");
      body.style.backgroundColor = "";
      body.style.color = "";
    } else if (currentModel === "padrao_v1") {
      body.classList.remove("model-barbearia");
    } else if (currentModel === "personalizado_v1") {
      body.classList.add("model-personalizado");
    }
    
    alert(`Tema ${currentModel} aplicado!`);
  };

  return (
    <div style={{
      position: "fixed",
      bottom: "10px",
      right: "10px",
      zIndex: 9999,
      background: currentModel === "barbearia_v1" ? "#333" : "#fff",
      padding: "8px",
      borderRadius: "8px",
      border: "2px solid " + (currentModel === "barbearia_v1" ? "#d4a54c" : "#ccc"),
      color: currentModel === "barbearia_v1" ? "#fff" : "#000"
    }}>
      <button 
        onClick={() => setShowDebug(!showDebug)}
        style={{ 
          fontSize: "12px", 
          padding: "4px 8px",
          background: "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer"
        }}
      >
        🔧 Debug: {currentModel}
      </button>
      
      {showDebug && (
        <div style={{ marginTop: "8px", fontSize: "11px" }}>
          <div style={{ marginBottom: "5px" }}>Current: <strong>{currentModel}</strong></div>
          <button 
            onClick={forceTheme}
            style={{ 
              display: "block",
              width: "100%",
              padding: "8px", 
              background: "#d4a54c", 
              color: "#000",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            🚀 FORÇAR TEMA BARBEARIA
          </button>
        </div>
      )}
    </div>
  );
}