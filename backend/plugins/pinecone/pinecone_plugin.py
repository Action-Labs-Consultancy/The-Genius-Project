# Pinecone plugin implementation for plugin-based architecture

import os
import logging
from pinecone import Pinecone, ServerlessSpec

def initialize_pinecone():
    try:
        pinecone_api_key = os.getenv("PINECONE_API_KEY")
        if not pinecone_api_key:
            raise ValueError("PINECONE_API_KEY required")
        pc = Pinecone(api_key=pinecone_api_key)
        index_name = "the-genius-project-index"
        dimension = 1536
        metric = "cosine"
        cloud = "aws"
        region = "us-east-1"
        indexes = pc.list_indexes()
        if index_name not in [index.name for index in indexes]:
            pc.create_index(
                name=index_name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(cloud=cloud, region=region)
            )
        index = pc.Index(index_name)
        return index
    except Exception as e:
        raise
