// A private object to store interactive map instances by their element IDs
let activeMaps = {};

/**
 * Initializes a fully interactive MapLibre map instance inside a given HTML element.
 */
export function initializeMap(elementId, lng, lat, zoom) {

    // Prevent memory leaks by cleaning up an existing map on this element if it exists
    if (activeMaps[elementId]) {
        activeMaps[elementId].remove();
    }


    
    // Create the interactive MapLibre instance using the global 'maplibregl' object
    const map = new maplibregl.Map({
        container: elementId,

        // This is an open-source Vector tile style. Can replace this with other tiles.
        style: 'https://tiles.openfreemap.org/styles/bright',

        center: [lng, lat],
        zoom: zoom,
        interactive: true,

        fadeDuration: 0,
    });
    

    // This below is the raster tiles style
   /*
    const map = new maplibregl.Map({
        container: elementId,

        style: {
            "version": 8,
            "sources": {
                "raster-tiles": {
                    "type": "raster",

                    // URL to your raster tiles (e.g., OpenStreetMap standard raster tiles)
                    "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],                    
                    "tileSize": 256,     // Or 512 for sharper raster tiles
                    "minzoom": 0,
                    "maxzoom": 19,
                    "attribution": "© OpenStreetMap contributors",
                }
            },
            "layers": [
                {
                    "id": "simple-tiles",
                    "type": "raster",
                    "source": "raster-tiles",
                    "minzoom": 0,
                    "maxzoom": 19
                }
            ]
        },
        center: [lng, lat],
        zoom: zoom
    }); 
    */

    // Add standard interactive navigation controls (Zoom +/- and compass tilt buttons)
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Save this specific instance so we can query its coordinates later
    activeMaps[elementId] = map;
}

/**
 * Grabs the exact bounding box coordinates based on where the user panned/zoomed.
 */
export function getBounds(elementId) {
    const map = activeMaps[elementId];
    if (!map) return null;

    const bounds = map.getBounds();
    // Returns [minLng, minLat, maxLng, maxLat] matching the exact array order above
    return [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
    ];
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