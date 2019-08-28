import React from "react";
import "./App.scss";
import "@material/react-top-app-bar/index.scss";
import "@material/react-list/index.scss";
import "@material/react-drawer/index.scss";
import "mapbox-gl/dist/mapbox-gl.css";

import routeGeoJSON from "./data/route_and_waypoints";

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

const SectionListItem = ({ section }) => {
  let title;
  if (section.start && section.finish)
    title = `${section.start.properties.name} to ${section.finish.properties.name}`;
  else if (section.finish) title = `Start -> ${section.finish.properties.name}`;
  else if (section.start) title = `${section.start.properties.name} -> Finish`;

  return (
    <ListItem>
      <ListItemText
        primaryText={title}
        secondaryText={section.segment.properties.desc}
      />
    </ListItem>
  );
};

class Map extends React.Component {

  state = {
    viewport: {
      width: "100%",
      height: "100%",
      latitude: -42,
      longitude: 174,
      zoom: 8
    }
  };

  render() {
    return (
      <ReactMapGL
        {...this.state.viewport}
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_API_KEY}
        onViewportChange={(viewport) => this.setState({viewport})}
      />
    );
  }
}


class App extends React.Component {
  state = { sections: deriveSections(routeGeoJSON.features), selectedIndex: 0 };
  render() {
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
                  this.setState({ selectedIndex })
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
            <Map />
          </DrawerAppContent>
        </TopAppBarFixedAdjust>
      </div>
    );
  }
}

export default App;
