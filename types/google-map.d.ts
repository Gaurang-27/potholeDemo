interface GoogleMapsElements {
  "gmp-map": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  "gmp-advanced-marker": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  "gmp-polyline": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
}

declare namespace JSX {
  interface IntrinsicElements extends GoogleMapsElements {}
}