'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Load Google Maps JavaScript API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!mapLoaded) return;

    // Initialize the map
    const map = new window.google.maps.Map(document.getElementById('map'), {
      center: { lat: 40.749933, lng: -73.98633 },
      zoom: 13,
    });

    // Add initial marker
    const marker = new window.google.maps.Marker({
      position: { lat: 40.749933, lng: -73.98633 },
      map: map,
      draggable: true
    });

    // Create the search box
    const input = document.getElementById('pac-input');
    const searchBox = new window.google.maps.places.SearchBox(input);

    // Bias the SearchBox results towards current map's viewport
    map.addListener('bounds_changed', () => {
      searchBox.setBounds(map.getBounds());
    });

    // Listen for the event when a user selects a prediction
    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();

      if (places.length === 0) {
        return;
      }

      // For each place, get the icon, name and location.
      const bounds = new window.google.maps.LatLngBounds();
      
      places.forEach(place => {
        if (!place.geometry || !place.geometry.location) {
          console.log('Returned place contains no geometry');
          return;
        }

        // Update marker position
        marker.setPosition(place.geometry.location);

        // Update map view
        if (place.geometry.viewport) {
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      
      map.fitBounds(bounds);
      map.setZoom(15); // You can adjust this value
    });

  }, [mapLoaded]);

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      <div className="flex flex-col gap-4 w-full max-w-6xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-gray-700 rounded-lg p-6 shadow-lg" style={{ flexGrow: 2 }}>
            <div className="relative">
              <input
                id="pac-input"
                className="w-full p-2 mb-4 rounded border border-gray-300 text-gray-900"
                type="text"
                placeholder="Search for a location"
              />
              <div 
                id="map" 
                style={{ 
                  height: '500px', 
                  width: '100%',
                  borderRadius: '0.5rem'
                }} 
              />
            </div>
          </div>
          <div className="flex-1 bg-gray-700 rounded-lg p-6 shadow-lg" style={{ flexGrow: 2 }}>
            <h2 className="text-gray-200 text-xl font-semibold">Box 2</h2>
            <p className="text-gray-300 mt-2">Content for second box</p>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-lg p-6 shadow-lg">
          <h2 className="text-gray-200 text-xl font-semibold">Box 3</h2>
          <p className="text-gray-300 mt-2">Content for the full-width box</p>
        </div>
      </div>
    </div>
  );
}