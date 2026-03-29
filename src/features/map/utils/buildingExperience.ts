import { format } from 'date-fns';
import type { Building, BuildingType } from '../../../assets/data/buildings';
import type { Event } from '../../../shared/types';
import type { MapUserLocation } from '../types';
import { getDistanceMeters, toMapCoordinate } from './wayfinding';

type BuildingHoursConfig = {
  weekday: { openHour: number; closeHour: number };
  weekend?: { openHour: number; closeHour: number };
  closedWeekends?: boolean;
};

const buildingHoursByType: Record<BuildingType, BuildingHoursConfig> = {
  library: {
    weekday: { openHour: 8, closeHour: 23 },
    weekend: { openHour: 10, closeHour: 22 },
  },
  student_center: {
    weekday: { openHour: 8, closeHour: 23 },
    weekend: { openHour: 10, closeHour: 22 },
  },
  academic: {
    weekday: { openHour: 8, closeHour: 20 },
    weekend: { openHour: 10, closeHour: 17 },
  },
  engineering: {
    weekday: { openHour: 8, closeHour: 22 },
    weekend: { openHour: 10, closeHour: 18 },
  },
  athletics: {
    weekday: { openHour: 9, closeHour: 22 },
    weekend: { openHour: 10, closeHour: 22 },
  },
  dining: {
    weekday: { openHour: 7, closeHour: 22 },
    weekend: { openHour: 9, closeHour: 21 },
  },
  recreation: {
    weekday: { openHour: 6, closeHour: 23 },
    weekend: { openHour: 9, closeHour: 21 },
  },
  performing_arts: {
    weekday: { openHour: 10, closeHour: 22 },
    weekend: { openHour: 11, closeHour: 22 },
  },
};

const buildingHighlightsByType: Record<BuildingType, string[]> = {
  library: ['Quiet seating', 'Power outlets', 'Research support'],
  student_center: ['Food options', 'Club spaces', 'Study pockets'],
  academic: ['Lecture halls', 'Office hours', 'Study corners'],
  engineering: ['Labs', 'Project rooms', 'Maker energy'],
  athletics: ['Game-day traffic', 'Fitness access', 'Crowd energy'],
  dining: ['Meal plan friendly', 'Late bites', 'Group seating'],
  recreation: ['Fitness floors', 'Courts', 'Locker rooms'],
  performing_arts: ['Performance venues', 'Rehearsal rooms', 'Gallery spaces'],
};

function getSchedule(building: Building, date: Date) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const config = buildingHoursByType[building.building_type];

  if (isWeekend && config.closedWeekends) {
    return null;
  }

  return isWeekend ? config.weekend ?? config.weekday : config.weekday;
}

function formatHourLabel(reference: Date, hour: number) {
  const date = new Date(reference);
  date.setHours(hour, 0, 0, 0);
  return format(date, 'h a');
}

function eventMatchesBuilding(event: Event, building: Building) {
  if (event.latitude !== null && event.longitude !== null) {
    const eventDistance = getDistanceMeters(
      [building.longitude, building.latitude],
      [event.longitude, event.latitude],
    );

    if (eventDistance <= 175) {
      return true;
    }
  }

  const haystack = `${event.location_name} ${event.description}`.toLowerCase();
  return (
    haystack.includes(building.name.toLowerCase()) ||
    haystack.includes(building.code.toLowerCase())
  );
}

export function getBuildingNowStatus(building: Building, date = new Date()) {
  const schedule = getSchedule(building, date);

  if (!schedule) {
    return {
      isOpen: false,
      label: 'Closed today',
      detail: 'This location is usually inactive on weekends.',
    };
  }

  const currentHour = date.getHours() + date.getMinutes() / 60;
  const isOpen = currentHour >= schedule.openHour && currentHour < schedule.closeHour;

  return isOpen
    ? {
        isOpen: true,
        label: `Open now until ${formatHourLabel(date, schedule.closeHour)}`,
        detail: 'Good time to head over.',
      }
    : {
        isOpen: false,
        label: 'Closed right now',
        detail: `Usually open ${formatHourLabel(date, schedule.openHour)} to ${formatHourLabel(
          date,
          schedule.closeHour,
        )}.`,
      };
}

export function isBuildingOpenNow(building: Building, date = new Date()) {
  return getBuildingNowStatus(building, date).isOpen;
}

export function getBuildingQuickFacts(building: Building) {
  return buildingHighlightsByType[building.building_type];
}

export function getCurrentEventsForBuilding(building: Building, events: Event[], date = new Date()) {
  return events
    .filter((event) => {
      const startsAt = new Date(event.starts_at);
      const endsAt = new Date(event.ends_at);
      return startsAt <= date && endsAt >= date && eventMatchesBuilding(event, building);
    })
    .sort((left, right) => new Date(left.ends_at).getTime() - new Date(right.ends_at).getTime());
}

export function getUpcomingEventsForBuilding(
  building: Building,
  events: Event[],
  date = new Date(),
  limit = 3,
) {
  return events
    .filter((event) => new Date(event.starts_at) > date && eventMatchesBuilding(event, building))
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime())
    .slice(0, limit);
}

export function getNearbyBuildings(
  location: MapUserLocation,
  buildings: Building[],
  radiusMeters = 425,
) {
  const coordinate = toMapCoordinate(location);

  return buildings
    .map((building) => ({
      building,
      distanceMeters: getDistanceMeters(coordinate, [building.longitude, building.latitude]),
    }))
    .filter((item) => item.distanceMeters <= radiusMeters)
    .sort((left, right) => left.distanceMeters - right.distanceMeters);
}

export function getNearbyEvents(location: MapUserLocation, events: Event[], radiusMeters = 425) {
  const coordinate = toMapCoordinate(location);

  return events
    .filter((event) => event.latitude !== null && event.longitude !== null)
    .map((event) => ({
      event,
      distanceMeters: getDistanceMeters(coordinate, [event.longitude as number, event.latitude as number]),
    }))
    .filter((item) => item.distanceMeters <= radiusMeters)
    .sort((left, right) => left.distanceMeters - right.distanceMeters);
}

export function isTonightEvent(event: Event, date = new Date()) {
  const startsAt = new Date(event.starts_at);
  const isSameDay =
    startsAt.getFullYear() === date.getFullYear() &&
    startsAt.getMonth() === date.getMonth() &&
    startsAt.getDate() === date.getDate();

  return isSameDay && startsAt.getHours() >= 17;
}