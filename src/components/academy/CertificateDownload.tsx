import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
}

export function CertificateDownload(props: CertificateDownloadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = 297;
      const H = 210;

      // Background
      pdf.setFillColor(255, 253, 245);
      pdf.rect(0, 0, W, H, "F");

      // Gold border
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(1.5);
      pdf.rect(8, 8, W - 16, H - 16);
      pdf.setLineWidth(0.5);
      pdf.rect(12, 12, W - 24, H - 24);

      // Corner decorations
      const corners = [[16, 16], [W - 16, 16], [16, H - 16], [W - 16, H - 16]];
      pdf.setFillColor(212, 175, 55);
      corners.forEach(([x, y]) => {
        pdf.circle(x, y, 2, "F");
      });

      // Header brand
      pdf.setFontSize(9);
      pdf.setTextColor(180, 140, 40);
      pdf.setFont("helvetica", "bold");
      pdf.text("GROWTHINNOV", W / 2, 28, { align: "center" });
      pdf.setFontSize(6);
      pdf.setFont("helvetica", "normal");
      pdf.text("AI ACCELERATION", W / 2, 33, { align: "center" });

      // Title
      pdf.setFontSize(28);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont("helvetica", "bold");
      pdf.text("CERTIFICAT DE RÉUSSITE", W / 2, 52, { align: "center" });

      // Decorative line
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.8);
      pdf.line(W / 2 - 40, 57, W / 2 + 40, 57);

      // "Décerné à"
      pdf.setFontSize(11);
      pdf.setTextColor(120, 120, 120);
      pdf.setFont("helvetica", "normal");
      pdf.text("Décerné à", W / 2, 68, { align: "center" });

      // Holder name
      pdf.setFontSize(24);
      pdf.setTextColor(30, 30, 30);
      pdf.setFont("helvetica", "bold");
      pdf.text(props.holderName, W / 2, 80, { align: "center" });

      // "Pour avoir complété"
      pdf.setFontSize(11);
      pdf.setTextColor(120, 120, 120);
      pdf.setFont("helvetica", "normal");
      pdf.text("Pour avoir complété avec succès le parcours", W / 2, 92, { align: "center" });

      // Path name
      pdf.setFontSize(16);
      pdf.setTextColor(212, 100, 45);
      pdf.setFont("helvetica", "bold");
      pdf.text(props.pathName, W / 2, 102, { align: "center" });

      // Stats line
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "normal");
      const statsLine = `Score global : ${props.score}%  •  ${props.modulesCompleted} modules  •  ${props.totalTimeHours}h de formation`;
      pdf.text(statsLine, W / 2, 114, { align: "center" });

      // Modules detail table
      if (props.modulesDetail && props.modulesDetail.length > 0) {
        let y = 124;
        pdf.setDrawColor(212, 175, 55);
        pdf.setLineWidth(0.3);
        pdf.line(60, y, W - 60, y);
        y += 5;
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(80, 80, 80);
        pdf.text("MODULE", 65, y);
        pdf.text("TYPE", 190, y);
        pdf.text("SCORE", 215, y);
        pdf.text("DURÉE", 235, y);
        y += 3;
        pdf.setLineWidth(0.2);
        pdf.line(60, y, W - 60, y);
        y += 4;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        props.modulesDetail.forEach((mod) => {
          pdf.setTextColor(60, 60, 60);
          const title = mod.title.length > 55 ? mod.title.slice(0, 52) + "..." : mod.title;
          pdf.text(title, 65, y);
          pdf.setTextColor(120, 120, 120);
          pdf.text(mod.type, 190, y);
          pdf.text(`${mod.score}%`, 215, y);
          pdf.text(`${mod.time_minutes}min`, 235, y);
          y += 5;
        });
      }

      // Footer
      const footerY = H - 28;
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.3);
      pdf.line(40, footerY - 5, W - 40, footerY - 5);

      pdf.setFontSize(8);
      pdf.setTextColor(130, 130, 130);
      pdf.setFont("helvetica", "normal");

      const dateStr = new Date(props.issuedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      pdf.text(`Date : ${dateStr}`, 50, footerY);
      pdf.text(`N° ${props.certificateId.slice(0, 8).toUpperCase()}`, W / 2, footerY, { align: "center" });

      if (props.difficulty) {
        pdf.text(`Niveau : ${props.difficulty}`, W - 50, footerY, { align: "right" });
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
