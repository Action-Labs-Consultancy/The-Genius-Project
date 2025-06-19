import os
import logging
from pinecone import Pinecone, ServerlessSpec, PineconeException

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def initialize_pinecone():
    """Initialize Pinecone for the-genius-project's project management search."""
    try:
        pinecone_api_key = os.getenv("PINECONE_API_KEY")
        if not pinecone_api_key:
            logger.error("PINECONE_API_KEY missing")
            raise ValueError("PINECONE_API_KEY required")

        pc = Pinecone(api_key=pinecone_api_key)

        index_name = "the-genius-project-index"
        dimension = 1536  # OpenAI embedding dimension
        metric = "cosine"
        cloud = "aws"
        region = "us-east-1"

        # 🟡 Correct method is `describe_index(index_name)` with try/except
        try:
            pc.describe_index(index_name)
            logger.info(f"Index '{index_name}' already exists.")
        except PineconeException:
            logger.info(f"Creating index: {index_name}")
            pc.create_index(
                name=index_name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(cloud=cloud, region=region)
            )

        index = pc.Index(index_name)
        logger.info(f"Connected to index: {index_name}")
        return index

    except PineconeException as e:
        logger.error(f"Pinecone error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise

