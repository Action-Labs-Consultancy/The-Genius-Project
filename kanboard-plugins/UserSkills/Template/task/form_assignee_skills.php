<?php if (!empty($values['owner_id'])): ?>
    <?php $assignee = $this->userModel->getById($values['owner_id']) ?>
    <?php if (!empty($assignee['skills'])): ?>
        <div class="form-column">
            <label><?= t('Assignee Skills') ?></label>
            <div class="assignee-skills">
                <?php 
                $skills = array_filter(array_map('trim', explode(',', $assignee['skills'])));
                foreach ($skills as $skill): 
                ?>
                    <span class="skill-tag"><?= $this->text->e(trim($skill)) ?></span>
                <?php endforeach ?>
            </div>
        </div>
    <?php endif ?>
<?php endif ?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    var ownerSelect = document.getElementById('form-owner_id');
    if (ownerSelect) {
        ownerSelect.addEventListener('change', function() {
            var userId = this.value;
            if (userId) {
                // You could implement AJAX here to dynamically load skills
                console.log('Selected user:', userId);
            }
        });
    }
});
</script>
