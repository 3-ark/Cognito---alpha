export const debounce = (callback: (...args: unknown[]) => void, timeout = 300) => {
  let timer: ReturnType<typeof setTimeout> | null;

  return (...args: unknown[]) => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      callback(...args);
    }, timeout);
  };
};
