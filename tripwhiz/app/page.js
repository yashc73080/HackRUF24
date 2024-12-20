'use client';

import { useEffect, useState, useRef } from 'react';
import ChatInterface from './components/ChatInterface';

export default function Page() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [currentPlace, setCurrentPlace] = useState(null);
  const [map, setMap] = useState(null);
  const [searchBox, setSearchBox] = useState(null);
  const [currentMarker, setCurrentMarker] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [routePolyline, setRoutePolyline] = useState(null);
  const locationsListRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (locationsListRef.current) {
      locationsListRef.current.scrollTop = locationsListRef.current.scrollHeight;
    }
  }, [selectedLocations]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!mapLoaded) return;

    const newMap = new window.google.maps.Map(document.getElementById('map'), {
      center: { lat: 40.749933, lng: -73.98633 },
      zoom: 13,
    });
    setMap(newMap);

    const input = document.getElementById('pac-input');
    const newSearchBox = new window.google.maps.places.SearchBox(input);
    setSearchBox(newSearchBox);

    newMap.addListener('bounds_changed', () => {
      newSearchBox.setBounds(newMap.getBounds());
    });

    newSearchBox.addListener('places_changed', () => {
      const places = newSearchBox.getPlaces();

      if (places.length === 0) return;

      const place = places[0];

      if (!place.geometry || !place.geometry.location) {
        console.log('Returned place contains no geometry');
        return;
      }

      setCurrentPlace({
        name: place.name,
        address: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });

      if (currentMarker) {
        currentMarker.setMap(null);
      }

      const newMarker = new window.google.maps.Marker({
        map: newMap,
        position: place.geometry.location,
        title: place.name,
        animation: window.google.maps.Animation.DROP,
      });

      setCurrentMarker(newMarker);

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
      const marker = new window.google.maps.Marker({
        map: map,
        position: { lat: currentPlace.lat, lng: currentPlace.lng },
        title: currentPlace.name,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
      });

      setSelectedLocations([...selectedLocations, { ...currentPlace, marker }]);
      document.getElementById('pac-input').value = '';
      setCurrentPlace(null);

      if (currentMarker) {
        currentMarker.setMap(null);
        setCurrentMarker(null);
      }
    }
  };

  const removeLocation = (index) => {
    const locationToRemove = selectedLocations[index];
    if (locationToRemove.marker) {
      locationToRemove.marker.setMap(null);
    }

    const newLocations = selectedLocations.filter((_, i) => i !== index);
    setSelectedLocations(newLocations);

    // Clear the optimized route when locations are modified
    setOptimizedRoute(null);
    if (routePolyline) {
      routePolyline.setMap(null);
      setRoutePolyline(null);
    }
  };

  const clearAllLocations = () => {
    // Clear all markers from the map
    selectedLocations.forEach(location => {
      if (location.marker) {
        location.marker.setMap(null);
      }
    });

    // Clear the optimized route
    if (routePolyline) {
      routePolyline.setMap(null);
      setRoutePolyline(null);
    }

    // Reset states
    setSelectedLocations([]);
    setOptimizedRoute(null);
  };

  // Submit itinerary function
  const submitItinerary = async () => {
    if (selectedLocations.length === 0) {
      alert("No locations to submit.");
      return;
    }

    setIsSubmitting(true);

    const itineraryData = selectedLocations.map(location => ({
      name: location.name,
      lat: location.lat,
      lng: location.lng
    }));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/submit-itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations: itineraryData }),
      });

      if (response.ok) {
        const data = await response.json();
        setOptimizedRoute(data.optimized_route);

        if (routePolyline) {
          routePolyline.setMap(null);
        }

        const routeCoordinates = data.optimized_route.map(index => ({
          lat: selectedLocations[index].lat,
          lng: selectedLocations[index].lng
        }));

        routeCoordinates.push(routeCoordinates[0]);

        const newPolyline = new window.google.maps.Polyline({
          path: routeCoordinates,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 2,
          map: map
        });

        setRoutePolyline(newPolyline);

        const bounds = new window.google.maps.LatLngBounds();
        routeCoordinates.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds);
      } else {
        alert('Failed to submit itinerary.');
      }
    } catch (error) {
      console.error('Error submitting itinerary:', error);
      alert('Error submitting itinerary.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 p-4">
      <div className="grid grid-cols-12 gap-4 max-w-[1920px] mx-auto">
        {/* Map Section - 6 columns */}
        <div className="col-span-6 bg-gray-700 rounded-lg p-6 shadow-lg">
          <div className="relative">
            <p className="text-gray-200 font-semibold mb-5 text-2xl">Plan your next adventure</p>
            <div className="flex gap-2 mb-4">
              <input
                id="pac-input"
                className="flex-1 p-2 rounded border border-gray-500 bg-gray-700 text-gray-100"
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
                Add
              </button>
            </div>
            <div
              id="map"
              className="rounded-lg"
              style={{ height: '600px', width: '100%' }}
            />
          </div>
        </div>

        {/* Right Side Sections - 6 columns */}
        <div className="col-span-6 flex flex-col gap-4">
          {/* Selected Locations - Scrollable */}
          <div className="bg-gray-700 rounded-lg p-4 shadow-lg h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-gray-200 text-lg font-semibold">Selected Locations</h2>
              <div className="flex gap-2">
                <button
                  onClick={clearAllLocations}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded flex items-center"
                  title="Clear all locations"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
                <button
                  onClick={submitItinerary}
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded flex items-center gap-2 ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg 
                        className="animate-spin h-5 w-5 text-white" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        />
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Submit Itinerary'
                  )}
                </button>
              </div>
            </div>
            <div
              ref={locationsListRef}
              className="flex-1 overflow-y-auto pr-2 space-y-2"
            >
              {selectedLocations.length === 0 ? (
                <p className="text-gray-400 text-sm">No locations added to itinerary yet</p>
              ) : (
                <ul className="space-y-2">
                  {selectedLocations.map((location, index) => (
                    <li key={index} className="flex justify-between items-start bg-gray-600 p-2 rounded">
                      <div className="text-gray-200">
                        <p className="text-sm font-semibold">{location.name}</p>
                        <p className="text-xs text-gray-400">{location.address}</p>
                        <p className="text-[10px] text-gray-400">
                          Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeLocation(index)}
                        className="text-red-400 hover:text-red-300 ml-2 text-sm"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Chat Interface Space */}
          <div className="bg-gray-700 rounded-lg p-4 shadow-lg flex flex-col h-[350px]">
            <h2 className="text-gray-200 text-lg font-semibold mb-3">TripWhiz AI</h2>
            <div className="flex-1 overflow-hidden"> {/* Added container */}
              <ChatInterface selectedLocations={selectedLocations} />
            </div>
          </div>

          {/* Final Itinerary */}
          <div className="bg-gray-700 rounded-lg p-4 shadow-lg">
            <h2 className="text-gray-200 text-lg font-semibold mb-3">Optimized Itinerary</h2>
            {selectedLocations.length === 0 ? (
              <p className="text-gray-400 text-sm">Add locations to generate an optimized route</p>
            ) : optimizedRoute ? (
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">Total Locations: {selectedLocations.length}</p>
                <div className="space-y-1">
                  {optimizedRoute.map((index, i) => (
                    <div key={i} className="text-gray-200 text-sm flex items-center">
                      <span className="mr-2">{i + 1}.</span>
                      <span>{selectedLocations[index]?.name || 'Location removed'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 text-sm">Total Locations: {selectedLocations.length}</p>
                <p className="text-gray-400 text-sm">Click &quot;Submit Itinerary&quot; to optimize route</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
