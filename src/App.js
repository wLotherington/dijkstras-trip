import { useState } from 'react';
import './App.css';
import DATA from './data.js';

const App = () => {
  const [ start, setStart ] = useState("");
  const [ finish, setFinish ] = useState("");
  const [ path, setPath ] = useState([]);

  const handleSubmit = event => {
    event.preventDefault();

    const startAirport = document.getElementById("startAirport").value;
    const finishAirport = document.getElementById("finishAirport").value;

    dijkstra(startAirport, finishAirport);
  };

  const handleChange = (event, className) => {
    resetPath();
    Array.from(document.getElementsByClassName(className)).forEach(elem => elem.classList.remove(className));
    let airport = event.target.value;

    if (airport != "") {
      document.getElementById(airport).classList.add(className)
    }

    if (className === "startAirport") {
      setStart(airport);
    } else if (className === "finishAirport") {
      setFinish(airport);
    }
  };

  const filtered = () => {
    let routes = {}
    
    DATA.routes.forEach(route => {
      let sortedRoute = [route.src, route.dest].sort((a, b) => a.localeCompare(b)).join("-");

      if (!routes[sortedRoute]) {
        routes[sortedRoute] = true
      }
    });

    return Object.keys(routes)
  };

  const dijkstra = (s, f) => {
    Array.from(document.getElementsByClassName("temp")).forEach(elem => elem.classList.remove("temp"));
    let start = findAirport(s);

    let shortest = {};
    let previous = {};
    
    let unvisited = [];
    let visited = {};

    shortest[start.code] = 0;

    let current = start;

    while (current) {
      visited[current.code] = true;
      unvisited = unvisited.filter(airport => airport.code !== current.code);

      DATA.routes.filter(route => route.src === current.code || route.dest === current.code).forEach(route => {
        let adjAirport = findAirport(route.dest);

        if (!visited[route.dest]) {
          unvisited.push(adjAirport);
        }

        let distance = shortest[current.code] + dist(current, adjAirport);
        if (!shortest[adjAirport.code] || distance < shortest[adjAirport.code]) {
          shortest[adjAirport.code] = distance;
          previous[adjAirport.code] = current.code
        }
      });

      current = unvisited.sort((a, b) => shortest[a.code] - shortest[b.code])[0];
    }

    let shortestPath = [];
    let currentCode = f;

    let i = 0

    while (currentCode !== s) {
      shortestPath.unshift(currentCode)
      currentCode = previous[currentCode];
    }

    shortestPath.unshift(s)

    showPath(shortestPath);
  };

  const showPath = (path) => {
    resetPath();
    for (let i = 1; i < path.length; i++) {
      let p = [path[i - 1], path[i]].sort((a, b) => a.localeCompare(b)).join("-");

      setTimeout(() => document.getElementById(p).classList.add("shortPath"), 500 * (i - 1));
    }
  };

  const resetPath = () => {
    Array.from(document.getElementsByClassName("shortPath")).forEach(elem => elem.classList.remove("shortPath"));
  }

  const reachableAirports = () => {
    let airports = {};
    let queue = [start];

    while (queue.length > 0) {
      let current = queue.pop();

      if (!airports[current] && current !== start) {
        airports[current] = true;
      }

      DATA.routes.filter(route =>
        route.src === current || route.dest === current).forEach(route => {
          if (!airports[route.dest] && route.dest !== start && queue.indexOf(route.dest) === -1) {
            queue.push(route.dest);
          }
        });
    }

    let reachable = Object.keys(airports);

    if (reachable.length == 0) {
      Array.from(document.getElementsByClassName("finishAirport")).forEach(elem => elem.classList.remove("finishAirport"));
    }

    return reachable
  };

  const findAirport = code => {
    return DATA.airports.find(airport => airport.code === code);
  };

  const dist = (start, finish) => {
    return distance(start.lat, start.long, finish.lat, finish.long);
  };

  const distance = (lat1, lon1, lat2, lon2) => {
    // SOURCE: https://www.geodatasource.com/developers/javascript
    if ((lat1 === lat2) && (lon1 === lon2)) {
      return 0;
    }
    else {
      var radlat1 = Math.PI * lat1/180;
      var radlat2 = Math.PI * lat2/180;
      var theta = lon1-lon2;
      var radtheta = Math.PI * theta/180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      return dist;
    }
  }

  const resetFilters = () => {
    setStart("");
    setFinish("");
  };

  return (
    <>
      <form>
        <p>
          <label>Choose Starting Airport: 
            <select id="startAirport" name="startAirport" onChange={e => handleChange(e, "startAirport")}>
              <option value="">Select Airport</option>
              {DATA.airports.sort((a, b) =>
                a.name.localeCompare(b.name)).map(airport =>
                  <option key={airport.code} value={airport.code}>{airport.name + " (" + airport.code + ")"}</option>
              )}
            </select>
          </label>
        </p>
        <p>
          <label>Choose Finishing Airport: 
            <select disabled={!start} id="finishAirport" name="finishAirport" onChange={e => handleChange(e, "finishAirport")}>
              <option value="">Select Airport</option>
              {reachableAirports().map(code => DATA.airports.find(airport => airport.code === code)).sort((a, b) =>
                a.name.localeCompare(b.name)).map(airport =>
                  <option key={airport.code} value={airport.code}>{airport.name + " (" + airport.code + ")"}</option>
              )}
            </select>
          </label>
        </p>
        <input disabled={!finish} type="submit" value="Run Dijkstra's Algorithm" onClick={handleSubmit} />
        <button onClick={resetFilters}>Reset</button>
      </form>
      <br />
      <br />
      <svg className="map" viewBox="-180 -90 360 180">
        <g transform="scale(1 -1)">
          <image xlinkHref="equirectangular_world.jpg" href="equirectangular_world.jpg" x="-180" y="-90" height="100%" width="100%" transform="scale(1 -1)"/>
          {filtered().map(path => {
            const paths = path.split("-");
            const airport1 = DATA.airports.find(airport => airport.code === paths[0]);
            const airport2 = DATA.airports.find(airport => airport.code === paths[1]);

            const x1 = airport1.long;
            const y1 = airport1.lat;
            const x2 = airport2.long;
            const y2 = airport2.lat;

            return (
              <g key={path}>
                <path d={`M${x1} ${y1} L ${x2} ${y2}`} id={path} />
              </g>
            );
          })}

          {DATA.airports.map(airport => {
            return (
              <g key={airport.code} >
                <circle className="airport" id={airport.code} cx={airport.long} cy={airport.lat}>
                  <title>{airport.name}</title>
                </circle> 
              </g>
            );
          })}

          
        </g>
      </svg>
    </>
  );
};

export default App;
