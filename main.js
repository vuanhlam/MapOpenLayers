import Map from "ol/Map.js";
import View from "ol/View.js";
import OLGoogleMaps from "olgm/OLGoogleMaps.js";
import GoogleLayer from "olgm/layer/Google.js";
import { defaults as defaultInteractions } from "olgm/interaction.js";

const center = [107.84641987555096, 15.557018118480753];
// const center = [15.557018118480753, 107.84641987555096];

// This dummy layer tells Google Maps to switch to its default map type
const googleLayer = new GoogleLayer();

const SatelliteLayer = new GoogleLayer({
  mapTypeId: google.maps.MapTypeId.SATELLITE,
});

const map = new Map({
  // use OL3-Google-Maps recommended default interactions
  interactions: defaultInteractions(),
  layers: [
    // googleLayer,
    SatelliteLayer,
  ],
  target: "map",
  view: new View({
    center: center,
    zoom: 5.8,  
  }),
});

const olGM = new OLGoogleMaps({ map: map }); // map is the Map instance
olGM.activate();
