import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Tuple, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.schema import DailyReport, EmailLog

logger = logging.getLogger("ai_radar.email")

def generate_email_html(report: DailyReport, frontend_url: str) -> str:
    """
    Renders a clean, high-clarity HTML email using the strict color palette:
    Background: #F7F9FC, Surface: #FFFFFF, Primary Text: #172033, Accent: #2563EB, Border: #E5EAF1.
    No purple, no dark background.
    """
    top_devs_html = ""
    for item in (report.top_developments or [])[:5]:
        headline = item.get("headline", "Development")
        what = item.get("what_happened", "")
        why = item.get("why_it_matters", "")
        url = item.get("source_url", "#")
        source = item.get("source_name", "Source")
        status = item.get("verification_status", "Verified")
        
        top_devs_html += f"""
        <div style="border-left: 3px solid #2563EB; padding: 12px 16px; margin-bottom: 16px; background-color: #FFFFFF; border-radius: 0 4px 4px 0; border-top: 1px solid #E5EAF1; border-right: 1px solid #E5EAF1; border-bottom: 1px solid #E5EAF1;">
            <div style="font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">
                {source} &bull; <span style="color: #15803D;">{status}</span>
            </div>
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #172033; font-weight: 600;">
                <a href="{url}" style="color: #172033; text-decoration: none;">{headline}</a>
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #334155; line-height: 1.5;">{what}</p>
            <div style="font-size: 12px; color: #1E40AF; background-color: #EFF6FF; padding: 6px 10px; border-radius: 4px; margin-bottom: 8px;">
                <strong>Why it matters:</strong> {why}
            </div>
            <a href="{url}" style="font-size: 12px; color: #2563EB; font-weight: 500; text-decoration: none;">Read primary source &rarr;</a>
        </div>
        """

    models_html = ""
    for m in (report.model_releases or []):
        m_name = m.get("model_name", "Model")
        m_org = m.get("organization", "Lab")
        m_details = m.get("details", "")
        m_url = m.get("source_url", "#")
        models_html += f"""
        <li style="margin-bottom: 8px; font-size: 13px; color: #172033;">
            <strong>{m_name}</strong> ({m_org}) &mdash; {m_details} 
            <a href="{m_url}" style="color: #2563EB; text-decoration: none;">[Source]</a>
        </li>
        """

    research_html = ""
    for r in (report.research_breakthroughs or []):
        r_title = r.get("title", "")
        r_sig = r.get("significance", "")
        r_url = r.get("source_url", "#")
        research_html += f"""
        <li style="margin-bottom: 8px; font-size: 13px; color: #172033;">
            <a href="{r_url}" style="color: #2563EB; text-decoration: none; font-weight: 600;">{r_title}</a>: {r_sig}
        </li>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Intelligence Brief - {report.report_date}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F7F9FC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #172033;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F9FC; padding: 24px 0;">
            <tr>
                <td align="center">
                    <table width="640" cellpadding="0" cellspacing="0" style="max-width: 640px; background-color: #FFFFFF; border: 1px solid #E5EAF1; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 24px 28px; border-bottom: 1px solid #E5EAF1; background-color: #FFFFFF;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td>
                                            <div style="font-size: 12px; font-weight: 700; color: #2563EB; letter-spacing: 0.05em; text-transform: uppercase;">
                                                AI Intelligence Radar
                                            </div>
                                            <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 700; color: #172033;">
                                                Daily Intelligence Brief
                                            </h1>
                                        </td>
                                        <td align="right" style="vertical-align: top;">
                                            <span style="font-size: 12px; font-weight: 500; color: #64748B; background-color: #F1F5F9; padding: 4px 10px; border-radius: 4px;">
                                                {report.report_date}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Executive Summary -->
                        <tr>
                            <td style="padding: 24px 28px; background-color: #F8FAFC; border-bottom: 1px solid #E5EAF1;">
                                <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 6px;">
                                    Executive Synthesis ({report.total_articles_analyzed} verified sources evaluated)
                                </div>
                                <div style="font-size: 14px; line-height: 1.6; color: #1E293B;">
                                    {report.executive_summary}
                                </div>
                            </td>
                        </tr>

                        <!-- Top Developments -->
                        <tr>
                            <td style="padding: 24px 28px; border-bottom: 1px solid #E5EAF1;">
                                <h2 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #172033; text-transform: uppercase; letter-spacing: 0.03em;">
                                    Top Developments of the Day
                                </h2>
                                {top_devs_html if top_devs_html else '<p style="font-size: 13px; color: #64748B;">No breaking developments recorded in this cycle.</p>'}
                            </td>
                        </tr>

                        <!-- Models & Research -->
                        {(f'''
                        <tr>
                            <td style="padding: 24px 28px; border-bottom: 1px solid #E5EAF1; background-color: #FFFFFF;">
                                <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #172033; text-transform: uppercase; letter-spacing: 0.03em;">
                                    Tracked Model Releases & Announcements
                                </h2>
                                <ul style="margin: 0; padding-left: 20px;">
                                    {models_html}
                                </ul>
                            </td>
                        </tr>
                        ''') if models_html else ''}

                        {(f'''
                        <tr>
                            <td style="padding: 24px 28px; border-bottom: 1px solid #E5EAF1; background-color: #FFFFFF;">
                                <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #172033; text-transform: uppercase; letter-spacing: 0.03em;">
                                    Key Research Breakthroughs
                                </h2>
                                <ul style="margin: 0; padding-left: 20px;">
                                    {research_html}
                                </ul>
                            </td>
                        </tr>
                        ''') if research_html else ''}

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 28px; background-color: #F1F5F9; text-align: center; font-size: 12px; color: #64748B;">
                                <p style="margin: 0 0 8px 0;">
                                    Delivered automatically via AI Intelligence Radar at 07:00 AM IST.
                                </p>
                                <a href="{frontend_url}" style="color: #2563EB; text-decoration: none; font-weight: 600;">
                                    Open Full Research Dashboard &rarr;
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return html

def test_smtp_connection(
    host: str,
    port: int,
    username: Optional[str],
    password: Optional[str],
    use_ssl: bool = True
) -> Tuple[bool, str]:
    """Test connection and credentials against SMTP server (e.g. Hostinger)."""
    if not host or not port:
        return False, "SMTP Host and Port are required."
    if not username or not password:
        return False, "SMTP Username and Password are required."

    try:
        if use_ssl or port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            server.starttls()
            
        server.login(username, password)
        server.quit()
        return True, "SMTP connection and authentication successful!"
    except smtplib.SMTPAuthenticationError as e:
        return False, f"SMTP Authentication failed: {e.smtp_error.decode() if isinstance(e.smtp_error, bytes) else str(e)}"
    except Exception as e:
        return False, f"SMTP Connection error: {str(e)}"

def send_daily_report_email(
    report: DailyReport,
    recipient: Optional[str],
    db: Session
) -> Tuple[bool, str]:
    """
    Sends the daily report email to the configured recipient via Hostinger SMTP.
    Records success or failure in email_logs table.
    """
    target_recipient = recipient or settings.EMAIL_RECIPIENT
    if not target_recipient:
        err = "No recipient email address configured in settings."
        logger.warning(err)
        return False, err

    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        err = "SMTP credentials (SMTP_USERNAME, SMTP_PASSWORD) are not configured."
        # Log skipped/failed attempt
        log = EmailLog(
            report_id=report.id,
            recipient=target_recipient,
            subject=f"AI Intelligence Brief - {report.report_date}",
            status="failed",
            error_message=err
        )
        db.add(log)
        db.commit()
        return False, err

    subject = f"AI Intelligence Brief | {report.report_date} Report"
    html_content = generate_email_html(report, settings.FRONTEND_URL)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USERNAME
    msg["To"] = target_recipient
    msg.attach(MIMEText(html_content, "html"))

    try:
        if settings.SMTP_USE_SSL or settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            server.starttls()

        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USERNAME, [target_recipient], msg.as_string())
        server.quit()

        log = EmailLog(
            report_id=report.id,
            recipient=target_recipient,
            subject=subject,
            status="sent",
            error_message=None
        )
        db.add(log)
        db.commit()
        logger.info(f"Daily intelligence brief successfully dispatched to {target_recipient}")
        return True, "Email successfully sent!"
        
    except Exception as e:
        err_msg = str(e)
        logger.error(f"Failed to dispatch daily email: {err_msg}")
        log = EmailLog(
            report_id=report.id,
            recipient=target_recipient,
            subject=subject,
            status="failed",
            error_message=err_msg
        )
        db.add(log)
        db.commit()
        return False, f"Failed to send email: {err_msg}"
