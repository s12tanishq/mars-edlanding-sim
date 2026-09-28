import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import MissionStation from "./ui/MissionStation.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(new URLSearchParams(location.search).has("station") ? <MissionStation/> : <App />);
