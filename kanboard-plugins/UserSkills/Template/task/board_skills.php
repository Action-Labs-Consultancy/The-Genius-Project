<?php if (!empty($task['owner_id'])): ?>
    <?php $user_skills = $this->userSkillsHelper->getSkillsForUser($task['owner_id']) ?>
    <?php if (!empty($user_skills)): ?>
        <div class="task-board-skills">
            <?php 
            $skills = array_filter(array_map('trim', explode(',', $user_skills)));
            $skill_count = count($skills);
            if ($skill_count > 0): 
            ?>
                <span class="skills-indicator" title="<?= $this->text->e(implode(', ', $skills)) ?>">
                    ⚡ <?= $skill_count ?> skill<?= $skill_count > 1 ? 's' : '' ?>
                </span>
            <?php endif ?>
        </div>
    <?php endif ?>
<?php endif ?>

<style>
.task-board-skills {
    margin-top: 3px;
}
.skills-indicator {
    font-size: 10px;
    color: #2ecc71;
    background: rgba(46, 204, 113, 0.1);
    padding: 1px 4px;
    border-radius: 3px;
    cursor: help;
}
</style>
