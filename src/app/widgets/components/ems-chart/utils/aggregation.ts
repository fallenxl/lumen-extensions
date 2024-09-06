export function getTypeChart(str: string): string {
  const type = str?.split(',')[1]??'line';

  switch (type) {
    case 'line':
      return 'line';
    case 'bar':
      return 'bar';
    case 'area':
      return 'area';
    case 'scatter':
      return 'scatter';
    case 'pie':
      return 'pie';
    case 'table':
      return 'table';
    default:
      return 'line';
  }
}


export function fillData(data: any[], startDate: number, endDate: number, resolution: number): any[] {
  // Validaciones iniciales
  if (startDate >= endDate) {
      throw new Error("startDate debe ser menor que endDate");
  }
  if (resolution <= 0) {
      throw new Error("resolution debe ser un número positivo");
  }

  let res = [];
  let currentDate = startDate;

  for (let i = 0; i < data.length; i++) {
      // Llenar los intervalos faltantes
      while (currentDate < data[i].date) {
          res.push({ date: currentDate, value: null });
          currentDate += resolution;
      }

      res.push(data[i]);
      currentDate = data[i].date + resolution;
  }

  // Llenar hasta el endDate
  while (currentDate <= endDate) {
      res.push({ date: currentDate, value: null });
      currentDate += resolution;
  }

  return res;
}