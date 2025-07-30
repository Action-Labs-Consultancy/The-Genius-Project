#!/usr/bin/env python3
import re

# Read the file
with open('/Users/rabab/the-genius-project/backend/app.py', 'r') as f:
    content = f.read()

# Fix the problematic section
old_pattern = r'''                    dm_channel = MongoChannel\.create_channel\(dm_name, True, member_ids, organizer_id\)
                    'send_message',
                    \{
                        'channel_id': channel_id,
                        'user_id': 'system',
                        'content': f'You have been invited to a meeting: "\{title\}" from \{start_time\} to \{end_time\}\.',
                        'name': 'System',
                        'parent_message_id': None
                    \}
                \)'''

new_text = '''                    dm_channel = MongoChannel.create_channel(dm_name, True, member_ids, organizer_id)
                
                channel_id = dm_channel.get('_id')
                # Send notification message about meeting invitation
                MongoMessage.create_message(
                    channel_id=channel_id,
                    user_id='system',
                    content=f'You have been invited to a meeting: "{title}" from {start_time} to {end_time}.',
                    name='System',
                    parent_message_id=None
                )'''

# Replace the problematic section
content = re.sub(old_pattern, new_text, content, flags=re.MULTILINE)

# Write back to file
with open('/Users/rabab/the-genius-project/backend/app.py', 'w') as f:
    f.write(content)

print("Fixed the syntax error in app.py")
