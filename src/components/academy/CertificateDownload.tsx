import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

interface CertificateDownloadProps {
  holderName: string;
  pathName: string;
  issuedAt: string;
  score: number;
  modulesCompleted: number;
  totalTimeHours: number;
  certificateId: string;
  difficulty?: string;
  modulesDetail?: { title: string; type: string; score: number; time_minutes: number }[];
  skills?: { name: string; category: string; level: number }[];
  aptitudes?: string[];
  pathDescription?: string;
}

const VERIFY_BASE = "https://think-align-grow.lovable.app/verify";

export function CertificateDownload(props: CertificateDownloadProps) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");

      // Generate QR code data URL
      const verifyUrl = `${VERIFY_BASE}/${props.certificateId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 1, color: { dark: "#D4AF37", light: "#FFFDF5" } });

      const certNum = props.certificateId.slice(0, 8).toUpperCase();
      const dateStr = new Date(props.issuedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      const difficultyLabels: Record<string, string> = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" };

      // ─── PAGE 1 — Certificat principal (paysage A4) ───
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = 297;
      const H = 210;

      // Background
      pdf.setFillColor(255, 253, 245);
      pdf.rect(0, 0, W, H, "F");

      // Subtle watermark pattern
      pdf.setDrawColor(240, 230, 200);
      pdf.setLineWidth(0.15);
      for (let x = 20; x < W - 20; x += 15) {
        for (let y = 20; y < H - 20; y += 15) {
          pdf.line(x - 1.5, y, x + 1.5, y);
          pdf.line(x, y - 1.5, x, y + 1.5);
        }
      }

      // Double border
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(2);
      pdf.rect(6, 6, W - 12, H - 12);
      pdf.setLineWidth(0.6);
      pdf.rect(10, 10, W - 20, H - 20);

      // Corner diamond ornaments
      const drawDiamond = (cx: number, cy: number, s: number) => {
        pdf.setFillColor(212, 175, 55);
        const pts = [{ x: cx, y: cy - s }, { x: cx + s, y: cy }, { x: cx, y: cy + s }, { x: cx - s, y: cy }];
        // @ts-ignore
        pdf.triangle(pts[0].x, pts[0].y, pts[1].x, pts[1].y, pts[3].x, pts[3].y, "F");
        // @ts-ignore
        pdf.triangle(pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y, "F");
      };
      drawDiamond(16, 16, 3);
      drawDiamond(W - 16, 16, 3);
      drawDiamond(16, H - 16, 3);
      drawDiamond(W - 16, H - 16, 3);

      // Small decorative lines from corners
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.4);
      [[14, 22, 30, 22], [W - 14, 22, W - 30, 22], [14, H - 22, 30, H - 22], [W - 14, H - 22, W - 30, H - 22]].forEach(([x1, y1, x2, y2]) => pdf.line(x1, y1, x2, y2));

      // Brand
      pdf.setFontSize(11);
      pdf.setTextColor(180, 140, 40);
      pdf.setFont("helvetica", "bold");
      pdf.text("GROWTHINNOV", W / 2, 30, { align: "center" });
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(180, 150, 70);
      pdf.text("AI ACCELERATION", W / 2, 35, { align: "center" });

      // Decorative line under brand
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.5);
      pdf.line(W / 2 - 30, 38, W / 2 + 30, 38);
      pdf.setFillColor(212, 175, 55);
      pdf.circle(W / 2 - 30, 38, 0.8, "F");
      pdf.circle(W / 2 + 30, 38, 0.8, "F");
      pdf.circle(W / 2, 38, 1, "F");

      // Title
      pdf.setFontSize(30);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont("helvetica", "bold");
      pdf.text("CERTIFICAT DE RÉUSSITE", W / 2, 54, { align: "center" });

      // Decorative line
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.8);
      pdf.line(W / 2 - 50, 59, W / 2 - 5, 59);
      pdf.line(W / 2 + 5, 59, W / 2 + 50, 59);
      pdf.setFillColor(212, 175, 55);
      pdf.circle(W / 2, 59, 1.2, "F");

      // "Décerné à"
      pdf.setFontSize(12);
      pdf.setTextColor(130, 130, 130);
      pdf.setFont("helvetica", "italic");
      pdf.text("Décerné à", W / 2, 72, { align: "center" });

      // Holder name
      pdf.setFontSize(28);
      pdf.setTextColor(30, 30, 30);
      pdf.setFont("helvetica", "bold");
      pdf.text(props.holderName, W / 2, 85, { align: "center" });

      // Underline for name
      const nameWidth = pdf.getTextWidth(props.holderName);
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.4);
      pdf.line(W / 2 - nameWidth / 2 - 5, 88, W / 2 + nameWidth / 2 + 5, 88);

      // "Pour avoir complété"
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "normal");
      pdf.text("Pour avoir complété avec succès le parcours de formation", W / 2, 98, { align: "center" });

      // Path name
      pdf.setFontSize(18);
      pdf.setTextColor(180, 80, 30);
      pdf.setFont("helvetica", "bold");
      pdf.text(`« ${props.pathName} »`, W / 2, 110, { align: "center" });

      // Stats block
      const statsY = 124;
      pdf.setFillColor(250, 245, 230);
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(W / 2 - 80, statsY - 6, 160, 16, 3, 3, "FD");

      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.setFont("helvetica", "bold");
      const statsItems = [
        `Score : ${props.score}%`,
        `${props.modulesCompleted} modules`,
        `${props.totalTimeHours}h de formation`,
      ];
      if (props.difficulty && difficultyLabels[props.difficulty]) {
        statsItems.push(`Niveau : ${difficultyLabels[props.difficulty]}`);
      }
      pdf.text(statsItems.join("   •   "), W / 2, statsY + 4, { align: "center" });

      // QR Code (bottom right)
      const qrSize = 28;
      const qrX = W - 50;
      const qrY = H - 52;
      pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
      pdf.setFontSize(5);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont("helvetica", "normal");
      pdf.text("Scanner pour vérifier", qrX + qrSize / 2, qrY + qrSize + 3, { align: "center" });

      // Footer separator
      const footerY = H - 30;
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.3);
      pdf.line(30, footerY - 6, W - 30, footerY - 6);

      // Footer left — date
      pdf.setFontSize(8);
      pdf.setTextColor(130, 130, 130);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Date d'émission : ${dateStr}`, 35, footerY);

      // Footer center — cert number
      pdf.setFont("helvetica", "bold");
      pdf.text(`N° ${certNum}`, W / 2, footerY, { align: "center" });

      // Footer right — signature
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100, 100, 100);
      pdf.text("Direction pédagogique", W - 60, footerY - 3, { align: "center" });
      pdf.setDrawColor(80, 80, 80);
      pdf.setLineWidth(0.3);
      pdf.line(W - 85, footerY + 1, W - 35, footerY + 1);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(80, 80, 80);
      pdf.text("GROWTHINNOV", W - 60, footerY + 5, { align: "center" });

      // ─── PAGE 2 — Relevé de notes (portrait A4) ───
      if (props.modulesDetail && props.modulesDetail.length > 0) {
        pdf.addPage("a4", "portrait");
        const W2 = 210;
        const H2 = 297;

        // Background
        pdf.setFillColor(255, 253, 245);
        pdf.rect(0, 0, W2, H2, "F");

        // Border
        pdf.setDrawColor(212, 175, 55);
        pdf.setLineWidth(1.2);
        pdf.rect(8, 8, W2 - 16, H2 - 16);

        // Header band
        pdf.setFillColor(45, 45, 45);
        pdf.rect(8, 8, W2 - 16, 28, "F");

        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.text("GROWTHINNOV", 20, 24);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(200, 200, 200);
        pdf.text("AI ACCELERATION", 20, 30);

        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.text("RELEVÉ DE NOTES", W2 - 20, 24, { align: "right" });

        // Info block
        let y = 50;
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.setFont("helvetica", "bold");
        pdf.text("Apprenant :", 20, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(props.holderName, 55, y);

        y += 7;
        pdf.setFont("helvetica", "bold");
        pdf.text("Parcours :", 20, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(props.pathName, 55, y);

        y += 7;
        pdf.setFont("helvetica", "bold");
        pdf.text("Date :", 20, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(dateStr, 55, y);

        y += 7;
        pdf.setFont("helvetica", "bold");
        pdf.text("Certificat N° :", 20, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(certNum, 55, y);

        // Table header
        y += 14;
        pdf.setFillColor(250, 245, 230);
        pdf.setDrawColor(212, 175, 55);
        pdf.setLineWidth(0.3);
        pdf.rect(18, y - 5, W2 - 36, 9, "FD");

        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(80, 70, 40);
        pdf.text("MODULE", 22, y + 1);
        pdf.text("TYPE", 130, y + 1);
        pdf.text("SCORE", 155, y + 1);
        pdf.text("DURÉE", 175, y + 1);
        y += 9;

        // Table rows
        const typeLabels: Record<string, string> = { lesson: "Leçon", quiz: "Quiz", exercise: "Exercice", practice: "Pratique" };
        props.modulesDetail.forEach((mod, idx) => {
          if (idx % 2 === 0) {
            pdf.setFillColor(252, 250, 242);
            pdf.rect(18, y - 4, W2 - 36, 8, "F");
          }
          pdf.setFontSize(7.5);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(50, 50, 50);
          const title = mod.title.length > 55 ? mod.title.slice(0, 52) + "…" : mod.title;
          pdf.text(title, 22, y + 1);
          pdf.setTextColor(100, 100, 100);
          pdf.text(typeLabels[mod.type] || mod.type, 130, y + 1);

          // Score with color coding
          const scoreColor = mod.score >= 90 ? [34, 139, 34] : mod.score >= 70 ? [200, 150, 30] : [200, 50, 50];
          pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
          pdf.setFont("helvetica", "bold");
          pdf.text(`${mod.score}%`, 155, y + 1);

          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          pdf.text(`${mod.time_minutes} min`, 175, y + 1);
          y += 8;
        });

        // Bottom line
        pdf.setDrawColor(212, 175, 55);
        pdf.setLineWidth(0.3);
        pdf.line(18, y, W2 - 18, y);

        // Totals
        y += 8;
        pdf.setFillColor(45, 45, 45);
        pdf.roundedRect(18, y - 5, W2 - 36, 14, 2, 2, "F");
        pdf.setFontSize(9);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Score moyen : ${props.score}%`, 28, y + 3);
        pdf.text(`Temps total : ${props.totalTimeHours}h`, W2 / 2, y + 3, { align: "center" });
        pdf.text(`${props.modulesCompleted} modules`, W2 - 28, y + 3, { align: "right" });

        // QR Code on page 2
        const qr2Size = 22;
        const qr2X = W2 - 45;
        const qr2Y = H2 - 50;
        pdf.addImage(qrDataUrl, "PNG", qr2X, qr2Y, qr2Size, qr2Size);
        pdf.setFontSize(5);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont("helvetica", "normal");
        pdf.text("Scanner pour vérifier", qr2X + qr2Size / 2, qr2Y + qr2Size + 3, { align: "center" });
        pdf.text(`N° ${certNum}`, qr2X + qr2Size / 2, qr2Y + qr2Size + 7, { align: "center" });

        // Legal
        pdf.setFontSize(6);
        pdf.setTextColor(170, 170, 170);
        pdf.text("Ce document est généré électroniquement par GROWTHINNOV. Son authenticité peut être vérifiée via le QR code ci-dessus.", 20, H2 - 16);
      }

      // ─── PAGE 3 — Attestation de compétences (portrait A4) ───
      if ((props.skills && props.skills.length > 0) || (props.aptitudes && props.aptitudes.length > 0)) {
        pdf.addPage("a4", "portrait");
        const W3 = 210;
        const H3 = 297;

        // Background
        pdf.setFillColor(255, 253, 245);
        pdf.rect(0, 0, W3, H3, "F");

        // Border
        pdf.setDrawColor(212, 175, 55);
        pdf.setLineWidth(1.2);
        pdf.rect(8, 8, W3 - 16, H3 - 16);

        // Header band
        pdf.setFillColor(45, 45, 45);
        pdf.rect(8, 8, W3 - 16, 28, "F");

        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.text("GROWTHINNOV", 20, 24);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(200, 200, 200);
        pdf.text("AI ACCELERATION", 20, 30);

        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.text("ATTESTATION DE COMPÉTENCES", W3 - 20, 24, { align: "right" });

        // Nominative context
        let y3 = 50;
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.setFont("helvetica", "bold");
        pdf.text("Apprenant :", 20, y3);
        pdf.setFont("helvetica", "normal");
        pdf.text(props.holderName, 55, y3);

        y3 += 7;
        pdf.setFont("helvetica", "bold");
        pdf.text("Parcours :", 20, y3);
        pdf.setFont("helvetica", "normal");
        pdf.text(props.pathName, 55, y3);

        if (props.difficulty) {
          y3 += 7;
          pdf.setFont("helvetica", "bold");
          pdf.text("Niveau :", 20, y3);
          pdf.setFont("helvetica", "normal");
          pdf.text(difficultyLabels[props.difficulty] || props.difficulty, 55, y3);
        }

        y3 += 7;
        pdf.setFont("helvetica", "bold");
        pdf.text("Score global :", 20, y3);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${props.score}%`, 55, y3);

        // Path description
        if (props.pathDescription) {
          y3 += 10;
          pdf.setFillColor(250, 245, 230);
          pdf.setDrawColor(212, 175, 55);
          pdf.setLineWidth(0.3);
          const descLines = pdf.splitTextToSize(props.pathDescription, W3 - 46);
          const descH = Math.min(descLines.length * 4.5 + 6, 40);
          pdf.roundedRect(18, y3 - 4, W3 - 36, descH, 2, 2, "FD");
          pdf.setFontSize(7.5);
          pdf.setTextColor(80, 70, 40);
          pdf.text(descLines.slice(0, 7), 22, y3 + 2);
          y3 += descH + 4;
        }

        // Skills table
        if (props.skills && props.skills.length > 0) {
          y3 += 6;
          pdf.setFontSize(10);
          pdf.setTextColor(50, 50, 50);
          pdf.setFont("helvetica", "bold");
          pdf.text("COMPÉTENCES ACQUISES", 20, y3);
          y3 += 6;

          // Table header
          pdf.setFillColor(250, 245, 230);
          pdf.setDrawColor(212, 175, 55);
          pdf.setLineWidth(0.3);
          pdf.rect(18, y3 - 4, W3 - 36, 8, "FD");
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(80, 70, 40);
          pdf.text("COMPÉTENCE", 22, y3 + 1);
          pdf.text("CATÉGORIE", 110, y3 + 1);
          pdf.text("NIVEAU", 150, y3 + 1);
          y3 += 8;

          const catLabels: Record<string, string> = { technique: "Technique", transversale: "Transversale", "métier": "Métier" };

          props.skills.forEach((skill, idx) => {
            if (y3 > H3 - 50) return;
            if (idx % 2 === 0) {
              pdf.setFillColor(252, 250, 242);
              pdf.rect(18, y3 - 4, W3 - 36, 7, "F");
            }
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(50, 50, 50);
            pdf.text(skill.name.slice(0, 50), 22, y3);
            pdf.setTextColor(100, 100, 100);
            pdf.text(catLabels[skill.category] || skill.category, 110, y3);
            // Stars
            const starStr = "★".repeat(skill.level) + "☆".repeat(5 - skill.level);
            pdf.setTextColor(212, 175, 55);
            pdf.text(starStr, 150, y3);
            y3 += 7;
          });

          pdf.setDrawColor(212, 175, 55);
          pdf.setLineWidth(0.3);
          pdf.line(18, y3 - 2, W3 - 18, y3 - 2);
        }

        // Aptitudes
        if (props.aptitudes && props.aptitudes.length > 0) {
          y3 += 8;
          pdf.setFontSize(10);
          pdf.setTextColor(50, 50, 50);
          pdf.setFont("helvetica", "bold");
          pdf.text("APTITUDES DÉVELOPPÉES", 20, y3);
          y3 += 6;

          props.aptitudes.forEach((apt) => {
            if (y3 > H3 - 50) return;
            pdf.setFontSize(7.5);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(60, 60, 60);
            pdf.text(`• ${apt.slice(0, 80)}`, 22, y3);
            y3 += 5.5;
          });
        }

        // Module scores summary
        if (props.modulesDetail && props.modulesDetail.length > 0) {
          y3 += 8;
          if (y3 < H3 - 60) {
            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont("helvetica", "bold");
            pdf.text("SCORES PAR MODULE", 20, y3);
            y3 += 6;

            props.modulesDetail.forEach((mod) => {
              if (y3 > H3 - 50) return;
              pdf.setFontSize(7);
              pdf.setFont("helvetica", "normal");
              pdf.setTextColor(50, 50, 50);
              const title = mod.title.length > 45 ? mod.title.slice(0, 42) + "…" : mod.title;
              pdf.text(title, 22, y3);
              const sc = mod.score >= 90 ? [34, 139, 34] : mod.score >= 70 ? [200, 150, 30] : [200, 50, 50];
              pdf.setTextColor(sc[0], sc[1], sc[2]);
              pdf.setFont("helvetica", "bold");
              pdf.text(`${mod.score}%`, 160, y3);
              y3 += 5.5;
            });
          }
        }

        // QR Code on page 3
        const qr3Size = 20;
        const qr3X = W3 - 42;
        const qr3Y = H3 - 46;
        pdf.addImage(qrDataUrl, "PNG", qr3X, qr3Y, qr3Size, qr3Size);
        pdf.setFontSize(5);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont("helvetica", "normal");
        pdf.text("Scanner pour vérifier", qr3X + qr3Size / 2, qr3Y + qr3Size + 3, { align: "center" });

        // Legal
        pdf.setFontSize(6);
        pdf.setTextColor(170, 170, 170);
        pdf.text("Cette attestation certifie les compétences acquises dans le cadre du parcours mentionné.", 20, H3 - 16);
      }

      pdf.save(`Certificat_${props.pathName.replace(/\s+/g, "_")}.pdf`);
      toast.success("Certificat téléchargé !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={generatePDF} disabled={generating} variant="outline" size="sm" className="gap-2">
      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Télécharger PDF
    </Button>
  );
}
