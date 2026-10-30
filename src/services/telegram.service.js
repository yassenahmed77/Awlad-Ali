/**
 * Telegram Notification Dispatcher
 * Sends instant audio-enabled rich alerts to the Cashier's Telegram group or chat.
 */

export const telegramService = {
  /**
   * Format and send an order alert to Telegram
   */
  async notifyNewOrder(order) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const itemsText = order.items
      .map((item, index) => {
        const sizeStr = item.selectedSize ? ` [${item.selectedSize.name}]` : "";
        const addonsStr =
          item.selectedAddons && item.selectedAddons.length > 0
            ? `\n   ➕ إضافات: ${item.selectedAddons.map((a) => a.name).join("، ")}`
            : "";
        return `${index + 1}. <b>${item.name}</b> x${item.quantity}${sizeStr} - <i>${item.itemTotal} ج.م</i>${addonsStr}`;
      })
      .join("\n");

    const orderTypeLabel = order.orderType === "delivery" ? "🛵 دليفري وتوصيل" : "🏬 استلام من الفرع (تيك أواي)";
    const addressLine =
      order.orderType === "delivery" && order.customerAddress
        ? `\n📍 <b>العنوان:</b> ${order.customerAddress}`
        : "";

    const notesLine = order.notes ? `\n📝 <b>ملاحظات العميل:</b> ${order.notes}` : "";

    const messageHtml = `
🚨 <b>أوردر جديد - أولاد علي #${order.id}</b>
━━━━━━━━━━━━━━━━━
👤 <b>العميل:</b> ${order.customerName}
📞 <b>التليفون:</b> <code>${order.customerPhone}</code>
📦 <b>النوع:</b> ${orderTypeLabel}${addressLine}${notesLine}

🛒 <b>تفاصيل الطلب:</b>
${itemsText}
━━━━━━━━━━━━━━━━━
💵 <b>الإجمالي المطلوب: ${order.totalAmount} ج.م</b>
⏰ <b>الوقت:</b> ${new Date(order.createdAt).toLocaleTimeString("ar-EG")}
    `.trim();

    // If bot token or chat id is not configured yet, log formatted message for testing
    if (!botToken || !chatId) {
      console.log("ℹ️ [Telegram Alert Simulated] No TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID provided yet.");
      console.log("---- Telegram Message Content ----\n" + messageHtml + "\n---------------------------------");
      return { success: true, simulated: true, messageHtml };
    }

    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageHtml,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        console.error("Telegram API Error:", data);
        return { success: false, error: data.description || "Failed to send telegram alert" };
      }

      return { success: true, data };
    } catch (err) {
      console.error("Error dispatching telegram notification:", err);
      return { success: false, error: err.message };
    }
  },
};

