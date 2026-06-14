"""
PDF Report Generator for ICEMGS
Generates comprehensive project reports with costs, BOMs, and specifications
"""
from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, PageBreak, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from django.conf import settings


class ProjectPDFGenerator:
    """Generate PDF reports for construction projects"""

    def __init__(self, project):
        self.project = project
        self.buffer = BytesIO()
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))

        # Section heading
        self.styles.add(ParagraphStyle(
            name='SectionHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))

        # Info text
        self.styles.add(ParagraphStyle(
            name='InfoText',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
        ))

    def generate(self):
        """Generate complete PDF report"""
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )

        # Container for the 'Flowable' objects
        elements = []

        # Add header
        elements.extend(self._create_header())

        # Add project details
        elements.extend(self._create_project_details())

        # Add cost summary
        elements.extend(self._create_cost_summary())

        # Add Bill of Materials
        if self.project.bill_of_materials.exists():
            elements.extend(self._create_bom_section())

        # Add floor and room details
        if self.project.floors.exists():
            elements.extend(self._create_floors_section())

        # Add gray structure specifications
        try:
            if self.project.gray_structure_details:
                elements.extend(self._create_gray_structure_section())
        except Exception:
            pass

        # Add finishing details
        try:
            if self.project.finishing_details:
                elements.extend(self._create_finishing_section())
        except Exception:
            pass

        # Add compliance information
        elements.extend(self._create_compliance_section())

        # Add footer
        elements.extend(self._create_footer())

        # Build PDF
        doc.build(elements)
        pdf = self.buffer.getvalue()
        self.buffer.close()
        return pdf

    def _create_header(self):
        """Create PDF header"""
        elements = []

        # Title
        title = Paragraph(
            "CONSTRUCTION ESTIMATION REPORT",
            self.styles['CustomTitle']
        )
        elements.append(title)
        elements.append(Spacer(1, 12))

        # Project name
        project_name = Paragraph(
            f"<b>Project:</b> {self.project.name}",
            self.styles['Heading2']
        )
        elements.append(project_name)
        elements.append(Spacer(1, 20))

        return elements

    def _create_project_details(self):
        """Create project details section"""
        elements = []

        elements.append(Paragraph("Project Details", self.styles['SectionHeading']))

        # Project info table
        data = [
            ['Plot Area:', f"{self.project.plot_area} {self.project.plot_unit}"],
            ['Location:', self.project.location or 'N/A'],
            ['Number of Floors:', str(self.project.num_floors)],
            ['Total Built Area:', f"{self.project.total_built_area} sq ft"],
            ['Construction Type:', self.project.get_construction_type_display()],
            ['Status:', self.project.get_status_display()],
            ['LDA Compliant:', 'Yes' if self.project.lda_compliant else 'No'],
            ['Created Date:', self.project.created_at.strftime('%B %d, %Y')],
        ]

        table = Table(data, colWidths=[2*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))

        elements.append(table)
        elements.append(Spacer(1, 20))

        return elements

    def _create_cost_summary(self):
        """Create cost summary section"""
        elements = []

        elements.append(Paragraph("Cost Summary", self.styles['SectionHeading']))

        # Cost breakdown table
        data = [
            ['Description', 'Amount (PKR)'],
            ['Gray Structure Cost', f"PKR {self.project.gray_structure_cost:,.2f}"],
            ['Finishing Cost', f"PKR {self.project.finishing_cost:,.2f}"],
            ['Labor Cost', f"PKR {self.project.labor_cost:,.2f}"],
            ['', ''],
            ['Total Project Cost', f"PKR {self.project.total_cost:,.2f}"],
        ]

        table = Table(data, colWidths=[3*inch, 3*inch])
        table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),

            # Data rows
            ('BACKGROUND', (0, 1), (-1, -2), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),

            # Total row
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#dbeafe')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),

            # Grid
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))

        elements.append(table)
        elements.append(Spacer(1, 20))

        return elements

    def _create_bom_section(self):
        """Create Bill of Materials section"""
        elements = []

        elements.append(Paragraph("Bill of Materials", self.styles['SectionHeading']))

        # Gray Structure BOM
        gray_bom = self.project.bill_of_materials.filter(category='gray_structure')
        if gray_bom.exists():
            elements.append(Paragraph("Gray Structure Materials", self.styles['Heading3']))

            data = [['Material', 'Quantity', 'Unit', 'Rate (PKR)', 'Total (PKR)']]

            for item in gray_bom:
                data.append([
                    item.material.name,
                    f"{item.quantity:.2f}",
                    item.unit,
                    f"{item.rate:,.2f}",
                    f"{item.total_cost:,.2f}",
                ])

            table = Table(data, colWidths=[2.5*inch, 1*inch, 0.8*inch, 1.2*inch, 1.5*inch])
            table.setStyle(self._get_bom_table_style())
            elements.append(table)
            elements.append(Spacer(1, 12))

        # Finishing BOM
        finishing_bom = self.project.bill_of_materials.filter(category='finishing')
        if finishing_bom.exists():
            elements.append(Paragraph("Finishing Materials", self.styles['Heading3']))

            data = [['Material', 'Quantity', 'Unit', 'Rate (PKR)', 'Total (PKR)']]

            for item in finishing_bom:
                data.append([
                    item.material.name,
                    f"{item.quantity:.2f}",
                    item.unit,
                    f"{item.rate:,.2f}",
                    f"{item.total_cost:,.2f}",
                ])

            table = Table(data, colWidths=[2.5*inch, 1*inch, 0.8*inch, 1.2*inch, 1.5*inch])
            table.setStyle(self._get_bom_table_style())
            elements.append(table)
            elements.append(Spacer(1, 12))

        elements.append(Spacer(1, 20))
        return elements

    def _get_bom_table_style(self):
        """Get standard BOM table style"""
        return TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),

            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),

            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ])

    def _create_floors_section(self):
        """Create floors and rooms section"""
        elements = []

        elements.append(Paragraph("Floor & Room Details", self.styles['SectionHeading']))

        for floor in self.project.floors.all().order_by('floor_number'):
            # Get rooms that were actually selected (size is not 'none')
            active_rooms = floor.rooms.exclude(size='none')

            # Floor heading — always show even if no active rooms
            floor_title = f"Floor {floor.floor_number} - {floor.get_floor_type_display()}"
            elements.append(Paragraph(floor_title, self.styles['Heading3']))

            if active_rooms.exists():
                # Rooms table
                data = [['Room Type', 'Size', 'Area (sq ft)', 'Features']]

                for room in active_rooms:
                    # Build features list from all boolean fields
                    features = []
                    if room.has_attached_bathroom:
                        features.append('Attached Bath')
                    if room.has_balcony:
                        features.append('Balcony')
                    if room.has_parapet_walls:
                        features.append('Parapet Walls')

                    # Add contextual features based on room type
                    if room.room_type == 'garage':
                        features.append('Vehicle Parking')
                    elif room.room_type == 'mumty':
                        features.append('Roof Access')
                    elif room.room_type == 'spiral_stairs':
                        features.append('External Stairs')

                    # Format size — use dimensions if available, else the size string
                    if room.length and room.width:
                        size_str = f"{room.length} x {room.width} ft"
                        if room.height:
                            size_str += f" (H: {room.height} ft)"
                    else:
                        size_val = (room.size or 'N/A').capitalize()
                        size_str = size_val

                    # Room display name
                    display_name = room.custom_name or room.get_room_type_display()
                    # Capitalize custom_name nicely
                    if room.custom_name:
                        display_name = room.custom_name.replace('_', ' ').title()

                    data.append([
                        display_name,
                        size_str,
                        f"{room.area:.0f}" if room.area and room.area > 0 else 'Auto',
                        ', '.join(features) if features else '-'
                    ])

                table = Table(data, colWidths=[2*inch, 1.5*inch, 1*inch, 2.5*inch])
                table.setStyle(self._get_bom_table_style())
                elements.append(table)
            else:
                elements.append(Paragraph(
                    "<i>No rooms configured for this floor</i>",
                    self.styles['InfoText']
                ))

            elements.append(Spacer(1, 12))

        elements.append(Spacer(1, 20))
        return elements

    def _create_gray_structure_section(self):
        """Create gray structure specifications section"""
        elements = []

        elements.append(Paragraph("Gray Structure Specifications", self.styles['SectionHeading']))

        gray = self.project.gray_structure_details
        data = []

        if gray.foundation_type:
            data.append(['Foundation Type:', gray.foundation_type.replace('-', ' ').title()])
        if gray.wall_material:
            data.append(['Wall Material:', gray.wall_material.replace('-', ' ').title()])
        if gray.wall_thickness:
            data.append(['Wall Thickness:', gray.wall_thickness.replace('-', ' ').title()])
        if gray.roof_type:
            data.append(['Roof Type:', gray.roof_type.replace('-', ' ').title()])
        if gray.steel_grade:
            data.append(['Steel Grade:', gray.steel_grade.replace('-', ' ').upper()])
        if gray.cement_type:
            data.append(['Cement Type:', gray.cement_type.replace('-', ' ').upper()])
        if gray.brick_type:
            data.append(['Brick Type:', gray.brick_type.replace('-', ' ').title()])
        if gray.plaster_type:
            data.append(['Plaster Type:', gray.plaster_type.replace('-', ' ').title()])
        if gray.spiral_stairs:
            data.append(['Spiral Stairs:', 'Yes'])

        if data:
            table = Table(data, colWidths=[2*inch, 4*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(table)

        elements.append(Spacer(1, 20))
        return elements

    def _create_finishing_section(self):
        """Create finishing materials section"""
        elements = []

        elements.append(Paragraph("Finishing Specifications", self.styles['SectionHeading']))

        try:
            finishing = self.project.finishing_details
        except Exception:
            elements.append(Paragraph(
                "<i>No finishing details configured</i>",
                self.styles['InfoText']
            ))
            elements.append(Spacer(1, 20))
            return elements

        data = []

        if finishing.floor_tiles:
            data.append(['Floor Tiles:', finishing.floor_tiles.replace('-', ' ').title()])
        if finishing.wall_tiles:
            data.append(['Wall Tiles:', finishing.wall_tiles.replace('-', ' ').title()])
        if finishing.paint:
            data.append(['Paint:', finishing.paint.replace('-', ' ').title()])
        if finishing.doors:
            label = finishing.doors.replace('-', ' ').title()
            if finishing.door_quantity:
                label += f" (Qty: {finishing.door_quantity})"
            data.append(['Doors:', label])
        if finishing.windows:
            label = finishing.windows.replace('-', ' ').title()
            if finishing.window_quantity:
                label += f" (Qty: {finishing.window_quantity})"
            data.append(['Windows:', label])
        if finishing.electrical:
            data.append(['Electrical:', finishing.electrical.replace('-', ' ').title()])
        if finishing.plumbing:
            data.append(['Plumbing:', finishing.plumbing.replace('-', ' ').title()])
        if finishing.sanitary:
            data.append(['Sanitary:', finishing.sanitary.replace('-', ' ').title()])
        if finishing.cabinets:
            data.append(['Kitchen Cabinets:', finishing.cabinets.replace('-', ' ').title()])

        if data:
            table = Table(data, colWidths=[2*inch, 4*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph(
                "<i>No finishing details configured</i>",
                self.styles['InfoText']
            ))

        elements.append(Spacer(1, 20))
        return elements

    def _create_compliance_section(self):
        """Create compliance information section"""
        elements = []

        elements.append(Paragraph("Compliance Information", self.styles['SectionHeading']))

        compliance_text = f"""
        <b>LDA Compliance Status:</b> {'Compliant' if self.project.lda_compliant else 'Non-Compliant'}<br/>
        """

        if self.project.compliance_notes:
            compliance_text += f"<b>Notes:</b> {self.project.compliance_notes}"

        elements.append(Paragraph(compliance_text, self.styles['InfoText']))
        elements.append(Spacer(1, 20))

        return elements

    def _create_footer(self):
        """Create PDF footer"""
        elements = []

        elements.append(Spacer(1, 30))

        footer_text = f"""
        <para alignment="center">
        <font size="8" color="#6b7280">
        Generated by ICEMGS - Intelligent Construction Estimation and Map Generator System<br/>
        Report Date: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}<br/>
        This is a computer-generated document and does not require a signature.
        </font>
        </para>
        """

        elements.append(Paragraph(footer_text, self.styles['Normal']))

        return elements
