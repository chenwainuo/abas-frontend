const numberToCurrency = (
  lang: string,
  currency: string,
  amount: number
): string => {
  const formatter = new Intl.NumberFormat(lang, {
    style: 'currency',
    currency,
  });
  return formatter.format(amount);
};

export { numberToCurrency };
