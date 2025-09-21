<?php

namespace Kanboard\Plugin\UserSkills\Helper;

use Kanboard\Core\Base;

class UserSkillsHelper extends Base
{
    public function getSkillsForUser($user_id)
    {
        $user = $this->userModel->getById($user_id);
        return isset($user['skills']) ? $user['skills'] : '';
    }

    public function getSkillsArray($user_id)
    {
        $skills = $this->getSkillsForUser($user_id);
        return array_filter(array_map('trim', explode(',', $skills)));
    }

    public function hasSkill($user_id, $skill)
    {
        $skills = $this->getSkillsArray($user_id);
        return in_array(trim($skill), $skills);
    }

    public function searchUsersBySkill($skill)
    {
        $users = $this->userModel->getAll();
        $matching_users = array();
        
        foreach ($users as $user) {
            if (!empty($user['skills']) && stripos($user['skills'], $skill) !== false) {
                $matching_users[] = $user;
            }
        }
        
        return $matching_users;
    }
}
