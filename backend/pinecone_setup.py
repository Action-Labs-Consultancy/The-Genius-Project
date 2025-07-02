import os
import logging
from pinecone import Pinecone, ServerlessSpec

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def initialize_pinecone():
    """Initialize Pinecone for the-genius-project's project management search."""
    try:
        # Retrieve API key from environment variables
        pinecone_api_key = os.getenv("PINECONE_API_KEY")
        if not pinecone_api_key:
            logger.error("PINECONE_API_KEY missing")
            raise ValueError("PINECONE_API_KEY required")

        # Initialize Pinecone client
        pc = Pinecone(api_key=pinecone_api_key)
        index_name = "the-genius-project-index"
        dimension = 1536  # Adjust if your model requires a different dimension
        metric = "cosine"
        cloud = "aws"
        region = "us-east-1"

        # Check if the index exists
        indexes = pc.list_indexes()
        if index_name not in [index.name for index in indexes]:
            logger.info(f"Creating index: {index_name}")
            pc.create_index(
                name=index_name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(cloud=cloud, region=region)
            )

        # Connect to the index
        index = pc.Index(index_name)
        logger.info(f"Connected to index: {index_name}")
        return index

    except Exception as e:
        logger.error(f"Error initializing Pinecone: {str(e)}")
        raise

# Pinecone setup logic has been moved to plugins/pinecone/pinecone_plugin.py for plugin-based architecture.
