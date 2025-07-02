import os
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document

def store_text_in_pinecone(texts, metadata_list):
    # Initialize embeddings
    embeddings = OpenAIEmbeddings(api_key=os.environ["OPENAI_API_KEY"])

    # Create documents
    documents = [
        Document(page_content=text, metadata=meta)
        for text, meta in zip(texts, metadata_list)
    ]

    # Initialize Pinecone vector store
    vector_store = PineconeVectorStore(
        index_name=os.environ["PINECONE_INDEX_NAME"],
        embedding=embeddings
    )

    # Add documents to Pinecone
    vector_store.add_documents(documents)
    print("Data stored in Pinecone successfully!")

from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA

def query_pinecone(question):
    # Initialize embeddings and LLM
    embeddings = OpenAIEmbeddings(api_key=os.environ["OPENAI_API_KEY"])
    llm = ChatOpenAI(model="gpt-4", api_key=os.environ["OPENAI_API_KEY"])

    # Initialize Pinecone vector store
    vector_store = PineconeVectorStore(
        index_name=os.environ["PINECONE_INDEX_NAME"],
        embedding=embeddings
    )

    # Create RAG pipeline
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vector_store.as_retriever(search_kwargs={"k": 3})
    )

    # Run query
    result = qa_chain.run(question)
    return result

# Pinecone utility logic has been moved to plugins/pinecone/pinecone_plugin.py for plugin-based architecture.
