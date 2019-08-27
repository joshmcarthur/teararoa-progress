import React from "react";
import "./App.scss";
import Card, { CardPrimaryContent } from "@material/react-card";
import '@material/react-card/index.scss';
import '@material/react-typography/index.scss';

import { Headline6, Subtitle2 } from "@material/react-typography";
import routeGeoJSON from "./data/route_and_waypoints";

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
      wp => wp.geometry.coordinates.toString() === part.geometry.coordinates[0].toString()
    ),
    finish: waypoints.find(
      wp =>
        wp.geometry.coordinates.toString() ===
        part.geometry.coordinates[part.geometry.coordinates.length - 1].toString()
    ),
    segment: part
  }));
};

const SectionCard = ({ section }) => {
  let title;
  if (section.start && section.finish) title = `${section.start.properties.name} to ${section.finish.properties.name}`
  else if (section.finish) title = `Start -> ${section.finish.properties.name}`
  else if (section.start) title = `${section.start.properties.name} -> Finish`

  return (
    <Card className="SectionCard" outlined>
      <CardPrimaryContent>
        <div>
          <Headline6>{title}</Headline6>
          <Subtitle2>{section.segment.properties.desc}</Subtitle2>
        </div>
      </CardPrimaryContent>
    </Card>
  );
};

class App extends React.Component {
  state = { sections: deriveSections(routeGeoJSON.features) };
  render() {
    return (
      <div className="App">
        {this.state.sections.map(s => (
          <SectionCard section={s} key={s.segment.properties.cmt} />
        ))}
      </div>
    );
  }
}

export default App;
