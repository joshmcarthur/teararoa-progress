import '../styles/index.scss';
import "../../node_modules/mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import jQuery from "jquery";
import bbox from "@turf/bbox";
import milestones from "json-loader!../..//milestones_km.geojson";
mapboxgl.accessToken = "pk.eyJ1Ijoic3Vkb2pvc2giLCJhIjoiY2p6djFpa2o0MGJlNDNibXIydjc1azcxNCJ9.4eH1qtw74O1soNIExDKHzQ";

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v9',
  zoom: 6,
  center: [174, -42]
});

map.on("load", () => map.resize());

jQuery.ajax({
    url: "https://script.google.com/macros/s/AKfycbzGvKKUIaqsMuCj7-A2YRhR-f7GZjl4kSxSN1YyLkS01_CfiyE/exec",
 
    // The name of the callback parameter, as specified by the YQL service
    jsonp: "callback",
 
    // Tell jQuery we're expecting JSONP
    dataType: "jsonp",
 
    // Tell YQL what we want and that we want JSON
    data: {
        id: "1ddAdoHp2q0yzX_cR5NX_fMsiJ0uA9KYHgqGpF9gqnHg",
        sheet: "output"
    },
 
    // Work with the response
    success: function( response ) {
      const completedKms = response.records.filter(r => r["Completed?"]).map(r => r.Route_Distance);
      const features = milestones.features.filter(feat => completedKms.indexOf(Number(feat.properties.name)) >= 0);
      const geojson = { type: "FeatureCollection", features };
      map
        .addSource('milestones', {
          type: 'geojson',
          data: geojson
        })
        .addLayer({
          id: "milestones",
          source: "milestones",
          type: "circle"
        });
      map.fitBounds(bbox(geojson), { padding: 100 });
    }
});
