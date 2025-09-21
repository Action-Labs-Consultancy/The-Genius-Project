<div class="page-header">
    <h2><?= t('Filter Tasks by Skills') ?></h2>
</div>

<form method="get" action="<?= $this->url->href('TaskSkillsController', 'filter', array('project_id' => $project['id']), false, 'UserSkills') ?>" class="search">
    <div class="input-addon">
        <?= $this->form->text('skills', array('skills' => $skills_filter), array(), array('placeholder' => t('Enter skills to search for...'), 'class' => 'form-control')) ?>
        <div class="input-addon-item">
            <button class="btn btn-blue" type="submit"><?= t('Search') ?></button>
        </div>
    </div>
</form>

<?php if (!empty($skills_filter)): ?>
    <div class="alert alert-info">
        <?= t('Showing tasks assigned to users with skills containing: ') ?>
        <strong><?= $this->text->e($skills_filter) ?></strong>
        <?= $this->url->link(t('Clear filter'), 'TaskSkillsController', 'filter', array('project_id' => $project['id']), false, 'btn btn-sm') ?>
    </div>
<?php endif ?>

<?php if (empty($tasks)): ?>
    <div class="alert alert-info">
        <?= t('No tasks found.') ?>
    </div>
<?php else: ?>
    <table class="table-striped table-scrolling">
        <thead>
            <tr>
                <th><?= t('Id') ?></th>
                <th><?= t('Title') ?></th>
                <th><?= t('Assignee') ?></th>
                <th><?= t('Skills') ?></th>
                <th><?= t('Status') ?></th>
                <th><?= t('Due Date') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($tasks as $task): ?>
                <tr>
                    <td class="task-table task-<?= $task['color_id'] ?>">
                        <?= $this->url->link('#'.$task['id'], 'TaskViewController', 'show', array('task_id' => $task['id'], 'project_id' => $task['project_id'])) ?>
                    </td>
                    <td>
                        <?= $this->url->link($this->text->e($task['title']), 'TaskViewController', 'show', array('task_id' => $task['id'], 'project_id' => $task['project_id'])) ?>
                    </td>
                    <td>
                        <?php if (!empty($task['assignee_name'])): ?>
                            <?= $this->text->e($task['assignee_name']) ?>
                        <?php else: ?>
                            <em><?= t('Unassigned') ?></em>
                        <?php endif ?>
                    </td>
                    <td>
                        <?php if (!empty($task['owner_id'])): ?>
                            <?php $user_skills = $this->userSkillsHelper->getSkillsForUser($task['owner_id']) ?>
                            <?php if (!empty($user_skills)): ?>
                                <?php 
                                $skills = array_filter(array_map('trim', explode(',', $user_skills)));
                                foreach ($skills as $skill): 
                                ?>
                                    <span class="skill-tag-small"><?= $this->text->e(trim($skill)) ?></span>
                                <?php endforeach ?>
                            <?php endif ?>
                        <?php endif ?>
                    </td>
                    <td>
                        <?= $this->text->e($task['column_title']) ?>
                    </td>
                    <td>
                        <?= $this->dt->date($task['date_due']) ?>
                    </td>
                </tr>
            <?php endforeach ?>
        </tbody>
    </table>
<?php endif ?>

<div class="page-footer">
    <?= $this->url->link(t('Back to board'), 'BoardViewController', 'show', array('project_id' => $project['id'])) ?>
</div>
