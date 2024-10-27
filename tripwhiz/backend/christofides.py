import googlemaps
import itertools
import networkx as nx
from dotenv import load_dotenv
import os

# Load environment variables from a .env file
load_dotenv('../.env.local')

# Initialize the Google Maps client with your API key
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

# Function to get the travel distance between two locations using Google Maps
def get_travel_distance(origin, destination):
    result = gmaps.distance_matrix(origin, destination, mode="driving")
    if result['rows'][0]['elements'][0]['status'] == 'OK':
        distance = result['rows'][0]['elements'][0]['distance']['value']
        return distance * 0.000621371  # Convert meters to miles
    else:
        print(f"Error retrieving distance from {origin} to {destination}")
        return float('inf')  # Use 'infinite' distance if calculation fails

# Function to build a complete graph with distances between each pair of locations
def build_graph(locations):
    graph = {}
    for i in range(len(locations)):
        for j in range(i + 1, len(locations)):
            origin = (locations[i]['lat'], locations[i]['lng'])
            destination = (locations[j]['lat'], locations[j]['lng'])
            distance = get_travel_distance(origin, destination)  # Use coordinates
            graph[(i, j)] = distance
            graph[(j, i)] = distance  # Undirected graph
    return graph

# Helper function to find the Minimum Spanning Tree (MST) of the graph
def minimum_spanning_tree(graph):
    G = nx.Graph()
    for (u, v), weight in graph.items():
        G.add_edge(u, v, weight=weight)
    return nx.minimum_spanning_tree(G)

# Helper function to find nodes with an odd number of edges (odd degree)
def find_odd_degree_nodes(mst):
    return [node for node, degree in mst.degree() if degree % 2 == 1]

# Function to create minimum weight perfect matching for odd degree nodes
def minimum_weight_perfect_matching(odd_nodes, graph):
    G = nx.Graph()
    for u, v in itertools.combinations(odd_nodes, 2):
        if (u, v) in graph:
            G.add_edge(u, v, weight=graph[(u, v)])
    return nx.algorithms.matching.min_weight_matching(G)

# Combine MST and matching to form an Eulerian circuit
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
def tsp(locations, start_index):
    graph = build_graph(locations)
    mst = minimum_spanning_tree(graph)
    odd_nodes = find_odd_degree_nodes(mst)
    
    # If there are no odd degree nodes, the MST is already an Eulerian graph
    if not odd_nodes:
        eulerian_circuit = list(nx.eulerian_circuit(mst))
    else:
        matching = minimum_weight_perfect_matching(odd_nodes, graph)
        eulerian_circuit = make_eulerian_circuit(mst, matching, graph)

    # Run the TSP algorithm and map indices back to location names for output
    hamiltonian_path = eulerian_to_hamiltonian(eulerian_circuit)
    route = [locations[i] for i in hamiltonian_path]  # Return the full location object
    return route

# Example of how to use the tsp function
if __name__ == '__main__':
    locations = [
        {"name": "Location 1", "lat": 40.712776, "lng": -74.005974},
        {"name": "Location 2", "lat": 34.052235, "lng": -118.243683},
        # Add more locations as needed
    ]
    
    start_index = 0  # Index of starting location
    optimized_route = tsp(locations, start_index)
    print("Optimized route:", optimized_route)
