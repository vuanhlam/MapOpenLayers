import Map from "ol/Map.js";
import OSM from "ol/source/OSM.js";
import TileLayer from "ol/layer/Tile.js";
import View from "ol/View.js";


const osmSource = new OSM();

const map = new Map({
  layers: [
    new TileLayer({
      source: osmSource, //*  An OpenStreetMap layer providing the base map tiles
    }),
  ],
  target: "map",
  view: new View({
    //*  This property specifies the initial view of the map. It is an object containing various view-related properties
    /**
     *! The projection of the map. In the code, it is set to "EPSG:4326",
     *! which is the identifier for the WGS 84 projection used for representing geographic coordinates in degrees.
     */
    projection: "EPSG:4326",
    /**
     *! The initial center of the map. It is an array of two numbers representing the longitude and latitude in the specified projection
     */
    center: [107.84641987555096, 15.557018118480753],
    /**
     *! The initial zoom level of the map
     */
    zoom: 5.8,
  }),
});
