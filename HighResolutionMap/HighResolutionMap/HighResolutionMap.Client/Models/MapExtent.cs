namespace HighResolutionMap.Client.Models;

public class MapExtent
{
    public string MapId { get; set; } = string.Empty; // 🚀 Add this line
    public double MinLng { get; set; }
    public double MinLat { get; set; }
    public double MaxLng { get; set; }
    public double MaxLat { get; set; }
}