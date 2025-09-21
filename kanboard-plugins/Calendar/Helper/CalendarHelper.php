<?php

namespace Kanboard\Plugin\Calendar\Helper;

use Kanboard\Core\Base;

/**
 * Calendar Helper
 *
 * @package Kanboard\Plugin\Calendar\Helper
 * @author  Frederic Guillot
 */
class CalendarHelper extends Base
{
    /**
     * Render calendar component
     *
     * @param  string $checkUrl
     * @param  string $saveUrl
     * @return string
     */
    public function render($checkUrl, $saveUrl): string
    {
        $params = array(
            'checkUrl' => $checkUrl,
            'saveUrl' => $saveUrl,
            'config' => $this->getConfig(),
        );

        return '<div class="js-calendar" data-params=\''.json_encode($params, JSON_HEX_APOS).'\'></div>';
    }

    /**
     * Collect config for the calendar
     *
     * @return string json
     */
    private function getConfig(): string
    {
        $config = array(
            'allDaySlot'    => getBool($this->configModel->get('calendar_alldayslot', CALENDAR_ALLDAYSLOT)),
            'firstDay'      => $this->configModel->get('calendar_firstday', CALENDAR_FIRSTDAY),
            'navLinks'      => getBool($this->configModel->get('calendar_navlinks', CALENDAR_NAVLINKS)),
            'nowIndicator'  => getBool($this->configModel->get('calendar_nowindic', CALENDAR_NOWINDIC)),
            'timeFormat'    => $this->dateParser->getUserTimeFormat(),
            'view'          => $this->configModel->get('calendar_view', CALENDAR_VIEW),
            'weekNumbers'   => getBool($this->configModel->get('calendar_weeknums', CALENDAR_WEEKNUMS)),
            'avatars'       => getBool($this->configModel->get('calendar_avatars', CALENDAR_AVATARS)),
            'timeAxis' => array(
                'enable'    => getBool($this->configModel->get('calendar_timeaxis', CALENDAR_TIMEAXIS)),
                'minTime'   => $this->configModel->get('calendar_mintime', CALENDAR_MINTIME),
                'maxTime'   => $this->configModel->get('calendar_maxtime', CALENDAR_MAXTIME),
            ),
            'businessHours' => array(
                'enable'    => getBool($this->configModel->get('calendar_business', CALENDAR_BUSINESS)),
                'minTime'   => $this->configModel->get('calendar_mintimebusi', CALENDAR_MINTIMEBUSI),
                'maxTime'   => $this->configModel->get('calendar_maxtimebusi', CALENDAR_MAXTIMEBUSI),
                'weekDays'  => $this->configModel->get('calendar_weekdays', CALENDAR_WEEKDAYS),
            ),
        );

        return json_encode($config);
    }
}

function getBool($expr)
{
    return $expr === '1';
}
