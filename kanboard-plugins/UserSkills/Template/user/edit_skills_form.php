<div class="form-column">
    <?= $this->form->label(t('Skills'), 'skills') ?>
    <?= $this->form->textarea('skills', $values, $errors, array('placeholder' => 'PHP, JavaScript, etc.', 'rows' => 3)) ?>
    <p class="form-help"><?= t('Enter your skills separated by commas') ?></p>
</div>
