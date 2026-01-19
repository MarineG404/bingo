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
			input.maxLength = 70;

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

function getBingoValues(isRandom = false) {
	const bingoForm = document.getElementById('bingo-form');
	if (!bingoForm) {
		return null;
	}

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

	return { values, size, center };
}

// Utility function to create table data structure
function createTableData(values, size, center) {
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

	return tableData;
}

// Store uploaded image
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

// CSV download button listener
const csvButton = document.getElementById('download-csv-btn');

if (csvButton) {
	csvButton.addEventListener('click', generateCSV);
}

function generateCSV() {
	const isRandom = document.getElementById('random').checked;
	const result = getBingoValues(isRandom);

	if (!result) {
		alert('Please create a bingo grid first');
		return;
	}

	const { values, size, center } = result;
	const tableData = createTableData(values, size, center);

	let csvContent = tableData.map(row =>
		row.map(cell => {
			const escaped = cell.replace(/"/g, '""');
			return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
				? `"${escaped}"`
				: escaped;
		}).join(',')
	).join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', `bingo-${Date.now()}.csv`);
	link.style.visibility = 'hidden';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

const importCsvButton = document.getElementById('import-csv-btn');

if (importCsvButton) {
	importCsvButton.addEventListener('click', importCSV);
}

function importCSV(){
	const fileInput = document.createElement('input');
	fileInput.type = 'file';
	fileInput.accept = '.csv,text/csv';

	fileInput.addEventListener('change', function (e) {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function (event) {
				const csvContent = event.target.result;
				const rows = csvContent.split('\n').map(row => row.split(',').map(cell => cell.replace(/(^"|"$)/g, '').replace(/""/g, '"')));
				const size = rows.length;
				document.getElementById('size').value = size;
				generateForm();

				const bingoForm = document.getElementById('bingo-form');
				rows.forEach((row, r) => {
					row.forEach((cell, c) => {
						const input = bingoForm.querySelector(`input[name="cell-${r}-${c}"]`);
						if (input && !(r === Math.floor(size / 2) && c === Math.floor(size / 2))) {
							input.value = cell;
						}
					});
				});
			};
			reader.readAsText(file);
		}
	});

	fileInput.click();
}


const pdfButton = document.getElementById('download-btn');

if (pdfButton) {
	pdfButton.addEventListener('click', generatePDF);
}

function generatePDF() {
	const { jsPDF } = window.jspdf;

	if (typeof jsPDF === 'undefined') {
		alert('jsPDF is not loaded');
		return;
	}

	const isRandom = document.getElementById('random').checked;
	const result = getBingoValues(isRandom);

	if (!result) {
		alert('Please create a bingo grid first');
		return;
	}

	const { values, size, center } = result;
	const tableData = createTableData(values, size, center);

	const doc = new jsPDF({
		orientation: 'landscape',
		unit: 'mm',
		format: 'a4'
	});

	doc.setFontSize(28);
	doc.setFont(undefined, 'bold');
	doc.setTextColor(239, 68, 68);
	doc.text('Bingo Grid!', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const horizontalMargin = 20;
	const startY = 25;

	const availableWidth = pageWidth - (horizontalMargin * 2);
	const availableHeight = pageHeight - startY - 20;

	const maxLength = Math.max(...values.map(v => (v || '').length), 5);

	let fontSize, padding;

	if (maxLength > 60) {
		fontSize = size === 3 ? 18 : size === 4 ? 16 : 14;
		padding = 3;
	} else if (maxLength > 30) {
		fontSize = size === 3 ? 22 : size === 4 ? 18 : 16;
		padding = size === 3 ? 5 : size === 4 ? 4 : 3;
	} else {
		fontSize = size === 3 ? 28 : size === 4 ? 22 : 18;
		padding = size === 3 ? 12 : size === 4 ? 10 : 8;
	}

	const cellWidth = availableWidth / size;
	const cellHeight = availableHeight / size;

	doc.autoTable({
		startY: startY,
		head: [],
		body: tableData,
		theme: 'grid',
		styles: {
			fontSize: fontSize,
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
				if (uploadedImage) {
					data.cell.text = '';
				}
			}
		},
		didDrawCell: function (data) {
			if (data.cell.raw === 'BINGO' && uploadedImage) {
				const imgSize = Math.min(data.cell.width, data.cell.height) * 0.7;
				const imgX = data.cell.x + (data.cell.width - imgSize) / 2;
				const imgY = data.cell.y + (data.cell.height - imgSize) / 2;

				doc.addImage(uploadedImage, 'PNG', imgX, imgY, imgSize, imgSize);
			}
		}
	});

	doc.save(`bingo-${Date.now()}.pdf`);
}
