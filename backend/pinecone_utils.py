import os
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from langchain.chains import RetrievalQA
from langchain.text_splitter import RecursiveCharacterTextSplitter

def store_text_in_pinecone(texts: List[str], metadata_list: List[Dict[str, Any]]) -> bool:
    """Store text chunks in Pinecone with metadata."""
    try:
        # Check for required environment variables
        if not os.environ.get("OPENAI_API_KEY"):
            print("Warning: OPENAI_API_KEY not found")
            return False
        
        if not os.environ.get("PINECONE_INDEX_NAME"):
            print("Warning: PINECONE_INDEX_NAME not found")
            return False

        # Initialize embeddings
        embeddings = OpenAIEmbeddings(api_key=os.environ["OPENAI_API_KEY"])

        # Create documents with unique IDs
        documents = []
        for text, meta in zip(texts, metadata_list):
            doc_id = meta.get('id', str(uuid.uuid4()))
            meta['id'] = doc_id
            documents.append(Document(page_content=text, metadata=meta))

        # Initialize Pinecone vector store
        vector_store = PineconeVectorStore(
            index_name=os.environ["PINECONE_INDEX_NAME"],
            embedding=embeddings
        )

        # Add documents to Pinecone
        vector_store.add_documents(documents)
        print(f"Successfully stored {len(documents)} documents in Pinecone")
        return True
        
    except Exception as e:
        print(f"Error storing data in Pinecone: {e}")
        return False

def query_pinecone(question: str, brain_id: Optional[str] = None) -> str:
    """Query Pinecone for relevant documents."""
    try:
        # Check for required environment variables
        if not os.environ.get("OPENAI_API_KEY"):
            return "OpenAI API key not configured"
        
        if not os.environ.get("PINECONE_INDEX_NAME"):
            return "Pinecone index not configured"

        # Initialize embeddings and LLM
        embeddings = OpenAIEmbeddings(api_key=os.environ["OPENAI_API_KEY"])
        llm = ChatOpenAI(model="gpt-3.5-turbo", api_key=os.environ["OPENAI_API_KEY"])

        # Initialize Pinecone vector store
        vector_store = PineconeVectorStore(
            index_name=os.environ["PINECONE_INDEX_NAME"],
            embedding=embeddings
        )

        # Create retriever with brain filter if provided
        search_kwargs = {"k": 3}
        if brain_id:
            search_kwargs["filter"] = {"brain_id": brain_id}
        
        retriever = vector_store.as_retriever(search_kwargs=search_kwargs)

        # Create RAG pipeline
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever
        )

        # Run query
        result = qa_chain.run(question)
        return result
        
    except Exception as e:
        print(f"Error querying Pinecone: {e}")
        return f"Error processing query: {str(e)}"

def generate_brain_response(brain_id: str, user_message: str, brain_prompt: str) -> str:
    """Generate AI response using brain's knowledge base and custom prompt."""
    try:
        # Check for required environment variables
        if not os.environ.get("OPENAI_API_KEY"):
            return "OpenAI API key not configured"

        # Initialize embeddings and LLM
        embeddings = OpenAIEmbeddings(api_key=os.environ["OPENAI_API_KEY"])
        llm = ChatOpenAI(model="gpt-3.5-turbo", api_key=os.environ["OPENAI_API_KEY"])

        # Search for relevant context in the brain's knowledge base
        if os.environ.get("PINECONE_INDEX_NAME"):
            vector_store = PineconeVectorStore(
                index_name=os.environ["PINECONE_INDEX_NAME"],
                embedding=embeddings
            )
            
            # Retrieve relevant documents
            retriever = vector_store.as_retriever(
                search_kwargs={"k": 3, "filter": {"brain_id": brain_id}}
            )
            
            relevant_docs = retriever.get_relevant_documents(user_message)
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
        else:
            context = ""

        # Generate response using the brain's custom prompt and context
        system_message = f"{brain_prompt}"
        if context:
            system_message += f"\n\nKnowledge Base Context:\n{context}"
        
        from openai import OpenAI
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"Error generating brain response: {e}")
        return f"I apologize, but I encountered an error processing your request: {str(e)}"

def chunk_document_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """Split document text into chunks for embedding."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = text_splitter.split_text(text)
    return chunks

def delete_brain_vectors(brain_id: str) -> bool:
    """Delete all vectors associated with a brain from Pinecone."""
    try:
        if not os.environ.get("PINECONE_INDEX_NAME"):
            print("Pinecone index not configured")
            return False

        import pinecone
        from pinecone import Pinecone
        
        pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
        index = pc.Index(os.environ["PINECONE_INDEX_NAME"])
        
        # Query for all vectors with this brain_id
        query_response = index.query(
            vector=[0] * 1536,  # Dummy vector for metadata-only query
            top_k=10000,
            include_metadata=True,
            filter={"brain_id": brain_id}
        )
        
        # Extract vector IDs
        vector_ids = [match['id'] for match in query_response['matches']]
        
        # Delete vectors in batches
        if vector_ids:
            index.delete(ids=vector_ids)
            print(f"Deleted {len(vector_ids)} vectors for brain {brain_id}")
        
        return True
        
    except Exception as e:
        print(f"Error deleting brain vectors: {e}")
        return False
