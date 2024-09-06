import { RESOLUTIONS } from "../constants/timestamps";
interface Resolution {
    id: number;
    name: string;
    ts: number;
    maxInterval?: number;
    disabled?: boolean;
    defaultChecked?: boolean;
}
export function getResolutionByInterval(startDate: number, endDate: number):Resolution[] {
    let interval = endDate - startDate;

    let res: Resolution[] = [];

  RESOLUTIONS.forEach((resolution) => {
    if (resolution.maxInterval) {
      if (resolution.maxInterval >= interval) {
        res.push(resolution);
      }else{
        res.push({...resolution, disabled: true});
      }
    } else {
      res.push(resolution);
    }
  });

  // Find the default resolution, if it is disabled, find the first enabled resolution
  let defaultResolution = res.find((resolution) => resolution.defaultChecked);
  if (!defaultResolution) {
    defaultResolution = res.find((resolution) => !resolution.disabled);
  }
  res.forEach((resolution) => {
    resolution.defaultChecked = resolution === defaultResolution;
  });

  

  return res;
}

export function getFormattedDate(date: number): string {
    const d = new Date(date);
    const month = d.toLocaleString('default', { month: 'long' });
    const day = d.getDate();
    const year = d.getFullYear();
    const hours = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours();
    const minutes = d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes();
    const seconds = d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds();
    return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
}