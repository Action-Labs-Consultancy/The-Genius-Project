'use strict';

$(function () {
    if (new URLSearchParams(window.location.search).get('controller') !== 'ConfigController') {
        return;
    }

    $('#cal-config').submit(function () {
        let weekdays = '';

        $('.cal-wd').each(function () {
            weekdays += this.checked ? '1' : '0';
        });

        $('#form-calendar_weekdays').val(weekdays);
    });


    // Timepicker

    $('.cal-tp').timepicker({
        stepMinute: 30,
        timeFormat: 'HH:mm',
    });

    const timeAxis = $('input[name="calendar_timeaxis"]');
    const timeAxisItems = $('.cal-tx');

    const businessHours = $('input[name="calendar_business"]');
    const businessHourItems = $('.cal-wd, .cal-bh');

    timeAxisItems.prop('disabled', !timeAxis[1].checked);
    timeAxis.change(function () {
        timeAxisItems.prop('disabled', !this.checked);
    });

    businessHourItems.prop('disabled', !businessHours[1].checked);
    businessHours.change(function () {
        businessHourItems.prop('disabled', !this.checked);
    });

    // Weekdays

    function getLabelText(id) {
        return id == '1' ? 'Weekdays, Mon ... Sun' : 'Weekdays, Sun ... Sat';
    }

    const firstDay = $('#form-calendar_firstday');

    $('label[for="form-calendar_weekdays"]').text(getLabelText(firstDay.prop('selectedIndex')));
    firstDay.change(function () {
        $('label[for="form-calendar_weekdays"]').text(getLabelText(this.selectedIndex));
    });

    let i = 0;
    let weekdays = $('#form-calendar_weekdays').val();
    $('.cal-wd').each(function () {
        this.checked = weekdays[i++] == '1';
    });
});
