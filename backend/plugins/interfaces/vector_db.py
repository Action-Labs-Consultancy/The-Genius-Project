# Interface for vector DB plugins (define abstract base class if needed)

from abc import ABC, abstractmethod

class VectorDBPlugin(ABC):
    @abstractmethod
    def upsert(self, vectors):
        """Insert or update vectors in the vector database."""
        pass

    @abstractmethod
    def query(self, vector, top_k=5):
        """Query the vector database for similar vectors."""
        pass

    @abstractmethod
    def delete(self, ids):
        """Delete vectors by IDs."""
        pass
