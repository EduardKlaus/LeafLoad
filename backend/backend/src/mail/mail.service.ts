import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export type OrderEmailData = {
    // Restaurant owner info
    ownerEmail: string;
    restaurantName: string;

    // Customer info
    customerName: string;
    customerAddress: string;
    customerRegion: string;

    // Order info
    orderId: number;
    orderDate: Date;
    deliveryTimeMin: number | null;

    // Items
    items: {
        title: string;
        quantity: number;
        price: number; // single item price
    }[];
};

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        const host = process.env.SMTP_HOST;

        if (host) {
            this.transporter = nodemailer.createTransport({
                host,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: Number(process.env.SMTP_PORT) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
            this.logger.log(`Mail transport configured: ${host}:${process.env.SMTP_PORT}`);
        } else {
            this.logger.warn(
                'SMTP_HOST not configured – emails will be logged to console only.',
            );
        }
    }

    /**
     * Sends an order notification email to the restaurant owner.
     * Fire-and-forget: errors are logged but never thrown.
     */
    async sendOrderNotification(data: OrderEmailData): Promise<void> {
        const html = this.buildOrderEmail(data);
        const subject = `Neue Bestellung #${data.orderId} – ${data.restaurantName}`;
        const from = process.env.SMTP_FROM || 'Leaf & Load <noreply@leafload.app>';

        if (!this.transporter) {
            // No SMTP configured → log the email to console
            this.logger.log('──── EMAIL (console mode) ────');
            this.logger.log(`To:      ${data.ownerEmail}`);
            this.logger.log(`Subject: ${subject}`);
            this.logger.log(`Body:\n${this.buildOrderPlainText(data)}`);
            this.logger.log('──── END EMAIL ────');
            return;
        }

        try {
            const info = await this.transporter.sendMail({
                from,
                to: data.ownerEmail,
                subject,
                html,
            });
            this.logger.log(`Order email sent to ${data.ownerEmail} (messageId: ${info.messageId})`);
        } catch (err) {
            this.logger.error(`Failed to send order email to ${data.ownerEmail}`, err);
        }
    }

    // ──── Email Templates ────

    private buildOrderEmail(data: OrderEmailData): string {
        const total = data.items.reduce(
            (sum, i) => sum + i.quantity * i.price,
            0,
        );

        const orderTime = new Date(data.orderDate).toLocaleString('de-AT', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });

        const deliveryEstimate = data.deliveryTimeMin
            ? `ca. ${data.deliveryTimeMin} Minuten`
            : 'Nicht verfügbar';

        const itemRows = data.items
            .map(
                (i) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${i.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">€${(i.price).toFixed(2)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">€${(i.quantity * i.price).toFixed(2)}</td>
        </tr>`,
            )
            .join('');

        return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background:#f4f4f4">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4a7c59,#6b9e7a);padding:24px 32px;color:#fff">
      <h1 style="margin:0;font-size:22px">🌿 Neue Bestellung #${data.orderId}</h1>
      <p style="margin:6px 0 0;opacity:.9;font-size:14px">${data.restaurantName}</p>
    </div>

    <div style="padding:24px 32px">

      <!-- Customer Info -->
      <h2 style="font-size:16px;color:#333;margin:0 0 12px;border-bottom:2px solid #4a7c59;padding-bottom:6px">👤 Kunde</h2>
      <table style="width:100%;font-size:14px;margin-bottom:20px">
        <tr><td style="padding:4px 0;color:#666;width:140px">Name:</td><td style="padding:4px 0"><strong>${data.customerName}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#666">Lieferadresse:</td><td style="padding:4px 0">${data.customerAddress || '—'}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Region:</td><td style="padding:4px 0">${data.customerRegion || '—'}</td></tr>
      </table>

      <!-- Timing -->
      <h2 style="font-size:16px;color:#333;margin:0 0 12px;border-bottom:2px solid #4a7c59;padding-bottom:6px">🕐 Zeitinfo</h2>
      <table style="width:100%;font-size:14px;margin-bottom:20px">
        <tr><td style="padding:4px 0;color:#666;width:140px">Bestellt am:</td><td style="padding:4px 0"><strong>${orderTime}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#666">Geschätzte Lieferzeit:</td><td style="padding:4px 0"><strong>${deliveryEstimate}</strong></td></tr>
      </table>

      <!-- Items -->
      <h2 style="font-size:16px;color:#333;margin:0 0 12px;border-bottom:2px solid #4a7c59;padding-bottom:6px">🛒 Bestellung</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
        <thead>
          <tr style="background:#f8f8f8">
            <th style="padding:8px 12px;text-align:left">Artikel</th>
            <th style="padding:8px 12px;text-align:center">Menge</th>
            <th style="padding:8px 12px;text-align:right">Preis</th>
            <th style="padding:8px 12px;text-align:right">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:12px;text-align:right;font-weight:bold;font-size:16px;border-top:2px solid #4a7c59">Gesamtpreis:</td>
            <td style="padding:12px;text-align:right;font-weight:bold;font-size:16px;color:#4a7c59;border-top:2px solid #4a7c59">€${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

    </div>

    <!-- Footer -->
    <div style="background:#f8f8f8;padding:16px 32px;text-align:center;font-size:12px;color:#999">
      Diese E-Mail wurde automatisch von Leaf &amp; Load versendet.
    </div>
  </div>
</body>
</html>`;
    }

    private buildOrderPlainText(data: OrderEmailData): string {
        const total = data.items.reduce(
            (sum, i) => sum + i.quantity * i.price,
            0,
        );

        const orderTime = new Date(data.orderDate).toLocaleString('de-AT', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });

        const deliveryEstimate = data.deliveryTimeMin
            ? `ca. ${data.deliveryTimeMin} Minuten`
            : 'Nicht verfügbar';

        const itemLines = data.items
            .map((i) => `  ${i.quantity}x ${i.title}  €${(i.quantity * i.price).toFixed(2)}`)
            .join('\n');

        return [
            `Neue Bestellung #${data.orderId} – ${data.restaurantName}`,
            '',
            `Kunde: ${data.customerName}`,
            `Adresse: ${data.customerAddress || '—'}`,
            `Region: ${data.customerRegion || '—'}`,
            '',
            `Bestellt am: ${orderTime}`,
            `Geschätzte Lieferzeit: ${deliveryEstimate}`,
            '',
            `Bestellung:`,
            itemLines,
            '',
            `Gesamtpreis: €${total.toFixed(2)}`,
        ].join('\n');
    }
}
