// A private object to store interactive map instances by their element IDs
let activeMaps = {};

/**
 * Initializes a fully interactive MapLibre map instance inside a given HTML element.
 */
export function initializeMap(elementId, lng, lat, zoom) {
    // 1. Prevent memory leaks by cleaning up an existing map on this element if it exists
    if (activeMaps[elementId]) {
        activeMaps[elementId].remove();
    }

    // 2. Create the interactive MapLibre instance using the global 'maplibregl' object
    const map = new maplibregl.Map({
        container: elementId,
        // Using an open-source demo tile style. Can replace this with own local GeoServer style JSON
        style: 'https://demotiles.maplibre.org/style.json',

        center: [lng, lat],
        zoom: zoom,
        interactive: true // This guarantees pan, drag, and zoom work out of the box
    });

    // 3. Add standard interactive navigation controls (Zoom +/- and compass tilt buttons)
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // 4. Save this specific instance so we can query its coordinates later
    activeMaps[elementId] = map;
}

/**
 * Grabs the exact bounding box coordinates based on where the user panned/zoomed.
 */
export function getBounds(elementId) {
    const map = activeMaps[elementId];
    if (!map) return null;

    const bounds = map.getBounds();
    return {
        minLng: bounds.getWest(),
        minLat: bounds.getSouth(),
        maxLng: bounds.getEast(),
        maxLat: bounds.getNorth()
    };
}

/**
 * Safely removes the map from memory when the user leaves the page.
 */
export function disposeMap(elementId) {
    if (activeMaps[elementId]) {
        activeMaps[elementId].remove();
        delete activeMaps[elementId];
    }
}