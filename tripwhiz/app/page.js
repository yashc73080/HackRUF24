'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [currentPlace, setCurrentPlace] = useState(null);
  const [map, setMap] = useState(null);
  const [searchBox, setSearchBox] = useState(null);
  const [currentMarker, setCurrentMarker] = useState(null);

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
    const newMap = new window.google.maps.Map(document.getElementById('map'), {
      center: { lat: 40.749933, lng: -73.98633 },
      zoom: 13,
    });
    setMap(newMap);

    // Create the search box
    const input = document.getElementById('pac-input');
    const newSearchBox = new window.google.maps.places.SearchBox(input);
    setSearchBox(newSearchBox);

    // Bias the SearchBox results towards current map's viewport
    newMap.addListener('bounds_changed', () => {
      newSearchBox.setBounds(newMap.getBounds());
    });

    // Listen for the event when a user selects a prediction
    newSearchBox.addListener('places_changed', () => {
      const places = newSearchBox.getPlaces();

      if (places.length === 0) return;

      const place = places[0]; // Get the first place

      if (!place.geometry || !place.geometry.location) {
        console.log('Returned place contains no geometry');
        return;
      }

      // Store the current place
      setCurrentPlace({
        name: place.name,
        address: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });

      // Clear existing marker
      if (currentMarker) {
        currentMarker.setMap(null);
      }

      // Create new marker
      const newMarker = new window.google.maps.Marker({
        map: newMap,
        position: place.geometry.location,
        title: place.name,
        animation: window.google.maps.Animation.DROP,
      });
      
      setCurrentMarker(newMarker);

      // Adjust map bounds
      if (place.geometry.viewport) {
        newMap.fitBounds(place.geometry.viewport);
      } else {
        newMap.setCenter(place.geometry.location);
        newMap.setZoom(17);
      }
    });

  }, [mapLoaded]);

  const addToItinerary = () => {
    if (currentPlace && !selectedLocations.some(loc => loc.name === currentPlace.name)) {
      // Add marker for the selected location
      const marker = new window.google.maps.Marker({
        map: map,
        position: { lat: currentPlace.lat, lng: currentPlace.lng },
        title: currentPlace.name,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
      });

      setSelectedLocations([...selectedLocations, { ...currentPlace, marker }]);
      document.getElementById('pac-input').value = ''; // Clear search box
      setCurrentPlace(null);
      
      // Clear the temporary search marker
      if (currentMarker) {
        currentMarker.setMap(null);
        setCurrentMarker(null);
      }
    }
  };

  const removeLocation = (index) => {
    // Remove marker from map
    const locationToRemove = selectedLocations[index];
    if (locationToRemove.marker) {
      locationToRemove.marker.setMap(null);
    }
    
    const newLocations = selectedLocations.filter((_, i) => i !== index);
    setSelectedLocations(newLocations);
  };

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      <div className="flex flex-col gap-4 w-full max-w-6xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-gray-700 rounded-lg p-6 shadow-lg">
            <div className="relative">
              <div className="flex gap-2 mb-4">
                <input
                  id="pac-input"
                  className="flex-1 p-2 rounded border border-gray-300 text-gray-900"
                  type="text"
                  placeholder="Search for a location"
                />
                <button
                  onClick={addToItinerary}
                  disabled={!currentPlace}
                  className={`px-4 py-2 rounded ${
                    currentPlace
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-400 text-gray-200'
                  }`}
                >
                  Add to Itinerary
                </button>
              </div>
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
          <div className="flex-1 bg-gray-700 rounded-lg p-6 shadow-lg">
            <h2 className="text-gray-200 text-xl font-semibold mb-4">Selected Locations</h2>
            {selectedLocations.length === 0 ? (
              <p className="text-gray-400">No locations added to itinerary yet</p>
            ) : (
              <ul className="space-y-4">
                {selectedLocations.map((location, index) => (
                  <li key={index} className="flex justify-between items-start bg-gray-600 p-3 rounded">
                    <div className="text-gray-200">
                      <p className="font-semibold">{location.name}</p>
                      <p className="text-sm text-gray-400">{location.address}</p>
                      <p className="text-xs text-gray-400">
                        Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeLocation(index)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-lg p-6 shadow-lg">
          <h2 className="text-gray-200 text-xl font-semibold">Route Details</h2>
          <p className="text-gray-300 mt-2">
            Total Locations: {selectedLocations.length}
          </p>
        </div>
      </div>
    </div>
  );
}