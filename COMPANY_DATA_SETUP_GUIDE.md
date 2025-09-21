# Company Data Processing Setup Guide

## Issues Fixed

### 1. Google Drive Download Error
**Problem**: "Export only supports Docs Editors files" error when downloading PDFs
**Solution**: The error occurs when trying to download Google Docs/Sheets files that were converted from PDFs. 

**Two solutions provided**:

1. **Fixed Original Workflow** (`Company_PDF_Importer_Fixed.json`):
   - Added `doNotConvert: true` option to prevent Google from converting PDFs
   - This should work for true PDF files

2. **Alternative HTTP Download** (`Company_PDF_Importer_HTTP_Download.json`):
   - Uses direct HTTP API call to download files
   - More reliable for various file types
   - **Recommended if the first approach fails**

### 2. Enhanced Database Structure
**Problem**: Only storing basic PDF data instead of comprehensive company information
**Solution**: Created new `company_data` table with complete company profile extraction

## New Database Schema

The new `company_data` table stores:
- **Company Information**: ID, name, folder location
- **Contact Details**: Websites, emails, phone numbers
- **Address Information**: Extracted physical addresses
- **File Metadata**: Size, processing timestamps
- **Full Content**: Complete extracted text for search

### Database Setup

1. **Run the SQL script**:
   ```sql
   -- Execute the create-company-data-table.sql file
   -- This creates the comprehensive company_data table
   ```

2. **Table Structure**:
   ```sql
   - company_id (unique identifier)
   - company_name (from folder name)
   - file_name, file_id, folder_id
   - content (full extracted text)
   - websites, primary_website
   - emails, primary_email  
   - phones, primary_phone
   - addresses, primary_address
   - file_size, content_length
   - processed_at, created_at, updated_at
   ```

## Data Extraction Features

The enhanced workflow now extracts:

### 🌐 **Websites**
- Finds all URLs in PDF content
- Sets primary website (first found)
- Stores all websites as comma-separated list

### 📧 **Email Addresses** 
- Extracts all email addresses
- Identifies primary contact email
- Useful for lead generation

### 📞 **Phone Numbers**
- Finds US phone number formats
- Extracts primary contact number
- Supports various formatting styles

### 🏠 **Addresses**
- Identifies street addresses
- Extracts complete address information
- Useful for location-based analysis

## Workflow Options

### Option 1: Use Fixed Original (Recommended First)
Import `Company_PDF_Importer_Fixed.json` and test

### Option 2: Use HTTP Download (If Option 1 Fails)
Import `Company_PDF_Importer_HTTP_Download.json`

## Testing Steps

1. **Import the workflow** into n8n
2. **Create the database table** using the SQL script
3. **Test with a new folder** containing PDF files
4. **Check the database** for extracted data

## Troubleshooting

### If you still get the "Export only supports Docs Editors files" error:
1. Check if your PDFs are actually Google Docs files
2. Try the HTTP download version
3. Verify your Google Drive OAuth2 credentials have proper permissions

### If extraction is missing data:
1. Check the PDF text quality (scanned vs text-based)
2. Review the regex patterns in the Function node
3. Test with different PDF formats

## Database Connection

Make sure your PostgreSQL connection in n8n points to the correct:
- Host, port, database name
- Username and password
- The new `company_data` table (not `pdf_data`)

## Next Steps

1. Import one of the workflow files
2. Run the database creation script
3. Test with a new company folder
4. Monitor the logs for successful data extraction
5. Query the database to verify all information is captured

Let me know if you need help with any of these steps!
