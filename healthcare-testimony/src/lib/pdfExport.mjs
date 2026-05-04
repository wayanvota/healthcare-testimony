export function markdownToPdfBuffer(markdown) {
  const text = String(markdown || "Healthcare testimony report").replace(/\r/g, "");
  const lines = text.split("\n").slice(0, 95).map((line) => line.replace(/^#+\s*/, "").replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)"));
  const content = [
    "BT",
    "/F1 11 Tf",
    "50 760 Td",
    "14 TL",
    ...lines.flatMap((line, index) => {
      const value = escapePdf(line.slice(0, 110));
      return index === 0 ? [`(${value}) Tj`] : ["T*", `(${value}) Tj`];
    }),
    "ET"
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}

function escapePdf(text) {
  return String(text).replace(/[\\()]/g, "\\$&");
}
