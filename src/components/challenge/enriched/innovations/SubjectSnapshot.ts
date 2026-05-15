import html2canvas from "html2canvas";

/** Innovation #8 — Capture PNG d'un sujet (slots + artifacts visibles) */
export async function captureSubjectSnapshot(node: HTMLElement, fileName = "subject.png"): Promise<void> {
  const canvas = await html2canvas(node, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
