namespace WebAppPrinting.Models
{
    public class MapExtent
    {
        public string MapId { get; set; } = string.Empty;
        public double MinLng { get; set; }
        public double MinLat { get; set; }
        public double MaxLng { get; set; }
        public double MaxLat { get; set; }

        public double ContainerWidth { get; set; }  

        public double ContainerHeight { get; set; } 
    }


    //Map Layer Items
    public class MapLayerItem
    {
        public string Id { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string RawGeoJson { get; set; } = string.Empty;
        public bool IsVisible { get; set; } = true;
        public string LayerType { get; set; } = "circle"; // 'circle' or 'line'
        public string Color { get; set; } = "#000000";

    }

}
