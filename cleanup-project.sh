#!/bin/bash
# Project Cleanup Script - Removes empty files, backup files, and temporary files
# WARNING: This script will permanently delete files. Review carefully before running.

echo "🧹 Starting project cleanup..."

# Counter for deleted files
deleted_count=0

# Function to safely delete a file
safe_delete() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Deleting: $file"
        rm "$file"
        ((deleted_count++))
    fi
}

# Function to safely delete empty directories
cleanup_empty_dirs() {
    find /Users/rabab/the-genius-project \
        -type d \
        -empty \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/llama.cpp/*" \
        -not -path "*/venv/*" \
        -not -path "*/build/*" \
        -delete 2>/dev/null || true
}

echo "1. Removing empty files that are safe to delete..."

# Safe empty files to delete (project-specific, not system files)
empty_files_to_delete=(
    "/Users/rabab/the-genius-project/test_database.py"
    "/Users/rabab/the-genius-project/127.0.0.1"
    "/Users/rabab/the-genius-project/frontend/LoginPage.js"
    "/Users/rabab/the-genius-project/frontend/src/AIContentGeneratorInline.js"
    "/Users/rabab/the-genius-project/frontend/src/SocialInsightsPageWrapper.js"
    "/Users/rabab/the-genius-project/frontend/src/ProjectDetailPage.js"
    "/Users/rabab/the-genius-project/frontend/src/ContentCalendarPage.js"
    "/Users/rabab/the-genius-project/frontend/src/TikTokAuthCallback.js"
    "/Users/rabab/the-genius-project/frontend/src/ChooseClientPage.js"
    "/Users/rabab/the-genius-project/frontend/src/PlatformBlock.js"
    "/Users/rabab/the-genius-project/frontend/src/config.js"
    "/Users/rabab/the-genius-project/frontend/src/AppleAuthCallback.js"
    "/Users/rabab/the-genius-project/frontend/src/AIGeneratorChat.js"
    "/Users/rabab/the-genius-project/frontend/src/apiUtils.js"
    "/Users/rabab/the-genius-project/frontend/src/InsightsDashboardPro.js"
    "/Users/rabab/the-genius-project/frontend/src/MetaAuthCallback.js"
    "/Users/rabab/the-genius-project/frontend/src/PlatformsSection.js"
    "/Users/rabab/the-genius-project/frontend/src/SocialMediaInsights.js"
    "/Users/rabab/the-genius-project/frontend/src/ProjectsPage.js"
    "/Users/rabab/the-genius-project/frontend/src/pages/index.js"
    "/Users/rabab/the-genius-project/frontend/src/pages/tiktok-analysis.js"
    "/Users/rabab/the-genius-project/frontend/src/pages/AdKPIDashboard.js"
    "/Users/rabab/the-genius-project/frontend/src/pages/SMContentCalendarPage.js"
    "/Users/rabab/the-genius-project/frontend/src/AIContentCreator.js"
    "/Users/rabab/the-genius-project/test-connection.js"
    "/Users/rabab/the-genius-project/backend/client_access_routes.py"
    "/Users/rabab/the-genius-project/backend/add_client_access_tables.py"
    "/Users/rabab/the-genius-project/backend/setup_client_users.py"
    "/Users/rabab/the-genius-project/backend/truly_custom_content.py"
    "/Users/rabab/the-genius-project/backend/manual_migration.py"
    "/Users/rabab/the-genius-project/backend/add_content_files_table.py"
    "/Users/rabab/the-genius-project/backend/new_mock_content.py"
    "/Users/rabab/the-genius-project/backend/create_tables.py"
    "/Users/rabab/the-genius-project/backend/migrate_old_attachments.py"
    "/Users/rabab/the-genius-project/backend/migrate_client_access.py"
    "/Users/rabab/the-genius-project/backend/create_sample_content.py"
    "/Users/rabab/the-genius-project/backend/test_client_access.py"
    "/Users/rabab/the-genius-project/backend/competitor_api.py"
    "/Users/rabab/the-genius-project/data-deletion.html"
    "/Users/rabab/the-genius-project/test_routes.py"
)

for file in "${empty_files_to_delete[@]}"; do
    safe_delete "$file"
done

echo "2. Removing backup files..."

# Backup files
backup_files=(
    "/Users/rabab/the-genius-project/frontend/vercel.json.bak"
    "/Users/rabab/the-genius-project/backend/mongo_db.py.bak2"
    "/Users/rabab/the-genius-project/backend/app.py.bak2"
    "/Users/rabab/the-genius-project/backend/app.py.bak"
    "/Users/rabab/the-genius-project/backend/mongo_db.py.bak"
    "/Users/rabab/the-genius-project/backend/mongo_db.py.backup"
    "/Users/rabab/the-genius-project/now.json.bak"
)

for file in "${backup_files[@]}"; do
    safe_delete "$file"
done

echo "3. Removing DS_Store and cache files..."

# DS_Store and cache files
find /Users/rabab/the-genius-project \
    -name ".DS_Store" \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -delete 2>/dev/null || true

echo "4. Removing empty directories..."
cleanup_empty_dirs

echo "✅ Cleanup complete! Deleted $deleted_count files."
echo "⚠️  Note: This script did not touch node_modules, .git, llama.cpp, or venv directories for safety."
