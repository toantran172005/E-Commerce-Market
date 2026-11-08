import zipfile
import sys
import json
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

with zipfile.ZipFile('Plans/Words/N13_ApplicationDevelopment_SRS.docx') as z:
    xml_content = z.read('word/document.xml')

root = ET.fromstring(xml_content)
tables = root.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tbl')

usecases = []
# Tables 3 to 23 are UC001 to UC021
for idx in range(3, min(24, len(tables))):
    tbl = tables[idx]
    rows = tbl.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tr')
    uc_info = {}
    for r in rows:
        cells = [''.join(c.itertext()).strip() for c in r.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tc')]
        if len(cells) >= 2:
            key = cells[0].rstrip(':').strip()
            val = cells[1].strip()
            uc_info[key] = val
    usecases.append(uc_info)

with open('Plans/progress/usecases_raw.json', 'w', encoding='utf-8') as f:
    json.dump(usecases, f, ensure_ascii=False, indent=2)

print(f'Parsed {len(usecases)} use cases to Plans/progress/usecases_raw.json')
for u in usecases:
    print(u.get('Tên use case', 'Unknown'), '->', u.get('Tác nhân chính', 'N/A'))
