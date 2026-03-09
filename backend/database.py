# Handles reading/writing to Azure Cosmos DB
from azure.cosmos.aio import CosmosClient
from azure.cosmos import PartitionKey
from azure.cosmos.exceptions import CosmosHttpResponseError
from backend.config import settings
import datetime
import numpy as np

class CosmosDBService:
    def __init__(self):
        self.client = CosmosClient(settings.COSMOS_DB_ENDPOINT, credential=settings.COSMOS_DB_KEY)
        self.db_name = settings.COSMOS_DB_DATABASE
        self.container_name = settings.COSMOS_DB_CONTAINER
        self.db = None
        self.container = None
        self.vector_container = None

    async def init_db(self):
        self.db = await self.client.create_database_if_not_exists(id=self.db_name)
        self.container = await self.db.create_container_if_not_exists(
            id=self.container_name,
            partition_key=PartitionKey(path="/session_id")
        )

        # Document Chunks Container with Vector Indexing
        # dimensions=384 for all-MiniLM-L6-v2
        vector_embedding_policy = {
            "vectorEmbeddings": [
                {
                    "path": "/embedding",
                    "dataType": "float32",
                    "distanceFunction": "cosine",
                    "dimensions": 384
                }
            ]
        }
        indexing_policy = {
            "includedPaths": [{"path": "/*"}],
            "excludedPaths": [{"path": "/\"_etag\"/?"}],
            "vectorIndexes": [{"path": "/embedding", "type": "quantizedFlat"}]
        }
        
        try:
            self.vector_container = await self.db.create_container_if_not_exists(
                id="document_chunks",
                partition_key=PartitionKey(path="/session_id"),
                indexing_policy=indexing_policy,
                vector_embedding_policy=vector_embedding_policy
            )
            self.use_native_vector_search = True
        except CosmosHttpResponseError as e:
            if "capability has not been enabled" in str(e):
                print("WARNING: Vector capability disabled on Cosmos. Falling back to python computation.")
                self.vector_container = await self.db.create_container_if_not_exists(
                    id="document_chunks",
                    partition_key=PartitionKey(path="/session_id")
                )
                self.use_native_vector_search = False
            else:
                raise e

    async def save_state(self, state_dict: dict):
        state_dict["updated_at"] = datetime.datetime.utcnow().isoformat()
        state_dict["id"] = state_dict["session_id"] # Cosmos requires 'id' field
        await self.container.upsert_item(body=state_dict)

    async def get_state(self, session_id: str) -> dict:
        try:
            return await self.container.read_item(item=session_id, partition_key=session_id)
        except Exception:
            return None

    async def get_recent_sessions(self, limit: int = 20) -> list:
        # Cross-partition query to grab all session metadata
        query = "SELECT c.session_id, c.status, c.updated_at, c.chat_history FROM c"
        results = []
        try:
            async for item in self.container.query_items(
                query=query
            ):
                prompt = "New Session"
                if item.get("chat_history") and len(item["chat_history"]) > 0:
                    prompt = item["chat_history"][0].get("content", "New Session")
                
                results.append({
                    "session_id": item.get("session_id"),
                    "status": item.get("status"),
                    "updated_at": item.get("updated_at", ""),
                    "initial_prompt": prompt
                })
            
            # Sort descending by updated_at
            results.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
            return results[:limit]
        except Exception as e:
            print(f"Error fetching history: {str(e)}")
            return []

    async def save_chunk(self, session_id: str, chunk_id: str, text: str, embedding: list, metadata: dict = None):
        if metadata is None: metadata = {}
        item = {
            "id": f"{session_id}_{chunk_id}",
            "session_id": session_id,
            "text": text,
            "embedding": embedding,
            "metadata": metadata
        }
        await self.vector_container.upsert_item(body=item)

    async def search_chunks(self, session_id: str, query_embedding: list, top_k: int = 5) -> list:
        if getattr(self, "use_native_vector_search", True):
            # Native Cosmos API
            query = """
                SELECT TOP @top_k c.text, c.metadata, VectorDistance(c.embedding, @query_embedding) AS similarity_score
                FROM c
                WHERE c.session_id = @session_id
                ORDER BY VectorDistance(c.embedding, @query_embedding)
            """
            parameters = [
                {"name": "@session_id", "value": session_id},
                {"name": "@query_embedding", "value": query_embedding},
                {"name": "@top_k", "value": top_k}
            ]
            
            results = []
            try:
                async for item in self.vector_container.query_items(query=query, parameters=parameters):
                    results.append(item)
                return results
            except Exception as e:
                print(f"Error executing vector query: {str(e)}")
                return []
        else:
            # Fallback local python cosine similarity
            query = "SELECT c.text, c.metadata, c.embedding FROM c WHERE c.session_id = @session_id"
            results = []
            try:
                async for item in self.vector_container.query_items(
                    query=query, 
                    parameters=[{"name": "@session_id", "value": session_id}]
                ):
                    e1 = np.array(item['embedding'])
                    e2 = np.array(query_embedding)
                    norm1, norm2 = np.linalg.norm(e1), np.linalg.norm(e2)
                    sim = float(np.dot(e1, e2) / (norm1 * norm2)) if norm1 and norm2 else 0.0
                    item['similarity_score'] = sim
                    results.append(item)
                
                results.sort(key=lambda x: x['similarity_score'], reverse=True)
                return results[:top_k]
            except Exception as e:
                print(f"Fallback computation failed: {str(e)}")
                return []

db_service = CosmosDBService()