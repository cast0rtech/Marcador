import io
from datetime import datetime
import logging

logger = logging.getLogger("BMS_PDF_Exporter")

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
except ImportError:
    colors = None
    A4 = None
    landscape = None
    SimpleDocTemplate = None
    logger.warning("ReportLab no está instalado en este entorno. Instálalo con: pip install reportlab")


def generar_pdf_auditoria(eventos, lang: str = "es") -> io.BytesIO:
    """Genera un archivo PDF en memoria con la tabla de auditoría del BMS."""
    if SimpleDocTemplate is None:
        raise RuntimeError("ReportLab no está instalado en el sistema. Ejecuta 'pip install reportlab'.")

    buffer = io.BytesIO()
    
    # Usamos A4 en formato horizontal (landscape) para que quepan holgadamente las columnas
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=landscape(A4), 
        rightMargin=30, 
        leftMargin=30, 
        topMargin=30, 
        bottomMargin=30
    )
    elementos = []
    estilos = getSampleStyleSheet()
    estilo_normal = estilos['Normal']
    
    # Textos según idioma
    i18n_pdf = {
        "es": {
            "title": "Registro Oficial de Auditoría BMS",
            "issued": "Fecha de emisión",
            "th_start": "Timestamp (Inicio)",
            "th_point": "Grupo / Punto de Datos",
            "th_status": "Estado",
            "th_notifs": "Trazabilidad Notificaciones",
            "th_res": "Resolución",
            "pending": "Activa / Pendiente",
            "no_notifs": "<i>Sin notificaciones</i>",
            "general_group": "General",
        },
        "de": {
            "title": "Offizielles BMS-Auditprotokoll",
            "issued": "Ausstellungsdatum",
            "th_start": "Zeitstempel (Beginn)",
            "th_point": "Gruppe / Datenpunkt",
            "th_status": "Status",
            "th_notifs": "Rückverfolgbarkeit Benachrichtigungen",
            "th_res": "Behebung",
            "pending": "Aktiv / Ausstehend",
            "no_notifs": "<i>Keine Benachrichtigungen</i>",
            "general_group": "Allgemein",
        },
        "en": {
            "title": "Official BMS Audit Log",
            "issued": "Issue date",
            "th_start": "Timestamp (Start)",
            "th_point": "Group / DataPoint",
            "th_status": "Status",
            "th_notifs": "Notification Traceability",
            "th_res": "Resolution",
            "pending": "Active / Pending",
            "no_notifs": "<i>No notifications</i>",
            "general_group": "General",
        }
    }
    texts = i18n_pdf.get(lang, i18n_pdf["es"])

    # 1. Cabecera del Documento
    titulo = Paragraph(f"<b>{texts['title']}</b>", estilos['Title'])
    fecha_emision = Paragraph(f"{texts['issued']}: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", estilo_normal)
    elementos.append(titulo)
    elementos.append(fecha_emision)
    elementos.append(Spacer(1, 20))

    # 2. Definición de la Tabla
    datos_tabla = [[
        texts["th_start"], 
        texts["th_point"], 
        texts["th_status"], 
        texts["th_notifs"], 
        texts["th_res"]
    ]]

    # Rellenar con los datos de la base de datos
    for ev in eventos:
        fecha_inicio = ev.created_at.strftime("%d/%m/%Y %H:%M:%S") if getattr(ev, 'created_at', None) else "---"
        fecha_res = ev.resolved_at.strftime("%d/%m/%Y %H:%M:%S") if getattr(ev, 'resolved_at', None) else texts["pending"]
        
        # Obtener DataPoint y Grupo con seguridad contra nulos
        dp = getattr(ev, 'data_point', None)
        dp_name = dp.name if dp and hasattr(dp, 'name') else f"Punto #{getattr(ev, 'data_point_id', 0)}"
        grupo_obj = getattr(dp, 'group', None) if dp else None
        grupo_name = grupo_obj.name if grupo_obj and hasattr(grupo_obj, 'name') else texts["general_group"]
        
        txt_punto = f"<b>{grupo_name}</b><br/>{dp_name}"
        p_punto = Paragraph(txt_punto, estilo_normal)

        # Estado
        ev_status = ev.status.value if hasattr(ev.status, 'value') else str(ev.status)

        # Notificaciones
        notifications = getattr(ev, 'notifications', None) or []
        if notifications:
            notifs = []
            for n in notifications:
                channel = n.channel.value.upper() if hasattr(n.channel, 'value') else str(n.channel).upper()
                notifs.append(f"[{channel}] {n.recipient} ({n.delivery_status})")
            txt_notifs = "<br/>".join(notifs)
        else:
            txt_notifs = texts["no_notifs"]
        p_notifs = Paragraph(txt_notifs, estilo_normal)

        datos_tabla.append([
            fecha_inicio,
            p_punto,
            ev_status,
            p_notifs,
            fecha_res
        ])

    # 3. Estilos de la Tabla
    tabla = Table(datos_tabla, colWidths=[110, 180, 80, 250, 110])
    tabla.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1F2937")),  # Gris oscuro industrial
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#F9FAFB")),  # Fondo alterno claro
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#F3F4F6"), colors.HexColor("#E5E7EB")]),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#D1D5DB")),      # Bordes de celdas
    ]))
    
    elementos.append(tabla)
    
    # 4. Construir el PDF
    doc.build(elementos)
    
    # Rebobinar el buffer de memoria al principio para lectura de streaming
    buffer.seek(0)
    return buffer

