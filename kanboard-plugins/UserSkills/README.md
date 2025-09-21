# Kanboard User Skills Plugin

A lightweight Kanboard plugin that adds skills management to users and enables filtering tasks by required skills.

## Features

- ✅ Add skills field to users table via database migration
- ✅ Admin interface to manage user skills from user management section
- ✅ Display user skills on profile pages with styled tags
- ✅ Show assignee skills on task details and forms
- ✅ Visual skills indicators on board view
- ✅ Filter/search tasks by user skills
- ✅ Simple text-based skills storage (comma-separated)
- ✅ Minimal and lightweight following Kanboard's plugin API

## Installation

### 1. Download and Install

```bash
# Navigate to your Kanboard plugins directory
cd /path/to/kanboard/plugins/

# Copy the UserSkills folder to your plugins directory
cp -r /path/to/UserSkills ./
```

### 2. Enable the Plugin

1. Log in to Kanboard as an administrator
2. Go to **Settings** → **Plugins**
3. Find "User Skills" in the plugin list
4. Click **Install/Enable**

### 3. Database Migration

The plugin will automatically create the necessary database changes when enabled:
- Adds a `skills` column to the `users` table

## Usage

### Managing User Skills

#### For Administrators:
1. Go to **Users** → **View all users**
2. Click on any user to view their profile
3. Click **Edit Skills** button
4. Enter skills separated by commas (e.g., "PHP, JavaScript, Project Management, Database Design")
5. Click **Save Skills**

#### For Users (editing own skills):
1. Go to your profile page
2. Click **Edit Skills** in the User Skills section
3. Enter your skills separated by commas
4. Click **Save Skills**

### Viewing Skills

**User Profile Page:**
- Skills are displayed as colored tags in the "User Skills" section
- Shows "No skills defined" if user has no skills

**Task Management:**
- Task details show assignee skills when viewing a task
- Task creation/editing forms show selected assignee's skills
- Board view shows skill indicators on task cards

### Filtering Tasks by Skills

1. Go to any project board
2. Navigate to: **Project** → **Filter Tasks by Skills**
3. Enter skill keywords in the search box
4. Click **Search**
5. View filtered results showing only tasks assigned to users with matching skills

## Technical Details

### Plugin Structure

```
UserSkills/
├── Plugin.php                          # Main plugin class
├── Config/
│   └── config.php                       # Plugin configuration
├── Controller/
│   ├── UserSkillsController.php         # User skills management
│   └── TaskSkillsController.php         # Task filtering by skills
├── Helper/
│   └── UserSkillsHelper.php             # Skills utility functions
├── Schema/
│   ├── Mysql.php                        # MySQL schema migration
│   ├── Postgres.php                     # PostgreSQL schema migration
│   └── Sqlite.php                       # SQLite schema migration
├── Template/
│   ├── user/
│   │   ├── show_skills.php              # Display skills on user profile
│   │   ├── edit_skills.php              # Skills editing form
│   │   └── edit_skills_form.php         # Skills form component
│   └── task/
│       ├── show_assignee_skills.php     # Skills on task details
│       ├── form_assignee_skills.php     # Skills on task forms
│       ├── board_skills.php             # Skills on board cards
│       └── skills_filter.php            # Skills filtering page
├── Locale/
│   └── en_US/
│       └── translations.php             # English translations
└── README.md                            # This file
```

### Database Changes

The plugin adds one column to the existing `users` table:
- `skills` (TEXT): Stores comma-separated list of user skills

### Hooks Used

- `template:user:show:information` - Display skills on user profile
- `template:user:edit:bottom` - Add skills editing to user management
- `template:task:show:information` - Show assignee skills on task details
- `template:task:form:second-column` - Show skills in task forms
- `template:board:task:footer` - Show skill indicators on board

### Routes Added

- `user/:user_id/skills/edit` - Edit user skills page
- `user/:user_id/skills/save` - Save user skills
- `project/:project_id/task/skills-filter` - Filter tasks by skills

## Customization

### Styling

The plugin includes basic CSS styling for skill tags. You can customize the appearance by modifying the styles in the template files:

```css
.skill-tag {
    background: #3498db;
    color: white;
    padding: 3px 8px;
    margin: 2px;
    border-radius: 12px;
    font-size: 12px;
}
```

### Skills Format

Skills are stored as comma-separated text. Examples:
- "PHP, JavaScript, MySQL"
- "Project Management, Agile, Scrum"
- "UI/UX Design, Photoshop, Figma"

### Adding More Languages

To add translations for other languages:

1. Create a new directory in `Locale/` (e.g., `fr_FR/`)
2. Copy `en_US/translations.php` to the new directory
3. Translate the strings in the array

## Troubleshooting

### Plugin Not Appearing
- Ensure the plugin folder is in the correct `plugins/` directory
- Check file permissions (web server needs read access)
- Check Kanboard logs for any errors

### Database Migration Issues
- Ensure your database user has ALTER TABLE permissions
- Check if the `skills` column already exists in the `users` table
- Review the Schema files for your database type

### Skills Not Displaying
- Clear browser cache
- Check if users have skills defined
- Verify the plugin is enabled and active

## Requirements

- Kanboard >= 1.2.0
- PHP >= 7.0
- MySQL/PostgreSQL/SQLite database

## License

This plugin is released under the same license as Kanboard (MIT License).

## Support

For issues and feature requests, please create an issue in the project repository.

## Development

### Testing the Plugin

1. Install in a development Kanboard instance
2. Create test users with various skills
3. Create test tasks and assign them to users
4. Test the filtering functionality
5. Verify skills display correctly in all views

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Version:** 1.0.0  
**Compatibility:** Kanboard >= 1.2.0  
**Author:** Kanboard Plugin Developer
