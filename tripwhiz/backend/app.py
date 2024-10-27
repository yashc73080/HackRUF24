from flask import Flask, request, jsonify
from christofides import tsp  # Import the tsp function from christofides.py

app = Flask(__name__)

@app.route('/')  # Root route
def home():
    return "Welcome to the TSP API! Use the /tsp endpoint to calculate routes."

@app.route('/tsp', methods=['POST'])
def tsp_route():
    data = request.get_json()

    locations = data.get("locations", [])
    
    if not locations or len(locations) < 2:
        return jsonify({"error": "You need at least two locations to calculate a route."}), 400

    start_location = data.get("start")

    if not any(loc['name'] == start_location['name'] for loc in locations):
        return jsonify({"error": "Starting location not found in the provided list of locations."}), 400

    start_index = next(i for i, loc in enumerate(locations) if loc['name'] == start_location['name'])

    # Run the TSP algorithm on the entered locations
    route = tsp(locations, start_index)

    return jsonify({"optimized_route": route})

if __name__ == '__main__':
    app.run(debug=True)
