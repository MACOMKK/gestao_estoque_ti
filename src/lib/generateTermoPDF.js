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

const LOGO_URL = 'https://res.cloudinary.com/drevbr5eq/image/upload/q_auto/f_auto/v1777603989/logo_vermelha_e2aob2.png';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export async function generateTermoPDF(employee, assets, options = {}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Header bar
  doc.setFillColor(230, 0, 18);
  doc.rect(0, 0, pageWidth, 12, 'F');

  // Logo
  try {
    const logo = await loadImage(LOGO_URL);
    doc.addImage(logo, 'PNG', margin, 15, 14, 14);
  } catch {
    // Keep generating PDF even if logo fails
  }

  // Company info
  y = 23;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(230, 0, 18);
  doc.text('MACOM', margin + 18, y);

  doc.setFontSize(9.5);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text('MITSUBISHI MOTORS | Gestao de Ativos TI', margin + 18, y + 6);
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`Belem/PA, ${today}`, pageWidth - margin, 8, { align: 'right' });

  // Title
  y = 42;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 6, contentWidth, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('TERMO DE RESPONSABILIDADE E POSSE DE EQUIPAMENTO', pageWidth / 2, y + 2, { align: 'center' });

  // Employee section
  y = 56;
  doc.setFillColor(230, 0, 18);
  doc.rect(margin, y, 3, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('DADOS DO COLABORADOR', margin + 7, y + 7);

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  const empData = [
    ['Nome:', employee.full_name || '-'],
    ['CPF:', employee.cpf || '-'],
    ['Email:', employee.email || '-'],
    ['Departamento:', employee.department || '-'],
    ['Cargo:', employee.role || '-'],
  ];

  empData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 40, y);
    y += 5.6;
  });

  // Assets section
  y += 5;
  doc.setFillColor(230, 0, 18);
  doc.rect(margin, y, 3, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('EQUIPAMENTOS SOB RESPONSABILIDADE', margin + 7, y + 7);
  y += 13;

  const colWidths = [25, 50, 40, 30, 25];
  const headers = ['Codigo', 'Equipamento', 'N Serie', 'Marca/Modelo', 'Estado'];

  doc.setFillColor(30, 30, 30);
  doc.rect(margin, y - 4.5, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  let x = margin + 2;
  headers.forEach((h, i) => {
    doc.text(h, x, y);
    x += colWidths[i];
  });

  y += 5.2;
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);

  const maxRows = 9;
  const shownAssets = assets.slice(0, maxRows);
  shownAssets.forEach((asset, idx) => {

    const bgColor = idx % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
    doc.setFillColor(...bgColor);
    doc.rect(margin, y - 3.4, contentWidth, 6.6, 'F');

    x = margin + 2;
    const row = [
      asset.tag || '-',
      `${categoryLabels[asset.category] || ''} ${asset.name || ''}`.trim(),
      asset.serial_number || '-',
      `${asset.brand || ''} ${asset.model || ''}`.trim() || '-',
      conditionLabels[asset.condition] || '-',
    ];
    row.forEach((cell, i) => {
      const text = cell.length > 26 ? cell.substring(0, 24) + '...' : cell;
      doc.text(text, x, y);
      x += colWidths[i];
    });
    y += 6.6;
  });

  if (assets.length > maxRows) {
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`+ ${assets.length - maxRows} item(ns) adicional(is) resumido(s).`, margin, y + 2);
    y += 5.2;
  }

  y += 6;
  doc.setFillColor(230, 0, 18);
  doc.rect(margin, y, 3, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('TERMOS E CONDICOES', margin + 7, y + 7);
  y += 13;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(60, 60, 60);

  const terms = [
    '1. O colaborador declara ter recebido o(s) equipamento(s) listado(s) acima em perfeito estado de funcionamento e conservacao.',
    '2. O colaborador compromete-se a zelar pela conservacao e bom uso do(s) equipamento(s), utilizando-o(s) exclusivamente para fins profissionais.',
    '3. E vedada a cessao, emprestimo ou transferencia do(s) equipamento(s) a terceiros sem previa autorizacao da MACOM.',
    '4. Em caso de dano, perda ou furto, o colaborador devera comunicar imediatamente ao departamento de TI.',
    '5. O colaborador compromete-se a devolver o(s) equipamento(s) em bom estado ao termino do vinculo empregaticio ou quando solicitado.',
    '6. O descumprimento deste termo podera acarretar em medidas administrativas e/ou ressarcimento dos valores correspondentes.',
  ];

  terms.forEach((term) => {
    const lines = doc.splitTextToSize(term, contentWidth - 10);
    doc.text(lines, margin + 5, y);
    y += lines.length * 3.7 + 2.2;
  });

  y += 10;
  const sigY = Math.min(y, pageHeight - 24);

  doc.setDrawColor(180, 180, 180);
  const sigWidth = (contentWidth - 20) / 2;
  doc.line(margin, sigY, margin + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(employee.full_name || 'Colaborador', margin + sigWidth / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Colaborador', margin + sigWidth / 2, sigY + 9, { align: 'center' });

  const rightX = margin + sigWidth + 20;
  doc.line(rightX, sigY, rightX + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Departamento de TI', rightX + sigWidth / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text('MACOM Mitsubishi', rightX + sigWidth / 2, sigY + 9, { align: 'center' });

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(230, 0, 18);
  doc.rect(0, pageH - 8, pageWidth, 8, 'F');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('MACOM Mitsubishi Motors - Gestao de Ativos TI', pageWidth / 2, pageH - 3, { align: 'center' });

  const filename = `Termo_${(employee.full_name || 'colaborador').replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  if (options.returnBlob) {
    const blob = doc.output('blob');
    return { blob, filename };
  }

  doc.save(filename);
  return { filename };
}
