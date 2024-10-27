import googlemaps       # For accessing Google Maps API
import itertools        # For working with pairs of items in lists
import networkx as nx   # For graph-related operations like MST and matching
from dotenv import load_dotenv
import os

load_dotenv('../.env.local')

# Initialize the Google Maps client with your API key
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')  # Replace with your actual Google Maps API key
gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)  # Create a client to interact with Google Maps

# Function to get the travel distance between two locations using Google Maps
def get_travel_distance(origin, destination):
    result = gmaps.distance_matrix(origin, destination, mode="driving")
    if result['rows'][0]['elements'][0]['status'] == 'OK':
        distance = result['rows'][0]['elements'][0]['distance']['value']
        return distance * 0.000621371  # Convert meters to miles
    else:
        print(f"Error retrieving distance from {origin} to {destination}: {result['rows'][0]['elements'][0]['status']}")
        return float('inf')  # Use 'infinite' distance if calculation fails

# Function to get the coordinates of a location using Google Maps
def get_coordinates(location_name):
    location_name = location_name.strip()  # Sanitize input
    geocode_result = gmaps.geocode(location_name)
    if geocode_result:
        lat = geocode_result[0]['geometry']['location']['lat']
        lng = geocode_result[0]['geometry']['location']['lng']
        return lat, lng
    else:
        print(f"Could not find coordinates for: {location_name}")
        return None, None

# Function to build a graph with distances between each pair of locations
def build_graph(locations):
    graph = {}
    for i in range(len(locations)):
        for j in range(i + 1, len(locations)):
            distance = get_travel_distance(locations[i][0], locations[j][0])  # Use location names
            graph[(i, j)] = distance
            graph[(j, i)] = distance  # Undirected graph
    return graph

# Helper function to find the Minimum Spanning Tree (MST) of the graph
def minimum_spanning_tree(graph):
    G = nx.Graph()
    for (u, v), weight in graph.items():
        G.add_edge(u, v, weight=weight)
    mst = nx.minimum_spanning_tree(G)
    return mst

# Helper function to find nodes with an odd number of edges (odd degree)
def find_odd_degree_nodes(mst):
    return [node for node, degree in mst.degree() if degree % 2 == 1]

# Function to create minimum weight perfect matching for odd degree nodes
# Function to create minimum weight perfect matching for odd degree nodes
def minimum_weight_perfect_matching(odd_nodes, graph):
    G = nx.Graph()
    for u, v in itertools.combinations(odd_nodes, 2):
        if v in graph[u]:  # Ensure the edge exists in the original graph
            G.add_edge(u, v, weight=graph[u][v])
    matching = nx.algorithms.matching.min_weight_matching(G)  # Removed maxcardinality=True
    return matching


# Combine the MST and matching to form an Eulerian circuit
def make_eulerian_circuit(mst, matching, graph):
    eulerian_graph = nx.MultiGraph(mst)
    for u, v in matching:
        eulerian_graph.add_edge(u, v, weight=graph[(u, v)])
    return list(nx.eulerian_circuit(eulerian_graph))

# Convert Eulerian circuit to a Hamiltonian cycle by skipping revisited nodes
def eulerian_to_hamiltonian(eulerian_circuit):
    visited = set()
    hamiltonian_path = []
    for u, v in eulerian_circuit:
        if u not in visited:
            hamiltonian_path.append(u)
            visited.add(u)
    hamiltonian_path.append(hamiltonian_path[0])  # Return to the starting point
    return hamiltonian_path

# Main function that runs the Christofides algorithm for TSP
def tsp(locations):
    graph = build_graph(locations)
    mst = minimum_spanning_tree(graph)
    odd_nodes = find_odd_degree_nodes(mst)
    matching = minimum_weight_perfect_matching(odd_nodes, graph)
    eulerian_circuit = make_eulerian_circuit(mst, matching, graph)
    hamiltonian_path = eulerian_to_hamiltonian(eulerian_circuit)
    return hamiltonian_path

# Prompt the user to input locations they want to visit
locations = []
num_locations = int(input("Enter the number of locations you want to visit: "))
for i in range(num_locations):
    location_name = input(f"Enter name of location {i+1} (e.g., 'Six Flags, New Jersey'): ")
    lat, lon = get_coordinates(location_name)
    if lat is not None and lon is not None:
        locations.append((location_name, (lat, lon)))  # Store name and coordinates
    else:
        print(f"Could not find coordinates for: {location_name}")

# Run the TSP algorithm on the entered locations
hamiltonian_path = tsp(locations)
print("Approximate TSP Path (in locations):", [locations[i][0] for i in hamiltonian_path])
