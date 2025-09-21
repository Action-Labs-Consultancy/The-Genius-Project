<?php if (!empty($task['owner_id'])): ?>
    <?php $user_skills = $this->userSkillsHelper->getSkillsForUser($task['owner_id']) ?>
    <?php if (!empty($user_skills)): ?>
        <div class="task-skills">
            <strong><?= t('Assignee Skills:') ?></strong>
            <div class="skills-list">
                <?php 
                $skills = array_filter(array_map('trim', explode(',', $user_skills)));
                foreach ($skills as $skill): 
                ?>
                    <span class="skill-tag-small"><?= $this->text->e(trim($skill)) ?></span>
                <?php endforeach ?>
            </div>
        </div>
    <?php endif ?>
<?php endif ?>

<style>
.task-skills {
    margin: 5px 0;
    font-size: 12px;
}
.skill-tag-small {
    display: inline-block;
    background: #2ecc71;
    color: white;
    padding: 1px 5px;
    margin: 1px;
    border-radius: 8px;
    font-size: 10px;
}
</style>
