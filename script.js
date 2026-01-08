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
	form.style.gridTemplateColumns = `repeat(${size}, auto)`;

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

function generatePDF() {
	if (typeof html2pdf === 'undefined') {
		alert('html2pdf n’est pas chargé');
		return;
	}

	const bingoForm = document.getElementById('bingo-form');
	if (!bingoForm) {
		alert('Veuillez d\'abord créer une grille de bingo');
		return;
	}

	const size = getGridSize();
	const center = Math.floor(size / 2);

	const clone = bingoForm.cloneNode(true);
	clone.style.display = 'grid';
	clone.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
	clone.className = 'clone';

	const inputs = clone.querySelectorAll('input');

	inputs.forEach((input, index) => {
		const row = Math.floor(index / size);
		const col = index % size;

		const div = document.createElement('div');
		div.className = 'bingo-cell';

		if (row === center && col === center) {
			div.textContent = 'BINGO';
			div.style.fontSize = '18px';
		} else {
			div.textContent = input.value || '';
		}

		input.replaceWith(div);
	});

	const container = document.createElement('div');
	container.className = "pdf-container";

	const title = document.createElement('h1');
	title.textContent = 'Grille de Bingo !';

	container.appendChild(title);
	container.appendChild(clone);
	document.body.appendChild(container);

	const options = {
		margin: 6,
		filename: `bingo-${Date.now()}.pdf`,
		image: { type: 'jpeg', quality: 0.98 },
		html2canvas: { scale: 2, useCORS: true },
		jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
	};

	html2pdf()
		.set(options)
		.from(container)
		.save()
		.finally(() => {
			container.remove();
		});
}
