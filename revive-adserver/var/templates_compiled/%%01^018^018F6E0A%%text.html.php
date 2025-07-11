<?php /* Smarty version 2.6.18, created on 2025-07-01 13:38:43
         compiled from options/text.html */ ?>
<?php require_once(SMARTY_CORE_DIR . 'core.load_plugins.php');
smarty_core_load_plugins(array('plugins' => array(array('modifier', 'escape', 'options/text.html', 8, false),)), $this); ?>
<tr>
    <td>&nbsp;</td>
    <td id='cell_<?php echo $this->_tpl_vars['aItem']['name']; ?>
' class='<?php if ($this->_tpl_vars['aItem']['disabled']): ?>celldisabled<?php else: ?>cellenabled<?php endif; ?>' valign='top'><?php echo $this->_tpl_vars['aItem']['text']; ?>

    <?php if ($this->_tpl_vars['aItem']['req']): ?><span class="required">*</span><?php endif; ?>
    </td>
    <td width='100%' valign='top'>
    <?php if ($this->_tpl_vars['aItem']['freeze']): ?>
        <strong><?php echo ((is_array($_tmp=$this->_tpl_vars['aItem']['value'])) ? $this->_run_mod_handler('escape', true, $_tmp) : smarty_modifier_escape($_tmp)); ?>
</strong>
    <?php else: ?>
        <input onBlur='phpAds_refreshEnabled(); max_formValidateElement(this);' class='flat' type='text' name='<?php echo $this->_tpl_vars['aItem']['name']; ?>
' id='<?php echo $this->_tpl_vars['aItem']['name']; ?>
' <?php if ($this->_tpl_vars['aItem']['disabled']): ?>disabled="disabled"<?php endif; ?> size='<?php echo $this->_tpl_vars['aItem']['size']; ?>
' <?php if ($this->_tpl_vars['aItem']['maxlength'] > 0): ?>maxlength='<?php echo $this->_tpl_vars['aItem']['maxlength']; ?>
' <?php endif; ?>value="<?php echo ((is_array($_tmp=$this->_tpl_vars['aItem']['value'])) ? $this->_run_mod_handler('escape', true, $_tmp) : smarty_modifier_escape($_tmp)); ?>
" tabindex='<?php echo $this->_tpl_vars['aItem']['tabindex']++; ?>
' <?php if ($this->_tpl_vars['aItem']['autocomplete']): ?>autocomplete="<?php echo $this->_tpl_vars['aItem']['autocomplete']; ?>
<?php endif; ?>>
        <span class='field-hint'><?php echo $this->_tpl_vars['aItem']['hint']; ?>
</span>
    <?php endif; ?>
    </td>
    <td><?php echo $this->_tpl_vars['this']->_showPadLock($this->_tpl_vars['aItem']); ?>
</td>
</tr>