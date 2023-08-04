import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";

/**
 *! Vector
 */
export const source = new VectorSource();
export const vector = new VectorLayer({
  source: source,
  style: {
    "fill-color": "rgba(255, 255, 255, 0.2)",
    "stroke-color": "#fd0101",
    "stroke-width": 3,
    "circle-radius": 7,
    "circle-fill-color": "#ffcc33",
  },
});
