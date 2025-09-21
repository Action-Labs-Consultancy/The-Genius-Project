const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json({ limit: '10mb' }));

app.post('/pdf-convert', async (req, res) => {
    try {
        const { html, options = {} } = req.body;
        
        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Launch puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set content
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Generate PDF
        const pdfOptions = {
            format: options.format || 'A4',
            margin: options.margin || {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            printBackground: true,
            displayHeaderFooter: false
        };
        
        const pdfBuffer = await page.pdf(pdfOptions);
        
        await browser.close();
        
        // Send PDF as response
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': 'attachment; filename="report.pdf"'
        });
        
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'PDF Converter' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔄 PDF Converter Service running on http://localhost:${PORT}`);
    console.log(`📄 Endpoint: POST /pdf-convert`);
    console.log(`💚 Health: GET /health`);
});

module.exports = app;
