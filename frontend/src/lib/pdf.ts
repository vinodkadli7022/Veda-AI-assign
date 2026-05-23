import jsPDF from 'jspdf';
import { GeneratedPaper, QUESTION_TYPE_LABELS } from '@/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export async function exportToPDF(paper: GeneratedPaper, assessmentTitle: string): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const colors = {
    primary: [67, 56, 202] as [number, number, number],
    dark: [15, 23, 42] as [number, number, number],
    gray: [71, 85, 105] as [number, number, number],
    lightGray: [241, 245, 249] as [number, number, number],
    border: [226, 232, 240] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    accent: [99, 102, 241] as [number, number, number],
  };

  function checkPageBreak(needed: number): void {
    if (y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  }

  function addLine(yPos: number, color: [number, number, number] = colors.border): void {
    pdf.setDrawColor(...color);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
  }

  // ─── Header ───────────────────────────────────────────────
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth, 45, 'F');

  pdf.setTextColor(...colors.white);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(paper.title, pageWidth / 2, 18, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${paper.subject} | ${paper.gradeLevel}`, pageWidth / 2, 27, { align: 'center' });

  pdf.setFontSize(9);
  pdf.text(
    `Generated: ${formatDate(paper.generatedAt)}`,
    pageWidth / 2,
    35,
    { align: 'center' }
  );

  y = 52;

  // ─── Info Row ─────────────────────────────────────────────
  pdf.setFillColor(...colors.lightGray);
  pdf.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');

  const infoItems = [
    { label: 'Duration', value: `${paper.duration} mins` },
    { label: 'Total Marks', value: `${paper.totalMarks}` },
    { label: 'Date', value: formatDate(paper.generatedAt) },
    { label: 'Name', value: '____________________' },
  ];

  const colWidth = contentWidth / infoItems.length;
  infoItems.forEach((item, i) => {
    const x = margin + i * colWidth + colWidth / 2;
    pdf.setTextColor(...colors.gray);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(item.label.toUpperCase(), x, y + 5, { align: 'center' });
    pdf.setTextColor(...colors.dark);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.value, x, y + 11, { align: 'center' });
  });
  y += 20;

  // ─── Instructions ─────────────────────────────────────────
  if (paper.instructions?.length) {
    pdf.setTextColor(...colors.primary);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INSTRUCTIONS', margin, y);
    y += 5;
    addLine(y);
    y += 4;

    paper.instructions.forEach((inst, i) => {
      checkPageBreak(8);
      pdf.setTextColor(...colors.dark);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(`${i + 1}. ${inst}`, contentWidth - 5);
      pdf.text(lines, margin + 2, y);
      y += lines.length * 5 + 1;
    });
    y += 6;
  }

  // ─── Sections ─────────────────────────────────────────────
  paper.sections.forEach((section, sIdx) => {
    checkPageBreak(20);

    // Section header
    pdf.setFillColor(...colors.accent);
    pdf.rect(margin, y, contentWidth, 10, 'F');
    pdf.setTextColor(...colors.white);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(
      `Section ${String.fromCharCode(65 + sIdx)}: ${section.title}`,
      margin + 3,
      y + 7
    );
    pdf.text(`[${section.sectionMarks} Marks]`, pageWidth - margin - 3, y + 7, {
      align: 'right',
    });
    y += 14;

    section.questions.forEach((q, qIdx) => {
      checkPageBreak(15);

      // Question number + text
      pdf.setTextColor(...colors.dark);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'bold');
      const questionNum = `Q${qIdx + 1}.`;
      const questionLines = pdf.splitTextToSize(
        `${questionNum} ${q.question}`,
        contentWidth - 15
      );

      // Marks badge
      pdf.setFillColor(...colors.lightGray);
      pdf.setDrawColor(...colors.border);
      pdf.roundedRect(pageWidth - margin - 20, y - 3, 20, 7, 1, 1, 'FD');
      pdf.setTextColor(...colors.gray);
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${q.marks} mk${q.marks > 1 ? 's' : ''}`, pageWidth - margin - 10, y + 1, {
        align: 'center',
      });

      pdf.setTextColor(...colors.dark);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(questionLines, margin + 2, y);
      y += questionLines.length * 5.5 + 2;

      // Options (MCQ / True-False)
      if (q.options && q.options.length > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);

        if (q.type === 'true_false') {
          // Inline True/False bubbles
          const opts = ['True', 'False'];
          opts.forEach((opt, oi) => {
            checkPageBreak(8);
            pdf.setDrawColor(...colors.border);
            pdf.circle(margin + 6 + oi * 35, y, 2, 'D');
            pdf.setTextColor(...colors.dark);
            pdf.text(opt, margin + 10 + oi * 35, y + 0.8);
          });
          y += 8;
        } else {
          q.options.forEach((opt, oi) => {
            checkPageBreak(7);
            pdf.setDrawColor(...colors.border);
            pdf.circle(margin + 6, y, 2, 'D');
            pdf.setTextColor(...colors.dark);
            const optLines = pdf.splitTextToSize(opt, contentWidth - 18);
            pdf.text(optLines, margin + 10, y + 0.8);
            y += optLines.length * 5 + 1;
          });
        }
      } else if (q.type === 'short_answer') {
        // Answer lines
        for (let l = 0; l < 2; l++) {
          checkPageBreak(7);
          addLine(y + 4, colors.border);
          y += 8;
        }
      } else if (q.type === 'long_answer') {
        for (let l = 0; l < 5; l++) {
          checkPageBreak(7);
          addLine(y + 4, colors.border);
          y += 8;
        }
      } else if (q.type === 'fill_in_blank') {
        // Lines already in question text
        y += 2;
      }

      y += 4;
      // Light separator between questions
      if (qIdx < section.questions.length - 1) {
        addLine(y - 2);
        y += 2;
      }
    });

    y += 8;
  });

  // ─── Footer ───────────────────────────────────────────────
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFillColor(...colors.lightGray);
    pdf.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    pdf.setTextColor(...colors.gray);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Generated by VedaAI Assessment Creator', margin, pageHeight - 4);
    pdf.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 4, {
      align: 'right',
    });
  }

  const fileName = `${assessmentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_assessment.pdf`;
  pdf.save(fileName);
}
