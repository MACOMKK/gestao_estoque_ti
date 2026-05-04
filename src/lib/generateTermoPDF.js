import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryLabels = {
  notebook: 'Notebook', monitor: 'Monitor', tv: 'TV', desktop: 'Desktop',
  impressora: 'Impressora', telefone: 'Telefone', headset: 'Headset',
  teclado: 'Teclado', mouse: 'Mouse', nobreak: 'Nobreak', switch: 'Switch',
  roteador: 'Roteador', servidor: 'Servidor', tablet: 'Tablet', outros: 'Outros',
};

const conditionLabels = {
  novo: 'Novo', bom: 'Bom', regular: 'Regular', ruim: 'Ruim',
};

export function generateTermoPDF(employee, assets) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Header bar
  doc.setFillColor(230, 0, 18); // MACOM Red
  doc.rect(0, 0, pageWidth, 12, 'F');
  
  // Company info
  y = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(230, 0, 18);
  doc.text('MACOM', margin, y);
  
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text('MITSUBISHI MOTORS | Gestão de Ativos TI', margin, y + 6);
  
  // Title
  y = 48;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 6, contentWidth, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text('TERMO DE RESPONSABILIDADE E POSSE DE EQUIPAMENTO', pageWidth / 2, y + 2, { align: 'center' });

  // Date
  y = 68;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.text(`Belém/PA, ${today}`, pageWidth - margin, y, { align: 'right' });

  // Employee section
  y = 80;
  doc.setFillColor(230, 0, 18);
  doc.rect(margin, y, 3, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('DADOS DO COLABORADOR', margin + 7, y + 7);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  const empData = [
    ['Nome:', employee.full_name || '—'],
    ['CPF:', employee.cpf || '—'],
    ['Email:', employee.email || '—'],
    ['Departamento:', employee.department || '—'],
    ['Cargo:', employee.role || '—'],
  ];

  empData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 40, y);
    y += 7;
  });

  // Assets section
  y += 8;
  doc.setFillColor(230, 0, 18);
  doc.rect(margin, y, 3, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('EQUIPAMENTOS SOB RESPONSABILIDADE', margin + 7, y + 7);
  y += 18;

  // Table header
  const colWidths = [25, 50, 40, 30, 25];
  const headers = ['Código', 'Equipamento', 'Nº Série', 'Marca/Modelo', 'Estado'];
  
  doc.setFillColor(30, 30, 30);
  doc.rect(margin, y - 5, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  
  let x = margin + 2;
  headers.forEach((h, i) => {
    doc.text(h, x, y);
    x += colWidths[i];
  });

  y += 6;
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  assets.forEach((asset, idx) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    
    const bgColor = idx % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
    doc.setFillColor(...bgColor);
    doc.rect(margin, y - 4, contentWidth, 8, 'F');
    
    x = margin + 2;
    const row = [
      asset.tag || '—',
      `${categoryLabels[asset.category] || ''} ${asset.name || ''}`.trim(),
      asset.serial_number || '—',
      `${asset.brand || ''} ${asset.model || ''}`.trim() || '—',
      conditionLabels[asset.condition] || '—',
    ];
    row.forEach((cell, i) => {
      const text = cell.length > 22 ? cell.substring(0, 20) + '...' : cell;
      doc.text(text, x, y);
      x += colWidths[i];
    });
    y += 8;
  });

  // Terms
  y += 12;
  if (y > 200) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(230, 0, 18);
  doc.rect(margin, y, 3, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('TERMOS E CONDIÇÕES', margin + 7, y + 7);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  const terms = [
    '1. O colaborador declara ter recebido o(s) equipamento(s) listado(s) acima em perfeito estado de funcionamento e conservação.',
    '2. O colaborador compromete-se a zelar pela conservação e bom uso do(s) equipamento(s), utilizando-o(s) exclusivamente para fins profissionais.',
    '3. É vedada a cessão, empréstimo ou transferência do(s) equipamento(s) a terceiros sem prévia autorização da MACOM.',
    '4. Em caso de dano, perda ou furto, o colaborador deverá comunicar imediatamente ao departamento de TI.',
    '5. O colaborador compromete-se a devolver o(s) equipamento(s) em bom estado ao término do vínculo empregatício ou quando solicitado.',
    '6. O descumprimento deste termo poderá acarretar em medidas administrativas e/ou ressarcimento dos valores correspondentes.',
  ];

  terms.forEach(term => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const lines = doc.splitTextToSize(term, contentWidth - 10);
    doc.text(lines, margin + 5, y);
    y += lines.length * 4.5 + 3;
  });

  // Signatures
  y += 20;
  if (y > 235) {
    doc.addPage();
    y = 40;
  }

  doc.setDrawColor(180, 180, 180);
  
  // Left signature
  const sigWidth = (contentWidth - 20) / 2;
  doc.line(margin, y, margin + sigWidth, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(employee.full_name || 'Colaborador', margin + sigWidth / 2, y + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Colaborador', margin + sigWidth / 2, y + 11, { align: 'center' });

  // Right signature
  const rightX = margin + sigWidth + 20;
  doc.line(rightX, y, rightX + sigWidth, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text('Departamento de TI', rightX + sigWidth / 2, y + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('MACOM Mitsubishi', rightX + sigWidth / 2, y + 11, { align: 'center' });

  // Footer bar
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(230, 0, 18);
  doc.rect(0, pageH - 8, pageWidth, 8, 'F');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('MACOM Mitsubishi Motors — Gestão de Ativos TI', pageWidth / 2, pageH - 3, { align: 'center' });

  doc.save(`Termo_${(employee.full_name || 'colaborador').replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}