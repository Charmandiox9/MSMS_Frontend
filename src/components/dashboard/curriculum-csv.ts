export interface ImportedCurriculumCourse {
  courseName: string;
  termNumber: number;
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("El CSV contiene comillas sin cerrar.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

export function parseCurriculumCsv(csv: string): ImportedCurriculumCourse[] {
  const rows = parseCsvRows(csv);
  const header = rows[0]?.map((value) => value.replace(/^\uFEFF/, "").trim().toLocaleLowerCase("es"));
  if (!header || header.length !== 2 || header[0] !== "nombre_asignatura" || header[1] !== "semestre") {
    throw new Error("El archivo debe comenzar con los encabezados nombre_asignatura,semestre.");
  }

  return rows.slice(1).map((values, index) => {
    const line = index + 2;
    if (values.length !== 2) throw new Error(`La fila ${line} debe tener dos columnas.`);
    const courseName = values[0].trim();
    const termNumber = Number(values[1].trim());
    if (!courseName) throw new Error(`Falta el nombre de la asignatura en la fila ${line}.`);
    if (!Number.isInteger(termNumber) || termNumber < 1 || termNumber > 20) {
      throw new Error(`El semestre de la fila ${line} debe ser un número entre 1 y 20.`);
    }
    return { courseName, termNumber };
  });
}
