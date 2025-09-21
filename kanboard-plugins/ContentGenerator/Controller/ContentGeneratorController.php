<?php

namespace Kanboard\Plugin\ContentGenerator\Controller;

use Kanboard\Controller\BaseController;

class ContentGeneratorController extends BaseController
{
    /**
     * Manual content generation endpoint
     */
    public function generate()
    {
        $task_id = $this->request->getIntegerParam('task_id');
        $task = $this->getTask();

        if ($this->request->isAjax()) {
            $success = $this->helper->contentGenerator->generateContent($task_id, $this->userSession->getId());
            
            $this->response->json(array(
                'success' => $success,
                'message' => $success ? t('Content generated successfully') : t('Failed to generate content')
            ));
        } else {
            $this->helper->contentGenerator->generateContent($task_id, $this->userSession->getId());
            $this->flash->success(t('Content generation initiated'));
            $this->response->redirect($this->helper->url->to('TaskViewController', 'show', array('task_id' => $task_id, 'project_id' => $task['project_id'])));
        }
    }
}
