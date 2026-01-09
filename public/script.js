function getGridSize() {
	const gridSizeInput = document.getElementById('size');
	return parseInt(gridSizeInput.value, 10) || 5;
}

const gridSizeForm = document.getElementById('grid-size');

if (gridSizeForm) {
	gridSizeForm.addEventListener('change', generateForm);
}

function generateForm(event) {
	if (event && event.preventDefault) event.preventDefault();

	const size = getGridSize();
	const bingoSection = document.getElementById('bingo-section');
	const bingoGrid = document.getElementById('bingo-grid');

	bingoGrid.innerHTML = '';
	bingoSection.style.display = 'flex';

	const form = document.createElement('form');
	form.id = 'bingo-form';
	form.className = 'bingo-form';
	form.style.display = 'grid';
	form.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

	const centerRow = Math.floor(size / 2);
	const centerCol = Math.floor(size / 2);

	for (let r = 0; r < size; r++) {
		for (let c = 0; c < size; c++) {
			const input = document.createElement('input');
			input.type = 'text';
			input.name = `cell-${r}-${c}`;
			input.className = 'bingo-input';

			if (r === centerRow && c === centerCol) {
				input.value = 'BINGO';
				input.readOnly = true;
			} else {
				input.placeholder = '';
			}

			form.appendChild(input);
		}
	}

	bingoGrid.appendChild(form);
}


// pdf
const pdfButton = document.getElementById('download-btn');

if (pdfButton) {
	pdfButton.addEventListener('click', generatePDF);
}

// Stocker l'image uploadée
let uploadedImage = null;
const imageInput = document.getElementById('imageInput');

if (imageInput) {
	imageInput.addEventListener('change', function (e) {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function (event) {
				uploadedImage = event.target.result;
			};
			reader.readAsDataURL(file);
		}
	});
}

function generatePDF() {
	const { jsPDF } = window.jspdf;

	if (typeof jsPDF === 'undefined') {
		alert('jsPDF n\'est pas chargé');
		return;
	}

	const bingoForm = document.getElementById('bingo-form');
	if (!bingoForm) {
		alert('Veuillez d\'abord créer une grille de bingo');
		return;
	}

	const isRandom = document.getElementById('random').checked;
	const size = getGridSize();
	const center = Math.floor(size / 2);

	const inputs = bingoForm.querySelectorAll('input');

	let values = [];
	inputs.forEach((input, index) => {
		const row = Math.floor(index / size);
		const col = index % size;
		if (row !== center || col !== center) {
			values.push(input.value || '');
		}
	});

	if (isRandom) {
		values = values.sort(() => Math.random() - 0.5);
	}

	const tableData = [];
	let valueIndex = 0;

	for (let r = 0; r < size; r++) {
		const row = [];
		for (let c = 0; c < size; c++) {
			if (r === center && c === center) {
				row.push('BINGO');
			} else {
				row.push(values[valueIndex++] || '');
			}
		}
		tableData.push(row);
	}

	const doc = new jsPDF({
		orientation: 'landscape',
		unit: 'mm',
		format: 'a4'
	});

	doc.setFontSize(28);
	doc.setFont(undefined, 'bold');
	doc.setTextColor(239, 68, 68);
	doc.text('Grille de Bingo !', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

	const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
	const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
	const horizontalMargin = 20;
	const startY = 25;

	const availableWidth = pageWidth - (horizontalMargin * 2);
	const availableHeight = pageHeight - startY - 20;

	const padding = size === 3 ? 12 : size === 4 ? 10 : 8;
	const cellWidth = availableWidth / size;
	const cellHeight = availableHeight / size;

	doc.autoTable({
		startY: startY,
		head: [],
		body: tableData,
		theme: 'grid',
		styles: {
			fontSize: size === 3 ? 18 : size === 4 ? 15 : 13,
			cellPadding: padding,
			halign: 'center',
			valign: 'middle',
			lineColor: [239, 68, 68],
			lineWidth: 1,
			textColor: [31, 41, 55],
			minCellHeight: cellHeight
		},
		columnStyles: Array.from({ length: size }, () => ({
			cellWidth: cellWidth
		})),
		margin: {
			left: horizontalMargin,
			right: horizontalMargin
		},
		tableWidth: 'wrap',
		didParseCell: function (data) {
			if (data.cell.raw === 'BINGO') {
				data.cell.styles.fontStyle = 'normal';
				// Si on a une image, vider le texte dès le parsing
				if (uploadedImage) {
					data.cell.text = '';
				}
			}
		},
		didDrawCell: function (data) {
			if (data.cell.raw === 'BINGO' && uploadedImage) {
				// Calculer la position et la taille de l'image
				const imgSize = Math.min(data.cell.width, data.cell.height) * 0.7;
				const imgX = data.cell.x + (data.cell.width - imgSize) / 2;
				const imgY = data.cell.y + (data.cell.height - imgSize) / 2;

				// Ajouter l'image
				doc.addImage(uploadedImage, 'PNG', imgX, imgY, imgSize, imgSize);
			}
		}
	});

	doc.save(`bingo-${Date.now()}.pdf`);
}
