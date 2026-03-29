import { colors } from '../../../shared/theme/colors';
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
  const coordinates = createJourneyCoordinates(originCoordinate, options.destinationCoordinate);
  const distanceMeters = getDistanceMeters(originCoordinate, options.destinationCoordinate);
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