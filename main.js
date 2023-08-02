import Map from "ol/Map.js";
import View from "ol/View.js";
import OLGoogleMaps from "olgm/OLGoogleMaps.js";
import GoogleLayer from "olgm/layer/Google.js";
import { defaults as defaultInteractions } from "olgm/interaction.js";
import { transform } from "ol/proj.js";
import { OSM, Vector as VectorSource } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import { Draw, Modify, Snap } from "ol/interaction.js";
import {toLonLat} from 'ol/proj';

/**
 *! Layer 
*/
const SatelliteLayer = new GoogleLayer({
  mapTypeId: google.maps.MapTypeId.SATELLITE,
});


/**
 *! Vector 
*/
const source = new VectorSource();
const vector = new VectorLayer({
  source: source,
  style: {
    "fill-color": "rgba(255, 255, 255, 0.2)",
    "stroke-color": "#fd0101",
    "stroke-width": 3,
    "circle-radius": 7,
    "circle-fill-color": "#ffcc33",
  },
});

const map = new Map({
  // use OL3-Google-Maps recommended default interactions
  interactions: defaultInteractions(),
  layers: [SatelliteLayer, vector],
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

let draw, snap; // global so we can remove them later
const typeSelect = document.getElementById("type");
console.log(typeSelect.value);

function addInteractions() {
  draw = new Draw({
    source: source,
    type: typeSelect.value,
  });
  // console.log(draw);
  map.addInteraction(draw);
  console.log(typeSelect.value);
  snap = new Snap({ source: source });
  map.addInteraction(snap);
}

/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw); //* remove type of drawing when switch to the new one 
  map.removeInteraction(snap);
  addInteractions();
};

//TODO: Get coordinate when point a place on map
map.on('click', function(event) { 
  // Get the clicked coordinate from the event
  const clickedCoordinate = event.coordinate;

  // Convert the clicked coordinate from the map projection (EPSG:3857) to lon/lat (EPSG:4326)
  const lonLatCoordinate = toLonLat(clickedCoordinate);

  // Extract the latitude and longitude from the lon/lat coordinate
  const latitude = lonLatCoordinate[1];
  const longitude = lonLatCoordinate[0];

  // Now you have the latitude and longitude of the clicked point
  console.log('Vĩ độ -> Latitude:', latitude, 'Kinh độ -> Longitude:', longitude);
});

addInteractions();

const olGM = new OLGoogleMaps({ map: map }); // map is the Map instance
olGM.activate();
