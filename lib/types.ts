export interface CompareItem {
  item: string;
  woolworths: { name: string; price: number | null } | null;
  coles: { name: string; price: number | null } | null;
  cheapest: string;
  saving: string | null;
}

export interface CompareResult {
  comparisons: CompareItem[];
  totals: {
    woolworths: string;
    coles: string;
    cheapestOverall: 'woolworths' | 'coles';
    saving: string;
    woolworthsCount: number;
    colesCount: number;
    commonCount: number;
  };
}
