import time
import threading
import logging
from datetime import datetime
from backend.services.publishing_service import PublishingService

logger = logging.getLogger(__name__)

class PublishingScheduler:
    """Background scheduler for automated content publishing"""
    
    def __init__(self):
        self.publishing_service = PublishingService()
        self.is_running = False
        self.thread = None
        self.check_interval = 60  # Check every minute
    
    def start(self):
        """Start the background scheduler"""
        if self.is_running:
            logger.warning("Publishing scheduler is already running")
            return
        
        self.is_running = True
        self.thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.thread.start()
        logger.info("Publishing scheduler started")
    
    def stop(self):
        """Stop the background scheduler"""
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Publishing scheduler stopped")
    
    def _run_scheduler(self):
        """Main scheduler loop"""
        logger.info("Publishing scheduler thread started")
        
        while self.is_running:
            try:
                self._process_queue()
                time.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in publishing scheduler: {str(e)}")
                time.sleep(self.check_interval)
    
    def _process_queue(self):
        """Process the publishing queue"""
        try:
            current_time = datetime.utcnow()
            logger.debug(f"Processing publishing queue at {current_time}")
            
            results = self.publishing_service.process_publishing_queue()
            
            if results['processed'] > 0:
                logger.info(
                    f"Processed {results['processed']} items: "
                    f"{results['published']} published, "
                    f"{results['failed']} failed, "
                    f"{results['skipped']} skipped"
                )
            
        except Exception as e:
            logger.error(f"Error processing publishing queue: {str(e)}")


# Global scheduler instance
publishing_scheduler = PublishingScheduler()

def start_publishing_scheduler():
    """Start the global publishing scheduler"""
    publishing_scheduler.start()

def stop_publishing_scheduler():
    """Stop the global publishing scheduler"""
    publishing_scheduler.stop()
