KB.component('calendar', function (containerElement, options) {
    const config = JSON.parse(options.config);
    // console.log(config);

    let modeMapping = {
        month: 'month',
        week: 'agendaWeek',
        day: 'agendaDay',
    };

    function getTimeFormat() {
        let fmt24h = config.timeFormat === 'H:i';
        return [
            fmt24h ? 'HH' : null, // slotLabelFormat
            fmt24h ? 'HH:mm' : null, // eventTimeFormat
        ];
    }

    function getMinMaxTime() {
        let opt = config.timeAxis.enable;
        return [
            opt ? config.timeAxis.minTime : '00:00',
            opt ? config.timeAxis.maxTime : '24:00',
        ];
    }

    function getWeekdays() {
        let arr = [];
        let weekdays = config.businessHours.weekDays;

        if (config.firstDay == '1') {
            weekdays = weekdays[weekdays.length - 1] + weekdays.substr(0, 6);
        }

        for (let i = 0; i < weekdays.length; i++) {
            if (weekdays[i] == '1') {
                arr.push(Number(i));
            }
        }

        return arr;
    }

    function formatTimeString(str) {
        return `${str.slice(0, 10)} ${str.slice(11, 16)}`;
    }

    function updateTask(json) {
        // console.log('save',json);
        $.ajax({
            cache: false,
            url: options.saveUrl,
            contentType: 'application/json',
            type: 'POST',
            processData: false,
            data: json,
        });
    }

    this.render = function () {
        let calendar = $(containerElement);
        let mode = config.view;
        if (window.location.hash) { // Check if hash contains mode
            let hashMode = window.location.hash.substr(1);
            mode = modeMapping[hashMode] || mode;
        }

        let timeformat = getTimeFormat();
        let minmaxtime = getMinMaxTime();

        calendar.fullCalendar({
            locale: $('html').attr('lang'),
            firstDay: Number(config.firstDay),
            slotLabelFormat: timeformat[0],
            eventTimeFormat: timeformat[1],

            editable: false, // Determines whether the events on the calendar can be modified. Default: false
            // Limits the number of events displayed on a day. The rest will show up in a popover.
            // A value of true will limit the number of events to the height of the day cell.
            eventLimit: true,
            defaultView: mode,

            allDaySlot: config.allDaySlot,
            navLinks: config.navLinks,
            nowIndicator: config.nowIndicator,
            weekNumbers: config.weekNumbers,
            weekNumberCalculation: 'ISO',

            minTime: minmaxtime[0],
            maxTime: minmaxtime[1],

            businessHours: !config.businessHours.enable ? null : {
                // Days of week. an array of zero-based day of week integers (0=Sunday)
                dow: getWeekdays(),
                start: config.businessHours.minTime,
                end: config.businessHours.maxTime,
            },

            header: {
                left: 'prev,next today gotoDate',
                center: 'title',
                right: 'month,agendaWeek,agendaDay',
            },

            customButtons: {
                gotoDate: {
                    text: 'date...',
                    click: function () {
                        $('.cal-dp').val('');
                        $('.cal-dp').datepicker('show');
                    },
                },
            },

            eventDrop: function (event) {
                let droppedEvent = {
                    'task_id': event.id,
                    'date_due': event,
                    'date_started': event,
                };

                updateTask(JSON.stringify(droppedEvent, function (name, val) {
                    let droppedDate = null;

                    if ((name.length == 0) || (name == 'task_id')) {
                        return val;
                    } else {
                        switch (name) {
                        case 'date_started':
                            droppedDate = val.start ? val.start : null;
                            break;
                        case 'date_due':
                            droppedDate = val.end ? val.end : null;
                            break;
                        default:
                            // console.error('Illegal name:', name);
                        }
                        // console.log(name, droppedDate ? formatTimeString(droppedDate.format()) : '#')
                        return droppedDate ? formatTimeString(droppedDate.format()) : '';
                    }
                }));
            },

            eventResize: function (event) {
                let droppedEvent = {
                    'task_id': event.id,
                    'date_due': event,
                };

                updateTask(JSON.stringify(droppedEvent, function (name, val) {
                    if ((name.length == 0) || (name == 'task_id')) {
                        return val;
                    } else {
                        return formatTimeString(event.end.format());
                    }
                }));
            },

            eventRender: function (eventObj, el) {
                if (eventObj.avatar == undefined) return;
                if (config.avatars && eventObj.avatar !== '') {
                    $(el[0].firstChild).append(`<div>${eventObj.avatar}</div>`);
                }
            },

            viewRender: function (view) {
                // Map view.name back and update location.hash
                for (let id in modeMapping) {
                    if (modeMapping[id] === view.name) { // Found
                        window.location.hash = id;
                        break;
                    }
                }

                let url = options.checkUrl;
                let params = {
                    'start': view.start.format(),
                    'end': view.end.format(),
                };

                for (let key in params) {
                    url += '&' + key + '=' + params[key];
                }

                // No avatars in user calendar
                if (new URLSearchParams(url).has('action', 'userEvents')) {
                    config.avatars = false;
                }

                $.getJSON(url, function (events) {
                    // console.log(events);
                    calendar.fullCalendar('removeEvents');
                    calendar.fullCalendar('addEventSource', events);
                });
            },
        });

        const toolBar = document.querySelector('div.fc-header-toolbar');
        const leftToolbar = toolBar.querySelectorAll('div.fc-left');
        $(leftToolbar).append('<input type="text" class="cal-dp" style="width:0px;"/>');

        $('.cal-dp').datepicker({
            dateFormat: 'yy-mm-dd',
            // changeYear: true, // Adds a year selector on top
            showWeek: config.weekNumbers,
            firstDay: Number(config.firstDay),
            onClose: function (dateText) {
                if (dateText.length) {
                    calendar.fullCalendar('gotoDate', dateText);
                }
            },
        });
    };
});

KB.on('dom.ready', function () {
    function goToLink(selector) {
        if (!KB.modal.isOpen()) {
            let element = KB.find(selector);

            if (element !== null) {
                window.location = element.attr('href');
            }
        }
    }

    KB.onKey('v+c', function () {
        goToLink('a.view-calendar');
    });
});
