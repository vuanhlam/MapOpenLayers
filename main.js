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
let measureTooltipElement;

/**
 * Overlay to show the measurement.
 * @type {Overlay}
 */
let measureTooltip;
let measureTooltips = [];
let features = [];

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

  createMeasureTooltip();

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
      measureTooltipElement.innerHTML = output;
      // console.log(output);
      measureTooltip.setPosition(tooltipCoord);
    });
  });

  draw.on("drawend", function (evt) {
    measureTooltipElement.className = "ol-tooltip ol-tooltip-static";
    measureTooltip.setOffset([0, -7]);
    // unset sketch
    sketch = null;
    // unset tooltip so that a new one can be created
    measureTooltipElement = null;
    createMeasureTooltip();
    unByKey(listener);
    features.push(evt.feature);
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

// --------------------------------------------- Get length -----------------------------------------//

/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }
  measureTooltipElement = document.createElement("div");
  measureTooltipElement.className = "ol-tooltip ol-tooltip-measure";
  measureTooltip = new Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: "bottom-center",
    stopEvent: false,
    insertFirst: false,
  });
  map.addOverlay(measureTooltip);
  measureTooltips.push(measureTooltip);
}

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

/**
 *! remove type of drawing when switch to the new one
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  addInteractions();
};

addInteractions();
