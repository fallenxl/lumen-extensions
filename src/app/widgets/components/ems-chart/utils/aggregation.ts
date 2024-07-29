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


export function fillData(data: any[], endDate: number, resolution: number): any[] {
  let res = [];
  let lastDate = data[data.length - 1].date + resolution;

  while (lastDate <= endDate) {
    res.push({ date: lastDate, value: null});
    lastDate += resolution;
  }

  return [...data, ...res];
}