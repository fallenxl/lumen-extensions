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