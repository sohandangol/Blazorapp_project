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

window.getBounds = getBounds;


/**
 * Safely removes the map from memory when the user leaves the page.
 */
export function disposeMap(elementId) {
    if (activeMaps[elementId]) {
        activeMaps[elementId].remove();
        delete activeMaps[elementId];
    }
}


/**
 * A js bridge function controlled completely by C# parameters.
 * Creates an un-rendered high-res canvas in the background and returns a JPEG format base64 string.
 */
window.generateHiddenCanvasBridge = function (sourceId, width, height, scale, minLng, minLat, maxLng, maxLat) {
    return new Promise((resolve, reject) => {
        try {
            // 1. Setup an isolated container far off the visible layout tree area
            const hiddenContainer = document.createElement('div');
            Object.assign(hiddenContainer.style, {
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                width: width + 'px',
                height: height + 'px'
            });
            document.body.appendChild(hiddenContainer);

            // 2. Temporarily hijack the browser device pixel ratio to force ultra-sharp rendering density
            const originalDPR = window.devicePixelRatio;
            Object.defineProperty(window, 'devicePixelRatio', { get: () => scale, configurable: true });

            // 3. Initialize a silent background MapLibre sandbox clone
            const hiddenMap = new maplibregl.Map({
                container: hiddenContainer,
                style: activeMaps[sourceId].getStyle(), // Automatically grabs whichever style (vector or raster comment out block) you have running!
                interactive: false,
                fadeDuration: 0,
                preserveDrawingBuffer: true, // Absolutely mandatory for reading raw canvas data blocks
                trackResize: false
            });

            // 4. Tight-fit the map canvas boundaries down onto the user's captured coordinates
            hiddenMap.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 0, animate: false });

            // 5. Once the canvas finishes drawing all background tiles completely, grab the bytes
            hiddenMap.once('idle', () => {
                try {
                    const canvas = hiddenMap.getCanvas();

                    // Export directly to high-quality image/jpeg format (0.95 quality) back to C#
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                    resolve(dataUrl);
                } catch (err) {
                    reject(err);
                } finally {
                    // 6. Memory Cleanup: Wipe out background footprint elements immediately
                    Object.defineProperty(window, 'devicePixelRatio', { get: () => originalDPR, configurable: true });
                    hiddenMap.remove();
                    hiddenContainer.remove();
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Standard Microsoft Blazor stream reference file saver utility
 */
window.BlazorDownloadFileBridge = async (fileName, contentStreamReference) => {
    const buffer = await contentStreamReference.arrayBuffer();
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);
    a.remove();
};