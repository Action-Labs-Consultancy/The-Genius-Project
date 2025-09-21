<?php

namespace Kanboard\Plugin\ContentGenerator;

use Kanboard\Core\Plugin\Base;
use Kanboard\Core\Translator;

class Plugin extends Base
{
    public function initialize()
    {
        // Register the content generator helper
        $this->helper->register('contentGenerator', '\Kanboard\Plugin\ContentGenerator\Helper\ContentGeneratorHelper');
        
        // Hook into comment creation events using the correct Kanboard event system
        $this->hook->on('comment.create', function($event_name, $task_id, $values) {
            $processor = new \Kanboard\Plugin\ContentGenerator\Helper\CommentProcessor($this->container);
            $processor->processComment($event_name, $task_id, $values);
        });
        
        // Hook into task creation events
        $this->hook->on('task.create', function($event_name, $task_id, $values) {
            $processor = new \Kanboard\Plugin\ContentGenerator\Helper\CommentProcessor($this->container);
            $processor->processTask($event_name, $task_id, $values);
        });
        
        // Hook into task modification events
        $this->hook->on('task.update', function($event_name, $task_id, $values) {
            $processor = new \Kanboard\Plugin\ContentGenerator\Helper\CommentProcessor($this->container);
            $processor->processTask($event_name, $task_id, $values);
        });
        
        // Add route for manual content generation
        $this->route->addRoute('task/:task_id/generate-content', 'ContentGeneratorController', 'generate', 'ContentGenerator');
    }

    public function onStartup()
    {
        Translator::load($this->languageModel->getCurrentLanguage(), __DIR__.'/Locale');
    }

    public function getClasses()
    {
        return array(
            'Plugin\ContentGenerator\Controller' => array(
                'ContentGeneratorController',
            ),
            'Plugin\ContentGenerator\Helper' => array(
                'ContentGeneratorHelper',
                'CommentProcessor',
            ),
        );
    }

    public function getPluginName()
    {
        return 'Content Generator';
    }

    public function getPluginAuthor()
    {
        return 'Kanboard Plugin Developer';
    }

    public function getPluginVersion()
    {
        return '1.0.1';
    }

    public function getPluginDescription()
    {
        return 'Automatically generate content when @CG is mentioned in task comments or descriptions';
    }

    public function getPluginHomepage()
    {
        return 'https://github.com/your-repo/kanboard-content-generator';
    }

    public function getCompatibleVersion()
    {
        return '>=1.2.0';
    }
}
