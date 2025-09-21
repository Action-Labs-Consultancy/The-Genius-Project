<?php

namespace Kanboard\Plugin\UserSkills;

use Kanboard\Core\Plugin\Base;
use Kanboard\Core\Translator;

class Plugin extends Base
{
    public function initialize()
    {
        $this->helper->hook->attach('template:user:show:information', 'UserSkills:user/show_skills');
        $this->helper->hook->attach('template:user:edit:bottom', 'UserSkills:user/edit_skills');
        $this->helper->hook->attach('template:task:show:information', 'UserSkills:task/show_assignee_skills');
        $this->helper->hook->attach('template:task:form:second-column', 'UserSkills:task/form_assignee_skills');
        $this->helper->hook->attach('template:board:task:footer', 'UserSkills:task/board_skills');
        
        $this->route->addRoute('user/:user_id/skills/edit', 'UserSkillsController', 'edit', 'UserSkills');
        $this->route->addRoute('user/:user_id/skills/save', 'UserSkillsController', 'save', 'UserSkills');
        $this->route->addRoute('project/:project_id/task/skills-filter', 'TaskSkillsController', 'filter', 'UserSkills');
        
        $this->helper->register('userSkillsHelper', '\Kanboard\Plugin\UserSkills\Helper\UserSkillsHelper');
    }

    public function onStartup()
    {
        Translator::load($this->languageModel->getCurrentLanguage(), __DIR__.'/Locale');
    }

    public function getClasses()
    {
        return array(
            'Plugin\UserSkills\Controller' => array(
                'UserSkillsController',
                'TaskSkillsController',
            ),
            'Plugin\UserSkills\Helper' => array(
                'UserSkillsHelper',
            ),
        );
    }

    public function getPluginName()
    {
        return 'User Skills';
    }

    public function getPluginAuthor()
    {
        return 'Kanboard Plugin Developer';
    }

    public function getPluginVersion()
    {
        return '1.0.0';
    }

    public function getPluginDescription()
    {
        return 'Add skills management to users and filter tasks by skills';
    }

    public function getPluginHomepage()
    {
        return 'https://github.com/your-repo/kanboard-user-skills';
    }

    public function getCompatibleVersion()
    {
        return '>=1.2.0';
    }
}
