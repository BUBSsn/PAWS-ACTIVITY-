"""Build the activity handoff PDF from the implemented control matrix and browser evidence."""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/paws-activity-documentation.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitlePAWS', fontName='Helvetica-Bold', fontSize=29, leading=35, textColor=colors.HexColor('#1E1E1E'), spaceAfter=15))
styles.add(ParagraphStyle(name='SubPAWS', fontName='Helvetica-Bold', fontSize=16, leading=22, textColor=colors.HexColor('#205E2B'), spaceAfter=12))
styles.add(ParagraphStyle(name='BodyPAWS', fontName='Helvetica', fontSize=10, leading=15, textColor=colors.HexColor('#40483B'), spaceAfter=10))
styles.add(ParagraphStyle(name='CellPAWS', fontName='Helvetica', fontSize=9, leading=13, spaceAfter=0))
styles.add(ParagraphStyle(name='SmallPAWS', fontName='Helvetica', fontSize=8, leading=12, textColor=colors.HexColor('#606A57'), spaceAfter=8))
story = []
def p(text, style='BodyPAWS'):
    return Paragraph(escape(text), styles[style])
def table(rows, widths, header=True):
    data = [[p(str(v), 'CellPAWS') for v in row] for row in rows]
    t = Table(data, colWidths=widths, hAlign='LEFT', repeatRows=1 if header else 0)
    t.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'), ('LEFTPADDING',(0,0),(-1,-1),9), ('RIGHTPADDING',(0,0),(-1,-1),9),
        ('TOPPADDING',(0,0),(-1,-1),8), ('BOTTOMPADDING',(0,0),(-1,-1),8),
        ('LINEBELOW',(0,0),(-1,0),1,colors.HexColor('#9EDB8E')),
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#EDF8EC')),
        ('LINEBELOW',(0,1),(-1,-1),.4,colors.HexColor('#E0E6DA')),
    ]))
    return t
def img(path, maxw, maxh):
    w,h = ImageReader(str(path)).getSize(); scale=min(maxw/w,maxh/h)
    return Image(str(path), width=w*scale, height=h*scale)
def footer(c, doc):
    w,h=A4
    c.setFillColor(colors.HexColor('#00CB00')); c.rect(42,h-29,28,3,fill=1,stroke=0)
    c.setFillColor(colors.HexColor('#697260')); c.setFont('Helvetica',8)
    c.drawString(42,25,'PAWS-inspired academic project | Form controls activity')
    c.drawRightString(w-42,25,f'{doc.page}')

story.extend([Spacer(1,25),p('PAWS Volunteer Portal', 'TitlePAWS'),p('Form controls activity', 'SubPAWS'),p('Implementation documentation | 23 October 2026', 'SmallPAWS'),p('Project: A Web-Based Volunteer Management System with Integrated Time and Access Control for the Philippine Animal Welfare Society (PAWS).'),p('This focused activity implements two major forms and two supporting forms. It connects form inputs, validation, saved results, remote review and reporting using React and Node.js. The green, cream, white and charcoal interface follows the PAWS website palette; this is not an official PAWS service.'),Spacer(1,9)])
story.append(table([
    ['Classification','Implemented form','Controls'],
    ['Major 1','Create Event','8 inputs + 2 buttons'],
    ['Major 2','Volunteer Profile and Vaccination Update','8 inputs + 2 buttons'],
    ['Supporting 1','Remote Work Submission','8 inputs + 2 buttons'],
    ['Supporting 2','Report Filters and Generation','8 inputs + 2 buttons'],
], [90,325,96]))
story.extend([Spacer(1,20),p('How the activity runs', 'SubPAWS'),p('Run npm install, then npm run dev, and open http://localhost:3000. Local demonstration mode uses fictional identities and saves records and files under data/. The identity selector is a classroom convenience, not secure authentication. Staff Ana Cruz creates events, reviews work and generates reports. Volunteers Maya Santos and Luis Reyes update profiles and submit work.'),p('Supabase mode is included through environment configuration, verified bearer tokens, staff/volunteer membership, a private JSONB activity store and private file storage. Its schema is intentionally smaller than the full thesis ERD. Live Supabase integration has not been tested without project credentials.'),p('Group submission: include all members in Canvas comments and supply the actual repository link with genuine member commits. A 2-4 minute recording must be made by the group; docs/demo-script.md provides the walkthrough.', 'SmallPAWS'),PageBreak()])

text=(ROOT/'docs/form-controls.md').read_text()
sections=text.split('\n## ')[1:]
screens=[('02-event-validation.png','03-event-saved.png'),('04-profile-validation.png','05-profile-saved.png'),('06-remote-validation.png','07-remote-pending.png'),('09-report-validation.png','10-report-results.png')]
for idx, section in enumerate(sections):
    lines=section.splitlines()
    story.append(p(lines[0],'SubPAWS'))
    purpose=next(line for line in lines if line.startswith('Purpose:'))
    story.append(p(purpose))
    rows=[]
    for line in lines:
        if line.startswith('|') and not line.startswith('| ---'):
            rows.append([c.strip() for c in line.strip('|').split('|')])
    story.append(table(rows,[23,121,90,277]))
    story.append(Spacer(1,12))
    after=False
    for line in lines:
        if line.startswith('| 10 '): after=True;continue
        if after and line.strip(): story.append(p(line,'SmallPAWS'))
    story.append(PageBreak())
    story.append(p(f'{lines[0].split(": ")[-1]} - browser evidence','SubPAWS'))
    story.append(p('Actual application captures using fictional demonstration data. Full-size PNGs are included in docs/screenshots/.','SmallPAWS'))
    shot1,shot2=screens[idx]
    photos=[[p('Validation / invalid submission','SmallPAWS'),p('Saved result / generated report','SmallPAWS')], [img(ROOT/'docs/screenshots'/shot1,245,605),img(ROOT/'docs/screenshots'/shot2,245,605)]]
    grid=Table(photos,colWidths=[255.5,255.5]); grid.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),10)]));story.append(grid)
    story.append(PageBreak())

story.extend([p('Project structure and verification','SubPAWS'),p('The directory snapshot below was generated from actual project files. Dependency folders, build output and local runtime data are omitted.','SmallPAWS'),img(ROOT/'docs/screenshots/14-directory-structure.png',511,400),Spacer(1,12),p('Completed checks','SubPAWS'),p('Production build passed. Six automated tests passed, covering validation, persistence, staff-only actions, evidence access, duplicate time claims, concurrent approval, credited totals and CSV. Headless Chrome completed the four form workflows, error states, reload persistence, staff review, report preview and download, empty results and 390px mobile layouts without JavaScript page errors.'),p('Limitations and remaining group deliverables','SubPAWS'),p('Live Supabase credentials were not provided, so cloud Auth/database/storage integration remains to be verified after setup. Local mode was tested. Full thesis modules such as kiosk attendance and task claiming are outside this activity. The group must record its 2-4 minute demo, supply its own repository URL and genuine member commits, and list members in Canvas comments.','SmallPAWS')])
doc=SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=42,rightMargin=42,topMargin=43,bottomMargin=42,title='PAWS Form Controls Activity Documentation',author='PAWS Project Team')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
