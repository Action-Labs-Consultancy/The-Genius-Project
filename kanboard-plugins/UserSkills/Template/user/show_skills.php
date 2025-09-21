<div class="panel">
    <div class="panel-heading">
        <h3><?= t('User Skills') ?></h3>
    </div>
    <div class="panel-body">
        <?php if (!empty($user['skills'])): ?>
            <div class="skills-display">
                <?php 
                $skills = array_filter(array_map('trim', explode(',', $user['skills'])));
                foreach ($skills as $skill): 
                ?>
                    <span class="skill-tag" style="display: inline-block; background: #3498db; color: white; padding: 3px 8px; margin: 2px; border-radius: 12px; font-size: 12px;">
                        <?= $this->text->e(trim($skill)) ?>
                    </span>
                <?php endforeach ?>
            </div>
        <?php else: ?>
            <p class="alert alert-info"><?= t('No skills defined for this user.') ?></p>
        <?php endif ?>
        
        <?php if ($this->user->isAdmin() || $this->user->getId() == $user['id']): ?>
            <div style="margin-top: 10px;">
                <?= $this->url->link(t('Edit Skills'), 'UserSkillsController', 'edit', array('user_id' => $user['id']), false, 'btn btn-blue', '', false, 'UserSkills') ?>
            </div>
        <?php endif ?>
    </div>
</div>
