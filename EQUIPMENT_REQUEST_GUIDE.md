# Equipment Request User Guide

## How to Request Equipment as a Normal User

### Step-by-Step Instructions:

1. **Access the Equipment Request System**
   - Log into your account at http://localhost:3000
   - From the Dashboard, click on **"Request Equipment"** (📋 icon)
   - This will take you to the Equipment Request page

2. **Browse Available Equipment**
   - The page opens on the "Browse Equipment" tab by default
   - Use the search bar to find specific equipment by name or category
   - Use the category filter dropdown to narrow down by equipment type
   - Each equipment card shows:
     - Item name and category
     - Unique ID (auto-generated like CAM001, COM001, AUD001)
     - Available quantity
     - Special instructions (if any)

3. **Add Equipment to Your Request**
   - Click **"+ Add to Request"** on any equipment you need
   - The button will change to **"✓ Added"** to confirm
   - Selected equipment appears in the "Selected Equipment" section below

4. **Configure Your Request**
   - For each selected item:
     - Set the quantity needed (up to available amount)
     - Add item-specific notes (optional)
     - Remove items with the "✕" button if needed

5. **Fill Out Request Details**
   - **Your Name**: Pre-filled with your account name
   - **Project**: Select from existing projects or create a new one
   - **Pickup Time**: When you need the equipment
   - **Expected Return**: When you'll return the equipment
   - **Additional Notes**: Any special requirements

6. **Submit Your Request**
   - Click **"Submit Request"** 
   - You'll see a confirmation message
   - Your request is now pending approval

7. **Track Your Requests**
   - Switch to the **"My Requests"** tab
   - View all your current and past requests
   - See status updates:
     - **Pending Approval**: Waiting for approval
     - **Approved**: Ready for pickup
     - **Rejected**: Not approved (with admin notes)
     - **Checked Out**: Currently in use
     - **Returned**: Request completed

### Key Features:

✅ **Automatic Unique IDs**: Equipment IDs are generated automatically (no manual entry needed)
✅ **Real-time Availability**: Only available equipment is shown
✅ **Project Management**: Create new projects on-the-fly
✅ **Request Tracking**: Monitor all your requests in one place
✅ **Smart Validation**: Prevents over-requesting available quantity

### Tips for Users:

- **Plan Ahead**: Submit requests well before your pickup time
- **Be Specific**: Use the notes fields to explain special needs
- **Check Return Dates**: Make sure return dates are realistic
- **Create Projects**: Organize equipment by project for better tracking

### Admin vs User Access:

- **Normal Users**: Can only request equipment and view their own requests
- **Admins**: Have full equipment management access including:
  - Equipment registration and editing
  - Request approval/rejection
  - Inventory management
  - System reporting

### Need Help?

Contact your system administrator if you:
- Can't find specific equipment
- Need special approval for extended rentals
- Have issues with the request system
- Need equipment that's not in the system

---

## Technical Details (For Developers):

### Unique ID Generation:
- Format: `[CATEGORY_PREFIX][NUMBER]` (e.g., CAM001, COM001, AUD001)
- Automatically generated on equipment creation
- Sequential numbering per category
- Guaranteed uniqueness through database validation

### Request Workflow:
1. User submits request via `/equipment-request` page
2. Request stored with "Pending Approval" status
3. Admin reviews via `/equipment` (admin panel)
4. Admin approves/rejects with optional notes
5. User notified of status change
6. Equipment checked out when ready
7. Return logged when equipment returned

### API Endpoints Used:
- `GET /api/equipment` - Browse available equipment
- `GET /api/equipment/projects` - Get projects list
- `POST /api/equipment/projects` - Create new project
- `POST /api/equipment/checkout` - Submit equipment request
- `GET /api/equipment/checkout` - Get user's requests

The system ensures data integrity and provides a smooth user experience for equipment management!
