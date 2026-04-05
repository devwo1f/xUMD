import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Building } from '../../../assets/data/buildings';
import type { Event } from '../../../shared/types';
import type { CampusRoute, DiningZone } from '../data/campusOverlays';
import type {
  EventLocationGroup,
  MapCoordinate,
  MapFocusRequest,
  MapUserLocation,
  WayfindingJourney,
} from '../types';

export interface CampusMapProps {
  style?: StyleProp<ViewStyle>;
  events: Event[];
  eventGroups: EventLocationGroup[];
  densityByEventId?: Record<string, number>;
  buildings: Building[];
  showEvents: boolean;
  showBuildings: boolean;
  showWalkingRoutes?: boolean;
  showDiningZones?: boolean;
  clusterEvents?: boolean;
  isHeatmapMode?: boolean;
  activeBuildingId?: string | null;
  activeEventGroupId?: string | null;
  activeRouteId?: string | null;
  activeDiningZoneId?: string | null;
  userLocation?: MapUserLocation | null;
  focusRequest?: MapFocusRequest | null;
  wayfindingJourney?: WayfindingJourney | null;
  onSelectEventGroup: (group: EventLocationGroup) => void;
  onSelectBuilding: (building: Building) => void;
  onSelectRoute?: (route: CampusRoute) => void;
  onSelectDiningZone?: (zone: DiningZone) => void;
  onLongPressCoordinate?: (coordinate: MapCoordinate) => void;
}

declare const CampusMap: ComponentType<CampusMapProps>;

export default CampusMap;
