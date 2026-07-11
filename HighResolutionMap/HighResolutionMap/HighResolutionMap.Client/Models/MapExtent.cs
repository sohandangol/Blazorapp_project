namespace HighResolutionMap.Client.Models;

public record MapExtent
(
    double MinLng,
    double MinLat,
    double MaxLng,
    double MaxLat
);
