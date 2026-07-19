// A private object to store interactive map instances by their element IDs
let activeMaps = {};

/**
 * Initializes a fully interactive MapLibre map instance inside a given HTML element.
 */
export function initializeMap(elementId, lng, lat, zoom) {

    const maplibregl = globalThis.maplibregl;
    if (!maplibregl) {
        throw new Error("MapLibre GL library is missing the global scope");
    }

    if (activeMaps[elementId]) {
        activeMaps[elementId].remove();
    }


    // Dont forget double slashes in style: 'https://tiles.openfreemap.org/styles/bright',
    const map = new maplibregl.Map({
        container: elementId,

        style: 'https://tiles.openfreemap.org/styles/bright',  // Vector Map

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
    const container = map.getContainer();

    // Returns [minLng, minLat, maxLng, maxLat] matching the exact array order above
    return [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),  //Added this container here below

        container.clientWidth,
        container.clientHeight
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

/**
 * A js bridge function controlled completely by C# parameters.
 * Creates an un-rendered high-res canvas in the background and returns a JPEG format base64 string.
 */
export function generateHiddenCanvasBridge(sourceId, cssWidth, cssHeight, scale, minLng, minLat, maxLng, maxLat) {
    return new Promise((resolve, reject) => {
        try {
            const MAX_CANVAS_DIM = 8192;
            if (cssWidth * scale > MAX_CANVAS_DIM || cssHeight * scale > MAX_CANVAS_DIM) {
                const maxCurrentDim = Math.max(cssWidth, cssHeight);
                scale = MAX_CANVAS_DIM / maxCurrentDim;
                console.warn(`Target canvas dimensions exceeded GPU limits. Clamping down to: ${scale}`);
            }

            const hiddenContainer = document.createElement('div');
            Object.assign(hiddenContainer.style, {
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                width: cssWidth + 'px',
                height: cssHeight + 'px'
            });
            document.body.appendChild(hiddenContainer);

            // 1. Intercept the standard device pixel layout metrics
            const originalDPR = window.devicePixelRatio;
            Object.defineProperty(window, 'devicePixelRatio', { get: () => scale, configurable: true });

            const maplibregl = globalThis.maplibregl;

            // 2. Instantiate hidden canvas target using advanced printing configurations
            const hiddenMap = new maplibregl.Map({
                container: hiddenContainer,
                style: activeMaps[sourceId].getStyle(),
                interactive: false,
                fadeDuration: 0,
                preserveDrawingBuffer: true,
                trackResize: false,

                // Forces high-density resource selection for symbols, sprites, and background layouts
                pixelRatio: scale
            });

            // 3. FORCE internal canvas pixel ratio engine manipulation
            // This is the direct call that instructs the WebGL subsystem to render 
            // smaller, razor-sharp vector line segments instead of stretched brush strokes.
            if (typeof hiddenMap.setPixelRatio === 'function') {
                hiddenMap.setPixelRatio(scale);
            }

            // 4. Force map target matrix projection system to align properly
            hiddenMap.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 0, animate: false });

            hiddenMap.once('idle', () => {
                try {
                    const canvas = hiddenMap.getCanvas();
                    const dataUrl = canvas.toDataURL('image/jpeg', 1.0); // 1.0 = Maximum JPEG compression fidelity quality
                    resolve(dataUrl);
                } catch (err) {
                    reject(err);
                } finally {
                    // Restore environment defaults to keep standard UI safe
                    Object.defineProperty(window, 'devicePixelRatio', { get: () => originalDPR, configurable: true });
                    hiddenMap.remove();
                    hiddenContainer.remove();
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Standard Microsoft Blazor stream reference file saver utility
 */
export async function BlazorDownloadFileBridge(fileName, contentStreamReference) {
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


// Below code is to display maps in DataMap.razor page
export function initializeMapWithMultipleLayers(elementId, lng, lat, zoom, layersJson) {
    const maplibregl = globalThis.maplibregl;
    if (!maplibregl) {
        throw new Error("MapLibre GL library is missing the global scope");
    }

    if (activeMaps[elementId]) {
        activeMaps[elementId].remove();
    }

    const map = new maplibregl.Map({
        container: elementId,
        // style: 'https:tiles.openfreemap.org/styles/bright',
        center: [lng, lat],
        zoom: zoom,
        interactive: true,
        fadeDuration: 0,
    });

    // Parse layers from JSON if provided
    let layers = [];
    if (layersJson && layersJson.trim() !== '') {
        try {
            layers = JSON.parse(layersJson);
        } catch (parseErr) {
            console.error("[Map Engine] Failed to parse layers JSON:", parseErr);
            layers = [];
        }
    }

    map.on('load', () => {
        if (layers && layers.length > 0) {
            layers.forEach(layer => {
                try {
                    // Ensure required properties exist before parsing
                    if (!layer || !layer.rawGeoJson) return;

                    const parsedData = JSON.parse(layer.rawGeoJson);
                    const sourceId = `source-${layer.id}`;
                    const layerId = `layer-${layer.id}`;

                    // Double check to make sure the source isn't duplicated
                    if (!map.getSource(sourceId)) {
                        map.addSource(sourceId, {
                            type: 'geojson',
                            data: parsedData
                        });
                    }

                    const visibilitySetting = layer.isVisible ? 'visible' : 'none';
                    const baseColor = layer.color || '#000000';

                    // Double check to ensure we don't duplicate the layer
                    if (map.getLayer(layerId)) return;

                    // Add Layer based on geometry type
                    if (layer.layerType === 'line') {
                        map.addLayer({
                            id: layerId,
                            type: 'line',
                            source: sourceId,
                            layout: {
                                'visibility': visibilitySetting,
                                'line-join': 'round',
                                'line-cap': 'round'
                            },
                            paint: {
                                'line-color': baseColor,
                                'line-width': 1.0
                            }
                        });
                    } else {
                        map.addLayer({
                            id: layerId,
                            type: 'circle',
                            source: sourceId,
                            layout: {
                                'visibility': visibilitySetting
                            },
                            paint: {
                                'circle-radius': 6.0,
                                'circle-color': baseColor,
                                'circle-stroke-width': 1.5,
                                'circle-stroke-color': '#ffffff'
                            }
                        });
                    }
                } catch (layerErr) {
                    console.error(`[Map Engine] Failed to safely load layer: ${layer?.id}`, layerErr);
                }
            });
        }
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    activeMaps[elementId] = map;
}

/**
 * Dynamically toggles the visibility of a layer.
 */
export function toggleLayerVisibility(elementId, layerId, isVisible) {
    const map = activeMaps[elementId];
    if (!map) return;

    const actualLayerId = `layer-${layerId}`;
    if (map.getLayer(actualLayerId)) {
        map.setLayoutProperty(actualLayerId, 'visibility', isVisible ? 'visible' : 'none');
    }
}
