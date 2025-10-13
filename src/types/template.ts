export interface Template {
  id: string | number;
  title: string;
  name?: string;
  category: string;
  description: string;
  example: string;
  icon: string;
  sampleImage?: string;
  suggestedEvents?: string[];
}
