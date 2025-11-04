type ClassDictionary = Record<string, boolean | null | undefined>;

type ClassValue = string | undefined | false | null | ClassValue[] | ClassDictionary;

export function cn(...inputs: ClassValue[]) {
  const classes: string[] = [];

  inputs.forEach((input) => {
    if (!input) {
      return;
    }

    if (Array.isArray(input)) {
      classes.push(cn(...input));
      return;
    }

    if (typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        if (value) {
          classes.push(key);
        }
      });
      return;
    }

    if (typeof input === 'string') {
      classes.push(input);
    }
  });

  return classes.join(' ');
}
