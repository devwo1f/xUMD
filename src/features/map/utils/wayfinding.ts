import { colors } from '../../../shared/theme/colors';
import { campusRoutes } from '../data/campusOverlays';
import type {
  MapCoordinate,
  MapFocusRequest,
  MapUserLocation,
  WayfindingJourney,
} from '../types';

export const defaultJourneyOrigin = {
  label: 'Stamp Student Union',
  coordinate: [-76.9447, 38.9882] as MapCoordinate,
};

type GraphNodeKey = string;

interface GraphNode {
  key: GraphNodeKey;
  coordinate: MapCoordinate;
}

interface GraphEdge {
  to: GraphNodeKey;
  distanceMeters: number;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(origin: MapCoordinate, destination: MapCoordinate) {
  const earthRadiusMeters = 6371000;
  const [originLongitude, originLatitude] = origin;
  const [destinationLongitude, destinationLatitude] = destination;
  const latitudeDelta = toRadians(destinationLatitude - originLatitude);
  const longitudeDelta = toRadians(destinationLongitude - originLongitude);
  const originLatitudeRadians = toRadians(originLatitude);
  const destinationLatitudeRadians = toRadians(destinationLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(originLatitudeRadians) *
      Math.cos(destinationLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function toMapCoordinate(location: MapUserLocation): MapCoordinate {
  return [location.longitude, location.latitude];
}

export function formatDistanceMiles(distanceMeters: number) {
  const miles = distanceMeters / 1609.34;
  return miles >= 1 ? `${miles.toFixed(1)} mi` : `${Math.round(distanceMeters)} m`;
}

function createJourneyCoordinates(origin: MapCoordinate, destination: MapCoordinate): MapCoordinate[] {
  const [originLongitude, originLatitude] = origin;
  const [destinationLongitude, destinationLatitude] = destination;
  const longitudeDelta = Math.abs(destinationLongitude - originLongitude);
  const latitudeDelta = Math.abs(destinationLatitude - originLatitude);

  if (longitudeDelta < 0.0009 || latitudeDelta < 0.0009) {
    return [origin, destination];
  }

  if (longitudeDelta >= latitudeDelta) {
    const midpointLongitude = originLongitude + (destinationLongitude - originLongitude) * 0.55;
    return [
      origin,
      [midpointLongitude, originLatitude],
      [midpointLongitude, destinationLatitude],
      destination,
    ];
  }

  const midpointLatitude = originLatitude + (destinationLatitude - originLatitude) * 0.55;
  return [
    origin,
    [originLongitude, midpointLatitude],
    [destinationLongitude, midpointLatitude],
    destination,
  ];
}

function coordinateKey([longitude, latitude]: MapCoordinate) {
  return `${longitude.toFixed(6)}:${latitude.toFixed(6)}`;
}

function coordinatesEqual(left: MapCoordinate, right: MapCoordinate) {
  return coordinateKey(left) === coordinateKey(right);
}

function dedupeCoordinates(coordinates: MapCoordinate[]) {
  return coordinates.filter((coordinate, index) => {
    if (index === 0) {
      return true;
    }

    return !coordinatesEqual(coordinate, coordinates[index - 1]);
  });
}

function buildCampusRouteGraph() {
  const nodes = new Map<GraphNodeKey, GraphNode>();
  const edges = new Map<GraphNodeKey, GraphEdge[]>();

  const addNode = (coordinate: MapCoordinate) => {
    const key = coordinateKey(coordinate);
    if (!nodes.has(key)) {
      nodes.set(key, { key, coordinate });
      edges.set(key, []);
    }
    return key;
  };

  const addEdge = (from: MapCoordinate, to: MapCoordinate) => {
    const fromKey = addNode(from);
    const toKey = addNode(to);
    const distanceMeters = getDistanceMeters(from, to);

    edges.get(fromKey)?.push({ to: toKey, distanceMeters });
    edges.get(toKey)?.push({ to: fromKey, distanceMeters });
  };

  campusRoutes.forEach((route) => {
    for (let index = 0; index < route.coordinates.length - 1; index += 1) {
      addEdge(route.coordinates[index], route.coordinates[index + 1]);
    }
  });

  return { nodes, edges };
}

const campusRouteGraph = buildCampusRouteGraph();

function getNearestGraphNodes(coordinate: MapCoordinate, limit = 3) {
  return [...campusRouteGraph.nodes.values()]
    .map((node) => ({
      key: node.key,
      coordinate: node.coordinate,
      connectorDistance: getDistanceMeters(coordinate, node.coordinate),
    }))
    .sort((left, right) => left.connectorDistance - right.connectorDistance)
    .slice(0, limit);
}

function reconstructPath(
  previous: Map<GraphNodeKey, GraphNodeKey | null>,
  startKey: GraphNodeKey,
  endKey: GraphNodeKey,
) {
  const path: MapCoordinate[] = [];
  let currentKey: GraphNodeKey | null = endKey;

  while (currentKey) {
    const node = campusRouteGraph.nodes.get(currentKey);
    if (!node) {
      return [];
    }

    path.push(node.coordinate);

    if (currentKey === startKey) {
      break;
    }

    currentKey = previous.get(currentKey) ?? null;
  }

  return path.reverse();
}

function findShortestCampusPath(startKey: GraphNodeKey, endKey: GraphNodeKey) {
  if (startKey === endKey) {
    const node = campusRouteGraph.nodes.get(startKey);
    return node ? [node.coordinate] : [];
  }

  const distances = new Map<GraphNodeKey, number>();
  const previous = new Map<GraphNodeKey, GraphNodeKey | null>();
  const unvisited = new Set<GraphNodeKey>(campusRouteGraph.nodes.keys());

  campusRouteGraph.nodes.forEach((_, key) => {
    distances.set(key, key === startKey ? 0 : Number.POSITIVE_INFINITY);
    previous.set(key, null);
  });

  while (unvisited.size > 0) {
    let currentKey: GraphNodeKey | null = null;
    let currentDistance = Number.POSITIVE_INFINITY;

    for (const key of unvisited) {
      const distance = distances.get(key) ?? Number.POSITIVE_INFINITY;
      if (distance < currentDistance) {
        currentDistance = distance;
        currentKey = key;
      }
    }

    if (!currentKey || !Number.isFinite(currentDistance)) {
      break;
    }

    if (currentKey === endKey) {
      return reconstructPath(previous, startKey, endKey);
    }

    unvisited.delete(currentKey);

    for (const edge of campusRouteGraph.edges.get(currentKey) ?? []) {
      if (!unvisited.has(edge.to)) {
        continue;
      }

      const tentativeDistance = currentDistance + edge.distanceMeters;
      if (tentativeDistance < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, tentativeDistance);
        previous.set(edge.to, currentKey);
      }
    }
  }

  return [];
}

function buildCampusNetworkJourney(origin: MapCoordinate, destination: MapCoordinate) {
  const originCandidates = getNearestGraphNodes(origin);
  const destinationCandidates = getNearestGraphNodes(destination);

  let bestPath: MapCoordinate[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  originCandidates.forEach((originNode) => {
    destinationCandidates.forEach((destinationNode) => {
      const networkPath = findShortestCampusPath(originNode.key, destinationNode.key);
      if (networkPath.length === 0) {
        return;
      }

      const networkDistance = networkPath.reduce((distance, coordinate, index) => {
        if (index === 0) {
          return 0;
        }

        return distance + getDistanceMeters(networkPath[index - 1], coordinate);
      }, 0);

      const score =
        originNode.connectorDistance + networkDistance + destinationNode.connectorDistance;

      if (score < bestScore) {
        bestScore = score;
        bestPath = dedupeCoordinates([origin, ...networkPath, destination]);
      }
    });
  });

  if (!bestPath) {
    return null;
  }

  const directDistance = getDistanceMeters(origin, destination);
  return bestScore <= directDistance * 2.4 ? bestPath : null;
}

function getPolylineDistanceMeters(coordinates: MapCoordinate[]) {
  return coordinates.reduce((distance, coordinate, index) => {
    if (index === 0) {
      return 0;
    }

    return distance + getDistanceMeters(coordinates[index - 1], coordinate);
  }, 0);
}

export function buildFocusRequestFromCoordinates(
  id: string,
  coordinates: MapCoordinate[],
  options: {
    zoomLevel?: number;
    padding?: number;
  } = {},
): MapFocusRequest {
  if (coordinates.length === 0) {
    return {
      id,
      zoomLevel: options.zoomLevel,
      padding: options.padding,
    };
  }

  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);

  return {
    id,
    centerCoordinate: [
      (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    ],
    bounds: {
      sw: [Math.min(...longitudes), Math.min(...latitudes)],
      ne: [Math.max(...longitudes), Math.max(...latitudes)],
    },
    coordinatePoints: coordinates,
    zoomLevel: options.zoomLevel,
    padding: options.padding ?? 56,
  };
}

export function buildFocusRequestForCoordinate(
  id: string,
  coordinate: MapCoordinate,
  zoomLevel = 16.55,
): MapFocusRequest {
  return {
    id,
    centerCoordinate: coordinate,
    zoomLevel,
    coordinatePoints: [coordinate],
    padding: 56,
  };
}

export function buildWayfindingJourney(options: {
  destinationId: string;
  destinationType: 'building' | 'event';
  destinationLabel: string;
  destinationCoordinate: MapCoordinate;
  subtitle: string;
  originCoordinate?: MapCoordinate;
  startLabel?: string;
}) {
  const originCoordinate = options.originCoordinate ?? defaultJourneyOrigin.coordinate;
  const startLabel = options.startLabel ?? defaultJourneyOrigin.label;
  const coordinates =
    buildCampusNetworkJourney(originCoordinate, options.destinationCoordinate) ??
    createJourneyCoordinates(originCoordinate, options.destinationCoordinate);
  const distanceMeters = getPolylineDistanceMeters(coordinates);
  const distanceMiles = Number((distanceMeters / 1609.34).toFixed(2));
  const durationMinutes = Math.max(3, Math.round(distanceMeters / 80));

  const journey: WayfindingJourney = {
    id: `journey-${options.destinationType}-${options.destinationId}`,
    destinationId: options.destinationId,
    destinationType: options.destinationType,
    title: `Walk to ${options.destinationLabel}`,
    subtitle: options.subtitle,
    startLabel,
    endLabel: options.destinationLabel,
    durationMinutes,
    durationLabel: `${durationMinutes} min`,
    distanceMiles,
    distanceLabel: formatDistanceMiles(distanceMeters),
    color: colors.primary.main,
    coordinates,
  };

  return journey;
}
