from flask import Flask, request, jsonify
from flask_cors import CORS
import googlemaps
from dotenv import load_dotenv
import os
from christofides import tsp  # Import the tsp function from christofides.py

# Load environment variables from a .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
load_dotenv(env_path)

# Initialize the Google Maps client with your API key
GOOGLE_MAPS_API_KEY = os.getenv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
if not GOOGLE_MAPS_API_KEY:
    raise ValueError("Google Maps API key not found in .env.local file")

gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/')
def home():
    return "Welcome to the TSP API! Use the /submit-itinerary endpoint to calculate routes."

@app.route('/submit-itinerary', methods=['POST'])
def submit_itinerary():
    data = request.json
    locations = data.get("locations", [])
    
    if not locations or len(locations) < 2:
        return jsonify({"error": "You need at least two locations to calculate a route."}), 400

    try:
        # Run the TSP algorithm on the entered locations
        optimized_route = tsp(locations, 0)  # Start from the first location
        return jsonify({
            "status": "success",
            "optimized_route": [locations.index(loc) for loc in optimized_route]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)