const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'PDF Converter',
        timestamp: new Date().toISOString(),
        puppeteer: 'ready'
    });
});

// Convert HTML/Markdown to PDF
app.post('/convert', async (req, res) => {
    let browser = null;
    
    try {
        const { content, type = 'html', filename = 'document.pdf', options = {} } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        
        console.log(`📄 Converting ${type} to PDF: ${filename}`);
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        // Convert content based on type
        let htmlContent = content;
        if (type === 'markdown') {
            // Simple markdown to HTML conversion for basic formatting
            htmlContent = convertMarkdownToHTML(content);
        }
        
        // Add professional styling
        const styledHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${filename}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    background: white;
                }
                h1 { 
                    color: #2c3e50; 
                    border-bottom: 3px solid #3498db;
                    padding-bottom: 10px;
                    font-size: 2.2em;
                }
                h2 { 
                    color: #34495e; 
                    margin-top: 30px;
                    font-size: 1.8em;
                }
                h3 { 
                    color: #34495e; 
                    margin-top: 25px;
                    font-size: 1.4em;
                }
                .section { 
                    margin-bottom: 30px; 
                    padding: 20px;
                    border-left: 4px solid #3498db;
                    background-color: #f8f9fa;
                }
                .meta { 
                    background: #ecf0f1; 
                    padding: 15px; 
                    border-radius: 5px;
                    margin: 20px 0;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0;
                }
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 12px; 
                    text-align: left;
                }
                th { 
                    background-color: #3498db; 
                    color: white;
                    font-weight: bold;
                }
                tr:nth-child(even) { 
                    background-color: #f2f2f2;
                }
                .approval-status {
                    display: inline-block;
                    padding: 5px 10px;
                    border-radius: 3px;
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 0.9em;
                }
                .approved { background: #2ecc71; color: white; }
                .rejected { background: #e74c3c; color: white; }
                .pending { background: #f39c12; color: white; }
                .page-break { page-break-before: always; }
                @media print {
                    body { margin: 0; padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>`;
        
        // Set content and generate PDF
        await page.setContent(styledHTML, { waitUntil: 'networkidle0' });
        
        const pdfOptions = {
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            displayHeaderFooter: true,
            headerTemplate: `<div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
                <span style="float: left; margin-left: 15mm;">${filename}</span>
                <span style="float: right; margin-right: 15mm;">Generated: ${new Date().toLocaleDateString()}</span>
            </div>`,
            footerTemplate: `<div style="font-size: 10px; width: 100%; text-align: center; color: #666; margin: 0 15mm;">
                Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            </div>`,
            ...options
        };
        
        const pdfBuffer = await page.pdf(pdfOptions);
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        console.log(`✅ PDF generated successfully: ${filename} (${pdfBuffer.length} bytes)`);
        
        // Send PDF
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('❌ PDF conversion error:', error);
        res.status(500).json({ 
            error: 'PDF conversion failed',
            message: error.message 
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Simple markdown to HTML converter
function convertMarkdownToHTML(markdown) {
    return markdown
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/<li>/g, '<ul><li>')
        .replace(/<\/li>/g, '</li></ul>')
        .replace(/<\/ul><ul>/g, '');
}

// Test endpoint
app.post('/test', async (req, res) => {
    try {
        const testHTML = `
        <h1>🧪 PDF Converter Test</h1>
        <div class="section">
            <h2>Service Status</h2>
            <p>✅ PDF Converter is working properly!</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
        <div class="section">
            <h2>Features</h2>
            <ul>
                <li>HTML to PDF conversion</li>
                <li>Markdown to PDF conversion</li>
                <li>Professional styling</li>
                <li>Header/footer support</li>
                <li>Custom page options</li>
            </ul>
        </div>`;
        
        const testContent = {
            content: testHTML,
            type: 'html',
            filename: 'test-document.pdf'
        };
        
        // Forward to convert endpoint
        req.body = testContent;
        return app._router.handle(req, res);
        
    } catch (error) {
        res.status(500).json({ error: 'Test failed', message: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('🔄 PDF Converter Service starting...');
    console.log(`📄 Running on http://localhost:${PORT}`);
    console.log('📋 Endpoints:');
    console.log('   POST /convert - Convert HTML/Markdown to PDF');
    console.log('   POST /test - Generate test PDF');
    console.log('   GET /health - Health check');
    console.log('💚 Ready to convert documents to PDF!');
});

module.exports = app;
