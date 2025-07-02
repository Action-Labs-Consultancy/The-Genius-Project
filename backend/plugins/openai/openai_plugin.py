# OpenAI plugin for embedding and search (plugin-based architecture)
import openai

class OpenAIPlugin:
    def __init__(self, api_key):
        self.client = openai.OpenAI(api_key=api_key)

    def get_embedding(self, text: str) -> list[float]:
        response = self.client.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response.data[0].embedding

    def search(self, pinecone_index, query: str, top_k=5):
        q_vec = self.get_embedding(query)
        results = pinecone_index.query(vector=q_vec, top_k=top_k)
        return results['matches']

    def store_data(self, pinecone_index, texts, metadata):
        embeddings = [self.get_embedding(t) for t in texts]
        vectors = [(f"id_{i}", embeddings[i], metadata[i]) for i in range(len(texts))]
        pinecone_index.upsert(vectors=vectors)
        return {'status': 'success'}
