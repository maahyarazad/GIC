declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module 'react-select-country-list' {
  interface CountryData {
    value: string;
    label: string;
  }
  interface CountryList {
    getData(): CountryData[];
    getLabel(value: string): string;
    getValue(label: string): string;
    getLabels(): string[];
    getValues(): string[];
    setEmpty(label: string): void;
    setLabel(value: string, label: string): CountryList;
    native(): CountryList;
  }
  export default function countryList(): CountryList;
}


// declare module '*.svg' {
//   import * as React from 'react';

//   export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;

//   const src: string;
//   export default src;
// }
