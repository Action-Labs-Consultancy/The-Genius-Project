<form method="post" action="<?= $this->url->href('UserSkillsController', 'save', array('user_id' => $user['id']), false, 'UserSkills') ?>" autocomplete="off">
    
    <?= $this->form->csrf() ?>
    
    <fieldset>
        <legend><?= t('Skills Management') ?></legend>
        
        <div class="form-column">
            <?= $this->form->label(t('Skills (comma separated)'), 'skills') ?>
            <?= $this->form->textarea('skills', array('skills' => isset($user['skills']) ? $user['skills'] : ''), array(), array('placeholder' => 'PHP, JavaScript, Project Management, etc.', 'rows' => 4)) ?>
            <p class="form-help"><?= t('Enter skills separated by commas. Example: PHP, JavaScript, Project Management, Database Design') ?></p>
        </div>
    </fieldset>

    <div class="form-actions">
        <button type="submit" class="btn btn-blue"><?= t('Save Skills') ?></button>
        <?= $this->url->link(t('Cancel'), 'UserViewController', 'show', array('user_id' => $user['id']), false, 'btn') ?>
    </div>
</form>

<style>
.skill-tag {
    display: inline-block;
    background: #3498db;
    color: white;
    padding: 3px 8px;
    margin: 2px;
    border-radius: 12px;
    font-size: 12px;
}
</style>
