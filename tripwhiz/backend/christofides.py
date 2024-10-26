# Import necessary libraries
import googlemaps       # For accessing Google Maps API
import itertools        # For working with pairs of items in lists
import networkx as nx   # For graph-related operations like MST and matching

# Initialize the Google Maps client with your API key
API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'  # Replace with your actual Google Maps API key
gmaps = googlemaps.Client(key=API_KEY)  # Create a client to interact with Google Maps

# Function to get the travel distance between two locations using Google Maps
def get_travel_distance(origin, destination):
    # Use Google Maps API to calculate distance
    result = gmaps.distance_matrix(origin, destination, mode="driving")
    
    # Check if the distance calculation was successful
    if result['rows'][0]['elements'][0]['status'] == 'OK':
        # Get the distance in meters, then convert to miles
        distance = result['rows'][0]['elements'][0]['distance']['value']
        return distance * 0.000621371  # Convert meters to miles (1 meter = 0.000621371 miles)
    else:
        # If something goes wrong, return an 'infinite' distance (we won't use this edge)
        return float('inf')

# Function to get the coordinates of a location using Google Maps
def get_coordinates(location_name):
    # Geocode the location name to get latitude and longitude
    geocode_result = gmaps.geocode(location_name)
    
    # Check if geocoding was successful
    if geocode_result:
        # Extract latitude and longitude from the geocode result
        lat = geocode_result[0]['geometry']['location']['lat']
        lng = geocode_result[0]['geometry']['location']['lng']
        return lat, lng
    else:
        # If geocoding fails, return None
        return None, None

# Function to build a graph with distances between each pair of locations
def build_graph(locations):
    # Initialize an empty dictionary to store the graph
    graph = {}
    
    # Go through each pair of locations (without repeating pairs)
    for i in range(len(locations)):
        for j in range(i + 1, len(locations)):
            # Get the travel distance between the two locations
            distance = get_travel_distance(locations[i], locations[j])
            
            # Ensure both locations have a dictionary in the graph
            if i not in graph:
                graph[i] = {}
            if j not in graph:
                graph[j] = {}
            
            # Store this distance in both directions (i to j and j to i)
            graph[i][j] = distance
            graph[j][i] = distance
    
    return graph  # Return the completed graph

# Helper function to find the Minimum Spanning Tree (MST) of the graph
def minimum_spanning_tree(graph):
    # Create an empty graph in NetworkX
    G = nx.Graph()
    
    # Add all edges with distances to the NetworkX graph
    for u in graph:
        for v in graph[u]:
            G.add_edge(u, v, weight=graph[u][v])
    
    # Use NetworkX to find the MST of the graph
    mst = nx.minimum_spanning_tree(G)
    return mst  # Return the MST

# Helper function to find nodes with an odd number of edges (odd degree)
def find_odd_degree_nodes(mst):
    # Find all nodes in the MST with an odd degree and store them in a list
    odd_nodes = [node for node, degree in mst.degree() if degree % 2 == 1]
    return odd_nodes  # Return the list of odd-degree nodes

# Function to create minimum weight perfect matching for odd degree nodes
def minimum_weight_perfect_matching(odd_nodes, graph):
    # Create a new empty graph in NetworkX
    G = nx.Graph()
    
    # Add edges between all pairs of odd nodes, using their distance as weight
    for u, v in itertools.combinations(odd_nodes, 2):
        G.add_edge(u, v, weight=graph[u][v])
    
    # Find a minimum weight matching (pairs of odd nodes with minimal distance)
    matching = nx.algorithms.matching.min_weight_matching(G, maxcardinality=True)
    return matching  # Return the matching pairs

# Combine the MST and matching to form an Eulerian circuit
def make_eulerian_circuit(mst, matching):
    # Create a multi-graph (allows repeated edges) and add MST edges
    eulerian_graph = nx.MultiGraph(mst)
    
    # Add edges from the matching pairs to make the graph Eulerian
    for u, v in matching:
        eulerian_graph.add_edge(u, v, weight=graph[u][v])
    
    # Find an Eulerian circuit (a path that uses each edge exactly once)
    return list(nx.eulerian_circuit(eulerian_graph))

# Convert Eulerian circuit to a Hamiltonian cycle by skipping revisited nodes
def eulerian_to_hamiltonian(circuit):
    # Create a set to keep track of visited nodes
    visited = set()
    # Start with an empty path
    hamiltonian_path = []
    
    # Go through each node in the Eulerian circuit
    for u, v in circuit:
        if u not in visited:  # Only add unvisited nodes
            visited.add(u)    # Mark node as visited
            hamiltonian_path.append(u)  # Add node to path
    
    # Close the cycle by adding the starting node at the end
    hamiltonian_path.append(hamiltonian_path[0])
    return hamiltonian_path  # Return the final TSP path

# Main function that runs the Christofides algorithm for TSP
def tsp(locations):
    # Step 1: Build the graph with travel distances between each location
    graph = build_graph(locations)
    
    # Step 2: Find the Minimum Spanning Tree (MST) of the graph
    mst = minimum_spanning_tree(graph)
    
    # Step 3: Find nodes in the MST that have an odd degree
    odd_nodes = find_odd_degree_nodes(mst)
    
    # Step 4: Find a minimum weight perfect matching for these odd-degree nodes
    matching = minimum_weight_perfect_matching(odd_nodes, graph)
    
    # Step 5: Combine the MST and matching edges to create an Eulerian circuit
    eulerian_circuit = make_eulerian_circuit(mst, matching)
    
    # Step 6: Convert the Eulerian circuit to a Hamiltonian cycle (TSP path)
    hamiltonian_path = eulerian_to_hamiltonian(eulerian_circuit)
    
    # Display the final path (approximate shortest route for visiting all locations)
    print("Approximate TSP Path (in miles):", hamiltonian_path)

# Prompt the user to input locations they want to visit
locations = []
num_locations = int(input("Enter the number of locations you want to visit: "))

# Get general location names from the user
for i in range(num_locations):
    location_name = input(f"Enter name of location {i+1} (e.g., 'Six Flags, New Jersey'): ")
    # Get latitude and longitude for the input location
    lat, lon = get_coordinates(location_name)
    
    if lat is not None and lon is not None:
        # If geocoding is successful, append the coordinates to the locations list
        locations.append((lat, lon))
    else:
        print(f"Could not find coordinates for: {location_name}")

# Run the TSP algorithm on the entered locations
tsp(locations)
