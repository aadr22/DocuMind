import asyncio
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class RealTimeProcessor:
    """Handles real-time document processing with progress tracking"""
    
    def __init__(self):
        self.active_processes: Dict[str, Dict[str, Any]] = {}
        self.websocket_connections: Dict[str, list] = {}
    
    def create_process(self, file_name: str, file_size: int) -> str:
        """Create a new processing session"""
        process_id = str(uuid.uuid4())
        
        self.active_processes[process_id] = {
            "id": process_id,
            "file_name": file_name,
            "file_size": file_size,
            "status": "initializing",
            "progress": 0,
            "current_step": "Starting document processing...",
            "start_time": datetime.now().isoformat(),
            "steps": [
                "File validation",
                "Document detection",
                "Text extraction",
                "AI analysis",
                "Summary generation"
            ],
            "completed_steps": [],
            "errors": [],
            "warnings": []
        }
        
        logger.info(f"Created process {process_id} for file {file_name}")
        return process_id
    
    def update_progress(self, process_id: str, progress: int, step: str, status: str = "processing"):
        """Update processing progress"""
        if process_id in self.active_processes:
            self.active_processes[process_id].update({
                "progress": min(progress, 100),
                "current_step": step,
                "status": status,
                "last_updated": datetime.now().isoformat()
            })
            
            # Mark step as completed if progress indicates it
            if progress >= 20 and "File validation" not in self.active_processes[process_id]["completed_steps"]:
                self.active_processes[process_id]["completed_steps"].append("File validation")
            elif progress >= 40 and "Document detection" not in self.active_processes[process_id]["completed_steps"]:
                self.active_processes[process_id]["completed_steps"].append("Document detection")
            elif progress >= 60 and "Text extraction" not in self.active_processes[process_id]["completed_steps"]:
                self.active_processes[process_id]["completed_steps"].append("Text extraction")
            elif progress >= 80 and "AI analysis" not in self.active_processes[process_id]["completed_steps"]:
                self.active_processes[process_id]["completed_steps"].append("AI analysis")
            elif progress >= 100 and "Summary generation" not in self.active_processes[process_id]["completed_steps"]:
                self.active_processes[process_id]["completed_steps"].append("Summary generation")
            
            logger.info(f"Process {process_id}: {progress}% - {step}")
    
    def add_error(self, process_id: str, error: str):
        """Add error to process"""
        if process_id in self.active_processes:
            self.active_processes[process_id]["errors"].append({
                "message": error,
                "timestamp": datetime.now().isoformat()
            })
            self.active_processes[process_id]["status"] = "error"
            logger.error(f"Process {process_id} error: {error}")
    
    def add_warning(self, process_id: str, warning: str):
        """Add warning to process"""
        if process_id in self.active_processes:
            self.active_processes[process_id]["warnings"].append({
                "message": warning,
                "timestamp": datetime.now().isoformat()
            })
            logger.warning(f"Process {process_id} warning: {warning}")
    
    def complete_process(self, process_id: str, result: Dict[str, Any]):
        """Mark process as completed"""
        if process_id in self.active_processes:
            self.active_processes[process_id].update({
                "status": "completed",
                "progress": 100,
                "current_step": "Processing completed successfully!",
                "end_time": datetime.now().isoformat(),
                "result": result
            })
            logger.info(f"Process {process_id} completed successfully")
    
    def get_process_status(self, process_id: str) -> Optional[Dict[str, Any]]:
        """Get current process status"""
        return self.active_processes.get(process_id)
    
    def cleanup_process(self, process_id: str):
        """Clean up completed process after some time"""
        if process_id in self.active_processes:
            del self.active_processes[process_id]
            logger.info(f"Cleaned up process {process_id}")
    
    def get_all_processes(self) -> Dict[str, Dict[str, Any]]:
        """Get all active processes (for admin purposes)"""
        return self.active_processes.copy()

# Global instance
realtime_processor = RealTimeProcessor()
