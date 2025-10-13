type ClassValue = string | undefined | false | null | ClassValue[];

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

    classes.push(input);
  });

  return classes.filter(Boolean).join(' ');
}
