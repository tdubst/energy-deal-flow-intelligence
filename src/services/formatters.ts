export const formatMw = (value: number) => `${value.toLocaleString()} MW`;

export const formatMoney = (valueM: number) => `$${valueM.toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;

export const formatAcres = (value: number) =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ac`;

export const formatPct = (value: number) =>
  `${(value * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}%`;

export const titleCase = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
