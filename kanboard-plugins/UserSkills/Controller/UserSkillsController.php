<?php

namespace Kanboard\Plugin\UserSkills\Controller;

use Kanboard\Controller\BaseController;
use Kanboard\Core\Controller\PageNotFoundException;

class UserSkillsController extends BaseController
{
    public function edit()
    {
        $user_id = $this->request->getIntegerParam('user_id');
        $user = $this->userModel->getById($user_id);

        if (empty($user)) {
            throw new PageNotFoundException();
        }

        if (! $this->userSession->isAdmin() && $this->userSession->getId() != $user_id) {
            $this->forbidden();
        }

        $this->response->html($this->helper->layout->user('UserSkills:user/edit_skills', array(
            'user' => $user,
            'title' => t('Edit Skills'),
        )));
    }

    public function save()
    {
        $user_id = $this->request->getIntegerParam('user_id');
        $values = $this->request->getValues();

        if (! $this->userSession->isAdmin() && $this->userSession->getId() != $user_id) {
            $this->forbidden();
        }

        if ($this->userModel->update(array('id' => $user_id, 'skills' => $values['skills']))) {
            $this->flash->success(t('User skills updated successfully.'));
        } else {
            $this->flash->failure(t('Unable to update user skills.'));
        }

        $this->response->redirect($this->helper->url->to('UserViewController', 'show', array('user_id' => $user_id)));
    }

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
}
