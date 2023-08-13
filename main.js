import Map from "ol/Map.js";
import View from "ol/View.js";
import { defaults as defaultInteractions } from "olgm/interaction.js";
import { transform } from "ol/proj.js";

import { Draw, Modify } from "ol/interaction.js";
import { toLonLat } from "ol/proj";
import Overlay from "ol/Overlay.js";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";
import { unByKey } from "ol/Observable.js";
import { LineString, Polygon } from "ol/geom.js";
import { formatArea, formatLength } from "./utils/utils.js";
// import { source, vector } from "./utils/vector.js";
import XYZ from "ol/source/XYZ";
import { Tile as TileLayer } from "ol/layer.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import GeoJSON from 'ol/format/GeoJSON.js';

let sketch;
let features = [];
let drawnFeatures = [];
const colorSelect = document.getElementById('colorSelect');
const typeSelect = document.getElementById("type");
const clearAll = document.getElementById("deleteAll");
const undoButton = document.getElementById('undo');
const toggleDrawButton = document.getElementById('toggleDraw');
const selectButton = document.getElementById('selectButton');
import { Select } from 'ol/interaction.js';
import { defaultLineCap } from "ol/render/canvas.js";

//* create a new instance of the GeoJSON format:
const format = new GeoJSON();

export const source = new VectorSource();
export const vector = new VectorLayer({
  source: source,
  style: {
    "fill-color": "rgba(255, 255, 255, 0.2)",
    "stroke-color": `${colorSelect.value}`,
    "stroke-width": 3,
    "circle-radius": 7,
    "circle-fill-color": "#ffcc33",
  },
});

const map = new Map({
  // use OL3-Google-Maps recommended default interactions
  interactions: defaultInteractions(),
  layers: [
    new TileLayer({
      source: new XYZ({
        url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      }),
    }),
    vector,
  ],
  target: "map",
  view: new View({
    center: transform(
      [107.84641987555096, 15.557018118480753],
      "EPSG:4326",
      "EPSG:3857"
    ),
    zoom: 5.8,
  }),
});

/**
 *! interaction used for modifying vector features on the map
 *! It allows users to edit the vertices and geometry of vector features, such as points, lines, and polygons.
 *! edit when drawed vector
 */
// const modify = new Modify({ source: source });
// map.addInteraction(modify);

const select = new Select();

let draw; // global so we can remove them later
function addInteractions() {
  const selectedColor = colorSelect.value;
  console.log(selectedColor)

  draw = new Draw({
    source: source,
    type: typeSelect.value,
    style: new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.2)",
      }),
      stroke: new Stroke({
        color: selectedColor,
        lineDash: [10, 10],
        width: 2,
      }),
      //* circle follow the mouse
      image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.7)",
        }),
        fill: new Fill({
          color: selectedColor,
        }),
      }),
    }),
  });
  map.addInteraction(draw);

  let listener;
  draw.on("drawstart", function (evt) {
    // set sketch
    sketch = evt.feature;

    listener = sketch.getGeometry().on("change", function (evt) {
      const geom = evt.target;
      let output;
      if (geom instanceof Polygon) {
        output = formatArea(geom);
      } else if (geom instanceof LineString) {
        output = formatLength(geom);
      }
      // console.log(output);
    });
  });

  draw.on("drawend", function (evt) {
    sketch = null;
    unByKey(listener);
    //delete lineString
    features.push(evt.feature);
    drawnFeatures.push(evt.feature);

    // Set the style of the drawn feature
    evt.feature.setStyle(new Style({
      stroke: new Stroke({
        color: selectedColor,
        width: 2
      })
    }));

    evt.feature.set('color', selectedColor);

    // Save all features to localStorage
    setTimeout(function() {
      const features = source.getFeatures();
      // console.log({features})
      const featuresGeoJSON = format.writeFeatures(features);
      const geometry = evt.feature.getGeometry();
      console.log(JSON.parse(featuresGeoJSON))
      localStorage.setItem('features', featuresGeoJSON);
    }, 0);
  });
}

//*------------------------------------------------ Event listener ---------------------------------------------//
const deleteButton = document.getElementById('delete');


toggleDrawButton.addEventListener('click', function() {
  const isActive = draw.getActive();
  draw.setActive(!isActive);
});

let selectedFeature;

select.on('select', function(e) {
  selectedFeature = e.selected[0];
  if (selectedFeature) {
    selectedFeature.setStyle(new Style({
      stroke: new Stroke({
        color: 'red',
        width: 2
      })
    }));
    console.log('active')
  }
});

let selectActive = false;

selectButton.addEventListener('click', function() {
    if (selectActive) {
        map.removeInteraction(select);
    } else {
        map.addInteraction(select);
    }
    selectActive = !selectActive;
});

deleteButton.addEventListener('click', function() {
  if (selectedFeature) {
    source.removeFeature(selectedFeature);
    selectedFeature = null;
  }
});

window.onload = function() {
  const featuresGeoJSON = localStorage.getItem('features');
  if (featuresGeoJSON) {
    const features = format.readFeatures(featuresGeoJSON);
    // The readFeatures method is used to parse a GeoJSON string and return an array of features.
    // The features are created according to the GeoJSON specification, which means their geometries and properties are read from the GeoJSON and assigned to the new features.
    // This method is particularly useful when you want to load GeoJSON data from a server or a file and then use it in your application.
    
    features.forEach(function(feature) {
      const color = feature.get('color');
      feature.setStyle(new Style({
        stroke: new Stroke({
          color: color,
          width: 2
        })
      }));
    });
    source.addFeatures(features);
  }
};

/**
 *! click to delete all action  
*/
clearAll.addEventListener("click", function () {
  // xóa vector
  source.clear();
  // xóa measure tooltip
  measureTooltips.forEach(function (tooltip) {
    map.removeOverlay(tooltip);
  });
  measureTooltips = [];
}); 

/**
 *! Click to undo action 
*/
undoButton.addEventListener('click', function() {
  const lastFeature = features.pop();
  if (lastFeature) {
    source.removeFeature(lastFeature);
  }
});

/**
 *! Support Ctrl+z to undo action 
*/
document.addEventListener('keydown', function(evt) {
  // Check if Ctrl + Z was pressed
  if (evt.ctrlKey && evt.key === 'z') {
    // Remove the last drawn feature
    let lastFeature = drawnFeatures.pop();
    if (lastFeature) {
      source.removeFeature(lastFeature);
    }
  }
});

/**
 *! remove type of drawing when switch to the new one
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  addInteractions();
};

colorSelect.onchange = function () {
  map.removeInteraction(draw);
  addInteractions();
};

addInteractions();

export default colorSelect