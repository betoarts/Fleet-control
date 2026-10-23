import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Reservation } from '../types';
import { ReportFilters } from './adminService';

export interface PDFReportOptions {
  companyName?: string;
  generatedBy?: string;
}

export const pdfReportService = {
  generateDetailedReport(
    reportData: Reservation[],
    filters: ReportFilters,
    options?: PDFReportOptions
  ) {
    if (!reportData || reportData.length === 0) {
      alert('Não há dados para exportar no período ou filtros selecionados.');
      return;
    }

    const companyName = options?.companyName || 'NBAPARK FLEET CONTROL';
    const generatedBy = options?.generatedBy || 'Administrador';

    // Landscape A4: 297mm x 210mm
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // 1. HEADER BAR
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 24, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(companyName.toUpperCase(), margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('RELATÓRIO EXECUTIVO DE CONTROLE DE FROTA & RESERVAS', margin, 18);

    // Metadata Right-Aligned
    const now = new Date();
    const emissionDateStr = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`Emissão: ${emissionDateStr}`, pageWidth - margin, 11, { align: 'right' });
    doc.text(`Emitido por: ${generatedBy}`, pageWidth - margin, 18, { align: 'right' });

    // 2. FILTERS SUMMARY BADGE ROW
    let currentY = 32;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text('FILTROS APLICADOS:', margin + 4, currentY + 6);

    doc.setFont('helvetica', 'normal');
    const filterParts: string[] = [];
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate).toLocaleDateString('pt-BR') : 'Início';
      const end = filters.endDate ? new Date(filters.endDate).toLocaleDateString('pt-BR') : 'Hoje';
      filterParts.push(`Período: ${start} até ${end}`);
    } else {
      filterParts.push('Período: Histórico Completo');
    }

    if (filters.vehicle) {
      filterParts.push(`Veículo: ${filters.vehicle}`);
    } else {
      filterParts.push('Veículos: Todos');
    }

    if (filters.status) {
      const statusLabel = filters.status === 'completed' ? 'Finalizadas' : 'Ativas';
      filterParts.push(`Status: ${statusLabel}`);
    } else {
      filterParts.push('Status: Todos');
    }

    doc.setTextColor(71, 85, 105);
    doc.text(filterParts.join('   |   '), margin + 4, currentY + 11);

    // 3. STATISTICAL KPI CARDS
    currentY += 18;
    const totalTrips = reportData.length;
    const completedTrips = reportData.filter(r => r.status === 'completed').length;
    const activeTrips = reportData.filter(r => r.status === 'active').length;

    let totalKm = 0;
    let tripsWithKm = 0;
    reportData.forEach(r => {
      if (r.endOdometer && r.endOdometer >= r.startOdometer) {
        totalKm += (r.endOdometer - r.startOdometer);
        tripsWithKm++;
      }
    });
    const avgKm = tripsWithKm > 0 ? (totalKm / tripsWithKm).toFixed(1) : '0';

    const kpiCards = [
      { label: 'TOTAL DE VIAGENS', value: totalTrips.toString(), sub: `${completedTrips} concluídas / ${activeTrips} ativas` },
      { label: 'KM TOTAL RODADO', value: `${totalKm.toLocaleString('pt-BR')} km`, sub: `${tripsWithKm} viagens com odômetro` },
      { label: 'MÉDIA KM / VIAGEM', value: `${avgKm} km`, sub: 'Distância média apurada' },
      { label: 'TAXA DE CONCLUSÃO', value: totalTrips > 0 ? `${Math.round((completedTrips / totalTrips) * 100)}%` : '0%', sub: `${completedTrips} de ${totalTrips} viagens` },
    ];

    const cardGap = 4;
    const totalGap = cardGap * (kpiCards.length - 1);
    const cardWidth = (pageWidth - margin * 2 - totalGap) / kpiCards.length;
    const cardHeight = 16;

    kpiCards.forEach((kpi, idx) => {
      const cardX = margin + idx * (cardWidth + cardGap);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, cardX + 3.5, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(kpi.value, cardX + 3.5, currentY + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(kpi.sub, cardX + 3.5, currentY + 14);
    });

    // 4. DETAILED DATA TABLE
    currentY += cardHeight + 6;

    const tableHeaders = [
      ['#', 'Motorista', 'Veículo', 'Saída', 'Retorno', 'KM Ini', 'KM Fim', 'KM Rodado', 'Status', 'Itinerário / Destino']
    ];

    const tableRows = reportData.map((trip, index) => {
      const start = new Date(trip.startTime);
      const end = trip.endTime ? new Date(trip.endTime) : null;
      const startFormatted = `${start.toLocaleDateString('pt-BR')} ${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      const endFormatted = end
        ? `${end.toLocaleDateString('pt-BR')} ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        : 'Em aberto';

      const kmRodado = (trip.endOdometer && trip.endOdometer >= trip.startOdometer)
        ? (trip.endOdometer - trip.startOdometer).toLocaleString('pt-BR')
        : '-';

      const statusText = trip.status === 'completed' ? 'Finalizada' : 'Ativa';

      return [
        (index + 1).toString(),
        trip.employeeName || 'Não informado',
        trip.vehicle || 'Polo Volkswagen',
        startFormatted,
        endFormatted,
        trip.startOdometer?.toLocaleString('pt-BR') || '0',
        trip.endOdometer ? trip.endOdometer.toLocaleString('pt-BR') : '-',
        kmRodado,
        statusText,
        trip.itinerary || 'Sem itinerário informado'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 14, top: 26 },
      head: tableHeaders,
      body: tableRows,
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2,
        valign: 'middle',
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [30, 41, 59], // slate-800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
      },
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' }, // #
        1: { cellWidth: 32 }, // Motorista
        2: { cellWidth: 28 }, // Veículo
        3: { cellWidth: 25 }, // Saída
        4: { cellWidth: 25 }, // Retorno
        5: { cellWidth: 16, halign: 'right' }, // KM Inicial
        6: { cellWidth: 16, halign: 'right' }, // KM Final
        7: { cellWidth: 18, halign: 'right', fontStyle: 'bold' }, // KM Rodado
        8: { cellWidth: 19, halign: 'center', fontStyle: 'bold' }, // Status
        9: { cellWidth: 'auto' }, // Itinerário / Destino (Wrap automático dinâmico)
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      didParseCell: (data) => {
        // Estilizar coluna Status com cores
        if (data.section === 'body' && data.column.index === 8) {
          if (data.cell.raw === 'Finalizada') {
            data.cell.styles.textColor = [22, 101, 52]; // green-800
          } else {
            data.cell.styles.textColor = [29, 78, 216]; // blue-700
          }
        }
        // Estilizar coluna KM Rodado
        if (data.section === 'body' && data.column.index === 7 && data.cell.raw !== '-') {
          data.cell.styles.textColor = [15, 23, 42];
        }
      },
      didDrawPage: (data) => {
        // Redesenhar mini cabeçalho caso quebre para nova página
        if (data.pageNumber > 1) {
          doc.setFillColor(15, 23, 42);
          doc.rect(0, 0, pageWidth, 14, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(255, 255, 255);
          doc.text(`${companyName} - Relatório Executivo de Frota (Continuação)`, margin, 9);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(203, 213, 225);
          doc.text(`Página ${data.pageNumber}`, pageWidth - margin, 9, { align: 'right' });
        }

        // Rodapé em todas as páginas
        const footerY = pageHeight - 6;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('NBAPARK Fleet Control • Documento Confidencial • Uso Interno', margin, footerY + 1.5);

        const pageStr = `Página ${data.pageNumber}`;
        doc.text(pageStr, pageWidth - margin, footerY + 1.5, { align: 'right' });
      },
    });

    // 5. SALVAR ARQUIVO
    const fileDate = now.toISOString().split('T')[0];
    doc.save(`relatorio_executivo_frota_${fileDate}.pdf`);
  }
};
