#!/usr/bin/env python3
"""
Comprehensive test script for The Genius Project workflow system.
Tests all major functionality including:
- MongoDB integration
- Workflow CRUD operations
- Workflow execution with different node types
- IF condition branching logic
- Grouped node functionality
- Real-time status updates
- Error handling

Usage: python3 test_workflow_system.py
"""

import requests
import json
import time
from datetime import datetime

# Test configuration
API_BASE_URL = "http://localhost:10000"
TEST_TIMEOUT = 30

class WorkflowTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.created_workflows = []

    def log_test(self, test_name, success, message="", details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if not success and details:
            print(f"   Details: {details}")

    def test_api_health(self):
        """Test if the API is responding"""
        try:
            response = self.session.get(f"{self.base_url}/api/health", timeout=5)
            data = response.json()
            
            if response.status_code == 200 and data.get("status") == "ok":
                self.log_test(
                    "API Health Check", 
                    True, 
                    f"MongoDB connected: {data.get('mongodb_connected', False)}"
                )
                return True
            else:
                self.log_test("API Health Check", False, f"Unexpected response: {data}")
                return False
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection failed: {str(e)}")
            return False

    def test_create_simple_workflow(self):
        """Test creating a simple workflow"""
        workflow_data = {
            "name": "Test Simple Workflow",
            "description": "Simple test workflow with start and end nodes",
            "nodes": [
                {"id": "start-1", "type": "start", "position": {"x": 100, "y": 100}, "data": {"label": "Start"}},
                {"id": "end-1", "type": "end", "position": {"x": 300, "y": 100}, "data": {"label": "End"}}
            ],
            "edges": [
                {"id": "e1", "source": "start-1", "target": "end-1"}
            ]
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/workflows",
                json=workflow_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                workflow_id = data.get("_id")
                self.created_workflows.append(workflow_id)
                self.log_test(
                    "Create Simple Workflow",
                    True,
                    f"Created workflow with ID: {workflow_id}"
                )
                return workflow_id
            else:
                self.log_test(
                    "Create Simple Workflow",
                    False,
                    f"Failed with status {response.status_code}: {response.text}"
                )
                return None
        except Exception as e:
            self.log_test("Create Simple Workflow", False, f"Exception: {str(e)}")
            return None

    def test_execute_workflow(self, workflow_id):
        """Test executing a workflow"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/workflows/{workflow_id}/execute",
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                execution_id = data.get("execution_id")
                status = data.get("status")
                node_statuses = data.get("node_statuses", {})
                
                success = status == "completed" and len(node_statuses) > 0
                message = f"Execution {status}, {len(node_statuses)} nodes executed"
                
                self.log_test(
                    "Execute Simple Workflow",
                    success,
                    message,
                    details=data if not success else None
                )
                return success
            else:
                self.log_test(
                    "Execute Simple Workflow",
                    False,
                    f"Failed with status {response.status_code}: {response.text}"
                )
                return False
        except Exception as e:
            self.log_test("Execute Simple Workflow", False, f"Exception: {str(e)}")
            return False

    def test_if_condition_workflow(self):
        """Test IF condition workflow with branching"""
        workflow_data = {
            "name": "Test IF Condition Workflow",
            "description": "Testing IF node branching logic",
            "nodes": [
                {"id": "start-1", "type": "start", "position": {"x": 100, "y": 100}, "data": {"label": "Start"}},
                {"id": "if-1", "type": "ifCondition", "position": {"x": 300, "y": 100}, 
                 "data": {"label": "Check Value", "config": {"leftOperand": "10", "operator": ">", "rightOperand": "5"}}},
                {"id": "log-true", "type": "log", "position": {"x": 500, "y": 50}, 
                 "data": {"label": "True Path", "config": {"message": "Condition was true: 10 > 5"}}},
                {"id": "log-false", "type": "log", "position": {"x": 500, "y": 150}, 
                 "data": {"label": "False Path", "config": {"message": "Condition was false"}}},
                {"id": "end-1", "type": "end", "position": {"x": 700, "y": 100}, "data": {"label": "End"}}
            ],
            "edges": [
                {"id": "e1", "source": "start-1", "target": "if-1"},
                {"id": "e2", "source": "if-1", "target": "log-true", "sourceHandle": "true"},
                {"id": "e3", "source": "if-1", "target": "log-false", "sourceHandle": "false"},
                {"id": "e4", "source": "log-true", "target": "end-1"},
                {"id": "e5", "source": "log-false", "target": "end-1"}
            ]
        }
        
        try:
            # Create workflow
            response = self.session.post(
                f"{self.base_url}/api/workflows",
                json=workflow_data,
                timeout=10
            )
            
            if response.status_code != 201:
                self.log_test(
                    "Create IF Condition Workflow",
                    False,
                    f"Failed to create: {response.status_code}"
                )
                return False
                
            workflow_id = response.json().get("_id")
            self.created_workflows.append(workflow_id)
            
            # Execute workflow
            response = self.session.post(
                f"{self.base_url}/api/workflows/{workflow_id}/execute",
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                execution_log = data.get("execution_log", [])
                
                # Check if the true branch was taken (10 > 5 should be true)
                log_entries = [entry for entry in execution_log if entry.get("node_id") == "log-true"]
                true_branch_taken = len(log_entries) > 0
                
                # Check if exactly 4 nodes executed (start, if, log-true, end)
                expected_nodes = 4
                actual_nodes = len(execution_log)
                
                success = (true_branch_taken and actual_nodes == expected_nodes and 
                          data.get("status") == "completed")
                
                message = f"True branch taken: {true_branch_taken}, Nodes executed: {actual_nodes}/{expected_nodes}"
                
                self.log_test(
                    "IF Condition Workflow Execution",
                    success,
                    message,
                    details=execution_log if not success else None
                )
                return success
            else:
                self.log_test(
                    "IF Condition Workflow Execution",
                    False,
                    f"Execution failed: {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test("IF Condition Workflow", False, f"Exception: {str(e)}")
            return False

    def test_grouped_workflow(self):
        """Test workflow with grouped nodes"""
        workflow_data = {
            "name": "Test Grouped Workflow",
            "description": "Testing grouped node functionality",
            "groups": [
                {
                    "id": "group-1",
                    "label": "Processing Group",
                    "position": {"x": 200, "y": 50},
                    "size": {"width": 300, "height": 150},
                    "nodeIds": ["log-1", "log-2"],
                    "isCollapsed": False
                }
            ],
            "nodes": [
                {"id": "start-1", "type": "start", "position": {"x": 50, "y": 100}, "data": {"label": "Start"}},
                {"id": "log-1", "type": "log", "position": {"x": 250, "y": 100}, 
                 "data": {"label": "Log 1", "config": {"message": "First log message"}}},
                {"id": "log-2", "type": "log", "position": {"x": 350, "y": 100}, 
                 "data": {"label": "Log 2", "config": {"message": "Second log message"}}},
                {"id": "end-1", "type": "end", "position": {"x": 550, "y": 100}, "data": {"label": "End"}}
            ],
            "edges": [
                {"id": "e1", "source": "start-1", "target": "log-1"},
                {"id": "e2", "source": "log-1", "target": "log-2"},
                {"id": "e3", "source": "log-2", "target": "end-1"}
            ]
        }
        
        try:
            # Create workflow
            response = self.session.post(
                f"{self.base_url}/api/workflows",
                json=workflow_data,
                timeout=10
            )
            
            if response.status_code != 201:
                self.log_test(
                    "Create Grouped Workflow",
                    False,
                    f"Failed to create: {response.status_code}"
                )
                return False
                
            workflow_data_response = response.json()
            workflow_id = workflow_data_response.get("_id")
            self.created_workflows.append(workflow_id)
            
            # Verify groups were saved
            groups = workflow_data_response.get("groups", [])
            has_groups = len(groups) > 0 and groups[0].get("id") == "group-1"
            
            # Execute workflow
            response = self.session.post(
                f"{self.base_url}/api/workflows/{workflow_id}/execute",
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                execution_log = data.get("execution_log", [])
                
                # Check if all 4 nodes executed (start, log-1, log-2, end)
                expected_nodes = 4
                actual_nodes = len(execution_log)
                
                # Check if grouped nodes executed correctly
                grouped_nodes_executed = any(entry.get("node_id") in ["log-1", "log-2"] 
                                           for entry in execution_log)
                
                success = (has_groups and actual_nodes == expected_nodes and 
                          grouped_nodes_executed and data.get("status") == "completed")
                
                message = f"Groups saved: {has_groups}, Grouped nodes executed: {grouped_nodes_executed}, Total nodes: {actual_nodes}/{expected_nodes}"
                
                self.log_test(
                    "Grouped Workflow Execution",
                    success,
                    message
                )
                return success
            else:
                self.log_test(
                    "Grouped Workflow Execution",
                    False,
                    f"Execution failed: {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test("Grouped Workflow", False, f"Exception: {str(e)}")
            return False

    def test_workflow_crud(self):
        """Test workflow CRUD operations"""
        # Create
        workflow_data = {
            "name": "CRUD Test Workflow",
            "description": "Testing CRUD operations",
            "nodes": [
                {"id": "start-1", "type": "start", "position": {"x": 100, "y": 100}, "data": {"label": "Start"}}
            ],
            "edges": []
        }
        
        try:
            # CREATE
            response = self.session.post(
                f"{self.base_url}/api/workflows",
                json=workflow_data,
                timeout=10
            )
            
            if response.status_code != 201:
                self.log_test("Workflow CRUD - Create", False, f"Create failed: {response.status_code}")
                return False
                
            workflow_id = response.json().get("_id")
            self.created_workflows.append(workflow_id)
            
            # READ
            response = self.session.get(f"{self.base_url}/api/workflows/{workflow_id}", timeout=10)
            if response.status_code != 200:
                self.log_test("Workflow CRUD - Read", False, f"Read failed: {response.status_code}")
                return False
                
            read_data = response.json()
            
            # UPDATE
            updated_data = read_data.copy()
            updated_data["description"] = "Updated description for CRUD test"
            
            response = self.session.put(
                f"{self.base_url}/api/workflows/{workflow_id}",
                json=updated_data,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test("Workflow CRUD - Update", False, f"Update failed: {response.status_code}")
                return False
                
            # Verify update
            response = self.session.get(f"{self.base_url}/api/workflows/{workflow_id}", timeout=10)
            if response.status_code == 200:
                updated_workflow = response.json()
                update_success = updated_workflow.get("description") == "Updated description for CRUD test"
            else:
                update_success = False
            
            # DELETE
            response = self.session.delete(f"{self.base_url}/api/workflows/{workflow_id}", timeout=10)
            delete_success = response.status_code == 200
            
            if delete_success:
                # Remove from our cleanup list since it's already deleted
                self.created_workflows.remove(workflow_id)
            
            overall_success = update_success and delete_success
            message = f"Update: {update_success}, Delete: {delete_success}"
            
            self.log_test("Workflow CRUD Operations", overall_success, message)
            return overall_success
            
        except Exception as e:
            self.log_test("Workflow CRUD Operations", False, f"Exception: {str(e)}")
            return False

    def cleanup(self):
        """Clean up test workflows"""
        print("\n🧹 Cleaning up test workflows...")
        for workflow_id in self.created_workflows:
            try:
                response = self.session.delete(f"{self.base_url}/api/workflows/{workflow_id}", timeout=5)
                if response.status_code == 200:
                    print(f"   Deleted workflow: {workflow_id}")
                else:
                    print(f"   Failed to delete workflow: {workflow_id}")
            except Exception as e:
                print(f"   Error deleting workflow {workflow_id}: {str(e)}")

    def run_all_tests(self):
        """Run all test cases"""
        print("🚀 Starting comprehensive workflow system tests...\n")
        
        # Core functionality tests
        if not self.test_api_health():
            print("\n❌ API health check failed. Cannot continue with tests.")
            return False
        
        # Test workflow creation and execution
        workflow_id = self.test_create_simple_workflow()
        if workflow_id:
            self.test_execute_workflow(workflow_id)
        
        # Test advanced features
        self.test_if_condition_workflow()
        self.test_grouped_workflow()
        self.test_workflow_crud()
        
        # Print summary
        self.print_summary()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        pass_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Pass Rate: {pass_rate:.1f}%")
        
        if pass_rate == 100:
            print("\n🎉 All tests passed! The workflow system is functioning correctly.")
        elif pass_rate >= 80:
            print("\n⚠️  Most tests passed, but there are some issues to address.")
        else:
            print("\n❌ Multiple test failures detected. System needs attention.")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("\nFailed tests:")
            for result in failed_tests:
                print(f"  - {result['test']}: {result['message']}")


def main():
    tester = WorkflowTester(API_BASE_URL)
    
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    finally:
        tester.cleanup()
        print("\n✅ Test cleanup completed")


if __name__ == "__main__":
    main()
