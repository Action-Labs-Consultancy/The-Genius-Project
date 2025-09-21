<?php

namespace Kanboard\Plugin\Calendar;

use Kanboard\Core\Plugin\Base;
use Kanboard\Core\Translator;
use Kanboard\Plugin\Calendar\Formatter\ProjectApiFormatter;
use Kanboard\Plugin\Calendar\Formatter\TaskCalendarFormatter;

require_once('SettingDefaults.php');

class Plugin extends Base
{
    public function initialize()
    {
        $this->helper->register('calendar', '\Kanboard\Plugin\Calendar\Helper\CalendarHelper');

        $this->container['taskCalendarFormatter'] = $this->container->factory(function ($c) {
            return new TaskCalendarFormatter($c);
        });

        $this->container['projectApiFormatter'] = $this->container->factory(function ($c) {
            return new ProjectApiFormatter($c);
        });

        $this->template->hook->attach('template:dashboard:page-header:menu', 'Calendar:dashboard/menu');
        $this->template->hook->attach('template:project:dropdown', 'Calendar:project/dropdown');
        $this->template->hook->attach('template:project-header:view-switcher', 'Calendar:project_header/views');
        $this->template->hook->attach('template:config:sidebar', 'Calendar:config/sidebar');

        $this->hook->on('template:layout:css', array('template' => 'plugins/Calendar/Assets/vendor/fullcalendar.min.css'));
        $this->hook->on('template:layout:css', array('template' => 'plugins/Calendar/Assets/calendar.css'));
        $this->hook->on('template:layout:js', array('template' => 'plugins/Calendar/Assets/vendor/moment.min.js'));
        $this->hook->on('template:layout:js', array('template' => 'plugins/Calendar/Assets/vendor/fullcalendar.min.js'));
        $this->hook->on('template:layout:js', array('template' => 'plugins/Calendar/Assets/vendor/locale-all.js'));
        $this->hook->on('template:layout:js', array('template' => 'plugins/Calendar/Assets/calendar.js'));
        $this->hook->on('template:layout:js', array('template' => 'plugins/Calendar/Assets/config.js'));
    }

    public function onStartup()
    {
        Translator::load($this->languageModel->getCurrentLanguage(), __DIR__.'/Locale');
    }

    public function getPluginName()
    {
        return 'Calendar';
    }

    public function getPluginDescription()
    {
        return t('Calendar for Kanboard');
    }

    public function getPluginAuthor()
    {
        return 'Frédéric Guillot, Alfred Bühler';
    }

    public function getPluginVersion()
    {
        return '1.5.0';
    }

    public function getPluginHomepage()
    {
        return 'https://codeberg.org/abu/Calendar/';
    }

    public function getCompatibleVersion()
    {
        return '>=1.2.13';
    }
}
