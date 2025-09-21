<?php

namespace Kanboard\Plugin\UserSkills\Controller;

use Kanboard\Controller\BaseController;

class TaskSkillsController extends BaseController
{
    public function filter()
    {
        $project_id = $this->request->getIntegerParam('project_id');
        $skills_filter = $this->request->getStringParam('skills');

        $project = $this->getProject();
        $search = 'status:open';

        if (!empty($skills_filter)) {
            $tasks = $this->getTasksWithSkillsFilter($project_id, $skills_filter);
        } else {
            $tasks = $this->taskFinderModel->getAll($project_id);
        }

        $this->response->html($this->helper->layout->app('UserSkills:task/skills_filter', array(
            'project' => $project,
            'tasks' => $tasks,
            'skills_filter' => $skills_filter,
            'title' => t('Filter tasks by skills'),
        )));
    }

    private function getTasksWithSkillsFilter($project_id, $skills_filter)
    {
        $tasks = $this->taskFinderModel->getAll($project_id);
        $filtered_tasks = array();
        $userSkillsHelper = $this->helper->userSkillsHelper;

        foreach ($tasks as $task) {
            if (!empty($task['owner_id'])) {
                $user_skills = $userSkillsHelper->getSkillsForUser($task['owner_id']);
                
                if (stripos($user_skills, $skills_filter) !== false) {
                    $filtered_tasks[] = $task;
                }
            }
        }

        return $filtered_tasks;
    }
}
