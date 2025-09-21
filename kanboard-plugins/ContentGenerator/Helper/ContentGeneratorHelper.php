<?php

namespace Kanboard\Plugin\ContentGenerator\Helper;

use Kanboard\Core\Base;

class ContentGeneratorHelper extends Base
{
    const CONTENT_GENERATOR_URL = 'http://192.168.100.137:2346/generate-content';

    /**
     * Generate content based on task data
     */
    public function generateContent($task_id, $trigger_user_id = null)
    {
        try {
            // Collect task data
            $taskData = $this->collectTaskData($task_id);
            
            // Build prompt for content generation
            $prompt = $this->buildContentPrompt($taskData);
            
            // Call your local content generator
            $generatedContent = $this->callLocalContentGenerator($prompt, $taskData);
            
            if ($generatedContent) {
                // Post generated content as a comment
                $this->postGeneratedContent($task_id, $generatedContent);
                return true;
            }
            
            return false;
            
        } catch (Exception $e) {
            $this->logger->error('ContentGenerator: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Collect all relevant task data
     */
    private function collectTaskData($task_id)
    {
        $task = $this->taskFinderModel->getById($task_id);
        $comments = $this->commentModel->getAll($task_id);
        $files = $this->taskFileModel->getAll($task_id);
        $subtasks = $this->subtaskModel->getAll($task_id);
        
        // Get project context
        $project = $this->projectModel->getById($task['project_id']);
        
        // Get assignee info if available
        $assignee = null;
        if (!empty($task['owner_id'])) {
            $assignee = $this->userModel->getById($task['owner_id']);
        }

        return array(
            'id' => $task['id'],
            'title' => $task['title'],
            'description' => $task['description'],
            'status' => $task['is_active'] ? 'Open' : 'Closed',
            'priority' => $task['priority'],
            'due_date' => $task['date_due'],
            'created_date' => $task['date_creation'],
            'project' => array(
                'id' => $project['id'],
                'name' => $project['name'],
                'description' => $project['description']
            ),
            'assignee' => $assignee ? array(
                'name' => $assignee['name'],
                'username' => $assignee['username']
            ) : null,
            'comments' => array_map(function($comment) {
                return array(
                    'content' => $comment['comment'],
                    'date' => $comment['date_creation'],
                    'user' => $comment['username']
                );
            }, $comments),
            'files' => array_map(function($file) {
                return array(
                    'name' => $file['name'],
                    'size' => $file['size']
                );
            }, $files),
            'subtasks' => array_map(function($subtask) {
                return array(
                    'title' => $subtask['title'],
                    'status' => $subtask['status']
                );
            }, $subtasks)
        );
    }

    /**
     * Build content generation prompt
     */
    private function buildContentPrompt($taskData)
    {
        $prompt = "You are an AI assistant helping with project management and task analysis.\n\n";
        $prompt .= "TASK CONTEXT:\n";
        $prompt .= "Project: " . $taskData['project']['name'] . "\n";
        $prompt .= "Task: " . $taskData['title'] . "\n";
        
        if (!empty($taskData['description'])) {
            $prompt .= "Description: " . $taskData['description'] . "\n";
        }
        
        $prompt .= "Status: " . $taskData['status'] . "\n";
        
        if ($taskData['assignee']) {
            $prompt .= "Assignee: " . $taskData['assignee']['name'] . "\n";
        }
        
        if (!empty($taskData['comments'])) {
            $prompt .= "\nCOMMENTS HISTORY:\n";
            foreach ($taskData['comments'] as $comment) {
                $prompt .= "- " . $comment['user'] . " (" . date('Y-m-d H:i', $comment['date']) . "): " . $comment['content'] . "\n";
            }
        }
        
        if (!empty($taskData['subtasks'])) {
            $prompt .= "\nSUBTASKS:\n";
            foreach ($taskData['subtasks'] as $subtask) {
                $prompt .= "- " . $subtask['title'] . " (" . ($subtask['status'] == 2 ? 'Completed' : 'Pending') . ")\n";
            }
        }
        
        $prompt .= "\nPlease analyze this task and provide helpful insights, suggestions, or relevant content that could assist with task completion. ";
        $prompt .= "Consider the project context, current progress, comments, and any blockers mentioned. ";
        $prompt .= "Provide actionable recommendations, potential solutions, or relevant information that would be valuable for the team.";
        
        return $prompt;
    }

    /**
     * Call your local content generator
     */
    private function callLocalContentGenerator($prompt, $taskData)
    {
        $ch = curl_init();
        
        $postData = json_encode(array(
            'productName' => $taskData['project']['name'],
            'targetAudience' => 'Project Team',
            'description' => $prompt,
            'tone' => 'Professional & Business',
            'platform' => 'Project Management',
            'language' => 'English',
            'funnelStage' => 'Action',
            'contentType' => 'Project Analysis',
            'timeline' => '1 Week'
        ));
        
        curl_setopt_array($ch, array(
            CURLOPT_URL => self::CONTENT_GENERATOR_URL,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json',
                'Content-Length: ' . strlen($postData)
            ),
            CURLOPT_TIMEOUT => 60,
            CURLOPT_CONNECTTIMEOUT => 10
        ));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            $this->logger->error('ContentGenerator cURL error: ' . curl_error($ch));
            curl_close($ch);
            return false;
        }
        
        curl_close($ch);
        
        if ($httpCode !== 200) {
            $this->logger->error('ContentGenerator API error: HTTP ' . $httpCode);
            return false;
        }
        
        $responseData = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->logger->error('ContentGenerator JSON decode error: ' . json_last_error_msg());
            return false;
        }
        
        // Extract the actual content from the response
        if (isset($responseData['rawContent'])) {
            return $this->cleanGeneratedContent($responseData['rawContent']);
        } elseif (isset($responseData['content'])) {
            return $this->cleanGeneratedContent($responseData['content']);
        }
        
        return false;
    }

    /**
     * Clean and format generated content
     */
    private function cleanGeneratedContent($content)
    {
        // Remove HTML tags if present
        $content = strip_tags($content);
        
        // Clean up excessive whitespace
        $content = preg_replace('/\n\s*\n\s*\n/', "\n\n", $content);
        $content = trim($content);
        
        // Limit length to reasonable size
        if (strlen($content) > 2000) {
            $content = substr($content, 0, 2000) . "...\n\n[Content truncated for readability]";
        }
        
        return $content;
    }

    /**
     * Post generated content as a task comment
     */
    private function postGeneratedContent($task_id, $content)
    {
        $formattedContent = "🤖 **AI Content Generator**\n\n" . $content . "\n\n*Generated automatically via @CG mention*";
        
        return $this->commentModel->create(array(
            'task_id' => $task_id,
            'user_id' => 1, // System user
            'comment' => $formattedContent
        ));
    }

    /**
     * Check if comment contains @CG mention
     */
    public function containsCGMention($comment)
    {
        return preg_match('/@CG\b/i', $comment);
    }

    /**
     * Check if task description contains @CG mention
     */
    public function taskDescriptionContainsCGMention($task_id)
    {
        $task = $this->taskFinderModel->getById($task_id);
        return $task && $this->containsCGMention($task['description']);
    }
}
