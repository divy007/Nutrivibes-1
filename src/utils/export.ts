import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { WeekPlan, ClientInfo, FoodItem } from '../types';

import { MEAL_TIMES, MEAL_LABELS } from '../data/meals';

const formatFoodItems = (items: FoodItem[]) => {
    if (!items || items.length === 0) return '';
    return items.map(i => `• ${i.name} (${i.portion})`).join('\n');
};

const saveFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
};

const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
    });
};

export const exportToPDF = async (weekPlan: WeekPlan, clientInfo: ClientInfo) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    let logoData = '';
    try {
        logoData = await loadImage('/Logo.jpeg');
    } catch (error) {
        console.warn('Logo could not be loaded:', error);
    }

    // --- Header ---
    // Removed Logo from header as requested

    doc.setFontSize(22);
    doc.setTextColor(27, 67, 50); // #1b4332 Dark Green
    doc.text('NutriVibes by Dt. Mansi Anajwala', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Contact: +91 98243 59944', 14, 26);

    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Diet Plan Week', 14, 36);

    // Client Info Box
    const boxTop = 45;
    const boxHeight = 25; // Increased height for vertical stacking
    doc.setDrawColor(200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(14, boxTop, 268, boxHeight, 3, 3, 'FD');

    // Client Name
    const textLeft = 20;
    const row1Top = boxTop + 8;
    const row2Top = boxTop + 18;

    doc.setFontSize(11);
    doc.setTextColor(50); // Dark Gray for label
    doc.setFont('helvetica', 'bold');
    doc.text('Client Name:', textLeft, row1Top);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0); // Black for value
    doc.text(clientInfo.name, textLeft + 28, row1Top); // Adjusted offset

    // Preferences
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.text('Preferences:', textLeft, row2Top);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(clientInfo.preferences || 'None', textLeft + 28, row2Top);

    // Prepare Table Data
    // Changed Format: EEE - MMM d
    const headRow = ['Time / Day', ...weekPlan.days.map(d => format(new Date(d.date), 'EEE - MMM d'))];

    // Extract dynamic meal times from the plan
    const uniqueTimes = Array.from(new Set(
        weekPlan.days.flatMap(day => day.meals.map(m => m.time))
    )).sort();

    const bodyRows = uniqueTimes.map(time => {
        // Find a label for this time if available, or just use the time
        const label = MEAL_LABELS[time] || `Meal at ${time}`;
        const rowData: string[] = [`${time}\n${label}`];

        weekPlan.days.forEach(day => {
            const meal = day.meals.find(m => m.time === time);
            rowData.push(formatFoodItems(meal?.foodItems || []));
        });

        return rowData;
    });

    // Generate Table
    autoTable(doc, {
        startY: boxTop + boxHeight + 10, // Dynamic startY based on box
        head: [headRow],
        body: bodyRows,
        theme: 'grid',
        headStyles: {
            fillColor: [156, 102, 68], // #9c6644 Warm Brown
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [255, 255, 255]
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            valign: 'top',
            overflow: 'linebreak',
            cellWidth: 'auto'
        },
        columnStyles: {
            0: { cellWidth: 30, fontStyle: 'bold', fillColor: [245, 245, 245] }
        },
        didDrawPage: (data) => {
            // Footer
            const str = `Generated on ${format(new Date(), 'PPpp')}`;
            doc.setFontSize(8);
            doc.setTextColor(150);
            const pageSize = doc.internal.pageSize;
            doc.text(str, data.settings.margin.left, pageSize.height - 10);
        }
    });

    // --- End Section (Logo) ---
    if (logoData) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const logoSize = 50;
        const padding = 20;

        // Get final Y position of the table
        interface AutoTableDoc {
            lastAutoTable: { finalY: number };
        }
        const finalY = (doc as unknown as AutoTableDoc).lastAutoTable.finalY + padding;

        const drawFooterLogo = (yPos: number) => {
            // Draw Brown Border
            doc.setDrawColor(139, 69, 19); // SaddleBrown #8B4513
            doc.setLineWidth(1.5);
            const borderPadding = 2;
            doc.rect(
                (pageWidth - logoSize) / 2 - borderPadding,
                yPos - borderPadding,
                logoSize + (borderPadding * 2),
                logoSize + (borderPadding * 2)
            );

            // Draw Image
            doc.addImage(logoData, 'JPEG', (pageWidth - logoSize) / 2, yPos, logoSize, logoSize);

            // Draw Text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(156, 102, 68); // #9c6644 Warm Brown
            doc.text('Thank You!', pageWidth / 2, yPos + logoSize + 15, { align: 'center' });
        };

        // Check availability
        if (finalY + logoSize + 30 < pageHeight) {
            // Fits on same page
            drawFooterLogo(finalY);
        } else {
            // New page needed
            doc.addPage();
            drawFooterLogo((pageHeight - logoSize) / 2 - 10);
        }
    }

    doc.save(`DietPlan_${clientInfo.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportToExcel = async (weekPlan: WeekPlan, clientInfo: ClientInfo) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NutriVibes';
    workbook.created = new Date();

    // --- Sheet 1: Client Details ---
    const sheet1 = workbook.addWorksheet('Client Details');

    sheet1.columns = [
        { header: 'Field', key: 'field', width: 20 },
        { header: 'Value', key: 'value', width: 40 }
    ];

    const clientData = [
        { field: 'Name', value: clientInfo.name },
        { field: 'Age', value: clientInfo.age || '-' },
        { field: 'Gender', value: clientInfo.gender || '-' },
        { field: 'Weight (kg)', value: clientInfo.weight || '-' },
        { field: 'Height (cm)', value: clientInfo.height || '-' },
        { field: 'Phone', value: clientInfo.phone || '-' },
        { field: 'Preferences', value: clientInfo.preferences },
        { field: 'Start Date', value: format(new Date(weekPlan.startDate), 'PPP') },
        { field: 'End Date', value: format(new Date(weekPlan.endDate), 'PPP') }
    ];

    clientData.forEach(row => {
        sheet1.addRow(row);
    });

    // Style Sheet 1
    sheet1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet1.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6B35' }
    };

    // --- Sheet 2: Weekly Plan ---
    const sheet2 = workbook.addWorksheet('Weekly Plan');

    // Columns: Time + 7 Days
    const columns = [
        { header: 'Time / Day', key: 'time', width: 20 }
    ];
    weekPlan.days.forEach((day, index) => {
        columns.push({
            header: format(new Date(day.date), 'EEEE, MMM d'),
            key: `day_${index}`,
            width: 35
        });
    });
    sheet2.columns = columns;

    // Extract dynamic meal times from the plan
    const uniqueTimes = Array.from(new Set(
        weekPlan.days.flatMap(day => day.meals.map(m => m.time))
    )).sort();

    // Add Rows
    uniqueTimes.forEach(time => {
        // Find a label for this time if available, or just use the time
        const label = MEAL_LABELS[time] || '';
        const rowObj: Record<string, string> = {
            time: `${time}${label ? ' - ' + label : ''}`
        };

        weekPlan.days.forEach((day, index) => {
            const meal = day.meals.find(m => m.time === time);
            rowObj[`day_${index}`] = formatFoodItems(meal?.foodItems || []);
        });

        const row = sheet2.addRow(rowObj);

        // Allow text wrap
        row.height = 80; // approximate height for bullet points
    });

    // Style Sheet 2
    sheet2.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    sheet2.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6B35' }
    };
    sheet2.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Border and Alignment for all cells
    sheet2.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // Align left top with wrap text
            cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };

            // Center the header row
            if (rowNumber === 1) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }
            // Bold the time column
            if (cell.col === '1') {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF5F5F5' }
                };
            }
        });
    });

    // Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveFile(blob, `DietPlan_${clientInfo.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
