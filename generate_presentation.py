"""Generate a presentation PDF about pdf-creator and pdfa-generator."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Frame, PageTemplate, BaseDocTemplate, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus.flowables import HRFlowable
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Line
from reportlab.graphics import renderPDF

# Colors
PRIMARY = HexColor("#1a56db")
PRIMARY_DARK = HexColor("#1040a0")
ACCENT = HexColor("#059669")
ACCENT_LIGHT = HexColor("#d1fae5")
BG_LIGHT = HexColor("#f0f5ff")
BG_DARK = HexColor("#1e293b")
TEXT_DARK = HexColor("#1e293b")
TEXT_MUTED = HexColor("#64748b")
ORANGE = HexColor("#ea580c")
PURPLE = HexColor("#7c3aed")
BORDER_LIGHT = HexColor("#e2e8f0")

W, H = A4


class PresentationDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(25*mm, 20*mm, W - 50*mm, H - 45*mm, id='normal')
        self.addPageTemplates([PageTemplate(id='normal', frames=frame, onPage=self._draw_page)])
        self.page_count = 0

    def _draw_page(self, canvas, doc):
        canvas.saveState()
        # Header line
        canvas.setStrokeColor(PRIMARY)
        canvas.setLineWidth(2)
        canvas.line(25*mm, H - 18*mm, W - 25*mm, H - 18*mm)

        # Footer
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(TEXT_MUTED)
        canvas.drawString(25*mm, 12*mm, "pdf-creator & pdfa-generator")
        canvas.drawRightString(W - 25*mm, 12*mm, f"Page {doc.page}")

        canvas.restoreState()


def build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        'SlideTitle', fontSize=26, leading=32, textColor=PRIMARY_DARK,
        fontName='Helvetica-Bold', spaceAfter=6*mm, alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        'SlideSubtitle', fontSize=14, leading=18, textColor=TEXT_MUTED,
        fontName='Helvetica', spaceAfter=8*mm,
    ))
    styles.add(ParagraphStyle(
        'SectionHeader', fontSize=13, leading=17, textColor=PRIMARY,
        fontName='Helvetica-Bold', spaceBefore=5*mm, spaceAfter=3*mm,
    ))
    styles.add(ParagraphStyle(
        'Body', fontSize=11, leading=16, textColor=TEXT_DARK,
        fontName='Helvetica', spaceAfter=3*mm, alignment=TA_JUSTIFY,
    ))
    styles.add(ParagraphStyle(
        'BulletItem', fontSize=11, leading=16, textColor=TEXT_DARK,
        fontName='Helvetica', leftIndent=8*mm, bulletIndent=2*mm,
        spaceAfter=2*mm, bulletFontName='Helvetica', bulletFontSize=11,
    ))
    styles.add(ParagraphStyle(
        'BulletBold', fontSize=11, leading=16, textColor=TEXT_DARK,
        fontName='Helvetica-Bold', leftIndent=8*mm, bulletIndent=2*mm,
        spaceAfter=2*mm, bulletFontName='Helvetica', bulletFontSize=11,
    ))
    styles.add(ParagraphStyle(
        'CoverTitle', fontSize=36, leading=44, textColor=white,
        fontName='Helvetica-Bold', alignment=TA_CENTER, spaceAfter=6*mm,
    ))
    styles.add(ParagraphStyle(
        'CoverSubtitle', fontSize=16, leading=22, textColor=HexColor("#cbd5e1"),
        fontName='Helvetica', alignment=TA_CENTER, spaceAfter=3*mm,
    ))
    styles.add(ParagraphStyle(
        'SmallNote', fontSize=9, leading=13, textColor=TEXT_MUTED,
        fontName='Helvetica-Oblique', spaceAfter=2*mm,
    ))
    styles.add(ParagraphStyle(
        'TableCell', fontSize=10, leading=14, textColor=TEXT_DARK,
        fontName='Helvetica',
    ))
    styles.add(ParagraphStyle(
        'TableHeader', fontSize=10, leading=14, textColor=white,
        fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        'BigNumber', fontSize=40, leading=44, textColor=PRIMARY,
        fontName='Helvetica-Bold', alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'Caption', fontSize=10, leading=14, textColor=TEXT_MUTED,
        fontName='Helvetica', alignment=TA_CENTER, spaceAfter=2*mm,
    ))
    return styles


def cover_page(story, styles):
    """Page 1: Cover page."""
    # We'll use spacers and colored table backgrounds to simulate a cover
    story.append(Spacer(1, 30*mm))

    # Title block as a colored table
    title_data = [
        [Paragraph("pdf-creator<br/>&amp; pdfa-generator", styles['CoverTitle'])],
        [Spacer(1, 4*mm)],
        [Paragraph("A Full-Stack PDF Generation Platform", styles['CoverSubtitle'])],
        [Spacer(1, 3*mm)],
        [Spacer(1, 1*mm)],
    ]
    title_table = Table(title_data, colWidths=[W - 60*mm])
    title_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_DARK),
        ('TOPPADDING', (0, 0), (-1, 0), 20*mm),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 15*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 10*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10*mm),
        ('ROUNDEDCORNERS', [4*mm, 4*mm, 4*mm, 4*mm]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(title_table)

    story.append(Spacer(1, 15*mm))
    story.append(Paragraph(
        "Next.js + React PDF  |  Java + Apache PDFBox  |  Docker Compose",
        ParagraphStyle('TechLine', parent=styles['Caption'], fontSize=11, textColor=PRIMARY)
    ))
    story.append(PageBreak())


def real_life_desires_page(story, styles):
    """Page 2: Real Life Desires — Why PDF generation matters."""
    story.append(Paragraph("Real Life Desires", styles['SlideTitle']))
    story.append(Paragraph("Why do organizations need programmatic PDF generation?", styles['SlideSubtitle']))

    scenarios = [
        ("<b>Invoices &amp; Financial Documents</b> — Finance teams need to generate hundreds of invoices monthly with consistent branding, dynamic data, and legal compliance.",),
        ("<b>Regulatory &amp; Archival Compliance</b> — Government and enterprise regulations (e.g., EU e-invoicing, ISO 19005) require PDF/A archival format with embedded fonts and metadata.",),
        ("<b>Reports &amp; Dashboards</b> — Stakeholders want periodic PDF reports with charts, KPI cards, and data tables — without manual copy-paste from spreadsheets.",),
        ("<b>Certificates &amp; Contracts</b> — HR and legal teams issue certificates, NDAs, and agreements that must be digitally signed and tamper-proof.",),
        ("<b>Batch Document Generation</b> — Operations need to stamp out hundreds of personalized documents (letters, labels, badges) from a single template and a CSV file.",),
        ("<b>Secure Distribution</b> — Sensitive documents require password encryption and controlled permissions before sharing.",),
    ]
    for s in scenarios:
        story.append(Paragraph(s[0], styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 6*mm))
    # Highlight box
    highlight = Table(
        [[Paragraph(
            "<b>The gap:</b> Most teams either hand-craft PDFs in Word/InDesign (slow, error-prone) "
            "or write fragile code with low-level PDF libraries (high maintenance, no visual editing). "
            "We need a platform that bridges visual design with programmatic generation.",
            ParagraphStyle('HighlightBody', parent=styles['Body'], textColor=PRIMARY_DARK)
        )]],
        colWidths=[W - 60*mm],
    )
    highlight.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 4*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 5*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5*mm),
        ('ROUNDEDCORNERS', [3*mm, 3*mm, 3*mm, 3*mm]),
        ('BOX', (0, 0), (-1, -1), 1, PRIMARY),
    ]))
    story.append(highlight)
    story.append(PageBreak())


def overview_page(story, styles):
    """Page 3: Platform Overview."""
    story.append(Paragraph("Platform Overview", styles['SlideTitle']))
    story.append(Paragraph("Two services, one unified template format", styles['SlideSubtitle']))

    # Architecture table
    arch_data = [
        [Paragraph("", styles['TableHeader']),
         Paragraph("pdf-creator", styles['TableHeader']),
         Paragraph("pdfa-generator", styles['TableHeader'])],
        [Paragraph("<b>Role</b>", styles['TableCell']),
         Paragraph("Visual editor + PDF renderer", styles['TableCell']),
         Paragraph("Advanced PDF processing", styles['TableCell'])],
        [Paragraph("<b>Tech Stack</b>", styles['TableCell']),
         Paragraph("Next.js 16, React 19,<br/>@react-pdf/renderer, ECharts", styles['TableCell']),
         Paragraph("Java 17, Apache PDFBox 3,<br/>BouncyCastle 1.79", styles['TableCell'])],
        [Paragraph("<b>Port</b>", styles['TableCell']),
         Paragraph("3000", styles['TableCell']),
         Paragraph("8090", styles['TableCell'])],
        [Paragraph("<b>Deployment</b>", styles['TableCell']),
         Paragraph("Docker / npm run dev", styles['TableCell']),
         Paragraph("Docker / java -jar", styles['TableCell'])],
        [Paragraph("<b>Test Coverage</b>", styles['TableCell']),
         Paragraph(">90% (Jest)", styles['TableCell']),
         Paragraph(">95% (JUnit + JaCoCo)", styles['TableCell'])],
    ]
    arch_table = Table(arch_data, colWidths=[35*mm, 55*mm, 55*mm])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('BACKGROUND', (0, 1), (0, -1), BG_LIGHT),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3*mm),
    ]))
    story.append(arch_table)

    story.append(Spacer(1, 6*mm))
    story.append(Paragraph("How They Work Together", styles['SectionHeader']))
    story.append(Paragraph(
        "Both services consume the <b>same JSON template format</b>. "
        "pdf-creator provides the visual editor and client-side rendering. "
        "When advanced features are needed (PDF/A conversion, digital signatures, encryption), "
        "pdf-creator delegates to pdfa-generator via HTTP.",
        styles['Body']
    ))

    story.append(Spacer(1, 4*mm))
    # Flow diagram as text
    flow_data = [
        [Paragraph("<b>User</b><br/>designs template<br/>in browser", styles['Caption']),
         Paragraph("\u27a1", ParagraphStyle('Arrow', fontSize=20, alignment=TA_CENTER, textColor=PRIMARY)),
         Paragraph("<b>pdf-creator</b><br/>renders PDF<br/>(React PDF)", styles['Caption']),
         Paragraph("\u27a1", ParagraphStyle('Arrow', fontSize=20, alignment=TA_CENTER, textColor=PRIMARY)),
         Paragraph("<b>pdfa-generator</b><br/>PDF/A, sign,<br/>encrypt", styles['Caption']),
         Paragraph("\u27a1", ParagraphStyle('Arrow', fontSize=20, alignment=TA_CENTER, textColor=PRIMARY)),
         Paragraph("<b>Final PDF</b><br/>compliant &amp;<br/>secured", styles['Caption'])],
    ]
    flow_table = Table(flow_data, colWidths=[28*mm, 10*mm, 28*mm, 10*mm, 28*mm, 10*mm, 28*mm])
    flow_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOX', (0, 0), (0, 0), 1, PRIMARY),
        ('BOX', (2, 0), (2, 0), 1, PRIMARY),
        ('BOX', (4, 0), (4, 0), 1, ACCENT),
        ('BOX', (6, 0), (6, 0), 1, PRIMARY_DARK),
        ('BACKGROUND', (0, 0), (0, 0), BG_LIGHT),
        ('BACKGROUND', (2, 0), (2, 0), BG_LIGHT),
        ('BACKGROUND', (4, 0), (4, 0), ACCENT_LIGHT),
        ('BACKGROUND', (6, 0), (6, 0), BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
    ]))
    story.append(flow_table)

    story.append(PageBreak())


def features_editor_page(story, styles):
    """Page 4: pdf-creator — Visual Editor Features."""
    story.append(Paragraph("pdf-creator: Visual Editor", styles['SlideTitle']))
    story.append(Paragraph("WYSIWYG template design in the browser", styles['SlideSubtitle']))

    story.append(Paragraph("Core Editing Capabilities", styles['SectionHeader']))
    bullets = [
        "Drag-and-drop canvas with multi-page support and page navigator",
        "Undo / Redo with full version history and auto-save",
        "Copy, paste, and duplicate elements across pages",
        "Alignment and distribution tools for multi-element selections",
        "Page size selection: A4, A3, A5",
        "Header, body, and footer sections per page",
    ]
    for b in bullets:
        story.append(Paragraph(b, styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph("11 Element Types", styles['SectionHeader']))

    elem_data = [
        [Paragraph("<b>Element</b>", styles['TableHeader']),
         Paragraph("<b>Description</b>", styles['TableHeader'])],
        [Paragraph("Text / Heading", styles['TableCell']),
         Paragraph("Rich text with bold, italic, underline, strikethrough, super/subscript, list styles", styles['TableCell'])],
        [Paragraph("Link", styles['TableCell']),
         Paragraph("Clickable hyperlinks with href targets", styles['TableCell'])],
        [Paragraph("Image", styles['TableCell']),
         Paragraph("Upload or URL-based, with compression (JPEG quality + DPI)", styles['TableCell'])],
        [Paragraph("Divider", styles['TableCell']),
         Paragraph("Horizontal lines with color and thickness options", styles['TableCell'])],
        [Paragraph("Table", styles['TableCell']),
         Paragraph("Manual rows or Auto CSV mode for dynamic data binding", styles['TableCell'])],
        [Paragraph("Card", styles['TableCell']),
         Paragraph("KPI metric cards: title, value, unit, subtitle, accent color", styles['TableCell'])],
        [Paragraph("Chart", styles['TableCell']),
         Paragraph("ECharts integration — line, bar, pie, scatter, heatmap, etc.", styles['TableCell'])],
        [Paragraph("Shape", styles['TableCell']),
         Paragraph("7 types: rectangle, circle, line, triangle, diamond, arrow, heart", styles['TableCell'])],
        [Paragraph("Repeater", styles['TableCell']),
         Paragraph("Template card stamped out per data item (CSV or JSON array)", styles['TableCell'])],
        [Paragraph("Placeholder", styles['TableCell']),
         Paragraph("Dynamic {{token}} insertion — resolved at export time", styles['TableCell'])],
        [Paragraph("Custom Fonts", styles['TableCell']),
         Paragraph("Upload WOFF fonts or use 9 bundled families (32 font files)", styles['TableCell'])],
    ]
    elem_table = Table(elem_data, colWidths=[30*mm, W - 80*mm])
    elem_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 2.5*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2.5*mm),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, BG_LIGHT]),
    ]))
    story.append(elem_table)

    story.append(PageBreak())


def features_dynamic_page(story, styles):
    """Page 5: pdf-creator — Dynamic Data & Templates."""
    story.append(Paragraph("pdf-creator: Dynamic Data", styles['SlideTitle']))
    story.append(Paragraph("Placeholders, CSV binding, repeaters, and charts", styles['SlideSubtitle']))

    story.append(Paragraph("Placeholder System", styles['SectionHeader']))
    story.append(Paragraph(
        "Text elements support <b>{{placeholder}}</b> tokens that are resolved at export time. "
        "Special tokens include <b>{{page_number}}</b> and <b>{{total_pages}}</b>. "
        "Placeholders work across all text elements including headers, footers, and table cells.",
        styles['Body']
    ))

    story.append(Paragraph("CSV Data Binding", styles['SectionHeader']))
    story.append(Paragraph(
        "Tables can be set to <b>Auto CSV mode</b>: at export time, upload a CSV file and the table "
        "automatically populates with rows. Combined with repeaters, this enables batch document generation "
        "from external data sources.",
        styles['Body']
    ))

    story.append(Paragraph("Repeater Elements", styles['SectionHeader']))
    story.append(Paragraph(
        "A repeater defines a visual card template that gets stamped once per data item. "
        "Each card's fields are mapped to columns in the data source. "
        "Use cases: employee directories, sensor dashboards, product catalogs.",
        styles['Body']
    ))

    story.append(Paragraph("Data Visualization with ECharts", styles['SectionHeader']))
    story.append(Paragraph(
        "Chart elements accept full <b>ECharts option objects</b> — supporting line, bar, pie, scatter, "
        "heatmap, and more. Charts are rendered server-side to PNG for PDF embedding. "
        "Live preview in the editor lets you iterate on chart configuration visually.",
        styles['Body']
    ))

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph("18 Built-in Templates", styles['SectionHeader']))

    tmpl_data = [
        [Paragraph("<b>Category</b>", styles['TableHeader']),
         Paragraph("<b>Templates</b>", styles['TableHeader'])],
        [Paragraph("Business", styles['TableCell']),
         Paragraph("Invoice, Purchase Order, Quotation, Project Proposal", styles['TableCell'])],
        [Paragraph("Reports", styles['TableCell']),
         Paragraph("Annual Report (7 pages), Monthly Sensor Report, Chart Showcase", styles['TableCell'])],
        [Paragraph("Data-Driven", styles['TableCell']),
         Paragraph("Employee Directory (CSV), IoT Sensor Dashboard (KPI cards)", styles['TableCell'])],
        [Paragraph("HR / Legal", styles['TableCell']),
         Paragraph("Professional CV, Cover Letter, Certificate, NDA / Contract", styles['TableCell'])],
        [Paragraph("Academic", styles['TableCell']),
         Paragraph("Research Paper, Lesson Plan", styles['TableCell'])],
        [Paragraph("Other", styles['TableCell']),
         Paragraph("Meeting Minutes, Event Invitation, Travel Itinerary", styles['TableCell'])],
    ]
    tmpl_table = Table(tmpl_data, colWidths=[30*mm, W - 80*mm])
    tmpl_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3*mm),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, ACCENT_LIGHT]),
    ]))
    story.append(tmpl_table)

    story.append(PageBreak())


def features_export_page(story, styles):
    """Page 6: pdf-creator — Export & Sharing."""
    story.append(Paragraph("pdf-creator: Export &amp; Sharing", styles['SlideTitle']))
    story.append(Paragraph("From template design to production-ready PDF", styles['SlideSubtitle']))

    story.append(Paragraph("Export Wizard", styles['SectionHeader']))
    story.append(Paragraph(
        "The multi-step export wizard guides users through all configuration options before generating the final PDF.",
        styles['Body']
    ))

    steps = [
        "<b>Metadata</b> — Title, author, subject, keywords, creator, producer, dates",
        "<b>Placeholders</b> — Fill in all {{token}} values used in the template",
        "<b>CSV Upload</b> — Provide data files for Auto CSV tables and repeaters",
        "<b>Charts</b> — Review and configure chart rendering options",
        "<b>Repeaters</b> — Map data columns to repeater card fields",
        "<b>Fonts</b> — Verify all custom fonts are available",
        "<b>Password Protection</b> — User password + owner password with permissions",
        "<b>PDF/A Conversion</b> — Select conformance level (1A, 1B, 2A, 2B, 2U, 3A, 3B, 3U)",
        "<b>Digital Signature</b> — Upload PKCS12/JKS keystore with signing metadata",
    ]
    for s in steps:
        story.append(Paragraph(s, styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph("Template Sharing", styles['SectionHeader']))
    bullets2 = [
        "Save templates as JSON files for version control",
        "Share via URL — base64-encoded template in shareable link",
        "Copy/paste templates from clipboard for quick collaboration",
    ]
    for b in bullets2:
        story.append(Paragraph(b, styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph("API Endpoint", styles['SectionHeader']))
    story.append(Paragraph(
        "<b>POST /api/generate-pdf</b> — accepts multipart form data with template JSON, "
        "placeholder values, CSV files, metadata, and all export options. "
        "Returns the generated PDF binary. Supports server-side chart rendering via ECharts SSR.",
        styles['Body']
    ))
    story.append(PageBreak())


def pdfa_overview_page(story, styles):
    """Page 7: pdfa-generator — Overview & PDF/A."""
    story.append(Paragraph("pdfa-generator: Enterprise Enhancement", styles['SlideTitle']))
    story.append(Paragraph("Advanced PDF processing for compliance and security", styles['SlideSubtitle']))

    story.append(Paragraph("Why pdfa-generator?", styles['SectionHeader']))
    story.append(Paragraph(
        "While pdf-creator handles visual design and basic PDF rendering, enterprise use cases demand "
        "capabilities that go beyond what browser-based rendering can provide: "
        "<b>archival compliance, digital signatures, encryption, and PDF manipulation</b>. "
        "pdfa-generator fills this gap as a dedicated Java microservice powered by Apache PDFBox.",
        styles['Body']
    ))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("12 API Endpoints", styles['SectionHeader']))

    api_data = [
        [Paragraph("<b>Endpoint</b>", styles['TableHeader']),
         Paragraph("<b>Purpose</b>", styles['TableHeader']),
         Paragraph("<b>Category</b>", styles['TableHeader'])],
        [Paragraph("/api/generate", styles['TableCell']),
         Paragraph("Generate PDF from template JSON (PDFBox engine)", styles['TableCell']),
         Paragraph("Generation", styles['TableCell'])],
        [Paragraph("/api/convert-to-pdfa", styles['TableCell']),
         Paragraph("Convert standard PDF to PDF/A format", styles['TableCell']),
         Paragraph("Compliance", styles['TableCell'])],
        [Paragraph("/api/validate-pdfa", styles['TableCell']),
         Paragraph("Validate PDF/A compliance with detailed error report", styles['TableCell']),
         Paragraph("Compliance", styles['TableCell'])],
        [Paragraph("/api/sign", styles['TableCell']),
         Paragraph("Digitally sign PDF with PKCS12/JKS certificate", styles['TableCell']),
         Paragraph("Security", styles['TableCell'])],
        [Paragraph("/api/encrypt", styles['TableCell']),
         Paragraph("Password-protect with 128/256-bit encryption", styles['TableCell']),
         Paragraph("Security", styles['TableCell'])],
        [Paragraph("/api/merge", styles['TableCell']),
         Paragraph("Merge multiple PDFs into one document", styles['TableCell']),
         Paragraph("Manipulation", styles['TableCell'])],
        [Paragraph("/api/split", styles['TableCell']),
         Paragraph("Split PDF by page numbers", styles['TableCell']),
         Paragraph("Manipulation", styles['TableCell'])],
        [Paragraph("/api/extract-text", styles['TableCell']),
         Paragraph("Extract text content (combined or per-page)", styles['TableCell']),
         Paragraph("Extraction", styles['TableCell'])],
        [Paragraph("/api/extract-metadata", styles['TableCell']),
         Paragraph("Extract document properties and metadata", styles['TableCell']),
         Paragraph("Extraction", styles['TableCell'])],
        [Paragraph("/api/text-watermark", styles['TableCell']),
         Paragraph("Add rotated text overlay with opacity control", styles['TableCell']),
         Paragraph("Watermark", styles['TableCell'])],
        [Paragraph("/api/image-watermark", styles['TableCell']),
         Paragraph("Add positioned image overlay with opacity", styles['TableCell']),
         Paragraph("Watermark", styles['TableCell'])],
        [Paragraph("/api/health", styles['TableCell']),
         Paragraph("Service health check", styles['TableCell']),
         Paragraph("Infra", styles['TableCell'])],
    ]
    api_table = Table(api_data, colWidths=[38*mm, 60*mm, 28*mm])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.5*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 2*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2*mm),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, ACCENT_LIGHT]),
    ]))
    story.append(api_table)

    story.append(PageBreak())


def pdfa_compliance_page(story, styles):
    """Page 8: PDF/A Compliance Deep Dive."""
    story.append(Paragraph("PDF/A Compliance", styles['SlideTitle']))
    story.append(Paragraph("ISO 19005 — Long-term archival and accessibility", styles['SlideSubtitle']))

    story.append(Paragraph("What is PDF/A?", styles['SectionHeader']))
    story.append(Paragraph(
        "PDF/A is an ISO-standardized subset of PDF designed for <b>long-term digital preservation</b>. "
        "It ensures that documents remain readable decades from now by embedding all resources "
        "(fonts, color profiles, metadata) and prohibiting features that depend on external state "
        "(JavaScript, external links, encryption in strict modes).",
        styles['Body']
    ))

    story.append(Paragraph("Supported Conformance Levels", styles['SectionHeader']))
    conf_data = [
        [Paragraph("<b>Standard</b>", styles['TableHeader']),
         Paragraph("<b>Level</b>", styles['TableHeader']),
         Paragraph("<b>Requirements</b>", styles['TableHeader'])],
        [Paragraph("PDF/A-1", styles['TableCell']),
         Paragraph("A, B", styles['TableCell']),
         Paragraph("Based on PDF 1.4. A = full accessibility (tagged PDF). B = visual preservation only.", styles['TableCell'])],
        [Paragraph("PDF/A-2", styles['TableCell']),
         Paragraph("A, B, U", styles['TableCell']),
         Paragraph("Based on PDF 1.7. Adds JPEG2000, transparency, layers. U = Unicode text.", styles['TableCell'])],
        [Paragraph("PDF/A-3", styles['TableCell']),
         Paragraph("A, B, U", styles['TableCell']),
         Paragraph("Same as PDF/A-2, plus allows embedding arbitrary file attachments.", styles['TableCell'])],
    ]
    conf_table = Table(conf_data, colWidths=[25*mm, 20*mm, W - 95*mm])
    conf_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3*mm),
    ]))
    story.append(conf_table)

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph("What pdfa-generator Does", styles['SectionHeader']))
    conversions = [
        "Embeds all fonts referenced in the document",
        "Injects ICC color profile (sRGB) for device-independent color",
        "Adds XMP metadata conforming to PDF/A requirements",
        "Removes incompatible features (JavaScript, encryption for A-level)",
        "Validates the result and returns detailed error categorization",
    ]
    for c in conversions:
        story.append(Paragraph(c, styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph("Validation API", styles['SectionHeader']))
    story.append(Paragraph(
        "The <b>/api/validate-pdfa</b> endpoint checks any PDF against PDF/A specifications "
        "and returns a structured report with pass/fail status and categorized errors — "
        "useful for CI/CD pipelines and quality gates.",
        styles['Body']
    ))

    story.append(PageBreak())


def pdfa_security_page(story, styles):
    """Page 9: Security Features."""
    story.append(Paragraph("Security &amp; Integrity", styles['SlideTitle']))
    story.append(Paragraph("Digital signatures and encryption", styles['SlideSubtitle']))

    story.append(Paragraph("Digital Signatures", styles['SectionHeader']))
    story.append(Paragraph(
        "pdfa-generator supports <b>cryptographic digital signatures</b> using industry-standard "
        "PKCS12 (.p12/.pfx) and Java KeyStore (.jks) formats. Signatures prove document authenticity "
        "and detect tampering after signing.",
        styles['Body']
    ))
    sig_bullets = [
        "<b>Keystore formats:</b> PKCS12 (.p12, .pfx) and JKS (.jks)",
        "<b>Signature metadata:</b> reason, location, contact info",
        "<b>Powered by:</b> BouncyCastle 1.79 cryptographic library",
        "<b>Use case:</b> Contracts, certificates, compliance documents",
    ]
    for b in sig_bullets:
        story.append(Paragraph(b, styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph("Password Encryption", styles['SectionHeader']))
    story.append(Paragraph(
        "Protect documents with two-tier password security:",
        styles['Body']
    ))
    enc_bullets = [
        "<b>User password:</b> Required to open the document",
        "<b>Owner password:</b> Required for full access (edit, print, copy)",
        "<b>Key lengths:</b> 128-bit or 256-bit AES encryption",
        "<b>Permissions:</b> Fine-grained control via permission bitfield",
    ]
    for b in enc_bullets:
        story.append(Paragraph(b, styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 5*mm))
    # Recommended processing order
    order_box = Table(
        [[Paragraph(
            "<b>Recommended Processing Order:</b><br/><br/>"
            "1. Generate PDF from template<br/>"
            "2. Convert to PDF/A (must be first post-processing step)<br/>"
            "3. Digitally sign (after PDF/A, before encryption)<br/>"
            "4. Encrypt (last step — incompatible with PDF/A-A compliance)",
            ParagraphStyle('OrderBody', parent=styles['Body'], textColor=TEXT_DARK, fontSize=10)
        )]],
        colWidths=[W - 60*mm],
    )
    order_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ACCENT_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 4*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 5*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5*mm),
        ('ROUNDEDCORNERS', [3*mm, 3*mm, 3*mm, 3*mm]),
        ('BOX', (0, 0), (-1, -1), 1, ACCENT),
    ]))
    story.append(order_box)

    story.append(PageBreak())


def pdfa_manipulation_page(story, styles):
    """Page 10: PDF Manipulation & Watermarks."""
    story.append(Paragraph("PDF Manipulation &amp; Watermarks", styles['SlideTitle']))
    story.append(Paragraph("Merge, split, extract, and watermark", styles['SlideSubtitle']))

    story.append(Paragraph("Document Manipulation", styles['SectionHeader']))

    manip_data = [
        [Paragraph("<b>Operation</b>", styles['TableHeader']),
         Paragraph("<b>Endpoint</b>", styles['TableHeader']),
         Paragraph("<b>Details</b>", styles['TableHeader'])],
        [Paragraph("Merge", styles['TableCell']),
         Paragraph("/api/merge", styles['TableCell']),
         Paragraph("Combine multiple PDFs into a single document. Useful for assembling reports from separate sections.", styles['TableCell'])],
        [Paragraph("Split", styles['TableCell']),
         Paragraph("/api/split", styles['TableCell']),
         Paragraph("Split a PDF by page numbers. Returns individual page files.", styles['TableCell'])],
        [Paragraph("Extract Text", styles['TableCell']),
         Paragraph("/api/extract-text", styles['TableCell']),
         Paragraph("Extract text content — combined or per-page. Enables search indexing and text analysis.", styles['TableCell'])],
        [Paragraph("Extract Metadata", styles['TableCell']),
         Paragraph("/api/extract-metadata", styles['TableCell']),
         Paragraph("Read document properties: title, author, dates, page count, PDF version.", styles['TableCell'])],
    ]
    manip_table = Table(manip_data, colWidths=[24*mm, 30*mm, W - 104*mm])
    manip_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 2.5*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2.5*mm),
    ]))
    story.append(manip_table)

    story.append(Spacer(1, 6*mm))
    story.append(Paragraph("Watermarking", styles['SectionHeader']))

    story.append(Paragraph("<b>Text Watermarks</b>", styles['Body']))
    text_wm = [
        "Overlay text (e.g., \"DRAFT\", \"CONFIDENTIAL\") on selected pages",
        "Configurable rotation angle, opacity, color, and font size",
        "Positioned at the center of the page by default",
    ]
    for b in text_wm:
        story.append(Paragraph(b, styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("<b>Image Watermarks</b>", styles['Body']))
    img_wm = [
        "Overlay an image (company logo, stamp) on selected pages",
        "Configurable position (x, y), size (width, height), and opacity",
        "Page-specific application for targeted watermarking",
    ]
    for b in img_wm:
        story.append(Paragraph(b, styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "<i>Note: pdf-creator also supports client-side image watermarks during export. "
        "pdfa-generator adds server-side text watermarks and more precise positioning control.</i>",
        styles['SmallNote']
    ))

    story.append(PageBreak())


def deployment_page(story, styles):
    """Page 11: Deployment & Getting Started."""
    story.append(Paragraph("Deployment &amp; Getting Started", styles['SlideTitle']))
    story.append(Paragraph("Up and running in minutes with Docker Compose", styles['SlideSubtitle']))

    story.append(Paragraph("Quick Start", styles['SectionHeader']))
    # Code block as a styled table
    code = (
        "# Clone and start both services\n"
        "git clone &lt;repo-url&gt;\n"
        "cd pdf-creator\n"
        "docker compose up --build\n"
        "\n"
        "# pdf-creator UI:        http://localhost:3000\n"
        "# pdfa-generator API:    http://localhost:8090/api/health"
    )
    code_para = Paragraph(
        code.replace('\n', '<br/>'),
        ParagraphStyle('Code', fontName='Courier', fontSize=9.5, leading=14,
                       textColor=HexColor("#e2e8f0"), backColor=BG_DARK)
    )
    code_table = Table([[code_para]], colWidths=[W - 56*mm])
    code_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 4*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 4*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4*mm),
        ('ROUNDEDCORNERS', [2*mm, 2*mm, 2*mm, 2*mm]),
    ]))
    story.append(code_table)

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph("Environment Configuration", styles['SectionHeader']))
    env_bullets = [
        "<b>PDFA_SERVICE_URL</b> — URL of pdfa-generator (default: http://pdfa-generator:8090)",
        "<b>PORT</b> — Port for each service (3000 / 8090)",
        "<b>BUNDLED_FONT_DIR</b> — Path to bundled TTF fonts",
        "<b>UPLOAD_FONT_DIR</b> — Shared volume for uploaded fonts",
    ]
    for b in env_bullets:
        story.append(Paragraph(b, styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph("Running Without Docker", styles['SectionHeader']))
    no_docker = [
        "<b>pdf-creator:</b> npm install &amp;&amp; npm run dev (requires Node.js)",
        "<b>pdfa-generator:</b> mvn clean package &amp;&amp; java -jar target/pdfa-generator-1.0.0.jar (requires Java 17+)",
    ]
    for b in no_docker:
        story.append(Paragraph(b, styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph("Sample PDF Generation", styles['SectionHeader']))
    story.append(Paragraph(
        "Run <b>bash generate-sample-pdfs.sh</b> to generate comparison PDFs from all 18 templates "
        "using both rendering engines. Results are saved to the <b>sample-pdf/</b> directory.",
        styles['Body']
    ))

    story.append(PageBreak())


def closing_page(story, styles):
    """Page 12: Summary & Next Steps."""
    story.append(Paragraph("Summary", styles['SlideTitle']))
    story.append(Paragraph("What makes this platform stand out", styles['SlideSubtitle']))

    # Key metrics in a grid
    metrics = [
        ("11", "Element Types"),
        ("18", "Built-in Templates"),
        ("12", "API Endpoints"),
        ("8", "PDF/A Levels"),
    ]
    metric_cells = []
    for num, label in metrics:
        cell = Paragraph(
            f"<font size='28' color='{PRIMARY.hexval()}'><b>{num}</b></font><br/>"
            f"<font size='9' color='{TEXT_MUTED.hexval()}'>{label}</font>",
            ParagraphStyle('MetricCell', alignment=TA_CENTER, leading=18)
        )
        metric_cells.append(cell)

    metric_table = Table([metric_cells], colWidths=[(W - 56*mm) / 4] * 4)
    metric_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5*mm),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_LIGHT),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('ROUNDEDCORNERS', [3*mm, 3*mm, 3*mm, 3*mm]),
    ]))
    story.append(metric_table)

    story.append(Spacer(1, 6*mm))

    story.append(Paragraph("Key Takeaways", styles['SectionHeader']))
    takeaways = [
        "<b>Visual + Programmatic:</b> Design templates visually in the browser, generate PDFs via API — best of both worlds.",
        "<b>Enterprise-Ready:</b> PDF/A archival compliance, digital signatures, encryption, and watermarks built in.",
        "<b>Data-Driven:</b> Placeholders, CSV binding, repeaters, and charts turn templates into dynamic document generators.",
        "<b>Shared Format:</b> Both services use the same JSON template format — design once, render anywhere.",
        "<b>Developer-Friendly:</b> Docker Compose deployment, REST APIs, high test coverage, and 18 ready-to-use templates.",
    ]
    for t in takeaways:
        story.append(Paragraph(t, styles['BulletItem'], bulletText='\u2022'))

    story.append(Spacer(1, 8*mm))

    # Closing box
    closing = Table(
        [[Paragraph(
            "<b>Thank you!</b><br/>"
            "Questions, feedback, and contributions are welcome.",
            ParagraphStyle('ClosingBody', parent=styles['Body'], textColor=white,
                           alignment=TA_CENTER, fontSize=13, leading=20)
        )]],
        colWidths=[W - 60*mm],
    )
    closing.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 8*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 10*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10*mm),
        ('ROUNDEDCORNERS', [4*mm, 4*mm, 4*mm, 4*mm]),
    ]))
    story.append(closing)


def main():
    output_path = "/output/presentation.pdf"

    doc = PresentationDocTemplate(
        output_path,
        pagesize=A4,
        title="pdf-creator & pdfa-generator — Internal Presentation",
        author="Engineering Team",
        subject="Platform overview for software engineers",
    )

    styles = build_styles()
    story = []

    cover_page(story, styles)
    real_life_desires_page(story, styles)
    overview_page(story, styles)
    features_editor_page(story, styles)
    features_dynamic_page(story, styles)
    features_export_page(story, styles)
    pdfa_overview_page(story, styles)
    pdfa_compliance_page(story, styles)
    pdfa_security_page(story, styles)
    pdfa_manipulation_page(story, styles)
    deployment_page(story, styles)
    closing_page(story, styles)

    doc.build(story)
    print(f"PDF generated: {output_path}")


if __name__ == "__main__":
    main()
