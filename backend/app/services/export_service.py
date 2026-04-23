from __future__ import annotations

from io import BytesIO, StringIO
import csv

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def games_to_csv_rows(records: list) -> str:
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(['id', 'lottery_type', 'numbers', 'score', 'sum', 'even_count', 'created_at'])
    for item in records:
        writer.writerow([
            item.id,
            item.lottery_type,
            '-'.join(str(n) for n in item.numbers),
            item.score,
            item.game_sum,
            item.even_count,
            item.created_at,
        ])
    return buffer.getvalue()


def single_game_pdf(record) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 60
    pdf.setTitle(f'jogo-{record.id}')
    pdf.setFont('Helvetica-Bold', 18)
    pdf.drawString(50, y, 'LotoMetrics - Jogo Exportado')
    y -= 40
    pdf.setFont('Helvetica', 12)
    lines = [
        f'ID: {record.id}',
        f'Loteria: {record.lottery_type}',
        f'Números: {", ".join(str(n).zfill(2) for n in record.numbers)}',
        f'Score: {record.score}',
        f'Soma: {record.game_sum}',
        f'Pares: {record.even_count}',
        f'Criado em: {record.created_at}',
    ]
    for line in lines:
        pdf.drawString(50, y, line)
        y -= 22
    pdf.setFont('Helvetica-Oblique', 10)
    y -= 10
    pdf.drawString(50, y, 'Material de apoio estatístico. Não representa previsão garantida.')
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
