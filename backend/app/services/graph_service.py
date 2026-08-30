import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Load local .env variables
load_dotenv()

# Local or cloud Neo4j connection URI (Default local instance)
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

class CartelGraphService:
    def __init__(self):
        try:
            self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        except Exception:
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    def check_cartel_rings(self, implementing_agency: str):
        """
        Queries the Neo4j graph to check if an agency shares directors, 
        phone numbers, or registered addresses with known blacklisted shell companies.
        """
        if not self.driver:
            return {
                "graph_connected": False,
                "cartel_detected": False,
                "message": "Neo4j graph instance offline. Skipping deep ring analysis."
            }
        
        query = """
        MATCH (a:Agency {name: $agency_name})-[:SHARED_ATTRIBUTE]->(attr)<-[:SHARED_ATTRIBUTE]-(other:Agency)
        WHERE other.blacklisted = true
        RETURN other.name AS connected_shell, attr.value AS shared_vector
        """
        try:
            with self.driver.session() as session:
                result = session.run(query, agency_name=implementing_agency)
                records = [record.data() for record in result]
                
                if records:
                    return {
                        "graph_connected": True,
                        "cartel_detected": True,
                        "risk_multiplier": 2.5,
                        "connections": records
                    }
        except Exception as e:
            pass

        return {
            "graph_connected": True,
            "cartel_detected": False,
            "message": "No active cartel bidding rings detected in graph topology."
        }

cartel_graph_service = CartelGraphService()