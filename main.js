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
import { source, vector } from "./utils/vector.js";
import XYZ from "ol/source/XYZ";
import { Tile as TileLayer } from "ol/layer.js";

/**
 * Currently drawn feature.
 * @type {import("../src/ol/Feature.js").default}
 */
let sketch, snap;

/**
 * The measure tooltip element.
 * @type {HTMLElement}
 */
// let measureTooltipElement;

/**
 * Overlay to show the measurement.
 * @type {Overlay}
 */
let measureTooltip;
let measureTooltips = [];
let features = [];
let drawnFeatures = [];

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
const modify = new Modify({ source: source });
map.addInteraction(modify);

let draw; // global so we can remove them later
const typeSelect = document.getElementById("type");
const clearAll = document.getElementById("deleteAll");
const undoButton = document.getElementById('undo');

function addInteractions() {
  draw = new Draw({
    source: source,
    type: typeSelect.value,
    style: new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.2)",
      }),
      stroke: new Stroke({
        color: "red",
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
          color: "yellow",
        }),
      }),
    }),
  });
  map.addInteraction(draw);

  let listener;
  draw.on("drawstart", function (evt) {
    // set sketch
    sketch = evt.feature;

    /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
    let tooltipCoord = evt.coordinate;

    listener = sketch.getGeometry().on("change", function (evt) {
      const geom = evt.target;
      let output;
      if (geom instanceof Polygon) {
        output = formatArea(geom);
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof LineString) {
        output = formatLength(geom);
        tooltipCoord = geom.getLastCoordinate();
      }
      console.log(output);
    });
  });

  draw.on("drawend", function (evt) {
    sketch = null;
    unByKey(listener);
    //delete lineString
    features.push(evt.feature);
    drawnFeatures.push(evt.feature);
  });
}

//TODO: Get coordinate when point a place on map
map.on("click", function (event) {
  // Get the clicked coordinate from the event
  const clickedCoordinate = event.coordinate;

  // Convert the clicked coordinate from the map projection (EPSG:3857) to lon/lat (EPSG:4326)
  const lonLatCoordinate = toLonLat(clickedCoordinate);

  // Extract the latitude and longitude from the lon/lat coordinate
  const latitude = lonLatCoordinate[1];
  const longitude = lonLatCoordinate[0];

  // Now you have the latitude and longitude of the clicked point
  // console.log(
  //   "Vĩ độ -> Latitude:",
  //   latitude,
  //   "Kinh độ -> Longitude:",
  //   longitude
  // );
});

//------------------------------------------------ Delete ---------------------------------------------//

clearAll.addEventListener("click", function () {
  // xóa vector
  source.clear();
  // xóa measure tooltip
  measureTooltips.forEach(function (tooltip) {
    map.removeOverlay(tooltip);
  });
  measureTooltips = [];
}); 

undoButton.addEventListener('click', function() {
  const lastFeature = features.pop();
  if (lastFeature) {
    source.removeFeature(lastFeature);
  }
});

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

addInteractions();
