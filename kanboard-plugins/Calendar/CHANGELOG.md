# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Fixed

- Avoid displaying avatars for events created by other plugins, like e.g. [Subtaskdate](https://github.com/eSkiSo/Subtaskdate).

---
## [v1.5.0](https://codeberg.org/abu/Calendar/releases/tag/v1.5.0) - 2023-08-08

### Added

- [#3](https://codeberg.org/abu/Calendar/issues/3) Add profile pictures.  
This feature is optional. It can be disabled via the calendar settings, but it's enabled by default.
The pictures are only shown in the project calendars, but never in the user calendar.

## [v1.4.1](https://codeberg.org/abu/Calendar/releases/tag/v1.4.1) - 2023-07-19

### Fixed

- [#2](https://codeberg.org/abu/Calendar/issues/2) Date picker doesnt select the requested date.

## [v1.4.0](https://codeberg.org/abu/Calendar/releases/tag/v1.4.0) - 2023-04-28

### Added

- Enable/disable timeaxis and business hours.
- Specify weekdays for business hours.

## [v1.3.0](https://codeberg.org/abu/Calendar/releases/tag/v1.3.0) - 2023-04-19

### Added

- Button "Goto date" to jump around.

#### New Settings

- Select preferred calendar view, Month week or day.
- Select first day of the week, Sunday or Monday.
- Display calendar week number.
- Display now indicator.
- Enable nav-links, click on day number or date jumps to appropriate display.
- Show/hide allDay Slot.
- Allow to display long events as "all-day".
- Enable/disable moving and resizing of events/tasks.
- Specify vertical hour scale.
- Specify business hours, non-business hours are greyed.

### Changed

- Updated fullcalendar to the highest v3, now is v3.10.5.
- Respect Kanboards timeformat, enforce 24h or use the locales default.

### Fixed

- Move and resize tasks by dragging.

---
