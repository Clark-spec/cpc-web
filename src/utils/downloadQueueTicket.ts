function displayQueueDate(value: string) {
  const parts = value.split("-").map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return value;
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Downloads a queue ticket with queue details only; it contains no student identity. */
export function downloadQueueTicket(queueType: string, office: string, queueNumber: number, queueDate: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 760;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.fillStyle = "#f1f5f9";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(48, 48, 1104, 664, 32);
  context.fill();

  context.fillStyle = "#1d4ed8";
  context.font = "700 28px Arial, sans-serif";
  context.fillText("CORDOVA PUBLIC COLLEGE", 96, 118);
  context.fillStyle = "#64748b";
  context.font = "600 24px Arial, sans-serif";
  context.fillText(`${queueType.toUpperCase()} QUEUE TICKET`, 96, 166);

  context.fillStyle = "#0f172a";
  context.font = "700 42px Arial, sans-serif";
  context.fillText(office, 96, 250, 1008);
  context.fillStyle = "#64748b";
  context.font = "600 24px Arial, sans-serif";
  context.fillText("YOUR QUEUE NUMBER", 96, 330);
  context.fillStyle = "#0f172a";
  context.font = "700 148px Arial, sans-serif";
  context.fillText(`#${queueNumber}`, 88, 500, 1000);

  context.strokeStyle = "#e2e8f0";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(96, 550);
  context.lineTo(1104, 550);
  context.stroke();
  context.fillStyle = "#334155";
  context.font = "600 28px Arial, sans-serif";
  context.fillText(`Request date: ${displayQueueDate(queueDate)}`, 96, 610, 1008);
  context.fillStyle = "#64748b";
  context.font = "24px Arial, sans-serif";
  context.fillText("Show this number to the office staff. This is your place in line, not an appointment time.", 96, 660, 1008);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFilename(queueType)}-${safeFilename(office)}-queue-${queueNumber}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
