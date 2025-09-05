import jsPDF from 'jspdf';
import { AssessmentData } from '@/types/assessment';
import { StaticFlowRenderer } from './staticFlowRenderer';
import { mapConfigToNodes } from './mapConfigToNodes';

export const generateAssessmentReport = async (data: AssessmentData, appConfig?: any): Promise<Blob> => {
  // Create landscape PDF (11" x 8.5")
  const pdf = new jsPDF('landscape', 'pt', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  let yPosition = 80;

  // === COVER PAGE ===
  // Header gradient background
  pdf.setFillColor(36, 108, 255); // MaintainX Blue
  pdf.rect(0, 0, pageWidth, 100, 'F');
  
  // Main title
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(32);
  pdf.text('MaintainX Integration Assessment', 60, 50);
  
  // Subtitle
  pdf.setFontSize(16);
  pdf.text('Technology Ecosystem Analysis & Recommendations', 60, 75);
  
  // === EXECUTIVE DASHBOARD ===
  yPosition = 140;
  pdf.setTextColor(55, 65, 81); // Text Gray
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('Executive Summary', 60, yPosition);
  
  yPosition += 40;
  
  // Key metrics boxes
  const metrics = [
    { label: 'Integrations Found', value: data.scorecard.integrationsFound.toString(), color: [36, 108, 255] },
    { label: 'Compatibility Score', value: `${data.scorecard.compatibilityPercent}%`, color: [46, 216, 136] },
    { label: 'Goals Supported', value: data.scorecard.goalsMatched.toString(), color: [255, 169, 69] }
  ];
  
  const boxWidth = 160;
  const boxHeight = 80;
  const boxSpacing = 40;
  const startX = 60;
  
  metrics.forEach((metric, index) => {
    const x = startX + (index * (boxWidth + boxSpacing));
    
    // Box background
    pdf.setFillColor(248, 250, 255); // Light blue
    pdf.rect(x, yPosition, boxWidth, boxHeight, 'F');
    
    // Box border
    pdf.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
    pdf.setLineWidth(2);
    pdf.rect(x, yPosition, boxWidth, boxHeight);
    
    // Value
    pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(36);
    pdf.text(metric.value, x + boxWidth / 2, yPosition + 35, { align: 'center' });
    
    // Label
    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.text(metric.label, x + boxWidth / 2, yPosition + 55, { align: 'center' });
  });
  
  yPosition += 120;
  
  // Company details
  pdf.setTextColor(55, 65, 81);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  
  const companyDetails = [
    `Assessment Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    `Assessment Type: ${data.mode === 'quick' ? 'Quick Assessment' : 'Advanced Assessment'}`,
    `Company Size: ${data.company.size.charAt(0).toUpperCase() + data.company.size.slice(1)}`,
    `Industry: ${data.company.industry}`,
    `Complexity Level: ${data.scorecard.complexity}`
  ];
  
  companyDetails.forEach(line => {
    pdf.text(line, 60, yPosition);
    yPosition += 25;
  });
  
  // === NEW PAGE: INTEGRATION ARCHITECTURE ===
  pdf.addPage();
  yPosition = 80;
  
  // Page header
  pdf.setFillColor(36, 108, 255);
  pdf.rect(0, 0, pageWidth, 60, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('Integration Architecture', 60, 35);
  
  // Generate and embed static flow diagram
  if (appConfig) {
    try {
      const flowRenderer = new StaticFlowRenderer();
      const nodes = mapConfigToNodes(appConfig, data);
      const diagramDataUrl = await flowRenderer.generateStaticFlowDiagram(nodes, 680, 380);
      
      // Add diagram to PDF with proper centering
      const imgData = diagramDataUrl.split(',')[1]; // Remove data:image/png;base64, prefix
      const imgX = (pageWidth - 680) / 2; // Center the image
      pdf.addImage(imgData, 'PNG', imgX, yPosition, 680, 380);
      yPosition += 420; // Move past the diagram
      
      // Check if we need a new page
      if (yPosition > pageHeight - 200) {
        pdf.addPage();
        yPosition = 60;
      }
    } catch (error) {
      console.warn('Could not generate flow diagram:', error);
      // Fallback text
      pdf.setTextColor(55, 65, 81);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(14);
      pdf.text('Integration architecture diagram could not be generated.', 60, yPosition);
      yPosition += 40;
    }
  }
  
  // === TECHNOLOGY ECOSYSTEM ===
  // Ensure proper spacing before this section
  yPosition += 30;
  
  pdf.setTextColor(0, 30, 64); // Hydraulic Blue
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('Your Technology Ecosystem', 60, yPosition);
  yPosition += 40;
  
  pdf.setTextColor(55, 65, 81);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  
  // Helper function to check page space and add new page if needed
  const checkPageSpace = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 60) {
      pdf.addPage();
      yPosition = 60;
      return true;
    }
    return false;
  };
  
  // ERP Systems
  if (data.integrations.erp) {
    checkPageSpace(80);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(36, 108, 255);
    pdf.text('ERP Systems', 60, yPosition);
    yPosition += 25;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(55, 65, 81);
    pdf.text(`• ${data.integrations.erp.brand}`, 80, yPosition);
    yPosition += 18;
    
    if (data.integrations.erp.environment) {
      pdf.text(`  Environment: ${data.integrations.erp.environment}`, 100, yPosition);
      yPosition += 18;
    }
    yPosition += 20;
  }
  
  // Sensors & Monitoring
  if (data.integrations.sensorsMonitoring.length > 0) {
    const activeSensors = data.integrations.sensorsMonitoring.filter(
      sensor => sensor.brand !== 'None' && sensor.brand !== 'Not sure'
    );
    
    if (activeSensors.length > 0) {
      checkPageSpace(60 + (activeSensors.length * 20));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(46, 216, 136); // Safety Green
      pdf.text('Sensors & Monitoring Systems', 60, yPosition);
      yPosition += 25;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(55, 65, 81);
      
      activeSensors.forEach(sensor => {
        pdf.text(`• ${sensor.brand} (${sensor.category})`, 80, yPosition);
        yPosition += 18;
      });
      yPosition += 20;
    }
  }
  
  // Automation & SCADA
  if (data.integrations.automationScada.length > 0) {
    const activeAutomation = data.integrations.automationScada.filter(
      automation => automation.brand !== 'None' && automation.brand !== 'Not sure'
    );
    
    if (activeAutomation.length > 0) {
      checkPageSpace(60 + (activeAutomation.length * 20));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 169, 69); // Safety Orange
      pdf.text('Automation & SCADA Systems', 60, yPosition);
      yPosition += 25;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(55, 65, 81);
      
      activeAutomation.forEach(automation => {
        pdf.text(`• ${automation.brand} (${automation.type})`, 80, yPosition);
        yPosition += 18;
      });
      yPosition += 20;
    }
  }
  
  // === NEW PAGE: RECOMMENDATIONS ===
  pdf.addPage();
  yPosition = 60;
  
  // Page header
  pdf.setFillColor(0, 30, 64); // Hydraulic Blue
  pdf.rect(0, 0, pageWidth, 60, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('Recommendations & Next Steps', 60, 35);
  
  // Goals section
  yPosition = 100;
  pdf.setTextColor(36, 108, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('Your Maintenance Goals', 60, yPosition);
  yPosition += 35;
  
  pdf.setTextColor(55, 65, 81);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  
  data.goals.forEach(goal => {
    pdf.text(`✓ ${goal}`, 80, yPosition);
    yPosition += 20;
  });
  
  yPosition += 30;
  
  // Recommendations
  pdf.setTextColor(46, 216, 136);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('Recommended Implementation Approach', 60, yPosition);
  yPosition += 35;
  
  pdf.setTextColor(55, 65, 81);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  
  const recommendations = [
    'Phase 1: Core CMMS Implementation (Weeks 1-4)',
    '• Set up MaintainX workspace and user accounts',
    '• Configure asset hierarchy and basic work order workflows',
    '• Train frontline maintenance teams on mobile app usage',
    '',
    'Phase 2: System Integrations (Weeks 5-8)',
    '• Connect ERP system for asset and inventory data sync',
    '• Integrate condition monitoring sensors for predictive maintenance',
    '• Set up automated work order creation from sensor alerts',
    '',
    'Phase 3: Advanced Analytics (Weeks 9-12)',
    '• Configure KPI dashboards and reporting',
    '• Implement preventive maintenance scheduling',
    '• Enable advanced analytics and trend monitoring'
  ];
  
  recommendations.forEach(rec => {
    if (rec.startsWith('Phase')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(36, 108, 255);
    } else if (rec.startsWith('•')) {
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
    } else if (rec === '') {
      yPosition += 10;
      return;
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
    }
    
    pdf.text(rec, 80, yPosition);
    yPosition += 18;
  });
  
  // CTA Section
  yPosition += 30;
  pdf.setFillColor(255, 169, 69); // Safety Orange
  pdf.rect(60, yPosition, 500, 100, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('Ready to Get Started?', 80, yPosition + 30);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.text('Schedule a demo to see how MaintainX can transform', 80, yPosition + 50);
  pdf.text('your maintenance operations.', 80, yPosition + 70);
  
  // Closing page with attribution (instead of footer on every page)
  pdf.addPage();
  let closingY = 120;
  pdf.setTextColor(0, 30, 64);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('Report Summary & Credits', 60, closingY);
  
  closingY += 30;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(55, 65, 81);
  pdf.text('This report was generated by the MaintainX Integration Assessment Tool.', 60, closingY);
  closingY += 20;
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 60, closingY);
  
  // Minimal footer: page numbers only on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    const footerY = pageHeight - 30;
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 100, footerY);
  }
  
  return pdf.output('blob');
};
