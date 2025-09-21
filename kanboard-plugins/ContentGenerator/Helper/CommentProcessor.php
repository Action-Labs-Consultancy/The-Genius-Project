<?php

namespace Kanboard\Plugin\ContentGenerator\Helper;

use Kanboard\Core\Base;

class CommentProcessor extends Base
{
    /**
     * Process comment when it's created
     */
    public function processComment($event_name, $task_id, $values)
    {
        if (!$task_id || !isset($values['comment'])) {
            return;
        }

        $comment = $values['comment'];
        $user_id = isset($values['user_id']) ? $values['user_id'] : null;

        // Check if comment contains @CG mention
        if ($this->helper->contentGenerator->containsCGMention($comment)) {
            $this->logger->info('ContentGenerator: @CG mention detected in comment for task ' . $task_id);
            $this->scheduleContentGeneration($task_id, $user_id);
        }
    }

    /**
     * Process task when it's created or updated
     */
    public function processTask($event_name, $task_id, $values)
    {
        if (!$task_id) {
            return;
        }

        // For task creation, check if description contains @CG
        if (isset($values['description'])) {
            if ($this->helper->contentGenerator->containsCGMention($values['description'])) {
                $this->logger->info('ContentGenerator: @CG mention detected in task description for task ' . $task_id);
                $this->scheduleContentGeneration($task_id, null);
            }
        } else {
            // For task updates, check the current task description
            if ($this->helper->contentGenerator->taskDescriptionContainsCGMention($task_id)) {
                $this->logger->info('ContentGenerator: @CG mention detected in updated task description for task ' . $task_id);
                $this->scheduleContentGeneration($task_id, null);
            }
        }
    }

    /**
     * Schedule content generation (execute immediately)
     */
    private function scheduleContentGeneration($task_id, $user_id)
    {
        try {
            // Small delay to ensure the triggering comment/task is saved
            sleep(1);
            
            // Generate content
            $success = $this->helper->contentGenerator->generateContent($task_id, $user_id);
            
            if ($success) {
                $this->logger->info('ContentGenerator: Successfully generated content for task ' . $task_id);
            } else {
                $this->logger->error('ContentGenerator: Failed to generate content for task ' . $task_id);
            }
            
        } catch (Exception $e) {
            $this->logger->error('ContentGenerator: Exception in content generation - ' . $e->getMessage());
        }
    }
}
