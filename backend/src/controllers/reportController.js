import PDFDocument from 'pdfkit';
import Scan from '../models/Scan.js';
import logger from '../utils/logger.js';

/**
 * @route   GET /api/scan/:id/pdf
 * @desc    Generate a PDF report for a specific scan
 * @access  Private
 */
export const generateScanPDF = async (req, res, next) => {
  try {
    const scanId = req.params.id;
    const scan = await Scan.findOne({ _id: scanId, userId: req.user._id, isDeleted: false });

    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SentinelX_Report_${scanId}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // --- Header ---
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#00d4ff').text('SentinelX Security Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#64748b').text(`Generated: ${new Date().toUTCString()}`, { align: 'center' });
    doc.moveDown(2);

    // --- Scan Meta ---
    doc.fontSize(16).fillColor('#f8fafc').text('Scan Overview');
    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).lineWidth(1).stroke('#334155');
    doc.moveDown(1);
    
    doc.fontSize(12).fillColor('#e2e8f0');
    doc.text(`Scan ID:`, { continued: true }).font('Helvetica').text(` ${scan._id}`);
    doc.font('Helvetica-Bold').text(`Type:`, { continued: true }).font('Helvetica').text(` ${scan.type.toUpperCase()}`);
    doc.font('Helvetica-Bold').text(`Target:`, { continued: true }).font('Helvetica').text(` ${scan.target.substring(0, 80)}${scan.target.length > 80 ? '...' : ''}`);
    doc.font('Helvetica-Bold').text(`Date:`, { continued: true }).font('Helvetica').text(` ${scan.createdAt.toLocaleString()}`);
    
    doc.moveDown(2);

    // --- Results ---
    const result = scan.result || {};
    const riskColor = result.riskLevel === 'dangerous' || result.riskLevel === 'critical' ? '#ff3366' 
                    : result.riskLevel === 'suspicious' ? '#ffaa00' : '#00ff88';

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#f8fafc').text('Analysis Results');
    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).lineWidth(1).stroke('#334155');
    doc.moveDown(1);

    doc.fontSize(14).fillColor(riskColor).text(`Risk Level: ${result.riskLevel ? result.riskLevel.toUpperCase() : 'UNKNOWN'}`);
    doc.fontSize(12).fillColor('#e2e8f0').text(`Risk Score: ${result.riskScore ?? 'N/A'}/100`);
    doc.moveDown(1);

    if (result.aiExplanation) {
      doc.font('Helvetica-Bold').fillColor('#f8fafc').text('AI Explanation:');
      doc.font('Helvetica').fillColor('#94a3b8').text(result.aiExplanation);
      doc.moveDown(1.5);
    }

    // --- Threats Found ---
    if (result.threats && result.threats.length > 0) {
      doc.font('Helvetica-Bold').fillColor('#f8fafc').text('Threats Detected:');
      doc.moveDown(0.5);
      doc.font('Helvetica').fillColor('#94a3b8');
      result.threats.forEach(t => {
        doc.text(`• ${t}`);
      });
    } else {
      doc.font('Helvetica-Bold').fillColor('#00ff88').text('No direct threats detected.');
    }
    
    // --- Footer ---
    doc.moveDown(4);
    doc.fontSize(10).fillColor('#64748b').text('SentinelX AI-Powered Phishing Detection Engine', { align: 'center' });

    doc.end();

    logger.info(`PDF report generated for scan: ${scanId}`);
  } catch (error) {
    logger.error(`Error generating PDF: ${error.message}`);
    // Don't use next(error) since headers might be partially sent
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error generating PDF' });
    }
  }
};
