import dotenv from 'dotenv';
dotenv.config();

const toRad = (deg) => (deg * Math.PI) / 180;

export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const checkOutOfJurisdiction = (lat, lng) => {
  const polsekLat = Number(process.env.POLSEK_LAT || -7.7547);
  const polsekLng = Number(process.env.POLSEK_LNG || 110.4912);
  const maxRadiusKm = Number(process.env.MAX_JURISDICTION_RADIUS_KM || 7.0);
  const westBoundaryLng = Number(process.env.WEST_BOUNDARY_LNG || 110.4835);

  const distanceKm = calculateDistanceMeters(polsekLat, polsekLng, lat, lng) / 1000;
  return lng < westBoundaryLng || distanceKm > maxRadiusKm;
};
