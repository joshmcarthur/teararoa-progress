import React from "react";
import "./App.scss";
import "@material/react-top-app-bar/index.scss";
import "@material/react-list/index.scss";
import "@material/react-drawer/index.scss";
import "@material/react-typography/index.scss";
import "mapbox-gl/dist/mapbox-gl.css";
import { fromJS } from "immutable";
import mapboxgl from "mapbox-gl";
import WebMercatorViewport from 'viewport-mercator-project';
import _debounce from "lodash/debounce";

import routeGeoJSON from "./data/route_and_waypoints";
import BASE_MAP_STYLE from "./baseMapStyle.json";

import TopAppBar, {
  TopAppBarFixedAdjust,
  TopAppBarRow,
  TopAppBarSection,
  TopAppBarTitle
} from "@material/react-top-app-bar";

import Drawer, {
  DrawerAppContent,
  DrawerContent,
  DrawerHeader,
  DrawerSubtitle,
  DrawerTitle
} from "@material/react-drawer";

import List, {
  ListItem,
  ListItemText,
} from "@material/react-list";

import { Headline2 } from "@material/react-typography";

import ReactMapGL from 'react-map-gl';

const deriveSections = routeAndWaypoints => {
  // Anything that is a linestring is a route segment
  const routeParts = routeAndWaypoints.filter(
    r => r.geometry.type === "LineString"
  );

  // Anything that is a point is a waypoint
  const waypoints = routeAndWaypoints.filter(r => r.geometry.type === "Point");

  // Each route should have a start and end waypoint.
  return routeParts.map(part => ({
    start: waypoints.find(
      wp =>
        wp.geometry.coordinates.toString() ===
        part.geometry.coordinates[0].toString()
    ),
    finish: waypoints.find(
      wp =>
        wp.geometry.coordinates.toString() ===
        part.geometry.coordinates[
          part.geometry.coordinates.length - 1
        ].toString()
    ),
    segment: part
  }));
};

const sectionTitle = (section) => {
  if (section.start && section.finish) return `${section.start.properties.name} to ${section.finish.properties.name}`;
  if (section.finish) return `Start -> ${section.finish.properties.name}`;
  if (section.start) return `${section.start.properties.name} -> Finish`;
}

const SectionListItem = ({ section }) => (
  <ListItem>
    <ListItemText
      primaryText={sectionTitle(section)}
      secondaryText={section.segment.properties.desc}
    />
  </ListItem>
);

class Map extends React.Component {
  state = {
    width: window.innerWidth,
    height: window.innerHeight / 2,
    latitude: -42,
    longitude: 174,
    zoom: 5,
    pitch: 0,
    bearing: 0
  };

  mapNode = React.createRef();

  dataLayer = {"id": "route", "source": "routeSegment", "type": "line"};

  componentDidUpdate(prevProps) {
    if (this.props.section.segment.properties.cmt !== prevProps.section.segment.properties.cmt) {
      const viewport= new WebMercatorViewport({...this.state});
      // Geographic coordinates of the section
      const coordinates = this.props.section.segment.geometry.coordinates;
    
      // Pass the first coordinates in the LineString to `lngLatBounds` &
      // wrap each coordinate pair in `extend` to include them in the bounds
      // result. A variation of this technique could be applied to zooming
      // to the bounds of multiple Points or Polygon geomteries - it just
      // requires wrapping all the coordinates with the extend method.
      let bounds = coordinates.reduce((bounds, coord) => bounds.extend(coord), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      this.setState({ ...viewport.fitBounds(bounds.toArray(), { padding: 100 }) });
    }
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener("resize", this.handleResize);
  }

  componentWillUnmount() { window.removeEventListener("resize", this.handleResize); }

  handleResize = _debounce(() => this.setState({
    width: document.querySelector(".drawer-app-content").clientWidth,
    height: window.innerHeight / 2}), 100);

  render() {
    const mapStyle = this.props.section ? fromJS(BASE_MAP_STYLE)
      // Add geojson source to map
      .setIn(['sources', 'routeSegment'], fromJS({type: 'geojson', data: this.props.section.segment}))
      // Add point layer to map
      .set('layers', fromJS(BASE_MAP_STYLE).get('layers').push(this.dataLayer)) : null;
      

    return (
      <ReactMapGL
        {...this.state}
        ref={this.mapNode}
        mapStyle={mapStyle || BASE_MAP_STYLE}
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_API_KEY}
        onViewportChange={(viewport) => this.setState({...viewport})}
      />
    );
  }
}

const SectionDetails = ({section}) => (
  <div className="SectionDetails">
    <Headline2>{sectionTitle(section)}</Headline2>
  </div>
)


class App extends React.Component {
  state = { sections: deriveSections(routeGeoJSON.features), selectedIndex: 0 };
  render() {
    const currentSection = this.state.sections[this.state.selectedIndex];
    return (
      <div className="drawer-container">
        <TopAppBar fixed>
          <TopAppBarRow>
            <TopAppBarSection align="start">
              <TopAppBarTitle>Te Araroa Progress Meter</TopAppBarTitle>
            </TopAppBarSection>
          </TopAppBarRow>
        </TopAppBar>

        <TopAppBarFixedAdjust className="top-app-bar-fix-adjust">
          <Drawer style={{ width: "33%" }}>
            <DrawerHeader>
              <DrawerTitle tag="h2">Sections</DrawerTitle>
              <DrawerSubtitle></DrawerSubtitle>
            </DrawerHeader>
            <DrawerContent>
              <List
                singleSelection
                twoLine
                selectedIndex={this.state.selectedIndex}
                handleSelect={selectedIndex =>
                  this.setState({ selectedIndex})
                }
              >
                {this.state.sections.map(s => (
                  <SectionListItem
                    key={s.segment.properties.cmt}
                    section={s}
                  />
                ))}
              </List>
            </DrawerContent>
          </Drawer>

          <DrawerAppContent className="drawer-app-content">
            <Map section={currentSection} />
            <SectionDetails section={currentSection} />
          </DrawerAppContent>
        </TopAppBarFixedAdjust>
      </div>
    );
  }
}

export default App;
