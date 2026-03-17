import { Question } from '../types';

export function printExam(questions: Question[], area: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const date = new Date().toLocaleDateString();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Examen de Simulacro - ${area}</title>
      <style>
        @media print {
          @page { margin: 1.5cm; }
        }
        body {
          font-family: 'Inter', Arial, sans-serif;
          line-height: 1.4;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -1px;
          margin: 0;
        }
        .subtitle {
          font-size: 14px;
          text-transform: uppercase;
          margin: 5px 0;
          font-weight: 600;
        }
        .info-bar {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 20px;
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }
        .instructions {
          background: #f9f9f9;
          padding: 10px;
          border: 1px solid #ddd;
          font-size: 11px;
          margin-bottom: 20px;
        }
        .questions-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        .question-block {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .question-text {
          font-weight: 700;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .options-list {
          list-style-type: none;
          padding-left: 0;
          margin: 0;
        }
        .option-item {
          font-size: 12px;
          margin-bottom: 4px;
          display: flex;
          gap: 8px;
        }
        .option-letter {
          font-weight: bold;
          min-width: 15px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="logo">ATOMIC QUIZ</h1>
        <div class="subtitle">Simulacro de Examen de Admisión</div>
      </div>

      <div class="info-bar">
        <span><strong>Área:</strong> ${area}</span>
        <span><strong>Fecha:</strong> ${date}</span>
        <span><strong>Duración:</strong> 180 Minutos</span>
      </div>

      <div class="instructions">
        <strong>INSTRUCCIONES:</strong> Lea atentamente cada pregunta y marque su respuesta en la ficha correspondiente. 
        Evite borrones o enmendaduras. El examen consta de ${questions.length} preguntas distribuidas por asignaturas.
      </div>

      <div class="questions-container">
        ${questions.map((q, i) => `
          <div class="question-block">
            <div class="question-text">${i + 1}. ${q.questionText}</div>
            <div class="options-list">
              ${q.options.map((opt, optIdx) => `
                <div class="option-item">
                  <span class="option-letter">${String.fromCharCode(65 + optIdx)})</span>
                  <span class="option-text">${opt}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="footer">
        Desarrollado por Carlos Llano - llanovilca97@gmail.com | © 2026 ATOMIC QUIZ
      </div>

      <script>
        window.onload = () => {
          window.print();
          // Opcional: window.close();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
