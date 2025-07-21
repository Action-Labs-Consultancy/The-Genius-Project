#!/usr/bin/env python3
"""
Document Ingestion Script for Local RAG System
Reads documents from /data folder, processes them, and stores in ChromaDB
"""

import os
import sys
from pathlib import Path
from typing import List
import logging

# Core imports
from langchain_community.document_loaders import TextLoader, PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize rich console
console = Console()

class DocumentIngestor:
    """Handles document ingestion and vector store creation"""
    
    def __init__(self, data_dir: str = "data", persist_dir: str = "db"):
        self.data_dir = Path(data_dir)
        self.persist_dir = Path(persist_dir)
        
        # Initialize embeddings (local HuggingFace model)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",  # Fast, lightweight model
            model_kwargs={'device': 'cpu'}
        )
        
        # Text splitter for chunking with better overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=300,  # Increased overlap for better context retention
            length_function=len,
            separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""]  # Better separators
        )
        
        console.print(f"[green]✓[/green] Initialized DocumentIngestor")
        console.print(f"  Data directory: {self.data_dir.absolute()}")
        console.print(f"  Persist directory: {self.persist_dir.absolute()}")

    def load_documents(self) -> List:
        """Load documents from the data directory"""
        console.print(f"\n[blue]📁 Loading documents from {self.data_dir}...[/blue]")
        
        if not self.data_dir.exists():
            console.print(f"[red]❌ Data directory {self.data_dir} does not exist![/red]")
            sys.exit(1)
        
        documents = []
        
        # Load text files
        txt_loader = DirectoryLoader(
            str(self.data_dir),
            glob="**/*.txt",
            loader_cls=TextLoader,
            loader_kwargs={'encoding': 'utf-8'}
        )
        
        # Load PDF files
        pdf_loader = DirectoryLoader(
            str(self.data_dir),
            glob="**/*.pdf",
            loader_cls=PyPDFLoader
        )
        
        try:
            txt_docs = txt_loader.load()
            pdf_docs = pdf_loader.load()
            
            documents.extend(txt_docs)
            documents.extend(pdf_docs)
            
            console.print(f"[green]✓[/green] Loaded {len(txt_docs)} text files")
            console.print(f"[green]✓[/green] Loaded {len(pdf_docs)} PDF files")
            console.print(f"[green]✓[/green] Total documents: {len(documents)}")
            
        except Exception as e:
            console.print(f"[red]❌ Error loading documents: {e}[/red]")
            sys.exit(1)
        
        if not documents:
            console.print(f"[yellow]⚠️  No documents found in {self.data_dir}[/yellow]")
            console.print("Please add .txt or .pdf files to the data directory.")
            sys.exit(1)
        
        return documents

    def process_documents(self, documents: List) -> List:
        """Split documents into chunks"""
        console.print(f"\n[blue]📄 Processing and chunking documents...[/blue]")
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Chunking documents...", total=None)
            
            chunks = self.text_splitter.split_documents(documents)
            
            progress.update(task, completed=True)
        
        console.print(f"[green]✓[/green] Created {len(chunks)} chunks")
        
        # Show sample chunk info
        if chunks:
            sample_chunk = chunks[0]
            console.print(f"[dim]Sample chunk length: {len(sample_chunk.page_content)} characters[/dim]")
        
        return chunks

    def create_vector_store(self, chunks: List):
        """Create and persist ChromaDB vector store"""
        console.print(f"\n[blue]🔍 Creating vector embeddings and storing in ChromaDB...[/blue]")
        
        # Create persist directory if it doesn't exist
        self.persist_dir.mkdir(exist_ok=True)
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Creating embeddings...", total=None)
            
            try:
                # Create vector store
                vectorstore = Chroma.from_documents(
                    documents=chunks,
                    embedding=self.embeddings,
                    persist_directory=str(self.persist_dir)
                )
                
                # Persist the database
                vectorstore.persist()
                
                progress.update(task, completed=True)
                
                console.print(f"[green]✓[/green] Vector store created and persisted")
                console.print(f"[green]✓[/green] Stored {len(chunks)} document chunks")
                
            except Exception as e:
                console.print(f"[red]❌ Error creating vector store: {e}[/red]")
                sys.exit(1)

    def ingest(self):
        """Main ingestion pipeline"""
        console.print("[bold blue]🚀 Starting Document Ingestion Pipeline[/bold blue]")
        
        # Load documents
        documents = self.load_documents()
        
        # Process documents
        chunks = self.process_documents(documents)
        
        # Create vector store
        self.create_vector_store(chunks)
        
        console.print("\n[bold green]🎉 Document ingestion completed successfully![/bold green]")
        console.print("You can now run the chatbot with: python main.py")


def main():
    """Main entry point"""
    console.print("[bold]Local RAG Document Ingestion[/bold]")
    console.print("This script will process documents and create a vector database.\n")
    
    # Initialize and run ingestion
    ingestor = DocumentIngestor()
    ingestor.ingest()


if __name__ == "__main__":
    main()
